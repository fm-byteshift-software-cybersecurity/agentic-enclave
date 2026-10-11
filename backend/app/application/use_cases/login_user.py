
from dataclasses import dataclass

from backend.app.application.ports.password_hasher import PasswordHasher
from backend.app.application.ports.token_service import TokenService
from backend.app.application.ports.user_repository import UserRepository


class InvalidCredentials(Exception):
    pass


@dataclass(frozen=True)
class LoginUserResult:
    user_id: int
    email: str
    access_token: str


class LoginUserUseCase:
    def __init__(
        self,
        user_repository: UserRepository,
        password_hasher: PasswordHasher,
        token_service: TokenService,
    ) -> None:
        self._user_repository = user_repository
        self._password_hasher = password_hasher
        self._token_service = token_service

    def execute(self, email: str, password: str) -> LoginUserResult:
        normalized_email = email.strip().lower()
        user = self._user_repository.get_by_email(normalized_email)

        if user is None or not self._password_hasher.verify(
            password,
            user.password_hash,
        ):
            raise InvalidCredentials("Invalid email or password.")

        if user.id is None:
            raise RuntimeError("The stored user has no ID.")

        access_token = self._token_service.create_access_token(user.id)

        return LoginUserResult(
            user_id=user.id,
            email=user.email,
            access_token=access_token,
        )