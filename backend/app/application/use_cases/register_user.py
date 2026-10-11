
from dataclasses import dataclass

from backend.app.application.ports.password_hasher import PasswordHasher
from backend.app.application.ports.token_service import TokenService
from backend.app.application.ports.user_repository import UserRepository
from backend.app.domain.model.user import User


class UserAlreadyExists(Exception):
    pass


@dataclass(frozen=True)
class RegisterUserResult:
    user_id: int
    email: str
    access_token: str


class RegisterUserUseCase:
    def __init__(
        self,
        user_repository: UserRepository,
        password_hasher: PasswordHasher,
        token_service: TokenService,
    ) -> None:
        self._user_repository = user_repository
        self._password_hasher = password_hasher
        self._token_service = token_service

    def execute(self, email: str, password: str) -> RegisterUserResult:
        normalized_email = email.strip().lower()

        if self._user_repository.get_by_email(normalized_email) is not None:
            raise UserAlreadyExists("An account with this email already exists.")

        password_hash = self._password_hasher.hash(password)

        user = self._user_repository.save(
            User(
                id=None,
                email=normalized_email,
                password_hash=password_hash,
            )
        )

        if user.id is None:
            raise RuntimeError("The repository did not assign a user ID.")

        access_token = self._token_service.create_access_token(user.id)

        return RegisterUserResult(
            user_id=user.id,
            email=user.email,
            access_token=access_token,
        )