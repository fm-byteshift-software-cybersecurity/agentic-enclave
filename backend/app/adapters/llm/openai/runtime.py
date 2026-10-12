import json
from dataclasses import dataclass
from typing import Any

from agents import Model, ModelSettings, Runner

from backend.app.adapters.llm.openai.context import OpenAIAgentContext
from backend.app.adapters.llm.openai.orders_agent import create_orders_agent_with_tools
from backend.app.application.tools.cancel_order_tool import CancelOrderTool


@dataclass(frozen=True)
class RuntimeResult:
    final_output: str
    tool_results: list[dict[str, Any]]


class OpenAIRuntime:
    def __init__(
        self,
        cancel_order_tool: CancelOrderTool,
        model: Model,
    ) -> None:
        self._agent = create_orders_agent_with_tools(
            cancel_order_tool=cancel_order_tool,
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
