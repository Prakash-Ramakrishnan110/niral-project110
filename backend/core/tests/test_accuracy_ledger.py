from datetime import timedelta
from django.test import TestCase
from django.utils import timezone
from django.contrib.auth.models import User
from django.contrib.gis.geos import Polygon, Point
from core.models import (
    State,
    District,
    Taluk,
    RevenueVillage,
    LandParcel,
    EncroachmentAlert,
    FieldVerification,
    DistrictLegalConfig,
    OfficerAssignment,
)
from core.services.accuracy_ledger import (
    compute_wilson_ci,
    AccuracyLedgerService,
)


class AccuracyLedgerTests(TestCase):
    def setUp(self):
        # Administrative Hierarchy
        self.state = State.objects.create(code='TN', name_en='Tamil Nadu', name_ta='தமிழ்நாடு')
        self.district = District.objects.create(state=self.state, code='TN-SLM', name_en='Salem', name_ta='சேலம்')
        self.taluk = Taluk.objects.create(district=self.district, code='TN-SLM-SLMW', name_en='Salem West', name_ta='சேலம் மேற்கு')
        self.village = RevenueVillage.objects.create(district=self.district, taluk=self.taluk, code='TN-SLM-SLMW-KNK', name_en='Kannankurichi', name_ta='கண்ணங்குறிச்சி')

        # District Legal Config
        self.config = DistrictLegalConfig.objects.create(
            district='Salem',
            tier1_confidence_min=0.80,
            tier2_confidence_min=0.50,
            min_sample_size_accuracy=30,
            fast_lane_audit_pct=20.0,
            recheck_days_low=30,
        )

        # Land Parcel
        poly = Polygon([
            (78.150, 11.650),
            (78.152, 11.650),
            (78.152, 11.652),
            (78.150, 11.652),
            (78.150, 11.650),
        ], srid=4326)
        self.parcel = LandParcel.objects.create(
            survey_number='101',
            subdivision='1A',
            classification='Waterbody',
            village_code='634001',
            taluk='Salem West',
            district='Salem',
            district_ref=self.district,
            taluk_ref=self.taluk,
            village_ref=self.village,
            geom=poly,
        )

        # User
        self.user = User.objects.create_user(username='test_officer', password='Pass@123Officer!')
        self.assignment = OfficerAssignment.objects.create(
            user=self.user,
            role='VAO',
            district=self.district,
            taluk=self.taluk,
            village=self.village,
            is_active=True
        )

    def test_wilson_score_interval_formula(self):
        """Test mathematical accuracy of Wilson score formula."""
        # Edge case: zero sample
        p, lo, hi = compute_wilson_ci(0, 0)
        self.assertEqual((p, lo, hi), (0.0, 0.0, 0.0))

        # 80 positives out of 100
        p, lo, hi = compute_wilson_ci(80, 100)
        self.assertEqual(round(p, 2), 0.80)
        self.assertAlmostEqual(lo, 0.711, places=2)
        self.assertAlmostEqual(hi, 0.867, places=2)

        # 100% positives (10/10) - must not exceed 1.0
        p, lo, hi = compute_wilson_ci(10, 10)
        self.assertEqual(p, 1.0)
        self.assertLessEqual(hi, 1.0)
        self.assertGreater(lo, 0.65)

    def test_insufficient_data_honesty_guard(self):
        """When n < min_sample_size (30), display must state 'Insufficient data'."""
        pt = Point(78.151, 11.651, srid=4326)

        # Create 5 verifications (well below 30)
        for i in range(5):
            alert = EncroachmentAlert.objects.create(
                parcel=self.parcel,
                alert_geom=pt,
                confidence_score=0.92,
                snapshot_lane='HIGH',
                snapshot_confidence=0.92,
                status='VAO_SUBMITTED',
            )
            FieldVerification.objects.create(
                alert=alert,
                verifier=self.user,
                officer_assignment=self.assignment,
                officer_name='Test Officer',
                verdict='ENCROACHMENT_CONFIRMED',
                gps_lat=11.651,
                gps_lon=78.151,
                snapshot_lane='HIGH',
                snapshot_confidence=0.92,
            )

        summary = AccuracyLedgerService.get_lane_accuracy_summary(district='Salem', min_sample_size=30)
        high_lane = summary['lanes']['HIGH']

        self.assertEqual(high_lane['sample_size_n'], 5)
        self.assertEqual(high_lane['status'], 'INSUFFICIENT_DATA')
        self.assertEqual(high_lane['display_accuracy'], 'Insufficient data')
        self.assertIsNone(high_lane['precision_pct'])
        self.assertIn("statutory threshold of 30", high_lane['note'])

    def test_statistically_valid_accuracy_with_wilson_ci(self):
        """When n >= 30, verified precision and Wilson 95% CI are computed."""
        pt = Point(78.151, 11.651, srid=4326)

        # Create 35 verifications in HIGH lane (28 confirmed, 7 false positives = 80% precision)
        for i in range(35):
            is_confirmed = i < 28
            alert = EncroachmentAlert.objects.create(
                parcel=self.parcel,
                alert_geom=pt,
                confidence_score=0.88,
                snapshot_lane='HIGH',
                snapshot_confidence=0.88,
                status='INSPECTOR_APPROVED',
            )
            FieldVerification.objects.create(
                alert=alert,
                verifier=self.user,
                officer_assignment=self.assignment,
                officer_name='Test Officer',
                verdict='ENCROACHMENT_CONFIRMED' if is_confirmed else 'FALSE_POSITIVE',
                gps_lat=11.651,
                gps_lon=78.151,
                snapshot_lane='HIGH',
                snapshot_confidence=0.88,
            )

        summary = AccuracyLedgerService.get_lane_accuracy_summary(district='Salem', min_sample_size=30)
        high_lane = summary['lanes']['HIGH']

        self.assertEqual(high_lane['sample_size_n'], 35)
        self.assertEqual(high_lane['status'], 'STATISTICALLY_VALID')
        self.assertEqual(high_lane['precision_pct'], 80.0)
        self.assertIsNotNone(high_lane['ci_95'])
        self.assertGreaterEqual(high_lane['ci_95']['lower_pct'], 60.0)
        self.assertLessEqual(high_lane['ci_95']['upper_pct'], 95.0)

    def test_control_checks_sampling_and_exclusion(self):
        """Control checks are sampled and excluded from accuracy ledger and actionable counts."""
        pt = Point(78.151, 11.651, srid=4326)

        # Create 20 alerts
        for i in range(20):
            EncroachmentAlert.objects.create(
                parcel=self.parcel,
                alert_geom=pt,
                confidence_score=0.35,  # Low lane
                status='NEW',
            )

        sampled_count = AccuracyLedgerService.sample_control_checks(
            district='Salem',
            sample_pct=10.0,
            low_lane_only=True
        )
        self.assertGreater(sampled_count, 0)

        control_alerts = EncroachmentAlert.objects.filter(is_control_check=True)
        self.assertEqual(control_alerts.count(), sampled_count)

    def test_satellite_coverage_gap_detection(self):
        """Taluks without recent clear satellite observation flag COVERAGE_GAP."""
        gaps = AccuracyLedgerService.detect_satellite_coverage_gaps(district='Salem', max_gap_days=5)
        self.assertTrue(len(gaps) > 0)
        self.assertEqual(gaps[0]['gap_status'], 'COVERAGE_GAP')

