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
                ),
                is_demo INTEGER NOT NULL DEFAULT 0
                    CHECK (is_demo IN (0, 1)),
                lab_owner_id INTEGER
            )
            """
        )

        # Migrate existing databases without recreating the table.
        result = connection.execute("PRAGMA table_info(orders)")
        existing_columns = {
            row[1] for row in result.fetchall()
        }

        if "is_demo" not in existing_columns:
            connection.execute(
                """
                ALTER TABLE orders
                ADD COLUMN is_demo INTEGER NOT NULL DEFAULT 0
                    CHECK (is_demo IN (0, 1))
                """
            )

        if "lab_owner_id" not in existing_columns:
            connection.execute(
                """
                ALTER TABLE orders
                ADD COLUMN lab_owner_id INTEGER
                """
            )

        connection.commit()
    finally:
        connection.close()
