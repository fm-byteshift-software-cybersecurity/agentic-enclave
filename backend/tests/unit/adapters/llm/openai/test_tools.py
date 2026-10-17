import json

import pytest

from agents.tool_context import ToolContext

from backend.app.adapters.llm.openai.context import OpenAIAgentContext
from backend.app.adapters.llm.openai.tools import create_openai_function_tool
from backend.app.application.agents.agent_context import AgentContext
from backend.app.application.authorization.actor import Actor
from backend.app.application.authorization.authorization_policy import (
    AuthorizationPolicy,
)
from backend.app.application.exceptions.authorization_denied import (
    AuthorizationDenied,
)
from backend.app.application.ports.order_repository import OrderRepository
from backend.app.application.tools.cancel_order_tool import CancelOrderTool
from backend.app.application.use_cases.cancel_order import CancelOrderUseCase
from backend.app.domain.model.order import Order, OrderStatus


class InMemoryOrderRepository(OrderRepository):
    def __init__(self, orders: list[Order]) -> None:
        self.orders = {order.id: order for order in orders}

    def get_by_id(self, order_id: int) -> Order | None:
        return self.orders.get(order_id)
    
    def list_demo_orders(self, lab_owner_id: int) -> list[Order]:
        return []

    def save(self, order: Order) -> None:
        self.orders[order.id] = order   
    
    def reset_demo_orders(
        self,
        lab_owner_id: int,
        orders: list[Order],
    ) -> list[Order]:
        return orders   
    
    def populate_demo_orders(self, lab_owner_id: int) -> list[Order]:
            return []

    


def create_function_tool(
    orders: list[Order],
) -> tuple[object, InMemoryOrderRepository]:
    repository = InMemoryOrderRepository(orders)

    use_case = CancelOrderUseCase(
        order_repository=repository,
        authorization_policy=AuthorizationPolicy(),
    )

    application_tool = CancelOrderTool(use_case=use_case)

    function_tool = create_openai_function_tool(
        tool=application_tool,
        parameters_schema={
            "type": "object",
            "properties": {
                "order_id": {
                    "type": "integer",
                },
            },
            "required": ["order_id"],
            "additionalProperties": False,
        },
    )

    return function_tool, repository


@pytest.mark.anyio
async def test_openai_tool_passes_application_context_to_application_tool() -> None:
    order = Order(
        id=1842,
        customer_id=1,
        status=OrderStatus.PENDING,
    )

    function_tool, repository = create_function_tool([order])

    application_context = AgentContext(
        actor=Actor(
            user_id=1,
            agent_id="orders_agent",
        )
    )

    openai_context = OpenAIAgentContext(
        application_context=application_context,
    )

    context = ToolContext(
        context=openai_context,
        tool_name="cancel_order",
        tool_call_id="test-call-1",
        tool_arguments='{"order_id": 1842}',
    )

    result = await function_tool.on_invoke_tool(
        context,
        '{"order_id": 1842}',
    )

    assert json.loads(result) == {
        "order_id": 1842,
        "status": "cancelled",
    }
    assert repository.orders[1842].status == OrderStatus.CANCELLED


@pytest.mark.anyio
async def test_openai_tool_cannot_impersonate_another_user() -> None:
    order = Order(
        id=1842,
        customer_id=2,
        status=OrderStatus.PENDING,
    )

    function_tool, repository = create_function_tool([order])

    application_context = AgentContext(
        actor=Actor(
            user_id=1,
            agent_id="orders_agent",
        )
    )

    openai_context = OpenAIAgentContext(
        application_context=application_context,
    )

    context = ToolContext(
        context=openai_context,
        tool_name="cancel_order",
        tool_call_id="test-call-2",
        tool_arguments='{"order_id": 1842}',
    )

    with pytest.raises(AuthorizationDenied):
        await function_tool.on_invoke_tool(
            context,
            '{"order_id": 1842}',
        )

    assert repository.orders[1842].status == OrderStatus.PENDING


@pytest.mark.anyio
async def test_openai_tool_does_not_accept_actor_identity_from_llm_arguments() -> None:
    order = Order(
        id=1842,
        customer_id=1,
        status=OrderStatus.PENDING,
    )

    function_tool, repository = create_function_tool([order])

    application_context = AgentContext(
        actor=Actor(
            user_id=1,
            agent_id="orders_agent",
        )
    )

    openai_context = OpenAIAgentContext(
        application_context=application_context,
    )

    context = ToolContext(
        context=openai_context,
        tool_name="cancel_order",
        tool_call_id="test-call-3",
        tool_arguments=(
            '{"order_id": 1842, '
            '"user_id": 999, '
            '"agent_id": "customer_agent"}'
        ),
    )

    with pytest.raises(TypeError):
        await function_tool.on_invoke_tool(
            context,
            (
                '{"order_id": 1842, '
                '"user_id": 999, '
                '"agent_id": "customer_agent"}'
            ),
        )

    assert repository.orders[1842].status == OrderStatus.PENDING
