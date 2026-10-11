
from backend.app.adapters.database.turso_connection import (
    create_turso_connection,
)


def initialize_schema() -> None:
    connection = create_turso_connection()
    try:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE COLLATE NOCASE,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY,
                customer_id INTEGER NOT NULL,
                status TEXT NOT NULL CHECK (
                    status IN (
                        'pending',
                        'processing',
                        'shipped',
                        'delivered',
                        'cancelled'
                    )
                )
            )
            """
        )

        connection.commit()
    finally:
        connection.close()