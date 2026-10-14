import pytest

from backend.app.application.use_cases.login_user import (
    InvalidCredentials,
    LoginUserUseCase,
)
from backend.app.domain.model.user import User


class FakeUserRepository:
    def __init__(self, user: User | None = None) -> None:
        self.user = user
        self.requested_emails: list[str] = []

    def get_by_email(self, email: str) -> User | None:
        self.requested_emails.append(email)
        if self.user is not None and self.user.email == email:
            return self.user
        return None


class FakePasswordHasher:
    def __init__(self, password_matches: bool = True) -> None:
        self.password_matches = password_matches
        self.verified_credentials: list[tuple[str, str]] = []

    def verify(self, password: str, password_hash: str) -> bool:
        self.verified_credentials.append((password, password_hash))
        return self.password_matches


class FakeTokenService:
    def __init__(self) -> None:
        self.user_ids: list[int] = []

    def create_access_token(self, user_id: int) -> str:
        self.user_ids.append(user_id)
        return f"token-for-user-{user_id}"


def test_login_user_normalizes_email_and_returns_access_token() -> None:
    user = User(
        id=42,
        email="fernando@example.com",
        password_hash="stored-hash",
    )
    repository = FakeUserRepository(user=user)
    password_hasher = FakePasswordHasher()
    token_service = FakeTokenService()

    use_case = LoginUserUseCase(
        user_repository=repository,
        password_hasher=password_hasher,
        token_service=token_service,
    )

    result = use_case.execute(
        email="  FERNANDO@Example.COM ",
        password="a-strong-test-password",
    )

    assert result.user_id == 42
    assert result.email == "fernando@example.com"
    assert result.access_token == "token-for-user-42"

    assert repository.requested_emails == ["fernando@example.com"]
    assert password_hasher.verified_credentials == [
        ("a-strong-test-password", "stored-hash")
    ]
    assert token_service.user_ids == [42]


def test_login_user_rejects_unknown_email_without_creating_token() -> None:
    repository = FakeUserRepository()
    password_hasher = FakePasswordHasher()
    token_service = FakeTokenService()

    use_case = LoginUserUseCase(
        user_repository=repository,
        password_hasher=password_hasher,
        token_service=token_service,
    )

    with pytest.raises(InvalidCredentials):
        use_case.execute(
            email="unknown@example.com",
            password="a-strong-test-password",
        )

    assert password_hasher.verified_credentials == []
    assert token_service.user_ids == []


def test_login_user_rejects_incorrect_password_without_creating_token() -> None:
    user = User(
        id=42,
        email="fernando@example.com",
        password_hash="stored-hash",
    )
    repository = FakeUserRepository(user=user)
    password_hasher = FakePasswordHasher(password_matches=False)
    token_service = FakeTokenService()

    use_case = LoginUserUseCase(
        user_repository=repository,
        password_hasher=password_hasher,
        token_service=token_service,
    )

    with pytest.raises(InvalidCredentials):
        use_case.execute(
            email="fernando@example.com",
            password="wrong-password",
        )

    assert password_hasher.verified_credentials == [
        ("wrong-password", "stored-hash")
    ]
    assert token_service.user_ids == []


def test_login_user_raises_if_stored_user_has_no_id() -> None:
    user = User(
        id=None,
        email="fernando@example.com",
        password_hash="stored-hash",
    )
    repository = FakeUserRepository(user=user)
    password_hasher = FakePasswordHasher()
    token_service = FakeTokenService()

    use_case = LoginUserUseCase(
        user_repository=repository,
        password_hasher=password_hasher,
        token_service=token_service,
    )

    with pytest.raises(
        RuntimeError,
        match="The stored user has no ID.",
    ):
        use_case.execute(
            email="fernando@example.com",
            password="a-strong-test-password",
        )

    assert token_service.user_ids == []
