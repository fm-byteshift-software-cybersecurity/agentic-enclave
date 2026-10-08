from typing import Any


CANCEL_ORDER_PARAMETERS_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "order_id": {
            "type": "integer",
            "description": "The ID of the order to cancel.",
        },
    },
    "required": ["order_id"],
    "additionalProperties": False,
}