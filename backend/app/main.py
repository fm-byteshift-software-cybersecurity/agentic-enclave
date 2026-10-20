
import os
from contextlib import asynccontextmanager
from typing import Annotated

from agents.exceptions import UserError
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.app.adapters.api.auth_dependencies import (
    get_authenticated_user,
)
from backend.app.adapters.api.auth_router import router as auth_router
from backend.app.adapters.database.schema import initialize_schema
from backend.app.adapters.database.turso_connection import (
    create_turso_connection,
)
from backend.app.adapters.database.turso_order_repository import (
    TursoOrderRepository,
)
from backend.app.adapters.database.turso_user_repository import (
    TursoUserRepository,
)
from backend.app.adapters.llm.openai.context import OpenAIAgentContext
from backend.app.adapters.llm.openai.model_factory import create_real_model
from backend.app.adapters.llm.openai.runtime import OpenAIRuntime
from backend.app.adapters.llm.openai.vulnerable_runtime import (
    VulnerableOpenAIRuntime,
)
from backend.app.adapters.security.jwt_token_service import JWTTokenService
from backend.app.adapters.security.password_hasher import PasswordHasher
from backend.app.application.agents.agent_context import AgentContext
from backend.app.application.authorization.actor import Actor
from backend.app.application.authorization.authorization_policy import (
    AuthorizationPolicy,
)
from backend.app.application.exceptions.authorization_denied import (
    AuthorizationDenied,
)
from backend.app.application.exceptions.entity_not_found import EntityNotFound
from backend.app.application.ports.order_repository import OrderRepository
from backend.app.application.tools.cancel_order_tool import CancelOrderTool
from backend.app.application.tools.vulnerable_cancel_order_tool import (
    VulnerableCancelOrderTool,
)
from backend.app.application.use_cases.cancel_order import CancelOrderUseCase
from backend.app.application.use_cases.reset_demo_orders import (
    ResetDemoOrdersUseCase,
)
from backend.app.application.use_cases.vulnerable_cancel_order import (
    VulnerableCancelOrderUseCase,
)
from backend.app.domain.exceptions.business_rule_violation import (
    BusinessRuleViolation,
)
from backend.app.domain.model.order import OrderStatus
from backend.app.domain.model.user import User


class CancelOrderRequest(BaseModel):
    user_input: str


@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_schema()
    connection = create_turso_connection()

    try:
        order_repository = TursoOrderRepository(connection)
        user_repository = TursoUserRepository(connection)

        password_hasher = PasswordHasher()
        token_service = JWTTokenService()

        app.state.connection = connection
        app.state.order_repository = order_repository
        app.state.user_repository = user_repository
        app.state.password_hasher = password_hasher
        app.state.token_service = token_service

        yield
    finally:
        connection.close()


def create_runtime(repository: OrderRepository) -> OpenAIRuntime:
    use_case = CancelOrderUseCase(
        order_repository=repository,
        authorization_policy=AuthorizationPolicy(),
    )
    cancel_order_tool = CancelOrderTool(use_case=use_case)

    return OpenAIRuntime(
        cancel_order_tool=cancel_order_tool,
        model=create_real_model(),
    )


def create_vulnerable_runtime(
    repository: OrderRepository,
) -> VulnerableOpenAIRuntime:
    use_case = VulnerableCancelOrderUseCase(
        order_repository=repository,
    )
    vulnerable_cancel_order_tool = VulnerableCancelOrderTool(
        use_case=use_case,
    )

    return VulnerableOpenAIRuntime(
        vulnerable_cancel_order_tool=vulnerable_cancel_order_tool,
        model=create_real_model(),
    )


app = FastAPI(
    title="AgenticEnclave",
    lifespan=lifespan,
)

cors_origins = [
    origin.strip().rstrip("/")
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]

trusted_origins = set(cors_origins)


@app.middleware("http")
async def validate_request_origin(
    request: Request,
    call_next,
):
    if request.method in {"POST", "PUT", "PATCH", "DELETE"}:
        origin = request.headers.get("origin")

        if origin is None or origin.rstrip("/") not in trusted_origins:
            from starlette.responses import JSONResponse

            return JSONResponse(
                status_code=403,
                content={"detail": "Request origin is not allowed."},
            )

    return await call_next(request)


app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "X-CSRF-Token"],
)

app.include_router(auth_router)


@app.get("/api/lab/sec-01/orders")
async def list_lab_orders(
    user: Annotated[User, Depends(get_authenticated_user)],
) -> dict[str, list[dict[str, str | int]]]:
    repository = app.state.order_repository
    orders = repository.list_demo_orders(lab_owner_id=user.id)

    return {
        "orders": [
            {
                "id": order.id,
                "customer_id": order.customer_id,
                "status": order.status.value,
            }
            for order in orders
        ]
    }


@app.post("/api/lab/sec-01/reset")
async def reset_lab_orders(
    user: Annotated[User, Depends(get_authenticated_user)],
) -> dict[str, str]:
    repository = app.state.order_repository
    use_case = ResetDemoOrdersUseCase(repository)

    use_case.execute(lab_owner_id=user.id)

    return {
        "message": "Lab orders reset successfully.",
    }


async def execute_cancellation(
    request: CancelOrderRequest,
    user: User,
    runtime: OpenAIRuntime | VulnerableOpenAIRuntime,
    repository: OrderRepository,
) -> dict[str, str | int]:
    context = OpenAIAgentContext(
        application_context=AgentContext(
            actor=Actor(
                user_id=user.id,
                agent_id="orders_agent",
            )
        )
    )

    try:
        result = await runtime.run(
            context=context,
            user_input=request.user_input,
        )
    except UserError as exc:
        cause = exc.__cause__

        if isinstance(cause, AuthorizationDenied):
            raise HTTPException(
                status_code=403,
                detail="You are not authorized to cancel this order.",
            ) from exc

        if isinstance(cause, BusinessRuleViolation):
            raise HTTPException(
                status_code=409,
                detail=str(cause),
            ) from exc

        if isinstance(cause, EntityNotFound):
            raise HTTPException(
                status_code=404,
                detail=str(cause),
            ) from exc

        raise

    if len(result.tool_results) != 1:
        raise HTTPException(
            status_code=502,
            detail="The agent did not return exactly one tool result.",
        )

    tool_result = result.tool_results[0]
    order_id = tool_result.get("order_id")
    order_status = tool_result.get("status")

    if (
        not isinstance(order_id, int)
        or isinstance(order_id, bool)
        or order_status != OrderStatus.CANCELLED.value
    ):
        raise HTTPException(
            status_code=502,
            detail="The agent returned an invalid cancellation result.",
        )

    order = repository.get_by_id(order_id)

    if order is None:
        raise HTTPException(
            status_code=502,
            detail="The cancelled order could not be retrieved.",
        )

    return {
        "message": result.final_output,
        "order_id": order_id,
        "order_status": order_status,
        "order_owner_id": order.customer_id,
    }


@app.post("/api/orders/cancel")
async def cancel_order(
    request: CancelOrderRequest,
    user: Annotated[User, Depends(get_authenticated_user)],
) -> dict[str, str | int]:
    repository = app.state.order_repository
    runtime = create_runtime(repository=repository)

    return await execute_cancellation(
        request=request,
        user=user,
        runtime=runtime,
        repository=repository,
    )


@app.post("/api/vulnerable/orders/cancel")
async def cancel_order_vulnerable(
    request: CancelOrderRequest,
    user: Annotated[User, Depends(get_authenticated_user)],
) -> dict[str, str | int]:
    repository = app.state.order_repository
    runtime = create_vulnerable_runtime(repository=repository)

    return await execute_cancellation(
        request=request,
        user=user,
        runtime=runtime,
        repository=repository,
    )

@app.get("/health")
async def health_check():
    return {"status": "ok"}