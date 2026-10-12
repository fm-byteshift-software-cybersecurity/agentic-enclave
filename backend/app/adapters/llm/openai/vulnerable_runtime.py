
import json
from dataclasses import dataclass
from typing import Any

from agents import Model, ModelSettings, Runner

from backend.app.adapters.llm.openai.context import OpenAIAgentContext
from backend.app.adapters.llm.openai.vulnerable_orders_agent import (
    create_vulnerable_orders_agent_with_tools,
)
from backend.app.application.tools.vulnerable_cancel_order_tool import (
    VulnerableCancelOrderTool,
)


@dataclass(frozen=True)
class RuntimeResult:
    final_output: str
    tool_results: list[dict[str, Any]]


class VulnerableOpenAIRuntime:
    def __init__(
        self,
        vulnerable_cancel_order_tool: VulnerableCancelOrderTool,
        model: Model,
    ) -> None:
        self._agent = create_vulnerable_orders_agent_with_tools(
            vulnerable_cancel_order_tool=vulnerable_cancel_order_tool,
        )
        self._agent.model = model
        self._agent.model_settings = ModelSettings(
            verbosity=None,
            reasoning=None,
        )

    async def run(
        self,
        context: OpenAIAgentContext,
        user_input: str,
    ) -> RuntimeResult:
        result = await Runner.run(
            self._agent,
            user_input,
            context=context,
        )

        tool_results: list[dict[str, Any]] = []

        for item in result.new_items:
            if getattr(item, "type", None) != "tool_call_output_item":
                continue

            output = getattr(item, "output", None)
            if not isinstance(output, str):
                continue

            try:
                parsed_output = json.loads(output)
            except json.JSONDecodeError:
                continue

            if isinstance(parsed_output, dict):
                tool_results.append(parsed_output)

        return RuntimeResult(
            final_output=result.final_output,
            tool_results=tool_results,
        )
