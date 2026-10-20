import pytest

from backend.app.application.ports.order_repository import OrderRepository
from backend.app.application.use_cases.reset_demo_orders import (
    ResetDemoOrdersUseCase,
)
from backend.app.domain.model.order import Order


class FakeOrderRepository(OrderRepository):
    def __init__(self) -> None:
        self.lab_owner_id = None
        self.reset_called = False

    def get_by_id(self, order_id: int) -> Order | None:
        return None

    def belongs_to_lab(self, order_id: int, lab_owner_id: int) -> bool:
        return False

    def list_demo_orders(self, lab_owner_id: int) -> list[Order]:
        return []

    def save(self, order: Order) -> None:
        pass

    def reset_demo_orders(self, lab_owner_id: int) -> None:
        self.lab_owner_id = lab_owner_id
        self.reset_called = True

    def populate_demo_orders(self, lab_owner_id: int) -> list[Order]:
        return []


def test_execute_resets_orders_for_lab_owner() -> None:
    repository = FakeOrderRepository()
    use_case = ResetDemoOrdersUseCase(repository)

    result = use_case.execute(lab_owner_id=42)

    assert result is None
    assert repository.lab_owner_id == 42
    assert repository.reset_called is True


@pytest.mark.parametrize("lab_owner_id", [0, -1, -42])
def test_execute_rejects_non_positive_lab_owner_id(
    lab_owner_id: int,
) -> None:
    repository = FakeOrderRepository()
    use_case = ResetDemoOrdersUseCase(repository)

    with pytest.raises(ValueError, match="positive integer"):
        use_case.execute(lab_owner_id=lab_owner_id)

    assert repository.lab_owner_id is None
    assert repository.reset_called is False
