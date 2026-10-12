
import re

import pytest
from agents.exceptions import UserError
from fastapi.testclient import TestClient

from backend.app import main
from backend.app.adapters.llm.openai.runtime import RuntimeResult
from backend.app.application.authorization.authorization_policy import (
    AuthorizationPolicy,
)
from backend.app.application.exceptions.authorization_denied import (
    AuthorizationDenied,
)
from backend.app.application.exceptions.entity_not_found import EntityNotFound
from backend.app.application.tools.cancel_order_tool import CancelOrderTool
from backend.app.application.tools.vulnerable_cancel_order_tool import (
    VulnerableCancelOrderTool,
)
from backend.app.application.use_cases.cancel_order import CancelOrderUseCase
from backend.app.application.use_cases.vulnerable_cancel_order import (
    VulnerableCancelOrderUseCase,
)
from backend.app.domain.exceptions.business_rule_violation import (
    BusinessRuleViolation,
)
from backend.app.domain.model.order import Order, OrderStatus
from backend.app.domain.model.user import User


class FakeTokenService:
    def get_user_id(self, token: str) -> int:
        if token == "test-token":
            return 1
        if token == "other-user-token":
            return 2
        raise ValueError("Invalid or expired access token.")


class FakeUserRepository:
    def get_by_id(self, user_id: int) -> User | None:
        users = {
            1: User(
                id=1,
                email="test@example.com",
                password_hash="test-hash",
            ),
            2: User(
                id=2,
                email="other@example.com",
                password_hash="test-hash",
            ),
        }
        return users.get(user_id)


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

    async def run(self, context, user_input: str) -> RuntimeResult:
        match = re.search(r"\b\d+\b", user_input)
        if match is None:
            raise ValueError("No order ID found in user input.")

        order_id = int(match.group())

        try:
            order = self._cancel_order_tool.execute(
                context=context.application_context,
                order_id=order_id,
            )
        except (
            AuthorizationDenied,
            BusinessRuleViolation,
            EntityNotFound,
        ) as exc:
            raise UserError(str(exc)) from exc

        return RuntimeResult(
            final_output=f"Order {order.id} cancelled.",
            tool_results=[
                {
                    "order_id": order.id,
                    "status": order.status.value,
                }
            ],
        )


class FakeVulnerableRuntime:
    def __init__(
        self,
        vulnerable_cancel_order_tool: VulnerableCancelOrderTool,
    ) -> None:
        self._vulnerable_cancel_order_tool = vulnerable_cancel_order_tool

    async def run(self, context, user_input: str) -> RuntimeResult:
        match = re.search(r"\b\d+\b", user_input)
        if match is None:
            raise ValueError("No order ID found in user input.")

        order_id = int(match.group())

        try:
            order = self._vulnerable_cancel_order_tool.execute(
                context=context.application_context,
                order_id=order_id,
            )
        except (BusinessRuleViolation, EntityNotFound) as exc:
            raise UserError(str(exc)) from exc

        return RuntimeResult(
            final_output=f"Order {order.id} cancelled.",
            tool_results=[
                {
                    "order_id": order.id,
                    "status": order.status.value,
                }
            ],
        )


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
            Order(
                id=1844,
                customer_id=2,
                status=OrderStatus.PENDING,
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

    def create_test_vulnerable_runtime(repository):
        use_case = VulnerableCancelOrderUseCase(
            order_repository=repository,
        )
        return FakeVulnerableRuntime(
            vulnerable_cancel_order_tool=VulnerableCancelOrderTool(
                use_case=use_case,
            ),
        )

    monkeypatch.setattr(main, "create_runtime", create_test_runtime)
    monkeypatch.setattr(
        main,
        "create_vulnerable_runtime",
        create_test_vulnerable_runtime,
    )

    main.app.state.order_repository = repository
    main.app.state.token_service = FakeTokenService()
    main.app.state.user_repository = FakeUserRepository()

    # Não executar o lifespan: ele inicializa a conexão com o Turso.
    test_client = TestClient(main.app)
    yield test_client
    test_client.close()


def test_cancel_order_without_token_returns_unauthorized(
    client: TestClient,
) -> None:
    response = client.post(
        "/api/orders/cancel",
        json={"user_input": "Cancel order 1842"},
    )

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


def test_cancel_order_with_invalid_token_returns_unauthorized(
    client: TestClient,
) -> None:
    response = client.post(
        "/api/orders/cancel",
        headers={"Authorization": "Bearer invalid-token"},
        json={"user_input": "Cancel order 1842"},
    )

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


def test_cancel_order_returns_success(client: TestClient) -> None:
    response = client.post(
        "/api/orders/cancel",
        headers={"Authorization": "Bearer test-token"},
        json={"user_input": "Cancel order 1842"},
    )

    assert response.status_code == 200
    assert response.json()["order_id"] == 1842
    assert response.json()["order_status"] == "cancelled"
    assert (
        client.app.state.order_repository.get_by_id(1842).status
        == OrderStatus.CANCELLED
    )


def test_cancel_already_cancelled_order_returns_conflict(
    client: TestClient,
) -> None:
    response = client.post(
        "/api/orders/cancel",
        headers={"Authorization": "Bearer test-token"},
        json={"user_input": "Cancel order 1843"},
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "Order 1843 is already cancelled."


def test_cancel_nonexistent_order_returns_not_found(
    client: TestClient,
) -> None:
    response = client.post(
        "/api/orders/cancel",
        headers={"Authorization": "Bearer test-token"},
        json={"user_input": "Cancel order 9999"},
    )

    assert response.status_code == 404


def test_user_cannot_cancel_another_users_order(
    client: TestClient,
) -> None:
    response = client.post(
        "/api/orders/cancel",
        headers={"Authorization": "Bearer test-token"},
        json={"user_input": "Cancel order 1844"},
    )

    assert response.status_code == 403
    assert (
        client.app.state.order_repository.get_by_id(1844).status
        == OrderStatus.PENDING
    )


def test_vulnerable_endpoint_allows_bola_order_cancellation(
    client: TestClient,
) -> None:
    response = client.post(
        "/api/vulnerable/orders/cancel",
        headers={"Authorization": "Bearer test-token"},
        json={"user_input": "Cancel order 1844"},
    )

    assert response.status_code == 200
    assert response.json()["order_id"] == 1844
    assert response.json()["order_status"] == "cancelled"
    assert (
        client.app.state.order_repository.get_by_id(1844).status
        == OrderStatus.CANCELLED
    )


def test_vulnerable_endpoint_still_requires_authentication(
    client: TestClient,
) -> None:
    response = client.post(
        "/api/vulnerable/orders/cancel",
        json={"user_input": "Cancel order 1844"},
    )

    assert response.status_code == 401
    assert (
        client.app.state.order_repository.get_by_id(1844).status
        == OrderStatus.PENDING
    )
