
from typing import Any

from backend.app.application.ports.order_repository import OrderRepository
from backend.app.domain.model.order import Order, OrderStatus


class TursoOrderRepository(OrderRepository):
    def __init__(self, connection: Any) -> None:
        self._connection = connection

    def get_by_id(self, order_id: int) -> Order | None:
        result = self._connection.execute(
            """
            SELECT id, customer_id, status
            FROM orders
            WHERE id = ?
            """,
            (order_id,),
        )

        row = result.fetchone()

        if row is None:
            return None

        return Order(
            id=row[0],
            customer_id=row[1],
            status=OrderStatus(row[2]),
        )

    def save(self, order: Order) -> None:
        self._connection.execute(
            """
            INSERT INTO orders (id, customer_id, status)
            VALUES (?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                customer_id = excluded.customer_id,
                status = excluded.status
            """,
            (order.id, order.customer_id, order.status.value),
        )

        self._connection.commit()