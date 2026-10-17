from uuid import uuid4

from backend.app.adapters.database.schema import initialize_schema
from backend.app.adapters.database.turso_connection import (
    create_turso_connection,
)
from backend.app.adapters.database.turso_order_repository import (
    TursoOrderRepository,
)
from backend.app.domain.model.order import Order, OrderStatus


def test_turso_order_repository_persists_order() -> None:
    initialize_schema()

    connection = create_turso_connection()
    order_id = int(uuid4().int % 1_000_000_000)

    try:
        repository = TursoOrderRepository(connection)

        order = Order(
            id=order_id,
            customer_id=12345,
            status=OrderStatus.PENDING,
        )

        repository.save(order)

        saved_order = repository.get_by_id(order_id)

        assert saved_order is not None
        assert saved_order.id == order_id
        assert saved_order.customer_id == 12345
        assert saved_order.status == OrderStatus.PENDING

        saved_order.status = OrderStatus.CANCELLED
        repository.save(saved_order)

        updated_order = repository.get_by_id(order_id)

        assert updated_order is not None
        assert updated_order.status == OrderStatus.CANCELLED

    finally:
        connection.execute(
            "DELETE FROM orders WHERE id = ?",
            (order_id,),
        )
        connection.commit()
        connection.close()


def test_populate_demo_orders_creates_three_orders_for_user() -> None:
    initialize_schema()

    connection = create_turso_connection()
    lab_owner_id = int(uuid4().int % 1_000_000_000)

    try:
        repository = TursoOrderRepository(connection)

        created_orders = repository.populate_demo_orders(lab_owner_id)

        assert len(created_orders) == 3
        assert all(order.id is not None for order in created_orders)
        assert len({order.id for order in created_orders}) == 3

        assert [order.customer_id for order in created_orders] == [
            lab_owner_id,
            2147483646,
            2147483645,
        ]
        assert all(
            order.status == OrderStatus.PENDING
            for order in created_orders
        )

        result = connection.execute(
            """
            SELECT id, customer_id, status, is_demo, lab_owner_id
            FROM orders
            WHERE lab_owner_id = ?
            ORDER BY id
            """,
            (lab_owner_id,),
        )

        rows = result.fetchall()

        assert len(rows) == 3
        assert {row[0] for row in rows} == {
            order.id for order in created_orders
        }
        assert {row[1] for row in rows} == {
            lab_owner_id,
            2147483646,
            2147483645,
        }
        assert all(row[2] == OrderStatus.PENDING.value for row in rows)
        assert all(row[3] == 1 for row in rows)
        assert all(row[4] == lab_owner_id for row in rows)

    finally:
        connection.execute(
            "DELETE FROM orders WHERE lab_owner_id = ?",
            (lab_owner_id,),
        )
        connection.commit()
        connection.close()


def test_populate_demo_orders_keeps_users_orders_separate() -> None:
    initialize_schema()

    connection = create_turso_connection()
    first_user_id = int(uuid4().int % 1_000_000_000)
    second_user_id = first_user_id + 1

    try:
        repository = TursoOrderRepository(connection)

        first_user_orders = repository.populate_demo_orders(first_user_id)
        second_user_orders = repository.populate_demo_orders(second_user_id)

        assert len(first_user_orders) == 3
        assert len(second_user_orders) == 3

        first_ids = {order.id for order in first_user_orders}
        second_ids = {order.id for order in second_user_orders}

        assert first_ids.isdisjoint(second_ids)

        for user_id in (first_user_id, second_user_id):
            result = connection.execute(
                """
                SELECT customer_id, is_demo, lab_owner_id
                FROM orders
                WHERE lab_owner_id = ?
                """,
                (user_id,),
            )

            rows = result.fetchall()

            assert len(rows) == 3
            assert {row[0] for row in rows} == {
                user_id,
                2147483646,
                2147483645,
            }
            assert all(row[1] == 1 for row in rows)
            assert all(row[2] == user_id for row in rows)

    finally:
        connection.execute(
            """
            DELETE FROM orders
            WHERE lab_owner_id IN (?, ?)
            """,
            (first_user_id, second_user_id),
        )
        connection.commit()
        connection.close()
