
from pwdlib import PasswordHash

from backend.app.application.ports.password_hasher import (
    PasswordHasher as PasswordHasherPort,
)


class PasswordHasher(PasswordHasherPort):
    def __init__(self) -> None:
        self._password_hash = PasswordHash.recommended()

    def hash(self, password: str) -> str:
        return self._password_hash.hash(password)

    def verify(self, password: str, password_hash: str) -> bool:
        return self._password_hash.verify(password, password_hash)