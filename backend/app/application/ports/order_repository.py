from abc import ABC, abstractmethod

from backend.app.domain.model.order import Order


class OrderRepository(ABC):
    @abstractmethod
    def get_by_id(self, order_id: int) -> Order | None:
        pass

    @abstractmethod
    def save(self, order: Order) -> None:
        pass