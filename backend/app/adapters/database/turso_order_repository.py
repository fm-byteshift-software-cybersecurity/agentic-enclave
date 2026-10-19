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

    def belongs_to_lab(self, order_id: int, lab_owner_id: int) -> bool:
        result = self._connection.execute(
            """
            SELECT 1
            FROM orders
            WHERE id = ?
              AND lab_owner_id = ?
            LIMIT 1
            """,
            (order_id, lab_owner_id),
        )

        return result.fetchone() is not None

    def list_demo_orders(self, lab_owner_id: int) -> list[Order]:
        result = self._connection.execute(
            """
            SELECT id, customer_id, status
            FROM orders
            WHERE
                (is_demo = 0 AND customer_id = ?)
                OR
                (is_demo = 1 AND lab_owner_id = ?)
            ORDER BY id
            """,
            (lab_owner_id, lab_owner_id),
        )

        return [
            Order(
                id=row[0],
                customer_id=row[1],
                status=OrderStatus(row[2]),
            )
            for row in result.fetchall()
        ]

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

    def populate_demo_orders(self, lab_owner_id: int) -> list[Order]:
        orders = [
            Order(
                id=0,
                customer_id=lab_owner_id,
                status=OrderStatus.PENDING,
            ),
            Order(
                id=0,
                customer_id=2147483646,
                status=OrderStatus.PENDING,
            ),
            Order(
                id=0,
                customer_id=2147483645,
                status=OrderStatus.PENDING,
            ),
        ]

        self._connection.execute("BEGIN")

        try:
            created_orders: list[Order] = []

            for order in orders:
                cursor = self._connection.execute(
                    """
                    INSERT INTO orders (
                        customer_id,
                        status,
                        is_demo,
                        lab_owner_id
                    )
                    VALUES (?, ?, 1, ?)
                    """,
                    (
                        order.customer_id,
                        order.status.value,
                        lab_owner_id,
                    ),
                )

                created_orders.append(
                    Order(
                        id=cursor.lastrowid,
                        customer_id=order.customer_id,
                        status=order.status,
                    )
                )

            self._connection.commit()
            return created_orders

        except Exception:
            self._connection.rollback()
            raise

    def reset_demo_orders(
        self,
        lab_owner_id: int,
        orders: list[Order],
    ) -> list[Order]:
        self._connection.execute("BEGIN")

        try:
            self._connection.execute(
                """
                DELETE FROM orders
                WHERE is_demo = 1
                  AND lab_owner_id = ?
                """,
                (lab_owner_id,),
            )

            created_orders: list[Order] = []

            for order in orders:
                cursor = self._connection.execute(
                    """
                    INSERT INTO orders (
                        customer_id,
                        status,
                        is_demo,
                        lab_owner_id
                    )
                    VALUES (?, ?, 1, ?)
                    """,
                    (
                        order.customer_id,
                        order.status.value,
                        lab_owner_id,
                    ),
                )

                created_orders.append(
                    Order(
                        id=cursor.lastrowid,
                        customer_id=order.customer_id,
                        status=order.status,
                    )
                )

            self._connection.commit()
            return created_orders

        except Exception:
            self._connection.rollback()
            raise
