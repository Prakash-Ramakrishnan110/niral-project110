from datetime import datetime, timedelta
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.db.models import Q
from core.models import ChangeFeedEvent


class ChangeFeedService:
    """
    Commit-safe cursor-based change feed service implementing Section 8 of Master Prompt.
    - Uses safe-horizon read to prevent missing concurrently committing transactions.
    - Cursor format: '<iso_timestamp>:<id>' ensuring deterministic ordering.
    - Scoped by officer administrative jurisdiction.
    """

    @classmethod
    def get_changes(
        cls,
        since_cursor: str = None,
        limit: int = 50,
        district: str = None,
        taluk: str = None,
        village: str = None,
        safe_horizon_seconds: float = 1.0,
    ) -> dict:
        limit = max(1, min(limit or 50, 200))
        now = timezone.now()
        safe_horizon_dt = now - timedelta(seconds=safe_horizon_seconds)

        qs = ChangeFeedEvent.objects.filter(created_at__lte=safe_horizon_dt)

        # Apply Scope Filtering
        if district:
            qs = qs.filter(Q(scope_district__iexact=district.strip()) | Q(scope_district__isnull=True))
        if taluk:
            qs = qs.filter(Q(scope_taluk__iexact=taluk.strip()) | Q(scope_taluk__isnull=True))
        if village:
            qs = qs.filter(Q(scope_village__iexact=village.strip()) | Q(scope_village__isnull=True))

        # Cursor Filtering
        if since_cursor and ':' in str(since_cursor):
            try:
                parts = str(since_cursor).rsplit(':', 1)
                cursor_dt = parse_datetime(parts[0])
                cursor_id = int(parts[1])
                if cursor_dt:
                    qs = qs.filter(
                        Q(created_at__gt=cursor_dt) |
                        (Q(created_at=cursor_dt) & Q(id__gt=cursor_id))
                    )
            except (ValueError, TypeError):
                # Fallback to datetime-only parse if ID parsing fails
                cursor_dt = parse_datetime(str(since_cursor))
                if cursor_dt:
                    qs = qs.filter(created_at__gt=cursor_dt)

        qs = qs.order_by('created_at', 'id')
        items = list(qs[:limit + 1])
        has_more = len(items) > limit
        page_items = items[:limit]

        changes = []
        for item in page_items:
            changes.append({
                "change_id": item.id,
                "cursor": item.cursor(),
                "entity_type": item.entity_type,
                "entity_id": item.entity_id,
                "version": item.version,
                "action": item.action,
                "scope": {
                    "district": item.scope_district,
                    "taluk": item.scope_taluk,
                    "village": item.scope_village,
                },
                "payload": item.payload,
                "timestamp": item.created_at.isoformat(),
            })

        next_cursor = page_items[-1].cursor() if page_items else since_cursor

        return {
            "changes": changes,
            "next_cursor": next_cursor,
            "has_more": has_more,
            "count": len(changes),
            "safe_horizon_timestamp": safe_horizon_dt.isoformat(),
        }
