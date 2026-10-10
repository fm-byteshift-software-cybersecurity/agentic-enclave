from agents import Model, ModelSettings, Runner

from backend.app.adapters.llm.openai.context import OpenAIAgentContext
from backend.app.adapters.llm.openai.orders_agent import create_orders_agent_with_tools
from backend.app.application.tools.cancel_order_tool import CancelOrderTool


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
    ) -> str:
        result = await Runner.run(
            self._agent,
            user_input,
            context=context,
        )
        return result.final_output

