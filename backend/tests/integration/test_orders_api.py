
import pytest
from fastapi.testclient import TestClient

from backend.app.domain.model.order import Order, OrderStatus
from backend.app.main import app


class InMemoryOrderRepository:
    def __init__(self, orders: list[Order]) -> None:
        self.orders = {order.id: order for order in orders}

    def get_by_id(self, order_id: int) -> Order | None:
        return self.orders.get(order_id)

    def save(self, order: Order) -> None:
        self.orders[order.id] = order


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        app.state.order_repository = InMemoryOrderRepository(
            [
                Order(
                    id=1842,
                    customer_id=1,
                    status=OrderStatus.PENDING,
                ),
                Order(
                    id=1843,
                    customer_id=1,
                    status=OrderStatus.CANCELLED,
                ),
            ]
        )
        yield test_client


def test_cancel_order_returns_success(client: TestClient) -> None:
    response = client.post(
        "/api/orders/cancel",
        json={
            "order_id": 1842,
            "user_input": "Cancel order 1842",
        },
    )

    assert response.status_code == 200
    assert response.json()["order_status"] == "cancelled"


def test_cancel_already_cancelled_order_returns_conflict(
    client: TestClient,
) -> None:
    response = client.post(
        "/api/orders/cancel",
        json={
            "order_id": 1843,
            "user_input": "Cancel order 1843",
        },
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "Order 1843 is already cancelled."


def test_cancel_nonexistent_order_returns_not_found(
    client: TestClient,
) -> None:
    response = client.post(
        "/api/orders/cancel",
        json={
            "order_id": 9999,
            "user_input": "Cancel order 9999",
        },
    )

    assert response.status_code == 404