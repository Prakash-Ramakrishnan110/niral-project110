import json
import hashlib
from typing import Callable, Any
from django.db import transaction
from core.models import IdempotencyKeyRecord


def compute_request_hash(payload: Any) -> str:
    """Computes SHA-256 fingerprint of request payload for collision detection."""
    try:
        norm = json.dumps(payload, sort_keys=True, default=str)
    except Exception:
        norm = str(payload)
    return hashlib.sha256(norm.encode('utf-8')).hexdigest()


def handle_idempotent_request(
    key: str,
    endpoint: str,
    user,
    payload: Any,
    execute_func: Callable[[], tuple[int, dict]]
) -> tuple[int, dict, bool]:
    """
    Guarantees network idempotency for field submissions and state transitions (Section 8).
    - If key was previously processed with identical payload: returns cached response (is_cached=True).
    - If key collides with different payload: returns 422 Unprocessable Entity.
    - If new key: executes function atomically, caches result, and returns (is_cached=False).
    """
    if not key or not str(key).strip():
        # No idempotency key provided; proceed with normal execution
        status_code, response_data = execute_func()
        return status_code, response_data, False

    clean_key = str(key).strip()
    req_hash = compute_request_hash(payload)

    # 1. Check existing record
    existing = IdempotencyKeyRecord.objects.filter(key=clean_key).first()
    if existing:
        if existing.request_hash and existing.request_hash != req_hash:
            return 422, {
                "error": "Idempotency Conflict: Key has already been used with a different request payload.",
                "idempotency_key": clean_key,
            }, False
        return existing.response_status, existing.response_body, True

    # 2. Execute within transaction and record key
    with transaction.atomic():
        status_code, response_data = execute_func()
        # Only cache 2xx/3xx/4xx business responses; do not cache 5xx server crashes
        if status_code < 500:
            IdempotencyKeyRecord.objects.create(
                key=clean_key,
                user=user if (user and user.is_authenticated) else None,
                endpoint=endpoint,
                request_hash=req_hash,
                response_status=status_code,
                response_body=response_data if isinstance(response_data, dict) else {"result": response_data},
            )

    return status_code, response_data, False
