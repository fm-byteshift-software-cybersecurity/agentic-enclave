import pytest
from fastapi.testclient import TestClient

from backend.app.domain.model.user import User
from backend.app.main import app


class FakeUserRepository:
    def __init__(self) -> None:
        self.users_by_email: dict[str, User] = {}
        self.next_id = 1

    def get_by_email(self, email: str) -> User | None:
        return self.users_by_email.get(email)

    def get_by_id(self, user_id: int) -> User | None:
        return next(
            (
                user
                for user in self.users_by_email.values()
                if user.id == user_id
            ),
            None,
        )

    def save(self, user: User) -> User:
        saved_user = User(
            id=self.next_id,
            email=user.email,
            password_hash=user.password_hash,
        )
        self.next_id += 1
        self.users_by_email[saved_user.email] = saved_user
        return saved_user


class FakePasswordHasher:
    def hash(self, password: str) -> str:
        return f"hashed:{password}"

    def verify(self, password: str, password_hash: str) -> bool:
        return password_hash == f"hashed:{password}"


class FakeTokenService:
    def __init__(self) -> None:
        self.created_user_ids: list[int] = []

    def create_access_token(self, user_id: int) -> str:
        self.created_user_ids.append(user_id)
        return f"test-token-{user_id}"

    def get_user_id(self, token: str) -> int:
        prefix = "test-token-"

        if not token.startswith(prefix):
            raise ValueError("Invalid or expired access token.")

        try:
            user_id = int(token.removeprefix(prefix))
        except ValueError as exc:
            raise ValueError(
                "Invalid or expired access token."
            ) from exc

        if user_id <= 0:
            raise ValueError("Invalid or expired access token.")

        return user_id


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch) -> TestClient:
    monkeypatch.setenv("APP_ENV", "development")

    app.state.user_repository = FakeUserRepository()
    app.state.password_hasher = FakePasswordHasher()
    app.state.token_service = FakeTokenService()

    # Do not use TestClient as a context manager here.
    # Entering its context starts the application's lifespan, which
    # replaces these fakes with the real database-backed dependencies.
    return TestClient(
    app,
    headers={"Origin": "http://localhost:5173"},
)


def assert_auth_cookie(response, expected_token: str) -> None:
    set_cookie = response.headers.get("set-cookie", "")

    assert f"access_token={expected_token}" in set_cookie
    assert "httponly" in set_cookie.lower()
    assert "samesite=lax" in set_cookie.lower()

    attributes = {
        attribute.strip().lower()
        for attribute in set_cookie.split(";")[1:]
    }
    assert "secure" not in attributes


def test_register_returns_created_user_and_sets_http_only_cookie(
    client: TestClient,
) -> None:
    response = client.post(
        "/api/auth/register",
        json={
            "email": "Fernando@Example.COM",
            "password": "a-strong-test-password",
        },
    )

    assert response.status_code == 201
    assert response.json() == {
        "user_id": 1,
        "email": "fernando@example.com",
    }
    assert "access_token" not in response.json()
    assert "token_type" not in response.json()
    assert_auth_cookie(response, "test-token-1")
    assert app.state.token_service.created_user_ids == [1]


def test_register_returns_conflict_for_existing_email(
    client: TestClient,
) -> None:
    first_response = client.post(
        "/api/auth/register",
        json={
            "email": "fernando@example.com",
            "password": "a-strong-test-password",
        },
    )
    second_response = client.post(
        "/api/auth/register",
        json={
            "email": "FERNANDO@example.com",
            "password": "another-strong-password",
        },
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 409
    assert second_response.json()["detail"] == (
        "An account with this email already exists."
    )
    assert app.state.token_service.created_user_ids == [1]


def test_login_returns_user_and_sets_http_only_cookie(
    client: TestClient,
) -> None:
    registration = client.post(
        "/api/auth/register",
        json={
            "email": "fernando@example.com",
            "password": "a-strong-test-password",
        },
    )
    assert registration.status_code == 201

    response = client.post(
        "/api/auth/login",
        json={
            "email": "FERNANDO@example.com",
            "password": "a-strong-test-password",
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "user_id": 1,
        "email": "fernando@example.com",
    }
    assert "access_token" not in response.json()
    assert "token_type" not in response.json()
    assert_auth_cookie(response, "test-token-1")
    assert app.state.token_service.created_user_ids == [1, 1]


def test_login_rejects_invalid_credentials(
    client: TestClient,
) -> None:
    response = client.post(
        "/api/auth/login",
        json={
            "email": "unknown@example.com",
            "password": "a-strong-test-password",
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password."
    assert app.state.token_service.created_user_ids == []
    assert "set-cookie" not in response.headers


def test_register_rejects_password_shorter_than_minimum(
    client: TestClient,
) -> None:
    response = client.post(
        "/api/auth/register",
        json={
            "email": "fernando@example.com",
            "password": "short",
        },
    )

    assert response.status_code == 422
    assert app.state.user_repository.users_by_email == {}
    assert app.state.token_service.created_user_ids == []


def test_logout_deletes_access_token_cookie(
    client: TestClient,
) -> None:
    registration = client.post(
        "/api/auth/register",
        json={
            "email": "fernando@example.com",
            "password": "a-strong-test-password",
        },
    )
    assert registration.status_code == 201

    response = client.post("/api/auth/logout")

    assert response.status_code == 204

    set_cookie = response.headers.get("set-cookie", "")
    assert "access_token=" in set_cookie
    assert "max-age=0" in set_cookie.lower()
    assert "httponly" in set_cookie.lower()


