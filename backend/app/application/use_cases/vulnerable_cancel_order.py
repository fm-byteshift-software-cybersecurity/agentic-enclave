from backend.app.application.exceptions.entity_not_found import EntityNotFound
from backend.app.application.ports.order_repository import OrderRepository
from backend.app.domain.model.order import Order


class VulnerableCancelOrderUseCase:
    """Demonstrate BOLA within a lab while enforcing lab isolation."""

    def __init__(
        self,
        order_repository: OrderRepository,
    ) -> None:
        self._order_repository = order_repository

    def execute(
        self,
        *,
        order_id: int,
        lab_owner_id: int,
    ) -> Order:
        if not self._order_repository.belongs_to_lab(
            order_id,
            lab_owner_id,
        ):
            raise EntityNotFound(
                f"Order {order_id} was not found."
            )

        order = self._order_repository.get_by_id(order_id)

        if order is None:
            raise EntityNotFound(
                f"Order {order_id} was not found."
            )

        order.cancel()
        self._order_repository.save(order)

        return order