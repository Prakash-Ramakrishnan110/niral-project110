from rest_framework import permissions

SAFE_METHODS = ('GET', 'HEAD', 'OPTIONS')

STATUTORY_NOTICE_ROLES = {'TAHSILDAR', 'RDO', 'COLLECTOR', 'CLA_STATE', 'STATE_APEX'}
INSPECTOR_APPROVE_ROLES = {'INSPECTOR', 'TAHSILDAR', 'RDO', 'COLLECTOR', 'STATE_APEX', 'ADMIN_GIS'}
BOUNDARY_REJECT_ROLES = {'INSPECTOR', 'TAHSILDAR', 'RDO', 'COLLECTOR', 'STATE_APEX'}
EVICTION_COMPLETE_ROLES = {'TAHSILDAR', 'RDO', 'COLLECTOR', 'STATE_APEX'}
PROPOSAL_APPROVE_ROLES = {'COLLECTOR', 'RDO', 'TAHSILDAR', 'STATE_APEX'}
STATEWIDE_ROLES = {'STATE_APEX', 'CLA_STATE', 'ADMIN_GIS', 'VIGILANCE'}


class IsVigilanceReadOnly(permissions.BasePermission):
    """
    Vigilance & Anti-Corruption role has read-only access across the entire state.
    Refuses any state-mutating requests (POST, PUT, PATCH, DELETE).
    """
    message = "Access Denied: Vigilance & Anti-Corruption officers have read-only audit access and cannot modify records."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        profile = getattr(request.user, 'profile', None)
        if profile and profile.role == 'VIGILANCE':
            return request.method in SAFE_METHODS
        return True


def get_user_role(user) -> str:
    """Helper to safely extract uppercase role from user profile."""
    if not user or not user.is_authenticated:
        return ''
    profile = getattr(user, 'profile', None)
    return (profile.role or '').upper() if profile else ''
