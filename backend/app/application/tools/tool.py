from abc import ABC, abstractmethod
from typing import Any

from backend.app.application.agents.agent_context import AgentContext


class Tool(ABC):
    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @property
    @abstractmethod
    def description(self) -> str:
        pass

    @abstractmethod
    def execute(
        self,
        context: AgentContext,
        **kwargs: Any,
    ) -> Any:
        pass