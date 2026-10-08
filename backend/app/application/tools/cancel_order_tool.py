from typing import Any

from backend.app.application.agents.agent_context import AgentContext
from backend.app.application.tools.tool import Tool
from backend.app.application.use_cases.cancel_order import CancelOrderUseCase


class CancelOrderTool(Tool):
    def __init__(
        self,
        use_case: CancelOrderUseCase,
    ) -> None:
        self._use_case = use_case

    @property
    def name(self) -> str:
        return "cancel_order"

    @property
    def description(self) -> str:
        return "Cancel an order when the current actor is authorized to do so."

    def execute(
        self,
        context: AgentContext,
        *,
        order_id: int,
    ) -> None:
        self._use_case.execute(
            actor=context.actor,
            order_id=order_id,
        )