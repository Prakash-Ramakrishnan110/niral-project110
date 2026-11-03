"""
Celery Task Definitions for GEOMMAND Periodic Scheduler.
Tasks are idempotent, protected by distributed locks, and run on Asia/Kolkata timezone.
All automated closing or review tasks write audit records under the SYSTEM actor.
"""
import logging
from celery import shared_task
from django.core.cache import cache
from core.services.watch_scheduler import (
    run_watch_zone_cadence_evaluator,
    evaluate_low_lane_recheck_watchdog,
    run_sla_compliance_watchdog
)

logger = logging.getLogger('geommand.tasks')


@shared_task(bind=True, max_retries=1)
def task_run_watch_zone_cadence_evaluator(self):
    """
    Periodic Celery Beat task: Evaluates watch zones whose review cadence is due.
    Generates ReviewTasks and notifies subscribers. Protected by lock.
    """
    lock_id = "lock_task_watch_zone_cadence_evaluator"
    acquire_lock = cache.add(lock_id, "true", timeout=60 * 10) if cache else True

    if not acquire_lock:
        logger.warning("Watch zone cadence evaluator is already executing. Skipping iteration.")
        return {'status': 'locked', 'created_tasks': 0}

    try:
        tasks = run_watch_zone_cadence_evaluator()
        return {'status': 'success', 'created_tasks': len(tasks)}
    finally:
        if cache:
            cache.delete(lock_id)


@shared_task(bind=True, max_retries=1)
def task_run_low_lane_recheck_watchdog(self, auto_close=False):
    """
    Periodic Celery Beat task: Evaluates low-lane observation windows past recheck_days_low.
    Creates review tasks and audits closure under SYSTEM actor.
    """
    lock_id = "lock_task_low_lane_recheck"
    acquire_lock = cache.add(lock_id, "true", timeout=60 * 10) if cache else True

    if not acquire_lock:
        logger.warning("Low lane recheck watchdog is already executing. Skipping iteration.")
        return {'status': 'locked', 'created_tasks': 0}

    try:
        tasks = evaluate_low_lane_recheck_watchdog(auto_close=auto_close)
        return {'status': 'success', 'created_tasks': len(tasks)}
    finally:
        if cache:
            cache.delete(lock_id)


@shared_task(bind=True, max_retries=1)
def task_run_sla_compliance_watchdog(self):
    """
    Periodic Celery Beat task: Evaluates statutory notice reply windows and hearing dates.
    Flags overdue cases and notifies. NEVER alters case state machine status.
    """
    lock_id = "lock_task_sla_watchdog"
    acquire_lock = cache.add(lock_id, "true", timeout=60 * 10) if cache else True

    if not acquire_lock:
        logger.warning("SLA compliance watchdog is already executing. Skipping iteration.")
        return {'status': 'locked', 'flagged_count': 0}

    try:
        flagged = run_sla_compliance_watchdog()
        return {'status': 'success', 'flagged_count': len(flagged)}
    finally:
        if cache:
            cache.delete(lock_id)


@shared_task(bind=True, max_retries=1)
def task_flush_expired_tokens(self):
    """
    Periodic Celery Beat maintenance task:
    Deletes expired JWT outstanding tokens (flushexpiredtokens) to maintain database hygiene.
    Protected by lock.
    """
    from django.core.management import call_command
    import io

    lock_id = "lock_task_flush_expired_tokens"
    acquire_lock = cache.add(lock_id, "true", timeout=60 * 5) if cache else True

    if not acquire_lock:
        logger.warning("Token flush task is already executing. Skipping iteration.")
        return {'status': 'locked'}

    try:
        out = io.StringIO()
        call_command('flushexpiredtokens', stdout=out)
        result_text = out.getvalue().strip() or "flushed"
        logger.info(f"flushexpiredtokens completed: {result_text}")
        return {'status': 'success', 'result': result_text}
    finally:
        if cache:
            cache.delete(lock_id)


