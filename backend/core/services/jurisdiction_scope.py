from django.db.models import Q
from core.models import (
    OfficerAssignment,
    StatutoryNoticeAuthority,
    District,
    Taluk,
    Firka,
    RevenueVillage,
    LandParcel,
    EncroachmentAlert
)


class JurisdictionScopeService:
    """
    Statewide administrative jurisdiction scoping engine (Part 4.2).
    Enforces deny-by-default role permissions and database-level SQL subquery scoping.
    Never builds in-memory Python lists of IDs.
    """

    STATEWIDE_READONLY_ROLES = {'STATE_APEX', 'VIGILANCE'}
    SYSTEM_ADMIN_ROLES = {'ADMIN_GIS'}
    CASE_WORKFLOW_ROLES = {'CLA_STATE', 'COLLECTOR', 'RDO', 'TAHSILDAR', 'INSPECTOR', 'VAO'}

    @classmethod
    def get_effective_assignments(cls, user):
        """Returns active, currently effective assignments for the user."""
        if not user or not user.is_authenticated:
            return OfficerAssignment.objects.none()
        return OfficerAssignment.objects.filter(
            user=user,
            is_active=True
        )

    @classmethod
    def get_primary_role(cls, user):
        """Returns the primary active role of the user."""
        assignment = cls.get_effective_assignments(user).first()
        if assignment:
            return assignment.role
        # Fallback to legacy UserProfile if assignment not yet found
        if hasattr(user, 'profile'):
            return user.profile.role
        return None

    @classmethod
    def get_user_scope(cls, user) -> dict:
        """Derives primary administrative scope (district, taluk, village) from active assignments or profile."""
        if not user or not user.is_authenticated:
            return {'district': None, 'taluk': None, 'village': None, 'level': 'NONE'}
        
        assignment = cls.get_effective_assignments(user).first()
        if assignment:
            district_name = assignment.district.name_en if assignment.district else None
            taluk_name = assignment.taluk.name_en if assignment.taluk else None
            village_name = assignment.village.name_en if assignment.village else None
            level = 'STATE'
            if village_name:
                level = 'VILLAGE'
            elif taluk_name:
                level = 'TALUK'
            elif district_name:
                level = 'DISTRICT'
            return {
                'level': level,
                'district': district_name,
                'taluk': taluk_name,
                'village': village_name,
            }

        # Fallback to UserProfile
        profile = getattr(user, 'profile', None)
        if profile:
            level = 'STATE'
            if profile.village:
                level = 'VILLAGE'
            elif profile.taluk:
                level = 'TALUK'
            elif profile.district:
                level = 'DISTRICT'
            return {
                'level': level,
                'district': profile.district,
                'taluk': profile.taluk,
                'village': profile.village,
            }

        if user.is_superuser:
            return {'level': 'STATE', 'district': None, 'taluk': None, 'village': None}

        return {'level': 'NONE', 'district': None, 'taluk': None, 'village': None}

    @classmethod
    def is_readonly(cls, user):
        """STATE_APEX and VIGILANCE are strictly read-only."""
        role = cls.get_primary_role(user)
        return role in cls.STATEWIDE_READONLY_ROLES

    @classmethod
    def scope_parcels(cls, queryset, user):
        """
        Applies SQL subquery filtering to LandParcel queryset based on user's active assignments.
        """
        if not user or not user.is_authenticated:
            return queryset.none()

        assignments = cls.get_effective_assignments(user)
        if not assignments.exists():
            return queryset.none()

        # Check for statewide roles
        if assignments.filter(role__in=['STATE_APEX', 'CLA_STATE', 'ADMIN_GIS', 'VIGILANCE']).exists():
            return queryset

        # Build subquery Q filter combining all active assignments (including additional charges)
        combined_q = Q()

        for a in assignments:
            if a.role == 'COLLECTOR' and a.district_id:
                combined_q |= Q(district_ref_id=a.district_id)
            elif a.role == 'RDO':
                if a.division_id:
                    combined_q |= Q(taluk_ref__revenue_division_id=a.division_id)
                elif a.taluk_id:
                    combined_q |= Q(taluk_ref_id=a.taluk_id)
                elif a.district_id:
                    combined_q |= Q(district_ref_id=a.district_id)
            elif a.role == 'TAHSILDAR' and a.taluk_id:
                combined_q |= Q(taluk_ref_id=a.taluk_id)
            elif a.role == 'INSPECTOR':
                if a.firka_id:
                    combined_q |= Q(village_ref__firka_id=a.firka_id)
                elif a.taluk_id:
                    combined_q |= Q(taluk_ref_id=a.taluk_id)
            elif a.role == 'VAO' and a.village_id:
                combined_q |= Q(village_ref_id=a.village_id)

        if not combined_q:
            return queryset.none()

        return queryset.filter(combined_q)

    @classmethod
    def scope_alerts(cls, queryset, user):
        """
        Applies subquery scoping on alerts by checking linked parcel jurisdiction.
        """
        if not user or not user.is_authenticated:
            return queryset.none()

        scoped_parcels = cls.scope_parcels(LandParcel.objects.all(), user)
        return queryset.filter(parcel__in=scoped_parcels)

    @classmethod
    def can_write_case(cls, alert, user):
        """
        Determines if user has write authority over the given alert/case.
        Deny-by-default rules:
        - Anonymous / unauthenticated: DENIED
        - Read-only roles (STATE_APEX, VIGILANCE): DENIED
        - System Admin (ADMIN_GIS): DENIED (system/layer operations only)
        - Outside geographic jurisdiction: DENIED
        """
        if not user or not user.is_authenticated:
            return False, "Unauthenticated"

        role = cls.get_primary_role(user)
        if role in cls.STATEWIDE_READONLY_ROLES:
            return False, f"Role {role} is strictly read-only."
        if role in cls.SYSTEM_ADMIN_ROLES:
            return False, f"Role {role} cannot perform case workflow actions."

        # Check geographic scope
        scoped_alerts = cls.scope_alerts(EncroachmentAlert.objects.filter(pk=alert.pk), user)
        if not scoped_alerts.exists():
            return False, f"Alert #{alert.pk} is outside your administrative jurisdiction."

        return True, "Authorized"

    @classmethod
    def check_authority(cls, user, action):
        """
        Checks StatutoryNoticeAuthority for the user's active role.
        Deny by default.
        """
        role = cls.get_primary_role(user)
        if not role:
            return False, "No active role"
        allowed = StatutoryNoticeAuthority.check_authority(role, action)
        if not allowed:
            return False, f"Role {role} is not authorized for statutory action: {action}"
        return True, "Authorized"

