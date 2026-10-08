from dataclasses import dataclass

from backend.app.application.agents.agent_context import AgentContext


@dataclass(frozen=True)
class OpenAIAgentContext:
    application_context: AgentContext