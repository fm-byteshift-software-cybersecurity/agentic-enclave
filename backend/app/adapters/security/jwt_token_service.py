
import os
from datetime import datetime, timedelta, timezone

import jwt

from backend.app.application.ports.token_service import TokenService


class JWTTokenService(TokenService):
    def __init__(self) -> None:
        secret_key = os.getenv("JWT_SECRET_KEY")

        if not secret_key:
            raise RuntimeError(
                "JWT_SECRET_KEY environment variable must be configured."
            )

        if len(secret_key) < 32:
            raise RuntimeError(
                "JWT_SECRET_KEY must contain at least 32 characters."
            )

        self._secret_key = secret_key
        self._algorithm = "HS256"
        self._expiration_minutes = 30

    def create_access_token(self, user_id: int) -> str:
        now = datetime.now(timezone.utc)
        payload = {
            "sub": str(user_id),
            "iat": now,
            "exp": now + timedelta(minutes=self._expiration_minutes),
        }

        return jwt.encode(
            payload,
            self._secret_key,
            algorithm=self._algorithm,
        )

    def get_user_id(self, token: str) -> int:
        try:
            payload = jwt.decode(
                token,
                self._secret_key,
                algorithms=[self._algorithm],
                options={"require": ["sub", "iat", "exp"]},
            )

            user_id = int(payload["sub"])

            if user_id <= 0:
                raise ValueError("Invalid user ID.")

            return user_id
        except (jwt.InvalidTokenError, TypeError, ValueError, KeyError) as exc:
            raise ValueError("Invalid or expired access token.") from exc