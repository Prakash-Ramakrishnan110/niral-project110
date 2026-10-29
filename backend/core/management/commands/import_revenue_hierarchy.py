import json
import os
from django.core.management.base import BaseCommand
from django.db import transaction
from core.models import District, RevenueDivision, Taluk, Firka, RevenueVillage, DistrictAdjacency


class Command(BaseCommand):
    help = "Import Revenue Department Hierarchy (Revenue Divisions, Firkas, and District Adjacency)"

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            default=None,
            help="Path to revenue_tamil_nilam.json"
        )
        parser.add_argument(
            '--adjacency-file',
            type=str,
            default=None,
            help="Path to district_adjacency.json"
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help="Simulate import without committing changes to database"
        )

    def handle(self, *args, **options):
        file_path = options.get('file')
        adj_path = options.get('adjacency_file')
        dry_run = options.get('dry_run', False)

        if not file_path:
            candidates = [
                '/app/data/revenue_tamil_nilam.json',
                '/app/data/jurisdiction/revenue_tamil_nilam.json',
                os.path.join(os.path.dirname(__file__), '../../../data/revenue_tamil_nilam.json'),
                'backend/data/revenue_tamil_nilam.json',
                'data/jurisdiction/revenue_tamil_nilam.json',
            ]
            for c in candidates:
                if os.path.exists(c):
                    file_path = os.path.abspath(c)
                    break

        if not adj_path:
            candidates_adj = [
                '/app/data/district_adjacency.json',
                '/app/data/jurisdiction/district_adjacency.json',
                os.path.join(os.path.dirname(__file__), '../../../data/district_adjacency.json'),
                'backend/data/district_adjacency.json',
                'data/jurisdiction/district_adjacency.json',
            ]
            for c in candidates_adj:
                if os.path.exists(c):
                    adj_path = os.path.abspath(c)
                    break

        if not file_path or not os.path.exists(file_path):
            self.stderr.write(self.style.ERROR(f"Revenue data file not found at: {file_path}"))
            return

        self.stdout.write(f"Reading Revenue hierarchy from: {file_path}")
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        divisions_data = data.get('revenue_divisions', [])
        firkas_data = data.get('firkas', [])

        stats = {
            'divisions': 0,
            'firkas': 0,
            'village_links': 0,
            'adjacencies': 0,
            'errors': []
        }

        try:
            with transaction.atomic():
                # 1. Revenue Divisions
                div_map = {}
                for div in divisions_data:
                    dist_code = div.get('district_code')
                    div_code = div.get('code')
                    if not dist_code or not div_code:
                        stats['errors'].append(f"Missing district or division code in {div}")
                        continue

                    dist_obj = District.objects.filter(code=dist_code).first()
                    if not dist_obj:
                        stats['errors'].append(f"District {dist_code} not found for division {div_code}")
                        continue

                    if not dry_run:
                        div_obj, _ = RevenueDivision.objects.update_or_create(
                            code=div_code,
                            defaults={
                                'district': dist_obj,
                                'name_en': div.get('name_en'),
                                'name_ta': div.get('name_ta'),
                            }
                        )
                        div_map[div_code] = div_obj

                        # Link taluks to division
                        taluk_codes = div.get('taluk_codes', [])
                        Taluk.objects.filter(code__in=taluk_codes).update(revenue_division=div_obj)
                    stats['divisions'] += 1

                # 2. Firkas & Village Linkage
                for firka in firkas_data:
                    t_code = firka.get('taluk_code')
                    f_code = firka.get('code')
                    if not t_code or not f_code:
                        stats['errors'].append(f"Missing taluk or firka code in {firka}")
                        continue

                    taluk_obj = Taluk.objects.filter(code=t_code).first()
                    if not taluk_obj:
                        stats['errors'].append(f"Taluk {t_code} not found for firka {f_code}")
                        continue

                    if not dry_run:
                        firka_obj, _ = Firka.objects.update_or_create(
                            code=f_code,
                            defaults={
                                'taluk': taluk_obj,
                                'name_en': firka.get('name_en'),
                                'name_ta': firka.get('name_ta'),
                            }
                        )

                        # Link revenue villages to firka
                        v_codes = firka.get('village_codes', [])
                        updated = RevenueVillage.objects.filter(code__in=v_codes).update(firka=firka_obj)
                        stats['village_links'] += updated
                    stats['firkas'] += 1

                # 3. District Adjacencies
                if adj_path and os.path.exists(adj_path):
                    with open(adj_path, 'r', encoding='utf-8') as f:
                        adj_list = json.load(f)
                    for pair in adj_list:
                        d1_name = pair.get('district')
                        d2_name = pair.get('adjacent')
                        d1 = District.objects.filter(name_en__iexact=d1_name).first()
                        d2 = District.objects.filter(name_en__iexact=d2_name).first()
                        if not d1 or not d2:
                            stats['errors'].append(f"District adjacency pair {d1_name} <-> {d2_name} unresolvable.")
                            continue
                        if not dry_run:
                            # Bidirectional adjacency
                            DistrictAdjacency.objects.get_or_create(district=d1, adjacent_district=d2)
                            DistrictAdjacency.objects.get_or_create(district=d2, adjacent_district=d1)
                        stats['adjacencies'] += 1

                if dry_run:
                    self.stdout.write(self.style.WARNING("[DRY RUN] Rolled back all changes."))
                    transaction.set_rollback(True)

        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Revenue import failed: {e}"))
            raise

        mode_str = "[DRY-RUN SIMULATION]" if dry_run else "[COMMITTED]"
        self.stdout.write(self.style.SUCCESS(
            f"{mode_str} Revenue Hierarchy Import Summary:\n"
            f"  - Revenue Divisions: {stats['divisions']}\n"
            f"  - Firkas:            {stats['firkas']}\n"
            f"  - Village Links:     {stats['village_links']}\n"
            f"  - Adjacency Pairs:   {stats['adjacencies']}\n"
            f"  - Errors:            {len(stats['errors'])}"
        ))
        if stats['errors']:
            for err in stats['errors'][:10]:
                self.stderr.write(self.style.WARNING(f"    * {err}"))
