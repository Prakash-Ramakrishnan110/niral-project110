import os
import tempfile
import csv
from django.test import TestCase
from core.services.satellite_feasibility_kit import SatelliteFeasibilityKit


class SatelliteFeasibilityKitTests(TestCase):
    """
    Automated test suite for Satellite Encroachment Detection Feasibility Test Kit.
    Verifies mathematical index calculation, change detection thresholds,
    cloud-gap statistics, and precision/recall evaluation.
    """

    def setUp(self):
        self.kit = SatelliteFeasibilityKit()

    def test_spectral_indices_computation(self):
        """Verifies mathematical correctness of NDVI, NDBI, and NDWI."""
        # Pure vegetation pixel: Red=0.04, NIR=0.36, Green=0.08, SWIR=0.12
        indices = self.kit.compute_spectral_indices(
            b3_green=0.08,
            b4_red=0.04,
            b8_nir=0.36,
            b11_swir=0.12,
        )
        # NDVI = (0.36 - 0.04) / (0.36 + 0.04) = 0.32 / 0.40 = 0.80
        self.assertAlmostEqual(indices['ndvi'], 0.80, places=2)
        # NDBI = (0.12 - 0.36) / (0.12 + 0.36) = -0.24 / 0.48 = -0.50
        self.assertAlmostEqual(indices['ndbi'], -0.50, places=2)
        # NDWI = (0.08 - 0.36) / (0.08 + 0.36) = -0.28 / 0.44 = -0.636
        self.assertAlmostEqual(indices['ndwi'], -0.6364, places=2)

    def test_detect_change_encroachment_signature(self):
        """Verifies detection when built-up signature (high NDBI, vegetation drop) occurs."""
        before = {'ndvi': 0.65, 'ndbi': -0.30, 'ndwi': -0.40}
        # Post-construction: concrete slab / tin shed built
        after = {'ndvi': 0.15, 'ndbi': 0.18, 'ndwi': -0.20}

        is_changed, score, deltas = self.kit.detect_change(before, after)
        self.assertTrue(is_changed)
        self.assertGreater(deltas['delta_ndbi'], 0.12)
        self.assertLess(deltas['delta_ndvi'], -0.10)
        self.assertGreater(score, 0.70)

    def test_detect_change_stable_baseline(self):
        """Verifies no change is detected when spectral profile is stable."""
        before = {'ndvi': 0.45, 'ndbi': -0.15, 'ndwi': -0.30}
        after = {'ndvi': 0.44, 'ndbi': -0.14, 'ndwi': -0.31}

        is_changed, score, deltas = self.kit.detect_change(before, after)
        self.assertFalse(is_changed)
        self.assertLess(deltas['delta_ndbi'], 0.05)

    def test_evaluate_sites_metrics_and_cloud_gaps(self):
        """Tests end-to-end evaluation with mixed changed/unchanged sites."""
        sites = [
            {
                'site_id': 'SALEM-VAL-01',
                'lat': 11.664,
                'lon': 78.145,
                'date_first_seen': '2026-08-15',
                'label': 'changed',
                'area_sqm': 450.0,
                'cloud_gap_days': 12,
            },
            {
                'site_id': 'SALEM-VAL-02',
                'lat': 11.670,
                'lon': 78.150,
                'date_first_seen': '2026-09-01',
                'label': 'changed',
                'area_sqm': 180.0,  # Smaller site
                'cloud_gap_days': 20,  # Monsoon cloud gap > 15 days
            },
            {
                'site_id': 'SALEM-VAL-03',
                'lat': 11.680,
                'lon': 78.160,
                'date_first_seen': '2026-09-10',
                'label': 'unchanged',
                'area_sqm': 0.0,
                'cloud_gap_days': 8,
            },
            {
                'site_id': 'SALEM-VAL-04',
                'lat': 11.690,
                'lon': 78.170,
                'date_first_seen': '2026-09-20',
                'label': 'unchanged',
                'area_sqm': 0.0,
                'cloud_gap_days': 14,
            },
        ]

        result = self.kit.evaluate_sites(sites)
        summary = result['summary']
        cloud_stats = result['cloud_gap_statistics']

        self.assertEqual(summary['total_sites_evaluated'], 4)
        self.assertEqual(summary['true_positives'], 2)
        self.assertEqual(summary['true_negatives'], 2)
        self.assertEqual(summary['false_positives'], 0)
        self.assertEqual(summary['false_negatives'], 0)
        self.assertEqual(summary['precision'], 1.0)
        self.assertEqual(summary['recall'], 1.0)
        self.assertEqual(summary['f1_score'], 1.0)
        self.assertEqual(summary['smallest_detectable_area_sqm'], 180.0)

        # Cloud gap statistics
        self.assertEqual(cloud_stats['max_gap_days'], 20)
        self.assertEqual(cloud_stats['sites_with_gap_over_15_days'], 1)
        self.assertEqual(cloud_stats['pct_sites_with_gap_over_15_days'], 25.0)

    def test_evaluate_csv_file_ingestion(self):
        """Verifies evaluation from a temporary physical CSV file."""
        with tempfile.NamedTemporaryFile('w', suffix='.csv', delete=False, newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['site_id', 'lat', 'lon', 'date_first_seen', 'label', 'area_sqm', 'cloud_gap_days'])
            writer.writerow(['SITE-T1', '11.65', '78.14', '2026-07-01', 'changed', '320', '9'])
            writer.writerow(['SITE-T2', '11.66', '78.15', '2026-07-15', 'unchanged', '0', '11'])
            tmp_csv = f.name

        try:
            res = self.kit.evaluate_csv(tmp_csv)
            self.assertEqual(res['summary']['total_sites_evaluated'], 2)
            self.assertEqual(res['summary']['true_positives'], 1)
            self.assertEqual(res['summary']['true_negatives'], 1)
            self.assertEqual(res['summary']['smallest_detectable_area_sqm'], 320.0)
        finally:
            if os.path.exists(tmp_csv):
                os.remove(tmp_csv)
