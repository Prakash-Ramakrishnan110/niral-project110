import json
import os
from django.core.management.base import BaseCommand
from django.db import transaction
from core.models import State, District, Taluk, RevenueVillage


class Command(BaseCommand):
    help = "Import LGD Administrative Hierarchy (State, District, Taluk, Revenue Village)"

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            default=None,
            help="Path to lgd_tamil_nadu.json"
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help="Simulate import without committing changes to database"
        )

    def handle(self, *args, **options):
        file_path = options.get('file')
        dry_run = options.get('dry_run', False)

        if not file_path:
            # Look in standard repo locations
            candidates = [
                '/app/data/lgd_tamil_nadu.json',
                '/app/data/jurisdiction/lgd_tamil_nadu.json',
                os.path.join(os.path.dirname(__file__), '../../../data/lgd_tamil_nadu.json'),
                'backend/data/lgd_tamil_nadu.json',
                'data/jurisdiction/lgd_tamil_nadu.json',
            ]
            for c in candidates:
                if os.path.exists(c):
                    file_path = os.path.abspath(c)
                    break

        if not file_path or not os.path.exists(file_path):
            self.stderr.write(self.style.ERROR(f"LGD data file not found at: {file_path}"))
            return

        self.stdout.write(f"Reading LGD hierarchy from: {file_path}")
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        state_data = data.get('state', {})
        districts_data = data.get('districts', [])
        taluks_data = data.get('taluks', [])
        villages_data = data.get('villages', [])

        stats = {
            'states': 0,
            'districts': 0,
            'taluks': 0,
            'villages': 0,
            'errors': []
        }

        try:
            with transaction.atomic():
                # 1. State
                st_code = state_data.get('code')
                if not st_code:
                    stats['errors'].append("State code missing.")
                else:
                    if not dry_run:
                        state_obj, _ = State.objects.update_or_create(
                            code=st_code,
                            defaults={
                                'lgd_code': state_data.get('lgd_code'),
                                'name_en': state_data.get('name_en'),
                                'name_ta': state_data.get('name_ta'),
                            }
                        )
                    stats['states'] += 1

                # 2. Districts
                district_map = {}
                for d in districts_data:
                    code = d.get('code')
                    if not code:
                        stats['errors'].append(f"District code missing for {d}")
                        continue
                    if not dry_run:
                        dist_obj, _ = District.objects.update_or_create(
                            code=code,
                            defaults={
                                'state': state_obj,
                                'lgd_code': d.get('lgd_code'),
                                'name_en': d.get('name_en'),
                                'name_ta': d.get('name_ta'),
                            }
                        )
                        district_map[code] = dist_obj
                    stats['districts'] += 1

                # 3. Taluks
                taluk_map = {}
                for t in taluks_data:
                    dist_code = t.get('district_code')
                    t_code = t.get('code')
                    if not dist_code or not t_code:
                        stats['errors'].append(f"Missing district or taluk code for {t}")
                        continue
                    if not dry_run:
                        dist_obj = district_map.get(dist_code) or District.objects.filter(code=dist_code).first()
                        if not dist_obj:
                            stats['errors'].append(f"District {dist_code} not found for taluk {t_code}")
                            continue
                        taluk_obj, _ = Taluk.objects.update_or_create(
                            code=t_code,
                            defaults={
                                'district': dist_obj,
                                'lgd_code': t.get('lgd_code'),
                                'name_en': t.get('name_en'),
                                'name_ta': t.get('name_ta'),
                            }
                        )
                        taluk_map[t_code] = taluk_obj
                    stats['taluks'] += 1

                # 4. Villages
                for v in villages_data:
                    t_code = v.get('taluk_code')
                    v_code = v.get('code')
                    if not t_code or not v_code:
                        stats['errors'].append(f"Missing taluk or village code for {v}")
                        continue
                    if not dry_run:
                        taluk_obj = taluk_map.get(t_code) or Taluk.objects.filter(code=t_code).first()
                        if not taluk_obj:
                            stats['errors'].append(f"Taluk {t_code} not found for village {v_code}")
                            continue
                        RevenueVillage.objects.update_or_create(
                            code=v_code,
                            defaults={
                                'district': taluk_obj.district,
                                'taluk': taluk_obj,
                                'lgd_code': v.get('lgd_code'),
                                'name_en': v.get('name_en'),
                                'name_ta': v.get('name_ta'),
                            }
                        )
                    stats['villages'] += 1

                if dry_run:
                    self.stdout.write(self.style.WARNING("[DRY RUN] Rolled back all changes."))
                    transaction.set_rollback(True)

        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Import failed: {e}"))
            raise

        mode_str = "[DRY-RUN SIMULATION]" if dry_run else "[COMMITTED]"
        self.stdout.write(self.style.SUCCESS(
            f"{mode_str} LGD Hierarchy Import Summary:\n"
            f"  - States:    {stats['states']}\n"
            f"  - Districts: {stats['districts']}\n"
            f"  - Taluks:    {stats['taluks']}\n"
            f"  - Villages:  {stats['villages']}\n"
            f"  - Errors:    {len(stats['errors'])}"
        ))
        if stats['errors']:
            for err in stats['errors'][:10]:
                self.stderr.write(self.style.WARNING(f"    * {err}"))
