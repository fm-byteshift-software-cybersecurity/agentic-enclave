
from backend.app.application.ports.user_repository import UserRepository
from backend.app.domain.model.user import User


class TursoUserRepository(UserRepository):
    def __init__(self, connection):
        self.connection = connection

    def get_by_email(self, email: str) -> User | None:
        result = self.connection.execute(
            """
            SELECT id, email, password_hash
            FROM users
            WHERE email = ?
            """,
            (email.strip().lower(),),
        )
        row = result.fetchone()

        if row is None:
            return None

        return User(
            id=row[0],
            email=row[1],
            password_hash=row[2],
        )

    def get_by_id(self, user_id: int) -> User | None:
        result = self.connection.execute(
            """
            SELECT id, email, password_hash
            FROM users
            WHERE id = ?
            """,
            (user_id,),
        )
        row = result.fetchone()

        if row is None:
            return None

        return User(
            id=row[0],
            email=row[1],
            password_hash=row[2],
        )

    def save(self, user: User) -> User:
        if user.id is not None:
            raise ValueError("Only new users can be saved.")

        result = self.connection.execute(
            """
            INSERT INTO users (email, password_hash)
            VALUES (?, ?)
            """,
            (user.email.strip().lower(), user.password_hash),
        )
        self.connection.commit()

        return User(
            id=result.lastrowid,
            email=user.email.strip().lower(),
            password_hash=user.password_hash,
        )