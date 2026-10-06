from dataclasses import dataclass


@dataclass(frozen=True)
class Actor:
    user_id: int
    agent_id: str