import datetime
from django.utils import timezone
from django.db import transaction
from core.models import (
    EncroachmentAlert,
    CaseAuditEvent,
    DistrictLegalConfig,
    OfficerAssignment,
    StatutoryNoticeAuthority,
)


class StateMachineError(Exception):
    """Base exception for case workflow state machine errors."""
    pass


class IllegalTransitionError(StateMachineError):
    """Raised when an alert cannot transition between two given states."""
    pass


class TransitionGuardError(StateMachineError):
    """Raised when a statutory guard check blocks the transition."""
    pass


class AuthorizationError(StateMachineError):
    """Raised when an actor lacks the role/authority to execute the transition."""
    pass


class CaseStateMachine:
    """
    Statutory workflow state machine enforcing Tamil Nadu Land Encroachment Act III of 1905
    due process, humanitarian rehabilitation routing, independent peer audits, and court stays.
    All transitions are server-validated, guard-checked, and recorded in immutable CaseAuditEvent logs.
    """

    # Canonical Lifecycle States (28 States)
    STATE_NEW = EncroachmentAlert.STATE_NEW
    STATE_TIER1_ESCALATED = EncroachmentAlert.STATE_TIER1_ESCALATED
    STATE_COLLECTOR_REVIEWED = EncroachmentAlert.STATE_COLLECTOR_REVIEWED
    STATE_WATCHING = EncroachmentAlert.STATE_WATCHING
    STATE_VAO_ASSIGNED = EncroachmentAlert.STATE_VAO_ASSIGNED
    STATE_IN_FIELD_VERIFICATION = EncroachmentAlert.STATE_IN_FIELD_VERIFICATION
    STATE_VAO_SUBMITTED = EncroachmentAlert.STATE_VAO_SUBMITTED
    STATE_FALSE_POSITIVE_CLAIMED = EncroachmentAlert.STATE_FALSE_POSITIVE_CLAIMED
    STATE_PEER_AUDIT_PENDING = EncroachmentAlert.STATE_PEER_AUDIT_PENDING
    STATE_FALSE_POSITIVE_CONFIRMED = EncroachmentAlert.STATE_FALSE_POSITIVE_CONFIRMED
    STATE_REINSTATED = EncroachmentAlert.STATE_REINSTATED
    STATE_INSPECTOR_APPROVED = EncroachmentAlert.STATE_INSPECTOR_APPROVED
    STATE_REJECTED_BOUNDARY = EncroachmentAlert.STATE_REJECTED_BOUNDARY
    STATE_CLOSED_PRIVATE_PATTA = EncroachmentAlert.STATE_CLOSED_PRIVATE_PATTA
    STATE_PANDAL_GRACE_PERIOD = EncroachmentAlert.STATE_PANDAL_GRACE_PERIOD
    STATE_TEMPORARY_OCCUPANCY_RESOLVED = EncroachmentAlert.STATE_TEMPORARY_OCCUPANCY_RESOLVED
    STATE_NOTICE_PREPARATION = EncroachmentAlert.STATE_NOTICE_PREPARATION
    STATE_SECTION_7_ISSUED = EncroachmentAlert.STATE_SECTION_7_ISSUED
    STATE_NOTICE_REPLY_PENDING = EncroachmentAlert.STATE_NOTICE_REPLY_PENDING
    STATE_HEARING_SCHEDULED = EncroachmentAlert.STATE_HEARING_SCHEDULED
    STATE_SECTION_6_ORDERED = EncroachmentAlert.STATE_SECTION_6_ORDERED
    STATE_EVICTION_SCHEDULED = EncroachmentAlert.STATE_EVICTION_SCHEDULED
    STATE_EVICTION_EXECUTED = EncroachmentAlert.STATE_EVICTION_EXECUTED
    STATE_REENCROACHMENT_FLAGGED = EncroachmentAlert.STATE_REENCROACHMENT_FLAGGED
    STATE_COURT_STAY_HOLD = EncroachmentAlert.STATE_COURT_STAY_HOLD
    STATE_CLOSED_COURT_QUASHED = EncroachmentAlert.STATE_CLOSED_COURT_QUASHED
    STATE_REHABILITATION_ROUTED = EncroachmentAlert.STATE_REHABILITATION_ROUTED
    STATE_REHABILITATION_COMPLETED = EncroachmentAlert.STATE_REHABILITATION_COMPLETED
    STATE_EXPIRED_NO_RECURRENCE = EncroachmentAlert.STATE_EXPIRED_NO_RECURRENCE

    # Legacy Transition States
    STATE_TRIAGE_LEGACY = EncroachmentAlert.STATE_TRIAGE_LEGACY
    STATE_TAHSILDAR_ACCEPTED_LEGACY = EncroachmentAlert.STATE_TAHSILDAR_ACCEPTED_LEGACY
    STATE_VAO_ASSIGNED_LEGACY = EncroachmentAlert.STATE_VAO_ASSIGNED_LEGACY
    STATE_COLLECTOR_ACCEPTED_LEGACY = EncroachmentAlert.STATE_COLLECTOR_ACCEPTED_LEGACY

    # Canonical Transitions Matrix
    VALID_TRANSITIONS = {
        STATE_NEW: [
            STATE_TIER1_ESCALATED,
            STATE_COLLECTOR_REVIEWED,
            STATE_VAO_ASSIGNED,
            STATE_WATCHING,
            STATE_COURT_STAY_HOLD,
        ],
        STATE_TIER1_ESCALATED: [
            STATE_COLLECTOR_REVIEWED,
            STATE_VAO_ASSIGNED,
            STATE_COURT_STAY_HOLD,
        ],
        STATE_COLLECTOR_REVIEWED: [
            STATE_VAO_ASSIGNED,
            STATE_WATCHING,
            STATE_COURT_STAY_HOLD,
        ],
        STATE_WATCHING: [
            STATE_VAO_ASSIGNED,
            STATE_EXPIRED_NO_RECURRENCE,
            STATE_NEW,
            STATE_COURT_STAY_HOLD,
        ],
        STATE_VAO_ASSIGNED: [
            STATE_IN_FIELD_VERIFICATION,
            STATE_VAO_SUBMITTED,
            STATE_FALSE_POSITIVE_CLAIMED,
            STATE_PEER_AUDIT_PENDING,
            STATE_CLOSED_PRIVATE_PATTA,
            STATE_PANDAL_GRACE_PERIOD,
            STATE_COURT_STAY_HOLD,
        ],
        STATE_IN_FIELD_VERIFICATION: [
            STATE_VAO_SUBMITTED,
            STATE_FALSE_POSITIVE_CLAIMED,
            STATE_PEER_AUDIT_PENDING,
            STATE_CLOSED_PRIVATE_PATTA,
            STATE_PANDAL_GRACE_PERIOD,
            STATE_COURT_STAY_HOLD,
        ],
        STATE_VAO_SUBMITTED: [
            STATE_INSPECTOR_APPROVED,
            STATE_REJECTED_BOUNDARY,
            STATE_NOTICE_PREPARATION,
            STATE_PANDAL_GRACE_PERIOD,
            STATE_REHABILITATION_ROUTED,
            STATE_COURT_STAY_HOLD,
        ],
        STATE_FALSE_POSITIVE_CLAIMED: [
            STATE_PEER_AUDIT_PENDING,
            STATE_COURT_STAY_HOLD,
        ],
        STATE_PEER_AUDIT_PENDING: [
            STATE_FALSE_POSITIVE_CONFIRMED,
            STATE_REINSTATED,
            STATE_COURT_STAY_HOLD,
        ],
        STATE_REINSTATED: [
            STATE_INSPECTOR_APPROVED,
            STATE_NOTICE_PREPARATION,
            STATE_VAO_ASSIGNED,
            STATE_COURT_STAY_HOLD,
        ],
        STATE_INSPECTOR_APPROVED: [
            STATE_NOTICE_PREPARATION,
            STATE_REHABILITATION_ROUTED,
            STATE_PANDAL_GRACE_PERIOD,
            STATE_COURT_STAY_HOLD,
        ],
        STATE_REJECTED_BOUNDARY: [
            STATE_VAO_ASSIGNED,
            STATE_CLOSED_PRIVATE_PATTA,
            STATE_COURT_STAY_HOLD,
        ],
        STATE_CLOSED_PRIVATE_PATTA: [
            STATE_REENCROACHMENT_FLAGGED,
        ],
        STATE_PANDAL_GRACE_PERIOD: [
            STATE_TEMPORARY_OCCUPANCY_RESOLVED,
            STATE_VAO_ASSIGNED,
            STATE_WATCHING,
            STATE_NOTICE_PREPARATION,
            STATE_COURT_STAY_HOLD,
        ],
        STATE_TEMPORARY_OCCUPANCY_RESOLVED: [
            STATE_WATCHING,
            STATE_REENCROACHMENT_FLAGGED,
        ],
        STATE_NOTICE_PREPARATION: [
            STATE_SECTION_7_ISSUED,
            STATE_REHABILITATION_ROUTED,
            STATE_CLOSED_PRIVATE_PATTA,
            STATE_COURT_STAY_HOLD,
        ],
        STATE_SECTION_7_ISSUED: [
            STATE_NOTICE_REPLY_PENDING,
            STATE_COURT_STAY_HOLD,
        ],
        STATE_NOTICE_REPLY_PENDING: [
            STATE_HEARING_SCHEDULED,
            STATE_SECTION_6_ORDERED,
            STATE_CLOSED_PRIVATE_PATTA,
            STATE_REHABILITATION_ROUTED,
            STATE_COURT_STAY_HOLD,
        ],
        STATE_HEARING_SCHEDULED: [
            STATE_SECTION_6_ORDERED,
            STATE_REHABILITATION_ROUTED,
            STATE_CLOSED_PRIVATE_PATTA,
            STATE_COURT_STAY_HOLD,
        ],
        STATE_SECTION_6_ORDERED: [
            STATE_EVICTION_SCHEDULED,
            STATE_COURT_STAY_HOLD,
        ],
        STATE_EVICTION_SCHEDULED: [
            STATE_EVICTION_EXECUTED,
            STATE_COURT_STAY_HOLD,
        ],
        STATE_EVICTION_EXECUTED: [
            STATE_WATCHING,
            STATE_REENCROACHMENT_FLAGGED,
        ],
        STATE_REENCROACHMENT_FLAGGED: [
            STATE_TIER1_ESCALATED,
            STATE_VAO_ASSIGNED,
            STATE_COURT_STAY_HOLD,
        ],
        STATE_COURT_STAY_HOLD: [
            STATE_CLOSED_COURT_QUASHED,
            # Vacation returns to previous_state (handled dynamically)
        ],
        STATE_CLOSED_COURT_QUASHED: [
            STATE_REENCROACHMENT_FLAGGED,
        ],
        STATE_REHABILITATION_ROUTED: [
            STATE_REHABILITATION_COMPLETED,
            STATE_NOTICE_PREPARATION,
            STATE_COURT_STAY_HOLD,
        ],
        STATE_REHABILITATION_COMPLETED: [
            STATE_WATCHING,
        ],
        STATE_EXPIRED_NO_RECURRENCE: [
            STATE_NEW,
        ],
        # Legacy states transitions
        STATE_TRIAGE_LEGACY: [
            STATE_NEW,
            STATE_VAO_ASSIGNED,
            STATE_WATCHING,
            STATE_COLLECTOR_REVIEWED,
            STATE_COURT_STAY_HOLD,
        ],
        STATE_TAHSILDAR_ACCEPTED_LEGACY: [
            STATE_NOTICE_PREPARATION,
            STATE_SECTION_7_ISSUED,
            STATE_VAO_ASSIGNED,
            STATE_COURT_STAY_HOLD,
        ],
        STATE_VAO_ASSIGNED_LEGACY: [
            STATE_IN_FIELD_VERIFICATION,
            STATE_VAO_SUBMITTED,
            STATE_FALSE_POSITIVE_CLAIMED,
            STATE_PEER_AUDIT_PENDING,
            STATE_COURT_STAY_HOLD,
        ],
        STATE_COLLECTOR_ACCEPTED_LEGACY: [
            STATE_COLLECTOR_REVIEWED,
            STATE_VAO_ASSIGNED,
            STATE_NOTICE_PREPARATION,
            STATE_COURT_STAY_HOLD,
        ],
        # Deprecated unmigrated raw statuses mapping fallback
        'Pending': [
            STATE_NEW,
            STATE_VAO_ASSIGNED,
            STATE_WATCHING,
            STATE_COLLECTOR_REVIEWED,
            STATE_COURT_STAY_HOLD,
        ],
        'TAHSILDAR_ACCEPTED': [
            STATE_NOTICE_PREPARATION,
            STATE_SECTION_7_ISSUED,
            STATE_VAO_ASSIGNED,
            STATE_COURT_STAY_HOLD,
        ],
        'COLLECTOR_ACCEPTED': [
            STATE_COLLECTOR_REVIEWED,
            STATE_VAO_ASSIGNED,
            STATE_NOTICE_PREPARATION,
            STATE_COURT_STAY_HOLD,
        ],
    }

    # Role Authority Mapping for Target States
    ROLE_ALLOWED_TARGETS = {
        'VAO': [
            STATE_IN_FIELD_VERIFICATION,
            STATE_VAO_SUBMITTED,
            STATE_FALSE_POSITIVE_CLAIMED,
            STATE_PEER_AUDIT_PENDING,
        ],
        'INSPECTOR': [
            STATE_INSPECTOR_APPROVED,
            STATE_REJECTED_BOUNDARY,
            STATE_PEER_AUDIT_PENDING,
            STATE_FALSE_POSITIVE_CONFIRMED,
            STATE_REINSTATED,
            STATE_VAO_ASSIGNED,
        ],
        'TAHSILDAR': [
            STATE_VAO_ASSIGNED,
            STATE_WATCHING,
            STATE_PEER_AUDIT_PENDING,
            STATE_PANDAL_GRACE_PERIOD,
            STATE_TEMPORARY_OCCUPANCY_RESOLVED,
            STATE_NOTICE_PREPARATION,
            STATE_SECTION_7_ISSUED,
            STATE_NOTICE_REPLY_PENDING,
            STATE_HEARING_SCHEDULED,
            STATE_SECTION_6_ORDERED,
            STATE_CLOSED_PRIVATE_PATTA,
            STATE_REHABILITATION_ROUTED,
        ],
        'RDO': [
            STATE_VAO_ASSIGNED,
            STATE_WATCHING,
            STATE_PEER_AUDIT_PENDING,
            STATE_PANDAL_GRACE_PERIOD,
            STATE_TEMPORARY_OCCUPANCY_RESOLVED,
            STATE_NOTICE_PREPARATION,
            STATE_SECTION_7_ISSUED,
            STATE_NOTICE_REPLY_PENDING,
            STATE_HEARING_SCHEDULED,
            STATE_SECTION_6_ORDERED,
            STATE_CLOSED_PRIVATE_PATTA,
            STATE_REHABILITATION_ROUTED,
            STATE_REHABILITATION_COMPLETED,
        ],
        'COLLECTOR': [
            STATE_TIER1_ESCALATED,
            STATE_COLLECTOR_REVIEWED,
            STATE_VAO_ASSIGNED,
            STATE_WATCHING,
            STATE_PANDAL_GRACE_PERIOD,
            STATE_TEMPORARY_OCCUPANCY_RESOLVED,
            STATE_NOTICE_PREPARATION,
            STATE_SECTION_7_ISSUED,
            STATE_NOTICE_REPLY_PENDING,
            STATE_HEARING_SCHEDULED,
            STATE_SECTION_6_ORDERED,
            STATE_EVICTION_SCHEDULED,
            STATE_EVICTION_EXECUTED,
            STATE_COURT_STAY_HOLD,
            STATE_CLOSED_COURT_QUASHED,
            STATE_REHABILITATION_ROUTED,
            STATE_REHABILITATION_COMPLETED,
        ],
        'CLA_STATE': [
            STATE_COLLECTOR_REVIEWED,
            STATE_COURT_STAY_HOLD,
            STATE_CLOSED_COURT_QUASHED,
            STATE_REHABILITATION_ROUTED,
        ],
        'STATE_APEX': [
            STATE_COLLECTOR_REVIEWED,
            STATE_COURT_STAY_HOLD,
            STATE_CLOSED_COURT_QUASHED,
        ],
        'ADMIN_GIS': [
            STATE_NEW,
            STATE_WATCHING,
            STATE_REENCROACHMENT_FLAGGED,
            STATE_EXPIRED_NO_RECURRENCE,
        ],
        'VIGILANCE': [],  # Strict read-only audit access
    }

    @classmethod
    def get_user_role(cls, user) -> str:
        """Derive effective officer role strictly from OfficerAssignment or profile."""
        if not user or not user.is_authenticated:
            return 'ANONYMOUS'
        
        # 1. Primary: Active effective-dated OfficerAssignment
        assignment = OfficerAssignment.objects.filter(
            user=user,
            is_active=True
        ).first()
        if assignment:
            return assignment.role

        # 2. Secondary fallback: UserProfile
        profile = getattr(user, 'profile', None)
        if profile:
            return profile.role

        # 3. Superuser fallback
        if user.is_superuser:
            return 'STATE_APEX'

        return 'ANONYMOUS'

    @classmethod
    def get_allowed_transitions(cls, alert: EncroachmentAlert, user=None) -> list[dict]:
        """
        Computes all permissible next transitions for this alert given the user's role.
        Used directly to populate `allowed_actions[]` on API endpoints.
        """
        role = cls.get_user_role(user)
        current_state = alert.status
        allowed = []

        valid_targets = list(cls.VALID_TRANSITIONS.get(current_state, []))
        if current_state == cls.STATE_COURT_STAY_HOLD and alert.previous_state:
            valid_targets.append(alert.previous_state)

        # Anyone with appropriate authority can record a court stay from active states
        if current_state not in [cls.STATE_COURT_STAY_HOLD, cls.STATE_CLOSED_COURT_QUASHED, cls.STATE_EXPIRED_NO_RECURRENCE]:
            if cls.STATE_COURT_STAY_HOLD not in valid_targets:
                valid_targets.append(cls.STATE_COURT_STAY_HOLD)

        role_targets = cls.ROLE_ALLOWED_TARGETS.get(role, [])
        is_admin_or_apex = role in ['STATE_APEX', 'CLA_STATE', 'COLLECTOR'] or (user and user.is_superuser)

        for target in valid_targets:
            # Check role authority
            role_ok = is_admin_or_apex or (target in role_targets)
            if not role_ok and target == cls.STATE_COURT_STAY_HOLD:
                role_ok = role in ['TAHSILDAR', 'RDO', 'COLLECTOR', 'CLA_STATE', 'STATE_APEX']

            # Guard checks preview
            guard_ok = True
            block_reason = ""

            # Guard: Vulnerable housing Section 6 block
            if target == cls.STATE_SECTION_6_ORDERED and alert.structure_category == 'VULNERABLE_HOUSING':
                guard_ok = False
                block_reason = "Section 6 Eviction is prohibited for Vulnerable Dwellers. Must route to TNUHDB."

            # Guard: Pandal grace only for TEMPORARY_PANDAL
            if target == cls.STATE_PANDAL_GRACE_PERIOD and alert.structure_category != 'TEMPORARY_PANDAL':
                guard_ok = False
                block_reason = "Pandal grace period is only permissible for TEMPORARY_PANDAL structures."

            # Guard: Pandal grace exit cannot be direct eviction
            if current_state == cls.STATE_PANDAL_GRACE_PERIOD and target in [cls.STATE_SECTION_6_ORDERED, cls.STATE_EVICTION_SCHEDULED, cls.STATE_EVICTION_EXECUTED]:
                guard_ok = False
                block_reason = "Pandal grace expiry cannot proceed directly to eviction. Return to verification or notice."

            allowed.append({
                "target_state": target,
                "label": target.replace('_', ' ').title(),
                "allowed": role_ok and guard_ok,
                "reason": block_reason if not guard_ok else ("Role not authorized" if not role_ok else "Permitted"),
            })

        return allowed

    @classmethod
    @transaction.atomic
    def transition(
        cls,
        alert: EncroachmentAlert,
        target_state: str,
        actor=None,
        reason: str = "",
        action: str = None,
        metadata: dict = None,
        dry_run: bool = False,
    ) -> tuple[bool, str, CaseAuditEvent | None]:
        """
        Executes a validated, guard-checked state transition.
        Atomically updates the alert and creates a CaseAuditEvent.
        """
        metadata = dict(metadata or {})
        current_state = alert.status
        actor_role = cls.get_user_role(actor)

        # 1. Vigilance Read-Only Lock
        if actor_role == 'VIGILANCE':
            raise AuthorizationError(
                "Access Denied: Vigilance & Anti-Corruption officers have read-only audit access and cannot execute transitions."
            )

        # 2. Valid Transition Check
        valid_targets = list(cls.VALID_TRANSITIONS.get(current_state, []))
        if current_state == cls.STATE_COURT_STAY_HOLD and alert.previous_state:
            valid_targets.append(alert.previous_state)
        
        # Court stay hold can be invoked from any active proceeding state
        if target_state == cls.STATE_COURT_STAY_HOLD and current_state not in [cls.STATE_COURT_STAY_HOLD, cls.STATE_CLOSED_COURT_QUASHED, cls.STATE_EXPIRED_NO_RECURRENCE]:
            valid_targets.append(cls.STATE_COURT_STAY_HOLD)

        if target_state not in valid_targets:
            raise IllegalTransitionError(
                f"Illegal State Transition: Cannot move alert {alert.id} from '{current_state}' to '{target_state}'."
            )

        # 3. Role Authorization Check
        is_admin_or_apex = actor_role in ['STATE_APEX', 'CLA_STATE', 'COLLECTOR'] or (actor and actor.is_superuser)
        role_targets = cls.ROLE_ALLOWED_TARGETS.get(actor_role, [])
        if not is_admin_or_apex and target_state not in role_targets:
            if target_state == cls.STATE_COURT_STAY_HOLD and actor_role in ['TAHSILDAR', 'RDO']:
                pass  # Tahsildars and RDOs can record court stay orders
            else:
                raise AuthorizationError(
                    f"Statutory Authority Denied: Role '{actor_role}' is not authorized to transition to '{target_state}'."
                )

        # 4. Guard Checks
        # Guard 4.1: Vulnerable Housing Humanitarian Block on Section 6
        if target_state == cls.STATE_SECTION_6_ORDERED and alert.structure_category == 'VULNERABLE_HOUSING':
            raise TransitionGuardError(
                "Statutory Guard: Section 6 Eviction Order is strictly prohibited for Vulnerable Dwellers / Thatched Huts. "
                "Humanitarian policy mandates routing to TNUHDB (REHABILITATION_ROUTED)."
            )

        # Guard 4.2: Court Stay Hold Clock Pause & Resume
        if target_state == cls.STATE_COURT_STAY_HOLD:
            stay_order_no = metadata.get('stay_order_no') or metadata.get('order_no')
            if not stay_order_no and not metadata.get('bypass_order_no_check'):
                raise TransitionGuardError(
                    "Statutory Guard: Entering COURT_STAY_HOLD requires a documented court stay order number (stay_order_no)."
                )
            alert.previous_state = alert.status
            alert.stay_commenced_at = timezone.now()
            if alert.sla_deadline:
                rem_seconds = int((alert.sla_deadline - timezone.now()).total_seconds())
                alert.paused_sla_remaining_seconds = max(0, rem_seconds)
            metadata['court_stay_recorded'] = True

        elif current_state == cls.STATE_COURT_STAY_HOLD:
            if target_state == cls.STATE_CLOSED_COURT_QUASHED:
                alert.stay_commenced_at = None
                alert.paused_sla_remaining_seconds = None
                metadata['stay_quashed'] = True
            elif target_state == alert.previous_state or target_state in valid_targets:
                # Stay vacated, resume clocks
                if alert.paused_sla_remaining_seconds is not None:
                    alert.sla_deadline = timezone.now() + datetime.timedelta(seconds=alert.paused_sla_remaining_seconds)
                alert.stay_commenced_at = None
                alert.paused_sla_remaining_seconds = None
                alert.previous_state = None
                metadata['stay_vacated_clock_resumed'] = True

        # Guard 4.3: Section 7 FMB Certified Survey Guard (only when newly issuing Section 7)
        if target_state == cls.STATE_SECTION_7_ISSUED and current_state != cls.STATE_COURT_STAY_HOLD:
            district_name = getattr(getattr(alert, 'parcel', None), 'district', None)
            cfg = DistrictLegalConfig.get_config_for_district(district_name)
            if cfg and cfg.fmb_certified_survey_required:
                has_certified = bool(alert.fmb_measurements and alert.fmb_measurements.get('certified') is True)
                acknowledged = alert.fmb_certified_acknowledged or bool(metadata.get('fmb_certified_acknowledged'))
                ack_reason = (alert.fmb_acknowledgement_reason or metadata.get('fmb_acknowledgement_reason', '')).strip()

                if not has_certified:
                    if not acknowledged or not ack_reason:
                        raise TransitionGuardError(
                            "Statutory Guard: Section 7 Notice requires certified FMB survey measurements under operative policy, "
                            "or explicit officer acknowledgement of indicative sketch (fmb_certified_acknowledged=True and fmb_acknowledgement_reason)."
                        )
                    alert.fmb_certified_acknowledged = True
                    alert.fmb_acknowledgement_reason = ack_reason
                    metadata['fmb_indicative_override'] = True

        # Guard 4.4: Pandal Grace Guard
        if target_state == cls.STATE_PANDAL_GRACE_PERIOD:
            if alert.structure_category != 'TEMPORARY_PANDAL':
                raise TransitionGuardError(
                    "Statutory Guard: Pandal grace period is only permissible for TEMPORARY_PANDAL structures."
                )
            if actor_role not in ['TAHSILDAR', 'RDO', 'COLLECTOR', 'CLA_STATE', 'STATE_APEX']:
                raise TransitionGuardError(
                    "Statutory Guard: Pandal grace period requires Tahsildar or higher authority."
                )

        if current_state == cls.STATE_PANDAL_GRACE_PERIOD:
            disallowed_targets = [cls.STATE_SECTION_6_ORDERED, cls.STATE_EVICTION_SCHEDULED, cls.STATE_EVICTION_EXECUTED]
            if target_state in disallowed_targets:
                raise TransitionGuardError(
                    f"Statutory Guard: Upon expiry or resolution of pandal grace period, direct transition to {target_state} is prohibited. "
                    "Case must return to triage/verification (VAO_ASSIGNED, WATCHING) or NOTICE_PREPARATION."
                )

        # Guard 4.5: Notice Reply Pending (no reply) Guard
        if current_state == cls.STATE_NOTICE_REPLY_PENDING and target_state == cls.STATE_SECTION_6_ORDERED:
            reply_received = metadata.get('reply_received', False)
            if not reply_received:
                district_name = getattr(getattr(alert, 'parcel', None), 'district', None)
                cfg = DistrictLegalConfig.get_config_for_district(district_name)
                if not (cfg and cfg.default_no_reply_action):
                    raise TransitionGuardError(
                        "Statutory Guard: [LEGAL RULE UNKNOWN - pending legal officer confirmation]. "
                        "Transition to Section 6 without notice reply or hearing is denied by default until statutory no-reply rule is configured."
                    )

        # Guard 4.6: False Positive Mandatory Peer Audit
        if target_state == cls.STATE_FALSE_POSITIVE_CLAIMED:
            alert.is_peer_audited = True
            metadata['queued_for_peer_audit'] = True

        if target_state == cls.STATE_FALSE_POSITIVE_CONFIRMED:
            # Must be confirmed by an independent officer (peer auditor)
            peer_auditor = metadata.get('peer_auditor_name') or (actor.get_full_name() or actor.username if actor else None)
            if not alert.is_peer_audited and not metadata.get('peer_audit_override'):
                raise TransitionGuardError(
                    "Statutory Guard: Cannot close case as FALSE_POSITIVE_CONFIRMED without independent peer audit verification."
                )
            if peer_auditor:
                alert.peer_auditor_name = peer_auditor

        if dry_run:
            return True, f"Dry-run transition from {current_state} to {target_state} validated successfully.", None

        # 5. Apply State Update
        action_name = action or f"TRANSITION_{current_state}_TO_{target_state}"
        alert.status = target_state
        if reason:
            alert.resolution_notes = f"{alert.resolution_notes or ''}\n[{target_state} by {actor_role}]: {reason}".strip()
        alert.save()

        # 6. Record Immutable CaseAuditEvent
        audit_event = CaseAuditEvent.objects.create(
            alert=alert,
            actor=actor if (actor and actor.is_authenticated) else None,
            actor_role=actor_role,
            action=action_name,
            from_state=current_state,
            to_state=target_state,
            reason=reason,
            metadata=metadata,
        )

        return True, f"Transitioned from {current_state} to {target_state}.", audit_event
