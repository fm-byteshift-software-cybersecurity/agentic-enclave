
import os
import threading
from pathlib import Path

import libsql
from dotenv import load_dotenv


ENV_FILE = Path(__file__).resolve().parents[3] / ".env"
load_dotenv(ENV_FILE)


class ResilientTursoConnection:   

    def __init__(self, database_url: str, auth_token: str) -> None:
        self._database_url = database_url
        self._auth_token = auth_token
        self._lock = threading.RLock()
        self._connection = self._connect()
        self._explicit_transaction = False
        self._transaction_broken = False

    def _connect(self):
        return libsql.connect(
            database=self._database_url,
            auth_token=self._auth_token,
        )

    @staticmethod
    def _is_stream_error(exc: Exception) -> bool:
        message = str(exc).lower()
        return "stream not found" in message or "stream has expired" in message

    @staticmethod
    def _is_read_query(sql: str) -> bool:
        normalized = sql.lstrip().upper()
        return normalized.startswith(("SELECT", "PRAGMA", "EXPLAIN"))

    def _reconnect(self) -> None:
        old_connection = self._connection

        try:
            old_connection.close()
        except Exception:
            pass

        self._connection = self._connect()

    def execute(self, sql: str, parameters=()):
        with self._lock:
            normalized = sql.strip().upper()

            if normalized == "BEGIN" or normalized.startswith("BEGIN "):
                self._explicit_transaction = True
                self._transaction_broken = False

            try:
                return self._connection.execute(sql, parameters)

            except Exception as exc:
                if not self._is_stream_error(exc):
                    raise

                if self._explicit_transaction:
                    self._reconnect()
                    self._transaction_broken = True
                    raise

                self._reconnect()

                if self._is_read_query(sql):
                    # Retry once only for a read query.
                    return self._connection.execute(sql, parameters)

                # A write may have reached the database before the
                # transport error. Reconnect, but never replay it here.
                raise

    def commit(self) -> None:
        with self._lock:
            if self._transaction_broken:
                self._explicit_transaction = False
                self._transaction_broken = False
                return

            try:
                self._connection.commit()
            except Exception as exc:
                if self._is_stream_error(exc):
                    self._reconnect()
                raise
            finally:
                self._explicit_transaction = False

    def rollback(self) -> None:
        with self._lock:
            if self._transaction_broken:
                self._explicit_transaction = False
                self._transaction_broken = False
                return

            try:
                self._connection.rollback()
            except Exception as exc:
                if self._is_stream_error(exc):
                    self._reconnect()
                raise
            finally:
                self._explicit_transaction = False

    def close(self) -> None:
        with self._lock:
            self._connection.close()

    def __getattr__(self, name):
        # Preserve access to other driver attributes when needed.
        return getattr(self._connection, name)


def create_turso_connection() -> ResilientTursoConnection:
    database_url = os.getenv("TURSO_DATABASE_URL")
    auth_token = os.getenv("TURSO_AUTH_TOKEN")

    if not database_url:
        raise RuntimeError("TURSO_DATABASE_URL is not configured.")

    if not auth_token:
        raise RuntimeError("TURSO_AUTH_TOKEN is not configured.")

    return ResilientTursoConnection(
        database_url=database_url,
        auth_token=auth_token,
    )
