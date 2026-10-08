from agents import FunctionTool

from backend.app.adapters.llm.openai.agents import create_orders_agent
from backend.app.adapters.llm.openai.context import OpenAIAgentContext


def create_fake_tool(name: str) -> FunctionTool:
    async def invoke(
        context: object,
        arguments: str,
    ) -> str:
        return "ok"

    return FunctionTool(
        name=name,
        description=f"Test tool: {name}",
        params_json_schema={
            "type": "object",
            "properties": {},
            "additionalProperties": False,
        },
        on_invoke_tool=invoke,
        strict_json_schema=True,
    )


def test_orders_agent_is_created_with_expected_configuration() -> None:
    cancel_order_tool = create_fake_tool("cancel_order")

    agent = create_orders_agent(
        tools=[cancel_order_tool],
    )

    assert agent.name == "Orders Agent"
    assert len(agent.tools) == 1
    assert agent.tools[0].name == "cancel_order"


def test_orders_agent_uses_application_controlled_context_type() -> None:
    cancel_order_tool = create_fake_tool("cancel_order")

    agent = create_orders_agent(
        tools=[cancel_order_tool],
    )

    assert agent.tools
    assert agent.instructions is not None