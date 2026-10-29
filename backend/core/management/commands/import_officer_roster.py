import csv
import os
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.db import transaction
from core.models import (
    OfficerAssignment,
    District,
    RevenueDivision,
    Taluk,
    Firka,
    RevenueVillage
)


class Command(BaseCommand):
    help = "Bulk import officer assignments from a CSV roster (Part 4.2)"

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            required=True,
            help="Path to CSV roster file"
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help="Simulate import without committing changes to database"
        )

    def handle(self, *args, **options):
        file_path = options['file']
        dry_run = options.get('dry_run', False)

        if not os.path.exists(file_path):
            self.stderr.write(self.style.ERROR(f"Roster file not found: {file_path}"))
            return

        self.stdout.write(f"Reading officer roster from: {file_path}")

        stats = {
            'total_rows': 0,
            'imported': 0,
            'errors': []
        }

        try:
            with transaction.atomic():
                with open(file_path, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    for row_idx, row in enumerate(reader, start=1):
                        stats['total_rows'] += 1
                        username = (row.get('username') or '').strip()
                        role = (row.get('role') or '').strip()
                        if not username or not role:
                            stats['errors'].append(f"Row {row_idx}: Missing username or role")
                            continue

                        # Resolve or create User
                        user, _ = User.objects.get_or_create(
                            username=username,
                            defaults={
                                'email': (row.get('email') or f"{username}@tn.gov.in").strip(),
                                'first_name': (row.get('first_name') or '').strip(),
                                'last_name': (row.get('last_name') or '').strip(),
                            }
                        )

                        # Resolve jurisdiction nodes
                        dist_code = (row.get('district_code') or '').strip()
                        div_code = (row.get('division_code') or '').strip()
                        taluk_code = (row.get('taluk_code') or '').strip()
                        firka_code = (row.get('firka_code') or '').strip()
                        village_code = (row.get('village_code') or '').strip()

                        dist_obj = District.objects.filter(code=dist_code).first() if dist_code else None
                        div_obj = RevenueDivision.objects.filter(code=div_code).first() if div_code else None
                        taluk_obj = Taluk.objects.filter(code=taluk_code).first() if taluk_code else None
                        firka_obj = Firka.objects.filter(code=firka_code).first() if firka_code else None
                        vil_obj = RevenueVillage.objects.filter(code=village_code).first() if village_code else None

                        is_add_chg = (row.get('is_additional_charge') or '').strip().lower() in ('true', '1', 'yes')
                        designation = (row.get('designation') or role.replace('_', ' ').title()).strip()

                        if not dry_run:
                            assignment, _ = OfficerAssignment.objects.update_or_create(
                                user=user,
                                role=role,
                                district=dist_obj,
                                taluk=taluk_obj,
                                village=vil_obj,
                                defaults={
                                    'division': div_obj,
                                    'firka': firka_obj,
                                    'designation': designation,
                                    'is_active': True,
                                    'is_additional_charge': is_add_chg,
                                }
                            )
                        stats['imported'] += 1

                if dry_run:
                    self.stdout.write(self.style.WARNING("[DRY RUN] Rolled back all officer assignment changes."))
                    transaction.set_rollback(True)

        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Officer roster import failed: {e}"))
            raise

        mode_str = "[DRY-RUN SIMULATION]" if dry_run else "[COMMITTED]"
        self.stdout.write(self.style.SUCCESS(
            f"{mode_str} Officer Roster Import Summary:\n"
            f"  - Total Rows Processed: {stats['total_rows']}\n"
            f"  - Successfully Imported: {stats['imported']}\n"
            f"  - Errors:                {len(stats['errors'])}"
        ))
        if stats['errors']:
            for err in stats['errors'][:10]:
                self.stderr.write(self.style.WARNING(f"    * {err}"))

