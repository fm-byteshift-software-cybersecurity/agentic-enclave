from agents import Agent, FunctionTool

from backend.app.adapters.llm.openai.context import OpenAIAgentContext


def create_orders_agent(
    tools: list[FunctionTool],
) -> Agent[OpenAIAgentContext]:
    return Agent[OpenAIAgentContext](
        name="Orders Agent",
        instructions=(
            "You are the Orders Agent for a customer support application. "
            "You help customers with order-related requests. "
            "Use the available tools when an operation requires access "
            "to application data or an action to be performed. "
            "Never assume authorization. "
            "Never ask the user for internal authorization data such as "
            "user IDs, agent IDs, permissions, or ownership information."
        ),
        tools=tools,
    )