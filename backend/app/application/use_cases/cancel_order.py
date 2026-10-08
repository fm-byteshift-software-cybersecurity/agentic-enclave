from backend.app.application.authorization.actor import Actor
from backend.app.application.authorization.authorization_policy import (
    AuthorizationPolicy,
)
from backend.app.application.authorization.permission import Permission
from backend.app.application.exceptions.authorization_denied import (
    AuthorizationDenied,
)
from backend.app.application.exceptions.entity_not_found import EntityNotFound
from backend.app.application.ports.order_repository import OrderRepository


class CancelOrderUseCase:
    def __init__(
        self,
        order_repository: OrderRepository,
        authorization_policy: AuthorizationPolicy,
    ) -> None:
        self._order_repository = order_repository
        self._authorization_policy = authorization_policy

    def execute(
        self,
        actor: Actor,
        order_id: int,
    ) -> None:
        order = self._order_repository.get_by_id(order_id)

        if order is None:
            raise EntityNotFound(
                f"Order {order_id} was not found."
            )

        if not self._authorization_policy.is_allowed(
            actor=actor,
            permission=Permission.CANCEL_ORDER,
            resource_owner_id=order.customer_id,
        ):
            raise AuthorizationDenied(
                f"Actor {actor.user_id} is not authorized to cancel "
                f"order {order.id}."
            )

        order.cancel()

        self._order_repository.save(order)
