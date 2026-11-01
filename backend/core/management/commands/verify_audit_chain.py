import sys
from django.core.management.base import BaseCommand, CommandError
from core.models import CaseAuditEvent, EncroachmentAlert


class Command(BaseCommand):
    help = "Cryptographically verifies the SHA-256 hash chain across all CaseAuditEvent records for tamper detection."

    def add_arguments(self, parser):
        parser.add_argument('--alert-id', type=str, help="Verify audit chain for a specific EncroachmentAlert UUID")

    def handle(self, *args, **options):
        alert_id = options.get('alert_id')
        alerts_qs = EncroachmentAlert.objects.all()
        if alert_id:
            alerts_qs = alerts_qs.filter(id=alert_id)

        total_events = 0
        total_cases = 0
        violations = []

        for alert in alerts_qs:
            events = list(CaseAuditEvent.objects.filter(alert=alert).order_by('created_at', 'id'))
            if not events:
                continue

            total_cases += 1
            expected_prev_hash = '0' * 64

            for idx, event in enumerate(events):
                total_events += 1
                stored_prev = event.previous_event_hash
                stored_curr = event.current_hash

                # 1. Check backward linkage
                if stored_prev != expected_prev_hash:
                    violations.append({
                        'alert_id': str(alert.id),
                        'event_id': str(event.id),
                        'step': idx,
                        'error': f"Hash chain linkage broken: expected prev_hash {expected_prev_hash}, found {stored_prev}"
                    })

                # 2. Recompute and check payload integrity
                computed_curr = event.compute_event_hash(stored_prev)
                if stored_curr != computed_curr:
                    violations.append({
                        'alert_id': str(alert.id),
                        'event_id': str(event.id),
                        'step': idx,
                        'error': f"Tamper detected: computed hash {computed_curr} does not match stored hash {stored_curr}"
                    })

                expected_prev_hash = stored_curr

        if violations:
            self.stderr.write(self.style.ERROR(f"FAILED: {len(violations)} tamper violation(s) detected across {total_events} events!"))
            for v in violations:
                self.stderr.write(self.style.ERROR(f"  Alert {v['alert_id']} [Step {v['step']}, Event {v['event_id']}]: {v['error']}"))
            raise CommandError(f"Audit chain verification failed with {len(violations)} violation(s).")

        self.stdout.write(self.style.SUCCESS(
            f"OK: Verified {total_events} audit events across {total_cases} cases. "
            f"Cryptographic SHA-256 hash chain is 100% valid (0 tamper violations)."
        ))

