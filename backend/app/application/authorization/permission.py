from enum import Enum


class Permission(str, Enum):
    READ_CUSTOMER = "read_customer"
    UPDATE_CUSTOMER = "update_customer"

    READ_ORDER = "read_order"
    CANCEL_ORDER = "cancel_order"

    READ_SUPPORT_TICKET = "read_support_ticket"
    CREATE_SUPPORT_TICKET = "create_support_ticket"
    UPDATE_SUPPORT_TICKET = "update_support_ticket"