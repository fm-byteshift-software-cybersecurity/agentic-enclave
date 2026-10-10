from contextlib import asynccontextmanager

from agents.exceptions import UserError
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from backend.app.adapters.database.schema import initialize_schema
from backend.app.adapters.database.turso_connection import (
    create_turso_connection,
)
from backend.app.adapters.database.turso_order_repository import (
    TursoOrderRepository,
)
from backend.app.adapters.llm.openai.context import OpenAIAgentContext
from backend.app.adapters.llm.openai.model_factory import create_real_model
from backend.app.adapters.llm.openai.runtime import OpenAIRuntime
from backend.app.application.agents.agent_context import AgentContext
from backend.app.application.authorization.actor import Actor
from backend.app.application.authorization.authorization_policy import (
    AuthorizationPolicy,
)
from backend.app.application.exceptions.entity_not_found import EntityNotFound
from backend.app.application.ports.order_repository import OrderRepository
from backend.app.application.tools.cancel_order_tool import CancelOrderTool
from backend.app.application.use_cases.cancel_order import CancelOrderUseCase
from backend.app.domain.exceptions.business_rule_violation import (
    BusinessRuleViolation,
)
from backend.app.domain.model.order import Order, OrderStatus


class CancelOrderRequest(BaseModel):
    order_id: int
    user_input: str


@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_schema()
    connection = create_turso_connection()

    try:
        repository = TursoOrderRepository(connection)

        # Demo data: create the sample order only if it does not exist.
        if repository.get_by_id(1842) is None:
            repository.save(
                Order(
                    id=1842,
                    customer_id=1,
                    status=OrderStatus.PENDING,
                )
            )

        app.state.connection = connection
        app.state.order_repository = repository
        yield
    finally:
        connection.close()


def create_runtime(
    repository: OrderRepository,
) -> OpenAIRuntime:
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


@app.post("/api/orders/cancel")
async def cancel_order(
    request: CancelOrderRequest,
) -> dict[str, str]:
    repository = app.state.order_repository

    context = OpenAIAgentContext(
        application_context=AgentContext(
            actor=Actor(
                user_id=1,
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

    order = repository.get_by_id(request.order_id)

    if order is None:
        raise RuntimeError(
            f"Order {request.order_id} was not found after execution."
        )

    return {
        "message": result,
        "order_status": order.status.value,
    }

