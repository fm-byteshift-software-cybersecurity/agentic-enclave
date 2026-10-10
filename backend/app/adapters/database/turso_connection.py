
import os
from pathlib import Path

import libsql
from dotenv import load_dotenv


ENV_FILE = Path(__file__).resolve().parents[3] / ".env"
load_dotenv(ENV_FILE)


def create_turso_connection():
    database_url = os.getenv("TURSO_DATABASE_URL")
    auth_token = os.getenv("TURSO_AUTH_TOKEN")

    if not database_url:
        raise RuntimeError("TURSO_DATABASE_URL is not configured.")

    if not auth_token:
        raise RuntimeError("TURSO_AUTH_TOKEN is not configured.")

    return libsql.connect(
        database=database_url,
        auth_token=auth_token,
    )