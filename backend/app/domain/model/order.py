from dataclasses import dataclass
from enum import Enum

from backend.app.domain.exceptions.business_rule_violation import (
    BusinessRuleViolation,
)


class OrderStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


@dataclass
class Order:
    id: int
    customer_id: int
    status: OrderStatus

    def cancel(self) -> None:
        if self.status in {
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED,
        }:
            raise BusinessRuleViolation(
                f"Order {self.id} cannot be cancelled in status "
                f"{self.status.value}."
            )

        if self.status == OrderStatus.CANCELLED:
            raise BusinessRuleViolation(
                f"Order {self.id} is already cancelled."
            )

        self.status = OrderStatus.CANCELLED