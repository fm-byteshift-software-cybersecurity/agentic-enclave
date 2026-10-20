from backend.app.application.ports.order_repository import OrderRepository


class ResetDemoOrdersUseCase:
    def __init__(self, order_repository: OrderRepository) -> None:
        self._order_repository = order_repository

    def execute(self, *, lab_owner_id: int) -> None:
        if lab_owner_id <= 0:
            raise ValueError("Lab owner ID must be a positive integer.")

        self._order_repository.reset_demo_orders(
            lab_owner_id=lab_owner_id,
        )
