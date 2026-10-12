
from contextlib import asynccontextmanager
from typing import Annotated

from agents.exceptions import UserError
from fastapi import Depends, FastAPI, HTTPException
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
from backend.app.application.use_cases.cancel_order import CancelOrderUseCase
from backend.app.domain.exceptions.business_rule_violation import (
    BusinessRuleViolation,
)
from backend.app.domain.model.order import Order, OrderStatus
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

        # Demo data: create the sample order only if it does not exist.
        if order_repository.get_by_id(1842) is None:
            order_repository.save(
                Order(
                    id=1842,
                    customer_id=1,
                    status=OrderStatus.PENDING,
                )
            )

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


app = FastAPI(
    title="AgenticEnclave",
    lifespan=lifespan,
)

app.include_router(auth_router)


@app.post("/api/orders/cancel")
async def cancel_order(
    request: CancelOrderRequest,
    user: Annotated[User, Depends(get_authenticated_user)],
) -> dict[str, str | int]:
    repository = app.state.order_repository

    context = OpenAIAgentContext(
        application_context=AgentContext(
            actor=Actor(
                user_id=user.id,
                agent_id="orders_agent",
            )
        )
    )

    runtime = create_runtime(repository=repository)

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

    return {
        "message": result.final_output,
        "order_id": order_id,
        "order_status": order_status,
    }
