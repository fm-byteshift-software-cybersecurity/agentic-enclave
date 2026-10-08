from agents.testing import ScriptedModel, assistant_message, function_call
from fastapi import FastAPI
from pydantic import BaseModel

from backend.app.adapters.llm.openai.context import OpenAIAgentContext
from backend.app.adapters.llm.openai.runtime import OpenAIRuntime
from backend.app.application.agents.agent_context import AgentContext
from backend.app.application.authorization.actor import Actor
from backend.app.application.authorization.authorization_policy import (
    AuthorizationPolicy,
)
from backend.app.application.ports.order_repository import OrderRepository
from backend.app.application.tools.cancel_order_tool import CancelOrderTool
from backend.app.application.use_cases.cancel_order import CancelOrderUseCase
from backend.app.domain.model.order import Order, OrderStatus


class CancelOrderRequest(BaseModel):
    order_id: int
    user_input: str


class InMemoryOrderRepository(OrderRepository):
    def __init__(self, orders: list[Order]) -> None:
        self.orders = {order.id: order for order in orders}

    def get_by_id(self, order_id: int) -> Order | None:
        return self.orders.get(order_id)

    def save(self, order: Order) -> None:
        self.orders[order.id] = order


def create_runtime() -> tuple[OpenAIRuntime, InMemoryOrderRepository]:
    repository = InMemoryOrderRepository(
        [
            Order(
                id=1842,
                customer_id=1,
                status=OrderStatus.PENDING,
            )
        ]
    )

    use_case = CancelOrderUseCase(
        order_repository=repository,
        authorization_policy=AuthorizationPolicy(),
    )

    cancel_order_tool = CancelOrderTool(
        use_case=use_case,
    )

    model = ScriptedModel(
        [
            [
                function_call(
                    "cancel_order",
                    {"order_id": 1842},
                    call_id="call_1",
                )
            ],
            [
                assistant_message(
                    "The order has been cancelled successfully."
                )
            ],
        ]
    )

    runtime = OpenAIRuntime(
        cancel_order_tool=cancel_order_tool,
        model=model,
    )

    return runtime, repository


app = FastAPI(title="AgenticEnclave")

runtime, order_repository = create_runtime()


@app.post("/api/orders/cancel")
async def cancel_order(request: CancelOrderRequest) -> dict[str, str]:
    context = OpenAIAgentContext(
        application_context=AgentContext(
            actor=Actor(
                user_id=1,
                agent_id="orders_agent",
            )
        )
    )

    result = await runtime.run(
        context=context,
        user_input=request.user_input,
    )

    return {
        "message": result,
        "order_status": order_repository.orders[
            request.order_id
        ].status.value,
    }