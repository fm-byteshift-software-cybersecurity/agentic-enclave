from backend.app.application.exceptions.entity_not_found import EntityNotFound
from backend.app.application.ports.order_repository import OrderRepository
from backend.app.domain.model.order import Order


class GetOrderUseCase:
    def __init__(self, order_repository: OrderRepository) -> None:
        self._order_repository = order_repository

    def execute(self, order_id: int) -> Order:
        order = self._order_repository.get_by_id(order_id)

        if order is None:
            raise EntityNotFound(
                f"Order {order_id} was not found."
            )

        return order