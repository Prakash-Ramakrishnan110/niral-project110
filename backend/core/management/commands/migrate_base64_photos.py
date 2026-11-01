import base64
import os
import re
from django.core.management.base import BaseCommand
from core.models import FieldVerification
from core.services.evidence_storage import EvidenceStorageService


class Command(BaseCommand):
    help = 'Scans FieldVerification records, migrates legacy base64 photos to object storage, and updates photo references.'

    def add_arguments(self, parser):
        parser.add_arguments_or_flags = getattr(parser, 'add_argument')
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simulate migration and report base64 photos without modifying records.',
        )
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Explicit authorization flag required to commit photo migration writes to the database.',
        )

    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)
        confirm = options.get('confirm', False)

        if not dry_run and not confirm:
            self.stdout.write(self.style.ERROR(
                "SAFETY STOP: Photo migration requires either --dry-run or --confirm.\n"
                "To preview changes safely: python manage.py migrate_base64_photos --dry-run\n"
                "To execute with explicit approval: python manage.py migrate_base64_photos --confirm"
            ))
            return

        self.stdout.write(self.style.NOTICE(
            f"Scanning FieldVerification records for legacy base64 photos (Mode: {'DRY RUN' if dry_run else 'LIVE MIGRATE'})..."
        ))

        verifications = FieldVerification.objects.exclude(photos=[]).exclude(photos=None)
        total_scanned = verifications.count()
        migrated_verifications = 0
        total_photos_migrated = 0

        for fv in verifications:
            photos = fv.photos or []
            new_photos = []
            modified = False

            for idx, p in enumerate(photos):
                photo_str = str(p).strip()
                if photo_str.startswith('data:image') or ';base64,' in photo_str or len(photo_str) > 500:
                    try:
                        # Extract base64 payload
                        if ';base64,' in photo_str:
                            b64_payload = photo_str.split(';base64,')[1]
                        elif photo_str.startswith('data:image'):
                            b64_payload = photo_str.split(',', 1)[1]
                        else:
                            b64_payload = photo_str

                        # Clean whitespace and decode
                        cleaned_b64 = re.sub(r'\s+', '', b64_payload)
                        image_bytes = base64.b64decode(cleaned_b64)

                        object_key = EvidenceStorageService.generate_object_key(
                            alert_id=fv.alert_id,
                            filename=f"legacy_migrated_{idx}.jpg"
                        )

                        if not dry_run:
                            EvidenceStorageService.save_local_binary(object_key, image_bytes)

                        new_photos.append(object_key)
                        modified = True
                        total_photos_migrated += 1
                    except Exception as e:
                        self.stdout.write(self.style.WARNING(
                            f"  [Warning] Failed to decode photo {idx} on verification {fv.id}: {e}. Retaining original."
                        ))
                        new_photos.append(photo_str)
                else:
                    new_photos.append(photo_str)

            if modified:
                migrated_verifications += 1
                if not dry_run:
                    fv.photos = new_photos
                    fv.save(update_fields=['photos'])
                self.stdout.write(
                    f"  {'[Plan]' if dry_run else '[Migrated]'} Verification {fv.id}: {len(photos)} photos -> object storage keys."
                )

        self.stdout.write(self.style.SUCCESS(
            f"\nMigration Summary:\n"
            f"  Total records scanned: {total_scanned}\n"
            f"  Verifications needing migration: {migrated_verifications}\n"
            f"  Total base64 photos migrated: {total_photos_migrated}\n"
            f"  Mode: {'SIMULATION ONLY (No writes committed)' if dry_run else 'COMMITTED TO DATABASE'}"
        ))
