from backend.app.application.authorization.permission import Permission


AGENT_PERMISSIONS: dict[str, frozenset[Permission]] = {
    "customer_agent": frozenset(
        {
            Permission.READ_CUSTOMER,
            Permission.UPDATE_CUSTOMER,
            Permission.READ_ORDER,
        }
    ),
    "orders_agent": frozenset(
        {
            Permission.READ_ORDER,
            Permission.CANCEL_ORDER,
        }
    ),
    "support_agent": frozenset(
        {
            Permission.READ_CUSTOMER,
            Permission.READ_ORDER,
            Permission.READ_SUPPORT_TICKET,
            Permission.CREATE_SUPPORT_TICKET,
            Permission.UPDATE_SUPPORT_TICKET,
        }
    ),
}