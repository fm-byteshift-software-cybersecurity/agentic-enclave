import os
from pathlib import Path

from agents import Model, OpenAIChatCompletionsModel, set_tracing_disabled
from dotenv import load_dotenv
from openai import AsyncOpenAI


ENV_FILE = Path(__file__).resolve().parents[4] / ".env"


def create_real_model() -> Model:
    load_dotenv(ENV_FILE)
    
    set_tracing_disabled(True)

    api_key = os.getenv("OPENAI_API_KEY")
    base_url = os.getenv("OPENAI_BASE_URL")
    model_name = os.getenv("OPENAI_MODEL")

    missing_variables = [
        name
        for name, value in (
            ("OPENAI_API_KEY", api_key),
            ("OPENAI_BASE_URL", base_url),
            ("OPENAI_MODEL", model_name),
        )
        if not value
    ]

    if missing_variables:
        raise RuntimeError(
            "Missing required environment variables: "
            + ", ".join(missing_variables)
        )

    client = AsyncOpenAI(
        api_key=api_key,
        base_url=base_url,
    )

    return OpenAIChatCompletionsModel(
        model=model_name,
        openai_client=client,
    )
