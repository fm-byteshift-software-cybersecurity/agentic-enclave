from backend.app.application.authorization.actor import Actor
from backend.app.application.authorization.authorization_policy import (
    AuthorizationPolicy,
)
from backend.app.application.exceptions.entity_not_found import EntityNotFound
from backend.app.application.use_cases.cancel_order import CancelOrderUseCase
from backend.app.domain.exceptions.business_rule_violation import (
    BusinessRuleViolation,
)
from backend.app.domain.model.order import Order, OrderStatus


class InMemoryOrderRepository:
    def __init__(self, orders: list[Order]) -> None:
        self.orders = {order.id: order for order in orders}

    def get_by_id(self, order_id: int) -> Order | None:
        return self.orders.get(order_id)

    def save(self, order: Order) -> None:
        self.orders[order.id] = order


def create_use_case(
    orders: list[Order],
) -> tuple[CancelOrderUseCase, InMemoryOrderRepository]:
    repository = InMemoryOrderRepository(orders)
    policy = AuthorizationPolicy()

    use_case = CancelOrderUseCase(
        order_repository=repository,
        authorization_policy=policy,
    )

    return use_case, repository


def test_owner_can_cancel_order() -> None:
    order = Order(
        id=1842,
        customer_id=1,
        status=OrderStatus.PENDING,
    )

    use_case, repository = create_use_case([order])

    actor = Actor(
        user_id=1,
        agent_id="orders_agent",
    )

    use_case.execute(
        actor=actor,
        order_id=1842,
    )

    assert repository.orders[1842].status == OrderStatus.CANCELLED


def test_user_cannot_cancel_order_owned_by_another_user() -> None:
    order = Order(
        id=1842,
        customer_id=2,
        status=OrderStatus.PENDING,
    )

    use_case, repository = create_use_case([order])

    actor = Actor(
        user_id=1,
        agent_id="orders_agent",
    )

    try:
        use_case.execute(
            actor=actor,
            order_id=1842,
        )
        assert False, "Expected PermissionError"
    except PermissionError:
        pass

    assert repository.orders[1842].status == OrderStatus.PENDING


def test_agent_without_cancel_permission_cannot_cancel_order() -> None:
    order = Order(
        id=1842,
        customer_id=1,
        status=OrderStatus.PENDING,
    )

    use_case, repository = create_use_case([order])

    actor = Actor(
        user_id=1,
        agent_id="customer_agent",
    )

    try:
        use_case.execute(
            actor=actor,
            order_id=1842,
        )
        assert False, "Expected PermissionError"
    except PermissionError:
        pass

    assert repository.orders[1842].status == OrderStatus.PENDING


def test_missing_order_raises_entity_not_found() -> None:
    use_case, _ = create_use_case([])

    actor = Actor(
        user_id=1,
        agent_id="orders_agent",
    )

    try:
        use_case.execute(
            actor=actor,
            order_id=9999,
        )
        assert False, "Expected EntityNotFound"
    except EntityNotFound:
        pass


def test_shipped_order_cannot_be_cancelled() -> None:
    order = Order(
        id=1842,
        customer_id=1,
        status=OrderStatus.SHIPPED,
    )

    use_case, repository = create_use_case([order])

    actor = Actor(
        user_id=1,
        agent_id="orders_agent",
    )

    try:
        use_case.execute(
            actor=actor,
            order_id=1842,
        )
        assert False, "Expected BusinessRuleViolation"
    except BusinessRuleViolation:
        pass

    assert repository.orders[1842].status == OrderStatus.SHIPPED