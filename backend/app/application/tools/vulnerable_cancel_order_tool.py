from backend.app.application.agents.agent_context import AgentContext
from backend.app.application.tools.tool import Tool
from backend.app.application.use_cases.vulnerable_cancel_order import (
    VulnerableCancelOrderUseCase,
)
from backend.app.domain.model.order import Order


class VulnerableCancelOrderTool(Tool):
    def __init__(
        self,
        use_case: VulnerableCancelOrderUseCase,
    ) -> None:
        self._use_case = use_case

    @property
    def name(self) -> str:
        return "vulnerable_cancel_order"

    @property
    def description(self) -> str:
        return (
            "Cancel an order by ID. This demonstration tool intentionally "
            "omits customer ownership authorization but enforces lab isolation."
        )

    def execute(
        self,
        context: AgentContext,
        *,
        order_id: int,
    ) -> Order:
        return self._use_case.execute(
            order_id=order_id,
            lab_owner_id=context.actor.user_id,
        )