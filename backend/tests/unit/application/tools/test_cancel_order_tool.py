import pytest

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


def create_tool(
    orders: list[Order],
) -> tuple[CancelOrderTool, InMemoryOrderRepository]:
    repository = InMemoryOrderRepository(orders)

    use_case = CancelOrderUseCase(
        order_repository=repository,
        authorization_policy=AuthorizationPolicy(),
    )

    tool = CancelOrderTool(
        use_case=use_case,
    )

    return tool, repository


def test_tool_uses_actor_from_application_context() -> None:
    order = Order(
        id=1842,
        customer_id=1,
        status=OrderStatus.PENDING,
    )

    actor = Actor(
        user_id=1,
        agent_id="orders_agent",
    )

    context = AgentContext(actor=actor)

    tool, repository = create_tool([order])

    tool.execute(
        context=context,
        order_id=1842,
    )

    assert repository.orders[1842].status == OrderStatus.CANCELLED


def test_tool_cannot_be_used_to_impersonate_another_user() -> None:
    order = Order(
        id=1842,
        customer_id=2,
        status=OrderStatus.PENDING,
    )

    actor = Actor(
        user_id=1,
        agent_id="orders_agent",
    )

    context = AgentContext(actor=actor)

    tool, repository = create_tool([order])

    with pytest.raises(AuthorizationDenied):
        tool.execute(
            context=context,
            order_id=1842,
        )

    assert repository.orders[1842].status == OrderStatus.PENDING


def test_tool_requires_application_context() -> None:
    order = Order(
        id=1842,
        customer_id=1,
        status=OrderStatus.PENDING,
    )

    actor = Actor(
        user_id=1,
        agent_id="orders_agent",
    )

    context = AgentContext(actor=actor)

    tool, repository = create_tool([order])

    with pytest.raises(TypeError):
        tool.execute(
            order_id=1842,
        )

    assert repository.orders[1842].status == OrderStatus.PENDING