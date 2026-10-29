import json
from django.core.management.base import BaseCommand
from django.db.models import Count
from core.models import EncroachmentAlert
from core.services.case_state_machine import CaseStateMachine


class Command(BaseCommand):
    help = "Read-only dry-run report for migrating legacy alert statuses to canonical state machine states."

    # Explicit Canonical Mapping
    STATUS_MAP = {
        'Pending': CaseStateMachine.STATE_TRIAGE_LEGACY,
        'TAHSILDAR_ACCEPTED': CaseStateMachine.STATE_TAHSILDAR_ACCEPTED_LEGACY,
        'VAO_ASSIGNED': CaseStateMachine.STATE_VAO_ASSIGNED_LEGACY,
        'COLLECTOR_ACCEPTED': CaseStateMachine.STATE_COLLECTOR_ACCEPTED_LEGACY,
        'NEW': CaseStateMachine.STATE_NEW,
        'In-Verification': CaseStateMachine.STATE_IN_FIELD_VERIFICATION,
        'Confirmed': CaseStateMachine.STATE_VAO_SUBMITTED,
        'False-Positive': CaseStateMachine.STATE_FALSE_POSITIVE_CLAIMED,
        'Resolved': CaseStateMachine.STATE_TEMPORARY_OCCUPANCY_RESOLVED,
    }

    def add_arguments(self, parser):
        parser.add_argument(
            '--apply',
            action='store_true',
            help='Apply the migration (BLOCKED unless explicitly specified after dry-run approval).'
        )
        parser.add_argument(
            '--format',
            choices=['text', 'json'],
            default='text',
            help='Output format (text or json).'
        )

    def handle(self, *args, **options):
        apply_mode = options.get('apply', False)
        output_format = options.get('format', 'text')

        total_alerts = EncroachmentAlert.objects.count()
        status_counts = list(
            EncroachmentAlert.objects.values('status')
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        unmapped = []
        mapping_plan = []

        for item in status_counts:
            cur_status = item['status']
            count = item['count']
            pct = (count / total_alerts * 100) if total_alerts else 0

            target = self.STATUS_MAP.get(cur_status)
            if target:
                mapping_plan.append({
                    'current_status': cur_status,
                    'count': count,
                    'percentage': round(pct, 1),
                    'target_status': target,
                    'approver_unverified': target.endswith('_LEGACY') or cur_status != 'NEW',
                    'next_valid_states': CaseStateMachine.VALID_TRANSITIONS.get(target, []),
                })
            else:
                unmapped.append({
                    'current_status': cur_status,
                    'count': count,
                    'percentage': round(pct, 1),
                })

        # Sample rows for demonstration
        sample_rows = []
        for plan in mapping_plan:
            samples = list(
                EncroachmentAlert.objects.filter(status=plan['current_status'])
                .select_related('parcel')
                .values('id', 'status', 'tier', 'parcel__survey_number', 'parcel__village_name', 'parcel__taluk')[:2]
            )
            for s in samples:
                sample_rows.append({
                    'id': str(s['id']),
                    'survey_number': s.get('parcel__survey_number') or 'N/A',
                    'village': s.get('parcel__village_name') or 'N/A',
                    'taluk': s.get('parcel__taluk') or 'N/A',
                    'tier': s.get('tier') or 'N/A',
                    'current_status': s['status'],
                    'proposed_target': plan['target_status'],
                    'proposed_approver_unverified': plan['approver_unverified'],
                    'proposed_legacy_status': s['status'],
                })

        report_data = {
            'total_alerts': total_alerts,
            'mapping_plan': mapping_plan,
            'unmapped_count': len(unmapped),
            'unmapped_statuses': unmapped,
            'sample_rows': sample_rows,
            'read_only_dry_run': not apply_mode,
        }

        if output_format == 'json':
            self.stdout.write(json.dumps(report_data, indent=2))
            return

        # Text Output
        self.stdout.write("=" * 80)
        self.stdout.write("GEOMMAND: LEGACY ALERT STATUS MIGRATION DRY-RUN REPORT")
        self.stdout.write("=" * 80)
        self.stdout.write(f"Total Encroachment Alerts in Database: {total_alerts}")
        self.stdout.write(f"Mode: {'EXECUTE MIGRATION' if apply_mode else 'READ-ONLY DRY RUN (No database rows modified)'}")
        self.stdout.write("-" * 80)
        self.stdout.write(f"{'CURRENT STATUS':<24} {'COUNT':>6} {'%':>6}  -->  {'TARGET STATE':<28} {'UNVERIFIED'}")
        self.stdout.write("-" * 80)

        for p in mapping_plan:
            unv_str = "YES (approver_unverified=True)" if p['approver_unverified'] else "NO (canonical)"
            self.stdout.write(
                f"{p['current_status']:<24} {p['count']:>6} {p['percentage']:>5.1f}%  -->  {p['target_status']:<28} {unv_str}"
            )

        if unmapped:
            self.stdout.write("\n" + "!" * 80)
            self.stdout.write(f"CRITICAL WARNING: {len(unmapped)} unmapped statuses found!")
            for u in unmapped:
                self.stdout.write(f"  * {u['current_status']}: {u['count']} alerts ({u['percentage']}%)")
            self.stdout.write("!" * 80)
        else:
            self.stdout.write("\n" + self.style.SUCCESS("[OK] 100% of alerts mapped cleanly to canonical / legacy states."))

        self.stdout.write("\n" + "-" * 80)
        self.stdout.write("SAMPLE ROW TRANSFORMATIONS:")
        self.stdout.write("-" * 80)
        for s in sample_rows:
            self.stdout.write(
                f"  Alert {s['id'][:8]}.. | Survey {s['survey_number']} ({s['village']}, {s['taluk']}) | {s['tier']}\n"
                f"    Old Status: '{s['current_status']}'\n"
                f"    -> New Status: '{s['proposed_target']}'\n"
                f"    -> legacy_status: '{s['proposed_legacy_status']}'\n"
                f"    -> approver_unverified: {s['proposed_approver_unverified']}\n"
            )

        self.stdout.write("-" * 80)
        self.stdout.write("STATE TRANSITION CAPABILITIES POST-MIGRATION:")
        self.stdout.write("-" * 80)
        for p in mapping_plan:
            valid_next = p['next_valid_states']
            next_str = ", ".join(valid_next[:4])
            if len(valid_next) > 4:
                next_str += f" (+{len(valid_next)-4} more)"
            self.stdout.write(f"  {p['target_status']}:\n    Allowed Next Transitions: [{next_str}]")

        self.stdout.write("\n" + "=" * 80)
        if not apply_mode:
            self.stdout.write(
                self.style.WARNING(
                    "READ-ONLY VERIFICATION COMPLETE.\n"
                    "Zero alerts were mutated in the database.\n"
                    "Awaiting explicit user approval before applying migration."
                )
            )
        else:
            self.stdout.write("Applying migration to database rows...")
            updated_total = 0
            for plan in mapping_plan:
                cnt = EncroachmentAlert.objects.filter(status=plan['current_status']).update(
                    legacy_status=plan['current_status'],
                    approver_unverified=plan['approver_unverified'],
                    status=plan['target_status'],
                )
                updated_total += cnt
                self.stdout.write(f"  Updated {cnt} alerts: {plan['current_status']} -> {plan['target_status']}")

            self.stdout.write(self.style.SUCCESS(f"Migration completed successfully. {updated_total} alerts updated."))
        self.stdout.write("=" * 80)
