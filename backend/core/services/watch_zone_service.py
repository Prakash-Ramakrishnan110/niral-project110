"""
Watch Zone Management Service.
Enforces administrative pinning permissions, per-district area quotas,
and explicit per-district cadence requirements (no hidden defaults).

Permissions Matrix:
- CLA_STATE / STATE_APEX: statewide (any district/taluk)
- COLLECTOR: within assigned district
- RDO: within assigned revenue division
- TAHSILDAR: within assigned taluk
- VAO: may request pinning; requires higher officer approval (PENDING_APPROVAL)
- Other roles: Denied (PermissionDenied)
"""
from typing import Dict, Any, Optional
from django.core.exceptions import PermissionDenied, ValidationError
from django.db.models import Sum
from django.utils import timezone
from django.conf import settings

from core.models import (
    WatchZone, WatchZoneAuditEvent, OfficerAssignment, District, Taluk,
    DistrictLegalConfig, LandParcel
)


class QuotaExceededError(ValidationError):
    """Raised when district pinned area exceeds the quota."""
    pass


def get_effective_assignment(user) -> Optional[OfficerAssignment]:
    """Finds active assignment for the given officer user."""
    return OfficerAssignment.objects.filter(
        user=user,
        is_active=True
    ).order_by('-start_date').first()


def check_pin_authority_and_scope(user, district: District, taluk: Optional[Taluk] = None):
    """
    Validates whether the user has statutory authority to pin or request a watch zone
    in the designated district and taluk.
    Returns: ('ALLOWED', assignment) or ('NEEDS_APPROVAL', assignment)
    Raises: PermissionDenied if out of jurisdiction or role unauthorized.
    """
    assignment = get_effective_assignment(user)
    if not assignment:
        raise PermissionDenied("Access Denied: No active officer assignment found.")

    role = assignment.role

    # 1. State Apex / CLA: Any jurisdiction
    if role in ('STATE_APEX', 'CLA_STATE'):
        return 'ALLOWED', assignment

    # 2. District Collector: Own district only
    if role == 'COLLECTOR':
        if not assignment.district_id or assignment.district_id != district.id:
            district_name = assignment.district.name_en if assignment.district else 'assigned district'
            raise PermissionDenied(f"Access Denied: Collector jurisdiction limited to {district_name}.")
        return 'ALLOWED', assignment

    # 3. Revenue Divisional Officer (RDO): Own division
    if role == 'RDO':
        if not assignment.division_id:
            raise PermissionDenied("Access Denied: RDO assignment has no designated revenue division.")
        if taluk and taluk.revenue_division_id != assignment.division_id:
            raise PermissionDenied("Access Denied: Target taluk is outside assigned revenue division.")
        if not taluk:
            # Check if district matches division's district
            if assignment.division.district_id != district.id:
                raise PermissionDenied("Access Denied: Target district is outside assigned revenue division.")
        return 'ALLOWED', assignment

    # 4. Tahsildar: Own taluk only
    if role == 'TAHSILDAR':
        if not assignment.taluk_id:
            raise PermissionDenied("Access Denied: Tahsildar assignment has no designated taluk.")
        if not taluk or assignment.taluk_id != taluk.id:
            taluk_name = assignment.taluk.name_en if assignment.taluk else 'assigned taluk'
            raise PermissionDenied(f"Access Denied: Tahsildar authority limited to {taluk_name}.")
        return 'ALLOWED', assignment

    # 5. Village Administrative Officer (VAO): May request; requires approval
    if role == 'VAO':
        if not assignment.taluk_id and not assignment.village_id:
            raise PermissionDenied("Access Denied: VAO assignment has no administrative scope.")
        if taluk and assignment.taluk_id and assignment.taluk_id != taluk.id:
            raise PermissionDenied("Access Denied: Target taluk is outside VAO jurisdictional taluk.")
        return 'NEEDS_APPROVAL', assignment

    raise PermissionDenied(f"Access Denied: Role '{role}' does not possess watch zone pinning authority.")


def check_district_quota(district: District, new_area_sqm: float, exclude_zone_id=None):
    """
    Enforces per-district quota on pinned watch zone area.
    """
    max_quota = getattr(settings, 'PINNED_AREA_MAX_DISTRICT_SQM', 10_000_000.0)
    qs = WatchZone.objects.filter(
        district=district,
        is_active=True,
        approval_status__in=['APPROVED', 'PENDING_APPROVAL']
    )
    if exclude_zone_id:
        qs = qs.exclude(id=exclude_zone_id)

    current_total = qs.aggregate(total=Sum('pinned_area_sqm'))['total'] or 0.0
    if (current_total + new_area_sqm) > max_quota:
        raise QuotaExceededError(
            f"District pinned area quota exceeded. Max: {max_quota} sq.m, Current: {current_total} sq.m, Requested: {new_area_sqm} sq.m."
        )


def resolve_district_cadence(district: District, proposed_cadence: Optional[int] = None) -> int:
    """
    Resolves cadence_days for a watch zone.
    Cadence is a per-district setting with NO hidden default.
    If no district setting exists and no proposed cadence is supplied, raises ValueError.
    """
    if proposed_cadence is not None:
        if proposed_cadence <= 0:
            raise ValueError("Proposed cadence days must be a positive integer.")
        return proposed_cadence

    # Check DistrictLegalConfig for district
    cfg = DistrictLegalConfig.objects.filter(district__iexact=district.name_en).first()
    if cfg and cfg.watch_zone_cadence_days:
        return cfg.watch_zone_cadence_days

    # Statewide config check
    state_cfg = DistrictLegalConfig.objects.filter(district__isnull=True).first()
    if state_cfg and state_cfg.watch_zone_cadence_days:
        return state_cfg.watch_zone_cadence_days

    raise ValueError(
        f"Cadence is a per-district setting with no hidden default. District '{district.name_en}' has no configured cadence; department must specify cadence."
    )


def pin_watch_zone(
    user,
    name_en: str,
    name_ta: str,
    category: str,
    district: District,
    reason: str,
    priority: int,
    taluk: Optional[Taluk] = None,
    geom=None,
    parcels: Optional[list] = None,
    proposed_cadence: Optional[int] = None,
    lane_threshold_override: Optional[dict] = None,
    pinned_area_sqm: float = 0.0,
    valid_from=None,
    valid_to=None,
) -> WatchZone:
    """
    Statutory entry-point to pin a WatchZone.
    Validates authority, quota, cadence, and writes an immutable audit record.
    """
    auth_status, assignment = check_pin_authority_and_scope(user, district, taluk)
    check_district_quota(district, pinned_area_sqm)
    cadence_days = resolve_district_cadence(district, proposed_cadence)

    approval_status = 'APPROVED' if auth_status == 'ALLOWED' else 'PENDING_APPROVAL'
    is_active = (approval_status == 'APPROVED')

    zone = WatchZone.objects.create(
        name_en=name_en,
        name_ta=name_ta,
        category=category,
        geom=geom,
        reason=reason,
        priority=priority,
        cadence_days=cadence_days,
        lane_threshold_override=lane_threshold_override,
        owner_assignment=assignment,
        district=district,
        taluk=taluk,
        is_active=is_active,
        approval_status=approval_status,
        valid_from=valid_from or timezone.now().date(),
        valid_to=valid_to,
        version=1,
        pinned_area_sqm=pinned_area_sqm,
        pinned_by=user,
        pinned_by_role=assignment.role,
    )

    if parcels:
        zone.parcels.set(parcels)

    action = 'ZONE_PINNED' if approval_status == 'APPROVED' else 'PIN_REQUESTED'
    WatchZoneAuditEvent.objects.create(
        zone=zone,
        actor=user,
        actor_role=assignment.role,
        action=action,
        from_status='',
        to_status=approval_status,
        reason=reason,
        metadata={
            'cadence_days': cadence_days,
            'pinned_area_sqm': pinned_area_sqm,
            'priority': priority,
            'category': category,
        }
    )

    return zone


def approve_pin_request(user, zone: WatchZone, reason: str = "Approved by supervisory officer") -> WatchZone:
    """
    Approves a pending VAO watch zone request.
    Only Tahsildar, RDO, Collector, or CLA may approve.
    """
    auth_status, assignment = check_pin_authority_and_scope(user, zone.district, zone.taluk)
    if auth_status != 'ALLOWED':
        raise PermissionDenied("Access Denied: Only supervisory officers (Tahsildar/RDO/Collector/CLA) can approve pin requests.")

    if zone.approval_status != 'PENDING_APPROVAL':
        raise ValidationError(f"Cannot approve zone with status {zone.approval_status}.")

    from_status = zone.approval_status
    zone.approval_status = 'APPROVED'
    zone.is_active = True
    zone.version += 1
    zone.save(update_fields=['approval_status', 'is_active', 'version', 'updated_at'])

    WatchZoneAuditEvent.objects.create(
        zone=zone,
        actor=user,
        actor_role=assignment.role,
        action='PIN_APPROVED',
        from_status=from_status,
        to_status='APPROVED',
        reason=reason,
        metadata={'approver_assignment_id': str(assignment.id)}
    )

    return zone


def retire_watch_zone(user, zone: WatchZone, reason: str) -> WatchZone:
    """
    Retires an active watch zone, deactivating future scheduler reviews.
    """
    auth_status, assignment = check_pin_authority_and_scope(user, zone.district, zone.taluk)
    if auth_status != 'ALLOWED':
        raise PermissionDenied("Access Denied: Officer does not have authority to retire this watch zone.")

    from_status = zone.approval_status
    zone.is_active = False
    zone.approval_status = 'RETIRED'
    zone.valid_to = timezone.now().date()
    zone.version += 1
    zone.save(update_fields=['is_active', 'approval_status', 'valid_to', 'version', 'updated_at'])

    WatchZoneAuditEvent.objects.create(
        zone=zone,
        actor=user,
        actor_role=assignment.role,
        action='ZONE_RETIRED',
        from_status=from_status,
        to_status='RETIRED',
        reason=reason,
        metadata={'retired_date': str(zone.valid_to)}
    )

    return zone
