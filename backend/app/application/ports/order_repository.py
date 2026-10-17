
from abc import ABC, abstractmethod

from backend.app.domain.model.order import Order


class OrderRepository(ABC):
    @abstractmethod
    def get_by_id(self, order_id: int) -> Order | None:
        pass

    @abstractmethod
    def save(self, order: Order) -> None:
        pass

    @abstractmethod
    def list_demo_orders(self, lab_owner_id: int) -> list[Order]:
        """Return only demo orders owned by the specified lab user."""
        pass

    @abstractmethod
    def reset_demo_orders(
        self,
        lab_owner_id: int,
        orders: list[Order],
    ) -> list[Order]:
        """Atomically replace a user's demo orders and return their generated IDs."""
        pass

    @abstractmethod
    def populate_demo_orders(self, lab_owner_id: int) -> list[Order]:
        """Create the initial demo orders for a user's lab."""
        pass
