import pytest

from backend.app.application.ports.order_repository import OrderRepository
from backend.app.application.use_cases.reset_demo_orders import (
    ResetDemoOrdersUseCase,
    SYNTHETIC_VICTIM_CUSTOMER_ID,
)
from backend.app.domain.model.order import Order, OrderStatus


class FakeOrderRepository(OrderRepository):
    def __init__(self) -> None:
        self.lab_owner_id = None
        self.orders = None

    def get_by_id(self, order_id: int) -> Order | None:
        return None

    def belongs_to_lab(self, order_id: int, lab_owner_id: int) -> bool:
        return False

    def list_demo_orders(self, lab_owner_id: int) -> list[Order]:
        return []

    def save(self, order: Order) -> None:
        pass

    def reset_demo_orders(
        self,
        lab_owner_id: int,
        orders: list[Order],
    ) -> list[Order]:
        self.lab_owner_id = lab_owner_id
        self.orders = orders
        return orders

    def populate_demo_orders(self, lab_owner_id: int) -> list[Order]:
        return []


def test_execute_creates_own_order_and_synthetic_victim_order() -> None:
    repository = FakeOrderRepository()
    use_case = ResetDemoOrdersUseCase(repository)

    result = use_case.execute(lab_owner_id=42)

    assert repository.lab_owner_id == 42
    assert len(result) == 2

    assert result[0].customer_id == 42
    assert result[0].status == OrderStatus.PENDING

    assert result[1].customer_id == SYNTHETIC_VICTIM_CUSTOMER_ID
    assert result[1].status == OrderStatus.PENDING

    assert all(order.id == 0 for order in result)


@pytest.mark.parametrize("lab_owner_id", [0, -1, -42])
def test_execute_rejects_non_positive_lab_owner_id(
    lab_owner_id: int,
) -> None:
    repository = FakeOrderRepository()
    use_case = ResetDemoOrdersUseCase(repository)

    with pytest.raises(ValueError, match="positive integer"):
        use_case.execute(lab_owner_id=lab_owner_id)

    assert repository.lab_owner_id is None
    assert repository.orders is None