
from agents import Agent

from backend.app.adapters.llm.openai.agents import create_orders_agent
from backend.app.adapters.llm.openai.schemas import (
    CANCEL_ORDER_PARAMETERS_SCHEMA,
)
from backend.app.adapters.llm.openai.tools import (
    create_openai_function_tool,
)
from backend.app.application.tools.vulnerable_cancel_order_tool import (
    VulnerableCancelOrderTool,
)


def create_vulnerable_orders_agent_with_tools(
    vulnerable_cancel_order_tool: VulnerableCancelOrderTool,
) -> Agent:
    vulnerable_cancel_order_function_tool = create_openai_function_tool(
        tool=vulnerable_cancel_order_tool,
        parameters_schema=CANCEL_ORDER_PARAMETERS_SCHEMA,
    )

    return create_orders_agent(
        tools=[vulnerable_cancel_order_function_tool],
    )
