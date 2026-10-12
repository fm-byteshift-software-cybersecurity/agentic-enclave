import json
from typing import Any

from agents import FunctionTool
from agents.tool_context import ToolContext

from backend.app.application.tools.tool import Tool
from backend.app.domain.model.order import Order


def create_openai_function_tool(
    tool: Tool,
    parameters_schema: dict[str, Any],
) -> FunctionTool:
    async def on_invoke_tool(
        context: ToolContext[Any],
        arguments: str,
    ) -> str:
        parsed_arguments = json.loads(arguments)

        result = tool.execute(
            context=context.context.application_context,
            **parsed_arguments,
        )

        if result is None:
            return "Tool execution completed successfully."

        if isinstance(result, Order):
            return json.dumps(
                {
                    "order_id": result.id,
                    "status": result.status.value,
                }
            )

        return str(result)

    return FunctionTool(
        name=tool.name,
        description=tool.description,
        params_json_schema=parameters_schema,
        on_invoke_tool=on_invoke_tool,
        strict_json_schema=True,
    )
