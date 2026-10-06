from backend.app.application.authorization.agent_permissions import (
    AGENT_PERMISSIONS,
)
from backend.app.application.authorization.permission import Permission
from backend.app.application.authorization.actor import Actor


class AuthorizationPolicy:
    def is_allowed(
        self,
        actor: Actor,
        permission: Permission,
        resource_owner_id: int | None = None,
    ) -> bool:
        agent_permissions = AGENT_PERMISSIONS.get(actor.agent_id)

        if agent_permissions is None:
            return False

        if permission not in agent_permissions:
            return False

        if (
            resource_owner_id is not None
            and resource_owner_id != actor.user_id
        ):
            return False

        return True