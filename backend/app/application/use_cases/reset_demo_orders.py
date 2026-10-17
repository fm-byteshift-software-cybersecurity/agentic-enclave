
from backend.app.application.ports.order_repository import OrderRepository
from backend.app.domain.model.order import Order, OrderStatus


SYNTHETIC_VICTIM_CUSTOMER_ID = -1


class ResetDemoOrdersUseCase:
    def __init__(self, order_repository: OrderRepository) -> None:
        self._order_repository = order_repository

    def execute(self, lab_owner_id: int) -> list[Order]:
        if lab_owner_id <= 0:
            raise ValueError("Lab owner ID must be a positive integer.")

        orders = [
            Order(
                id=0,
                customer_id=lab_owner_id,
                status=OrderStatus.PENDING,
            ),
            Order(
                id=0,
                customer_id=SYNTHETIC_VICTIM_CUSTOMER_ID,
                status=OrderStatus.PENDING,
            ),
        ]

        return self._order_repository.reset_demo_orders(
            lab_owner_id=lab_owner_id,
            orders=orders,
        )
