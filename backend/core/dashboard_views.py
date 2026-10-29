import os
from datetime import timedelta
from django.utils import timezone
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from core.models import EncroachmentAlert, FieldVerification
from core.services.jurisdiction_scope import JurisdictionScopeService
from core.services.accuracy_ledger import AccuracyLedgerService


class DashboardSummaryView(APIView):
    """
    Executive and Operational Dashboard Summary endpoint (Part 14 Step 6).
    Returns scoped KPIs, statutory pipeline stages, satellite coverage gaps,
    and data integrity indicators. All metrics are derived from genuine database queries.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        role = JurisdictionScopeService.get_primary_role(user)
        scope = JurisdictionScopeService.get_user_scope(user)

        # 1. Scoped Alerts QuerySet
        alerts_qs = JurisdictionScopeService.scope_alerts(EncroachmentAlert.objects.all(), user)
        now = timezone.now()
        in_48h = now + timedelta(hours=48)

        # Excluded closed terminal states for active counts
        closed_states = [
            EncroachmentAlert.STATE_CLOSED_COURT_QUASHED,
            EncroachmentAlert.STATE_CLOSED_PRIVATE_PATTA,
            EncroachmentAlert.STATE_TEMPORARY_OCCUPANCY_RESOLVED,
            EncroachmentAlert.STATE_EXPIRED_NO_RECURRENCE,
            EncroachmentAlert.STATE_FALSE_POSITIVE_CONFIRMED,
        ]
        active_alerts = alerts_qs.exclude(status__in=closed_states)

        # 2. Scoped Actionable Items by Role
        action_states_by_role = {
            'VAO': [
                EncroachmentAlert.STATE_VAO_ASSIGNED,
                EncroachmentAlert.STATE_IN_FIELD_VERIFICATION,
                EncroachmentAlert.STATE_VAO_ASSIGNED_LEGACY,
            ],
            'INSPECTOR': [
                EncroachmentAlert.STATE_VAO_SUBMITTED,
                EncroachmentAlert.STATE_FALSE_POSITIVE_CLAIMED,
            ],
            'TAHSILDAR': [
                EncroachmentAlert.STATE_INSPECTOR_APPROVED,
                EncroachmentAlert.STATE_NOTICE_PREPARATION,
                EncroachmentAlert.STATE_NOTICE_REPLY_PENDING,
                EncroachmentAlert.STATE_HEARING_SCHEDULED,
                EncroachmentAlert.STATE_TRIAGE_LEGACY,
                EncroachmentAlert.STATE_TAHSILDAR_ACCEPTED_LEGACY,
            ],
            'COLLECTOR': [
                EncroachmentAlert.STATE_TIER1_ESCALATED,
                EncroachmentAlert.STATE_NEW,
                EncroachmentAlert.STATE_COLLECTOR_ACCEPTED_LEGACY,
                EncroachmentAlert.STATE_REENCROACHMENT_FLAGGED,
            ],
        }
        role_action_states = action_states_by_role.get(role, [])
        needs_my_action = active_alerts.filter(status__in=role_action_states).count() if role_action_states else 0

        # 3. KPI Calculations
        sla_breached = active_alerts.filter(
            sla_deadline__lt=now
        ).count()

        due_within_48h = active_alerts.filter(
            sla_deadline__gte=now,
            sla_deadline__lte=in_48h
        ).count()

        peer_audits_open = active_alerts.filter(
            status=EncroachmentAlert.STATE_PEER_AUDIT_PENDING
        ).count()

        court_stays_in_force = active_alerts.filter(
            status=EncroachmentAlert.STATE_COURT_STAY_HOLD
        ).count()

        open_cases_total = active_alerts.count()

        kpis = {
            "needs_my_action": needs_my_action,
            "sla_breached": sla_breached,
            "due_within_48h": due_within_48h,
            "peer_audits_open": peer_audits_open,
            "court_stays_in_force": court_stays_in_force,
            "open_cases_total": open_cases_total,
        }

        # 4. Pipeline Stages
        pipeline_stages = {
            "triage": alerts_qs.filter(
                status__in=[
                    EncroachmentAlert.STATE_NEW,
                    EncroachmentAlert.STATE_TIER1_ESCALATED,
                    EncroachmentAlert.STATE_COLLECTOR_REVIEWED,
                    EncroachmentAlert.STATE_WATCHING,
                    EncroachmentAlert.STATE_TRIAGE_LEGACY,
                ]
            ).count(),
            "field_verification": alerts_qs.filter(
                status__in=[
                    EncroachmentAlert.STATE_VAO_ASSIGNED,
                    EncroachmentAlert.STATE_IN_FIELD_VERIFICATION,
                    EncroachmentAlert.STATE_VAO_SUBMITTED,
                    EncroachmentAlert.STATE_FALSE_POSITIVE_CLAIMED,
                    EncroachmentAlert.STATE_PEER_AUDIT_PENDING,
                    EncroachmentAlert.STATE_VAO_ASSIGNED_LEGACY,
                ]
            ).count(),
            "inspection": alerts_qs.filter(
                status__in=[
                    EncroachmentAlert.STATE_INSPECTOR_APPROVED,
                    EncroachmentAlert.STATE_REINSTATED,
                    EncroachmentAlert.STATE_PANDAL_GRACE_PERIOD,
                ]
            ).count(),
            "statutory_notice": alerts_qs.filter(
                status__in=[
                    EncroachmentAlert.STATE_NOTICE_PREPARATION,
                    EncroachmentAlert.STATE_SECTION_7_ISSUED,
                    EncroachmentAlert.STATE_NOTICE_REPLY_PENDING,
                    EncroachmentAlert.STATE_TAHSILDAR_ACCEPTED_LEGACY,
                    EncroachmentAlert.STATE_COLLECTOR_ACCEPTED_LEGACY,
                ]
            ).count(),
            "hearing": alerts_qs.filter(
                status=EncroachmentAlert.STATE_HEARING_SCHEDULED
            ).count(),
            "eviction_order": alerts_qs.filter(
                status__in=[
                    EncroachmentAlert.STATE_SECTION_6_ORDERED,
                    EncroachmentAlert.STATE_EVICTION_SCHEDULED,
                ]
            ).count(),
            "executed_resolved": alerts_qs.filter(
                status__in=[
                    EncroachmentAlert.STATE_EVICTION_EXECUTED,
                    EncroachmentAlert.STATE_REHABILITATION_COMPLETED,
                    EncroachmentAlert.STATE_CLOSED_PRIVATE_PATTA,
                    EncroachmentAlert.STATE_TEMPORARY_OCCUPANCY_RESOLVED,
                    'RESOLVED',
                ]
            ).count(),
        }

        # 5. Satellite Coverage Gaps
        district_filter = scope.get('district') if scope.get('level') != 'STATE' else None
        coverage_gaps = AccuracyLedgerService.detect_satellite_coverage_gaps(
            district=district_filter,
            max_gap_days=10
        )

        # 6. Integrity Indicators
        certified_count = active_alerts.filter(fmb_measurements__is_certified_survey=True).count()
        indicative_fmb_count = max(0, active_alerts.count() - certified_count)

        unverified_approvals_count = active_alerts.filter(
            approver_unverified=True
        ).count()

        rehabilitation_routed = active_alerts.filter(
            status=EncroachmentAlert.STATE_REHABILITATION_ROUTED
        ).count()

        control_checks_count = alerts_qs.filter(
            is_control_check=True
        ).count()

        integrity_indicators = {
            "indicative_fmb_count": indicative_fmb_count,
            "unverified_approvals_count": unverified_approvals_count,
            "active_court_stays": court_stays_in_force,
            "rehabilitation_routed": rehabilitation_routed,
            "control_checks_count": control_checks_count,
            "disclaimer": "All cadastral boundaries are INDICATIVE until certified by Taluk Surveyor.",
        }

        # 7. Accuracy Ledger Metrics
        accuracy_metrics = AccuracyLedgerService.get_lane_accuracy_summary(
            district=district_filter
        )

        return Response({
            "scope": scope,
            "role": role,
            "kpis": kpis,
            "pipeline_stages": pipeline_stages,
            "coverage_gaps": coverage_gaps,
            "integrity_indicators": integrity_indicators,
            "accuracy": accuracy_metrics,
            "is_demo": os.environ.get('GEOMMAND_ENV') == 'demo',
            "timestamp": now.isoformat(),
        }, status=status.HTTP_200_OK)
