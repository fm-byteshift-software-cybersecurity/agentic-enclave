
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