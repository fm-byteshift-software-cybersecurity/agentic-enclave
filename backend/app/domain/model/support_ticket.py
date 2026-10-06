from dataclasses import dataclass
from enum import Enum

from backend.app.domain.exceptions.business_rule_violation import (
    BusinessRuleViolation,
)


class TicketStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


@dataclass
class SupportTicket:
    id: int
    customer_id: int
    subject: str
    description: str
    status: TicketStatus

    def update_description(self, description: str) -> None:
        if self.status == TicketStatus.CLOSED:
            raise BusinessRuleViolation(
                f"Ticket {self.id} cannot be updated because it is closed."
            )

        if not description.strip():
            raise BusinessRuleViolation(
                "Ticket description cannot be empty."
            )

        self.description = description

    def close(self) -> None:
        if self.status == TicketStatus.CLOSED:
            raise BusinessRuleViolation(
                f"Ticket {self.id} is already closed."
            )

        self.status = TicketStatus.CLOSED