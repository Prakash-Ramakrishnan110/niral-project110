"""
Notification Adapter (Sandbox) for GEOMMAND Review Tasks and Watch Zone alerts.
Delivers in-memory/logged notification events to subscribed officers without external side-effects.
"""
import logging
from typing import List, Dict, Any

logger = logging.getLogger('geommand.notifications')

# In-memory sandbox outbox for testing and inspection
SANDBOX_OUTBOX: List[Dict[str, Any]] = []

def clear_sandbox_outbox():
    global SANDBOX_OUTBOX
    SANDBOX_OUTBOX.clear()

def get_sandbox_outbox() -> List[Dict[str, Any]]:
    return list(SANDBOX_OUTBOX)

def send_sandbox_notification(recipient_username: str, role: str, subject: str, message: str, payload: dict = None) -> Dict[str, Any]:
    """
    Delivers a structured notification to the sandbox outbox and logs it.
    """
    event = {
        'recipient': recipient_username,
        'role': role,
        'subject': subject,
        'message': message,
        'payload': payload or {},
        'channel': 'SANDBOX_NOTIFICATION',
    }
    SANDBOX_OUTBOX.append(event)
    logger.info("Sandbox Notification dispatched to %s (%s): %s", recipient_username, role, subject)
    return event

def notify_zone_subscribers(zone, review_task) -> int:
    """
    Finds all active subscriptions for the given WatchZone and delivers notifications.
    """
    subscriptions = zone.subscriptions.filter(is_active=True).select_related('user')
    count = 0
    for sub in subscriptions:
        send_sandbox_notification(
            recipient_username=sub.user.username,
            role=sub.role or 'OFFICER',
            subject=f"Review Due: Watch Zone {zone.name_en}",
            message=f"Review task {review_task.id} generated for {zone.name_en}. Due date: {review_task.due_date}.",
            payload={
                'zone_id': str(zone.id),
                'zone_name': zone.name_en,
                'priority': zone.priority,
                'cadence_days': zone.cadence_days,
                'task_id': str(review_task.id),
                'due_date': str(review_task.due_date),
            }
        )
        count += 1
    return count

