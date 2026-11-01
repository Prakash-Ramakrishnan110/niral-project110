import os
import json
from django.core.management.base import BaseCommand, CommandError
from core.services.satellite_feasibility_kit import SatelliteFeasibilityKit


class Command(BaseCommand):
    help = (
        "Runs the Satellite Encroachment Detection Feasibility Test Kit on a ground-truth CSV. "
        "Calculates precision, recall, smallest detectable area (sqm), and cloud-gap statistics."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--csv',
            type=str,
            required=True,
            help="Path to the ground-truth validation CSV (site_id, lat, lon, date_first_seen, label, [area_sqm])",
        )
        parser.add_argument(
            '--output',
            type=str,
            default=None,
            help="Optional path to output the evaluation report as a JSON file.",
        )
        parser.add_argument(
            '--fixtures',
            type=str,
            default=None,
            help="Optional path to offline fixture directory containing per-site JSON scenes.",
        )

    def handle(self, *args, **options):
        csv_path = options['csv']
        out_path = options.get('output')
        fixture_dir = options.get('fixtures')

        if not os.path.exists(csv_path):
            raise CommandError(f"Validation CSV file does not exist: {csv_path}")

        kit = SatelliteFeasibilityKit(offline_fixture_dir=fixture_dir)
        self.stdout.write(self.style.NOTICE(f"[START] Evaluating satellite feasibility on: {csv_path}"))

        try:
            report = kit.evaluate_csv(csv_path)
        except Exception as e:
            raise CommandError(f"Feasibility evaluation failed: {e}")

        summary = report['summary']
        cloud = report['cloud_gap_statistics']

        self.stdout.write(self.style.SUCCESS("\n" + "=" * 75))
        self.stdout.write(self.style.SUCCESS("  SATELLITE CHANGE DETECTION FEASIBILITY BENCHMARK REPORT"))
        self.stdout.write(self.style.SUCCESS("=" * 75))
        self.stdout.write(f"  Total Ground-Truth Sites : {summary['total_sites_evaluated']}")
        self.stdout.write(f"  True Positives (TP)      : {summary['true_positives']}")
        self.stdout.write(f"  False Positives (FP)     : {summary['false_positives']}")
        self.stdout.write(f"  True Negatives (TN)      : {summary['true_negatives']}")
        self.stdout.write(f"  False Negatives (FN)     : {summary['false_negatives']}")
        self.stdout.write("-" * 75)
        self.stdout.write(f"  Precision                : {summary['precision'] * 100:.1f}%")
        self.stdout.write(f"  Recall                   : {summary['recall'] * 100:.1f}%")
        self.stdout.write(f"  F1 Score                 : {summary['f1_score']:.4f}")
        self.stdout.write(f"  Smallest Detectable Area : {summary['smallest_detectable_area_sqm']} sq.m")
        self.stdout.write("-" * 75)
        self.stdout.write(f"  Mean Cloud Gap           : {cloud['mean_gap_days']:.1f} days")
        self.stdout.write(f"  Max Cloud Gap            : {cloud['max_gap_days']} days")
        self.stdout.write(f"  Sites with Gap > 15 Days : {cloud['sites_with_gap_over_15_days']} ({cloud['pct_sites_with_gap_over_15_days']}%)")
        self.stdout.write(self.style.SUCCESS("=" * 75 + "\n"))

        if out_path:
            with open(out_path, 'w', encoding='utf-8') as f:
                json.dump(report, f, indent=2)
            self.stdout.write(self.style.SUCCESS(f"Saved full JSON evaluation report to: {out_path}"))
