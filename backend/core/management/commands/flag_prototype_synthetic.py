from django.core.management.base import BaseCommand, CommandError
from core.models import EncroachmentAlert


class Command(BaseCommand):
    help = 'One-off management command to safely flag all prototype alerts as synthetic.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm execution of synthetic flag update.'
        )
        parser.add_argument(
            '--expected-count',
            type=int,
            required=True,
            help='Exact number of alerts expected to be flagged.'
        )

    def handle(self, *args, **options):
        confirm = options['confirm']
        expected_count = options['expected_count']

        total_alerts = EncroachmentAlert.objects.count()
        already_flagged = EncroachmentAlert.objects.filter(is_synthetic=True).count()

        if already_flagged > 0:
            raise CommandError(
                f"[ABORTED] Safety guard tripped: {already_flagged} alerts are already flagged as synthetic."
            )

        if total_alerts != expected_count:
            raise CommandError(
                f"[ABORTED] Count mismatch: expected {expected_count} alerts, but database contains {total_alerts}."
            )

        if not confirm:
            self.stdout.write(
                self.style.WARNING(
                    f"[DRY RUN] Found exactly {total_alerts} alerts ready to be flagged. "
                    "Re-run with --confirm to apply."
                )
            )
            return

        updated = EncroachmentAlert.objects.filter(is_synthetic=False).update(is_synthetic=True)
        self.stdout.write(
            self.style.SUCCESS(
                f"[SUCCESS] Successfully flagged {updated} prototype alerts as is_synthetic=True."
            )
        )
