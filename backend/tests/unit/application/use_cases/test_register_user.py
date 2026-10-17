
import pytest

from backend.app.application.use_cases.register_user import (
    RegisterUserUseCase,
    UserAlreadyExists,
)
from backend.app.domain.model.user import User


class FakeUserRepository:
    def __init__(
        self,
        existing_user: User | None = None,
        assigned_id: int | None = 1,
    ) -> None:
        self.existing_user = existing_user
        self.assigned_id = assigned_id
        self.saved_user: User | None = None

    def get_by_email(self, email: str) -> User | None:
        if (
            self.existing_user is not None
            and self.existing_user.email == email
        ):
            return self.existing_user
        return None

    def save(self, user: User) -> User:
        self.saved_user = user
        return User(
            id=self.assigned_id,
            email=user.email,
            password_hash=user.password_hash,
        )


class FakePasswordHasher:
    def __init__(self) -> None:
        self.hashed_passwords: list[str] = []

    def hash(self, password: str) -> str:
        self.hashed_passwords.append(password)
        return f"hashed:{password}"


class FakeTokenService:
    def __init__(self) -> None:
        self.user_ids: list[int] = []

    def create_access_token(self, user_id: int) -> str:
        self.user_ids.append(user_id)
        return f"token-for-user-{user_id}"


class FakeOrderRepository:
    def __init__(self) -> None:
        self.populated_lab_owner_ids: list[int] = []

    def populate_demo_orders(self, lab_owner_id: int) -> list:
        self.populated_lab_owner_ids.append(lab_owner_id)
        return []


def test_register_user_normalizes_email_hashes_password_and_creates_token() -> None:
    repository = FakeUserRepository(assigned_id=42)
    password_hasher = FakePasswordHasher()
    token_service = FakeTokenService()
    order_repository = FakeOrderRepository()

    use_case = RegisterUserUseCase(
        user_repository=repository,
        password_hasher=password_hasher,
        token_service=token_service,
        order_repository=order_repository,
    )

    result = use_case.execute(
        email="  Fernando@Example.COM ",
        password="a-strong-test-password",
    )

    assert result.user_id == 42
    assert result.email == "fernando@example.com"
    assert result.access_token == "token-for-user-42"

    assert repository.saved_user is not None
    assert repository.saved_user.id is None
    assert repository.saved_user.email == "fernando@example.com"
    assert repository.saved_user.password_hash == (
        "hashed:a-strong-test-password"
    )

    assert password_hasher.hashed_passwords == [
        "a-strong-test-password"
    ]
    assert token_service.user_ids == [42]
    assert order_repository.populated_lab_owner_ids == [42]


def test_register_user_rejects_existing_email_without_hashing_or_creating_token() -> None:
    existing_user = User(
        id=7,
        email="fernando@example.com",
        password_hash="existing-hash",
    )
    repository = FakeUserRepository(existing_user=existing_user)
    password_hasher = FakePasswordHasher()
    token_service = FakeTokenService()
    order_repository = FakeOrderRepository()

    use_case = RegisterUserUseCase(
        user_repository=repository,
        password_hasher=password_hasher,
        token_service=token_service,
        order_repository=order_repository,
    )

    with pytest.raises(UserAlreadyExists):
        use_case.execute(
            email="  FERNANDO@example.com ",
            password="a-strong-test-password",
        )

    assert repository.saved_user is None
    assert password_hasher.hashed_passwords == []
    assert token_service.user_ids == []
    assert order_repository.populated_lab_owner_ids == []


def test_register_user_raises_if_repository_does_not_assign_id() -> None:
    repository = FakeUserRepository(assigned_id=None)
    password_hasher = FakePasswordHasher()
    token_service = FakeTokenService()
    order_repository = FakeOrderRepository()

    use_case = RegisterUserUseCase(
        user_repository=repository,
        password_hasher=password_hasher,
        token_service=token_service,
        order_repository=order_repository,
    )

    with pytest.raises(
        RuntimeError,
        match="The repository did not assign a user ID.",
    ):
        use_case.execute(
            email="fernando@example.com",
            password="a-strong-test-password",
        )

    assert repository.saved_user is not None
    assert password_hasher.hashed_passwords == [
        "a-strong-test-password"
    ]
    assert token_service.user_ids == []
    assert order_repository.populated_lab_owner_ids == []
