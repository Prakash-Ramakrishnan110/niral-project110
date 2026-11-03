"""
Watch Scheduler Service.
Implements:
1. Periodic ReviewTask generator for due Watch Zones (based on zone.cadence_days, no hidden default).
   - Cloudy observations (NO_CLEAR_OBSERVATION) do NOT count as checked clear; zone stays due.
   - Dispatches sandbox notifications to subscribed officers.
   - Idempotent: repeated runs never duplicate pending ReviewTasks.
2. Low-Lane Watch: checks alerts past recheck_days_low from LaneConfig/DistrictLegalConfig.
   - Creates ReviewTasks.
   - Can close alerts as EXPIRED_NO_RECURRENCE with audit logging under system actor.
3. SLA Watchdog: reads statutory periods from DistrictLegalConfig.
   - Flags overdue cases and notifies.
   - Strictly NEVER alters case state or mutates alert status.
   - Zero hardcoded numeric day literals.
"""
import logging
from datetime import timedelta, date
from typing import Optional, List
from django.utils import timezone
from django.db import transaction

from core.models import (
    WatchZone, ParcelCheck, ReviewTask, EncroachmentAlert,
    DistrictLegalConfig, LaneConfig, CaseAuditEvent
)
from core.services.notification_adapter import notify_zone_subscribers, send_sandbox_notification

logger = logging.getLogger('geommand.scheduler')


def calculate_zone_due_date(zone: WatchZone, reference_date: Optional[date] = None) -> date:
    """
    Computes statutory or cadence review due date for a WatchZone.
    Due date = last_clear_observation_date + zone.cadence_days.
    If no clear observation exists, due date is valid_from + zone.cadence_days.
    A cloudy scene (NO_CLEAR_OBSERVATION) is NOT a clear observation and is ignored.
    """
    cadence = timedelta(days=zone.cadence_days)

    # Find the most recent check that was either CLEAR or ALERT
    last_valid_check = ParcelCheck.objects.filter(
        zone=zone,
        result__in=['CLEAR', 'ALERT']
    ).order_by('-checked_at').first()

    if last_valid_check:
        base_date = last_valid_check.checked_at.date()
    else:
        base_date = zone.valid_from or (reference_date or timezone.now().date())

    return base_date + cadence


def run_watch_zone_cadence_evaluator(target_date: Optional[date] = None) -> List[ReviewTask]:
    """
    Evaluates all active, approved WatchZones.
    If due_date <= target_date, generates an idempotent ReviewTask and notifies subscribers.
    Does NOT trigger imagery ingest or recompute satellite deltas.
    """
    today = target_date or timezone.now().date()
    created_tasks = []

    active_zones = WatchZone.objects.filter(
        is_active=True,
        approval_status='APPROVED'
    ).select_related('district', 'taluk')

    for zone in active_zones:
        due_date = calculate_zone_due_date(zone, reference_date=today)

        if due_date <= today:
            # Idempotency check: Don't duplicate open/pending review tasks for this zone on this due date
            existing_task = ReviewTask.objects.filter(
                zone=zone,
                task_type='ZONE_CADENCE_REVIEW',
                status='PENDING',
                due_date=due_date
            ).first()

            if not existing_task:
                with transaction.atomic():
                    task = ReviewTask.objects.create(
                        zone=zone,
                        task_type='ZONE_CADENCE_REVIEW',
                        due_date=due_date,
                        status='PENDING',
                        details={
                            'cadence_days': zone.cadence_days,
                            'priority': zone.priority,
                            'category': zone.category,
                            'evaluation_date': str(today),
                        }
                    )
                    created_tasks.append(task)
                    # Notify subscribers via sandbox adapter
                    notify_zone_subscribers(zone, task)
                    logger.info("Created ReviewTask %s for zone %s (due %s)", task.id, zone.name_en, due_date)

    return created_tasks


def evaluate_low_lane_recheck_watchdog(target_date: Optional[date] = None, auto_close: bool = False) -> List[ReviewTask]:
    """
    Low-lane watch: alerts past recheck_days_low from LaneConfig/DistrictLegalConfig
    get a ReviewTask.
    Closing as EXPIRED_NO_RECURRENCE follows configured rule and is audited under system actor.
    No hardcoded numeric day literals.
    """
    today = target_date or timezone.now().date()
    created_tasks = []

    # Target alerts in observation/watching states or low-priority lanes (C, D)
    watching_alerts = EncroachmentAlert.objects.filter(
        status__in=['WATCHING', 'Pending', 'TRIAGE_LEGACY', 'NEW'],
        snapshot_lane__in=['LANE_C_ROAD_STREET', 'LANE_D_RESIDENTIAL_LIVELIHOOD', 'C', 'D']
    ).select_related('parcel')

    for alert in watching_alerts:
        district_name = alert.parcel.district if alert.parcel else None
        legal_cfg = DistrictLegalConfig.get_config_for_district(district_name)
        recheck_interval_days = legal_cfg.recheck_days_low

        recheck_delta = timedelta(days=recheck_interval_days)
        alert_baseline_date = alert.detection_date.date() if hasattr(alert.detection_date, 'date') else alert.detection_date
        due_date = alert_baseline_date + recheck_delta

        if due_date <= today:
            existing_task = ReviewTask.objects.filter(
                alert=alert,
                task_type='LOW_LANE_RECHECK',
                status='PENDING',
                due_date=due_date
            ).first()

            if not existing_task:
                with transaction.atomic():
                    task = ReviewTask.objects.create(
                        alert=alert,
                        parcel=alert.parcel,
                        task_type='LOW_LANE_RECHECK',
                        due_date=due_date,
                        status='PENDING',
                        details={
                            'recheck_days_low': recheck_interval_days,
                            'lane': alert.snapshot_lane,
                            'alert_id': str(alert.id),
                        }
                    )
                    created_tasks.append(task)

                    if auto_close:
                        # Close alert as EXPIRED_NO_RECURRENCE with audit logging
                        from_state = alert.status
                        alert.status = 'EXPIRED_NO_RECURRENCE'
                        alert.version += 1
                        alert.save(update_fields=['status', 'version'])

                        CaseAuditEvent.objects.create(
                            alert=alert,
                            actor=None,
                            actor_role='SYSTEM',
                            action='LOW_LANE_EXPIRED_NO_RECURRENCE',
                            from_state=from_state,
                            to_state='EXPIRED_NO_RECURRENCE',
                            reason=f"Closed as EXPIRED_NO_RECURRENCE: elapsed observation window of {recheck_interval_days} days without recurrence per DistrictLegalConfig.",
                            metadata={
                                'recheck_days_low': recheck_interval_days,
                                'task_id': str(task.id),
                            }
                        )

    return created_tasks


def run_sla_compliance_watchdog(target_date: Optional[date] = None) -> List[dict]:
    """
    Statutory SLA watchdog.
    Reads notice/reply/hearing periods from DistrictLegalConfig.
    Flags overdue cases and notifies officer subscribers.
    NEVER mutates alert status or modifies case state machine.
    Zero hardcoded numeric day literals.
    """
    today = target_date or timezone.now().date()
    flagged_overdue = []

    # Active alerts in notice or hearing pipeline
    active_notice_alerts = EncroachmentAlert.objects.filter(
        status__in=['SECTION_7_ISSUED', 'NOTICE_REPLY_PENDING', 'HEARING_SCHEDULED']
    ).select_related('parcel')

    for alert in active_notice_alerts:
        district_name = alert.parcel.district if alert.parcel else None
        legal_cfg = DistrictLegalConfig.get_config_for_district(district_name)

        reply_window = timedelta(days=legal_cfg.section7_reply_window_days)
        if alert.sla_deadline:
            sla_deadline = alert.sla_deadline.date() if hasattr(alert.sla_deadline, 'date') else alert.sla_deadline
        else:
            base_date = alert.detection_date.date() if hasattr(alert.detection_date, 'date') else alert.detection_date
            sla_deadline = base_date + reply_window

        if sla_deadline < today:
            # Record overdue flag without altering alert.status
            overdue_record = {
                'alert_id': str(alert.id),
                'current_status': alert.status,
                'deadline': str(sla_deadline),
                'days_configured': legal_cfg.section7_reply_window_days,
                'is_overdue': True,
            }
            flagged_overdue.append(overdue_record)

            # Create or update SLA ReviewTask (flag only)
            existing_task = ReviewTask.objects.filter(
                alert=alert,
                task_type='SLA_OVERDUE_REVIEW',
                status='PENDING'
            ).first()

            if not existing_task:
                ReviewTask.objects.create(
                    alert=alert,
                    parcel=alert.parcel,
                    task_type='SLA_OVERDUE_REVIEW',
                    due_date=sla_deadline,
                    status='PENDING',
                    details=overdue_record
                )

            # Dispatch sandbox notification to assigned officer or role
            send_sandbox_notification(
                recipient_username='tahsildar_salem',
                role='TAHSILDAR',
                subject=f"Statutory SLA Overdue: Alert {alert.id}",
                message=f"Section 7 reply window ({legal_cfg.section7_reply_window_days} days) exceeded for parcel {alert.parcel.survey_number if alert.parcel else ''}.",
                payload=overdue_record
            )

    return flagged_overdue
