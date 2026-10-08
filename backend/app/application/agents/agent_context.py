from dataclasses import dataclass

from backend.app.application.authorization.actor import Actor


@dataclass(frozen=True)
class AgentContext:
    actor: Actor