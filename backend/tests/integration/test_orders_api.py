import re

import pytest
from agents.exceptions import UserError
from fastapi.testclient import TestClient

from backend.app import main
from backend.app.application.authorization.authorization_policy import (
    AuthorizationPolicy,
)
from backend.app.application.exceptions.entity_not_found import EntityNotFound
from backend.app.application.tools.cancel_order_tool import CancelOrderTool
from backend.app.application.use_cases.cancel_order import CancelOrderUseCase
from backend.app.domain.exceptions.business_rule_violation import (
    BusinessRuleViolation,
)
from backend.app.domain.model.order import Order, OrderStatus


class InMemoryOrderRepository:
    def __init__(self, orders: list[Order]) -> None:
        self.orders = {order.id: order for order in orders}

    def get_by_id(self, order_id: int) -> Order | None:
        return self.orders.get(order_id)

    def save(self, order: Order) -> None:
        self.orders[order.id] = order


class FakeRuntime:
    def __init__(self, cancel_order_tool: CancelOrderTool) -> None:
        self._cancel_order_tool = cancel_order_tool

    async def run(self, context, user_input: str) -> str:
        match = re.search(r"\b\d+\b", user_input)
        if match is None:
            raise ValueError("No order ID found in user input.")

        order_id = int(match.group())

        try:
            self._cancel_order_tool.execute(
                context=context.application_context,
                order_id=order_id,
            )
        except (BusinessRuleViolation, EntityNotFound) as exc:
            raise UserError(str(exc)) from exc

        return f"Order {order_id} cancelled."


@pytest.fixture
def client(monkeypatch):
    repository = InMemoryOrderRepository(
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

    def create_test_runtime(repository):
        use_case = CancelOrderUseCase(
            order_repository=repository,
            authorization_policy=AuthorizationPolicy(),
        )
        return FakeRuntime(
            cancel_order_tool=CancelOrderTool(use_case=use_case),
        )

    monkeypatch.setattr(main, "create_runtime", create_test_runtime)
    main.app.state.order_repository = repository

    # Não executar o lifespan: ele inicializa a conexão com o Turso.
    test_client = TestClient(main.app)
    yield test_client
    test_client.close()


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

