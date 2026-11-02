"""
M2 Step 1: LaneConfig behaviour tests.

1. District without its own LaneConfig row falls back to the state-wide row.
2. Migration 0023 data copy takes values from DistrictLegalConfig (NON-default values used, so a
   copy cannot be confused with model defaults).
3. Detection-time snapshot: changing a threshold later does not re-lane old alerts.
"""
import importlib

from django.apps import apps as django_apps
from django.contrib.gis.geos import Polygon, Point
from django.db import IntegrityError, transaction
from django.test import TestCase

from core.models import (
    State, District, Taluk, RevenueVillage, LandParcel, EncroachmentAlert,
    DistrictLegalConfig, LaneConfig,
)


class LaneConfigTestBase(TestCase):
    def setUp(self):
        LaneConfig.objects.all().delete()
        self.state = State.objects.create(code='TN', name_en='Tamil Nadu', name_ta='தமிழ்நாடு')
        self.salem = District.objects.create(state=self.state, code='TN-SLM', name_en='Salem', name_ta='சேலம்')
        self.other = District.objects.create(state=self.state, code='TN-ERD', name_en='Erode', name_ta='ஈரோடு')
        taluk = Taluk.objects.create(district=self.salem, code='TN-SLM-SLMW', name_en='Salem West', name_ta='சேலம் மேற்கு')
        village = RevenueVillage.objects.create(
            district=self.salem, taluk=taluk, code='TN-SLM-SLMW-KNK',
            name_en='Kannankurichi', name_ta='கண்ணங்குறிச்சி',
        )
        poly = Polygon([(78.150, 11.650), (78.152, 11.650), (78.152, 11.652), (78.150, 11.652), (78.150, 11.650)], srid=4326)
        self.parcel = LandParcel.objects.create(
            survey_number='101', subdivision='1A', classification='Waterbody',
            village_code='634001', taluk='Salem West', district='Salem',
            district_ref=self.salem, taluk_ref=taluk, village_ref=village, geom=poly,
        )

    def _alert(self, confidence, **kw):
        return EncroachmentAlert.objects.create(
            parcel=self.parcel, alert_geom=Point(78.151, 11.651, srid=4326),
            confidence_score=confidence, status='NEW', **kw
        )


class LaneConfigFallbackTests(LaneConfigTestBase):
    def test_district_without_row_falls_back_to_statewide_row(self):
        statewide = LaneConfig.objects.create(district=None, high_min=0.90, medium_min=0.60)
        LaneConfig.objects.create(district=self.salem, high_min=0.70, medium_min=0.40)

        # Erode has no row of its own -> state-wide row
        self.assertEqual(LaneConfig.get_config_for_district(self.other).id, statewide.id)
        self.assertEqual(LaneConfig.get_config_for_district('Erode').id, statewide.id)
        # Salem has its own row -> not the state-wide one
        self.assertEqual(LaneConfig.get_config_for_district(self.salem).high_min, 0.70)
        self.assertEqual(LaneConfig.get_config_for_district('salem').high_min, 0.70)

    def test_no_legal_config_needed_for_lanes(self):
        """A district with NO DistrictLegalConfig still gets lanes from LaneConfig."""
        self.assertFalse(DistrictLegalConfig.objects.filter(district='Erode').exists())
        LaneConfig.objects.create(district=None, high_min=0.90, medium_min=0.60)
        cfg = LaneConfig.get_config_for_district(self.other)
        self.assertEqual((cfg.classify(0.95), cfg.classify(0.70), cfg.classify(0.30)), ('HIGH', 'MEDIUM', 'LOW'))

    def test_check_constraints_reject_bad_thresholds(self):
        for hi, med in [(0.5, 0.5), (0.4, 0.6), (1.2, 0.5), (0.8, -0.1)]:
            with self.assertRaises(IntegrityError):
                with transaction.atomic():
                    LaneConfig.objects.create(district=None, high_min=hi, medium_min=med)


class LaneConfigMigrationCopyTests(LaneConfigTestBase):
    def test_data_migration_copies_values_from_district_legal_config(self):
        """Seed NON-default source values (defaults are 0.8/0.5/30) and run the 0023 copy function."""
        migration = importlib.import_module('core.migrations.0023_laneconfig_model')
        DistrictLegalConfig.objects.all().delete()
        DistrictLegalConfig.objects.create(
            district='Salem', tier1_confidence_min=0.91, tier2_confidence_min=0.62, min_sample_size_accuracy=45,
        )
        DistrictLegalConfig.objects.create(
            district=None, tier1_confidence_min=0.95, tier2_confidence_min=0.55, min_sample_size_accuracy=60,
        )
        LaneConfig.objects.all().delete()

        migration.copy_district_legal_config_to_lane_config(django_apps, None)

        salem = LaneConfig.objects.get(district=self.salem)
        self.assertEqual((salem.high_min, salem.medium_min, salem.min_sample_size), (0.91, 0.62, 45))
        statewide = LaneConfig.objects.get(district__isnull=True)
        self.assertEqual((statewide.high_min, statewide.medium_min, statewide.min_sample_size), (0.95, 0.55, 60))
        # None of these equal the model defaults -> proves a copy, not defaults
        self.assertNotEqual(salem.high_min, 0.80)
        self.assertNotEqual(salem.min_sample_size, 30)


class LaneSnapshotTests(LaneConfigTestBase):
    def test_threshold_change_does_not_relane_existing_alerts(self):
        cfg = LaneConfig.objects.create(district=self.salem, high_min=0.80, medium_min=0.50)
        old_high = self._alert(0.85)
        old_med = self._alert(0.60)
        self.assertEqual((old_high.snapshot_lane, old_med.snapshot_lane), ('HIGH', 'MEDIUM'))
        self.assertEqual(old_high.snapshot_confidence, 0.85)

        # Calibration tightens thresholds
        cfg.high_min, cfg.medium_min = 0.90, 0.70
        cfg.save()

        old_high.refresh_from_db()
        old_med.refresh_from_db()
        self.assertEqual(old_high.snapshot_lane, 'HIGH')      # frozen at detection time
        self.assertEqual(old_med.snapshot_lane, 'MEDIUM')     # frozen at detection time
        self.assertEqual(old_high.priority_lane, 'HIGH')
        # A NEW alert with the same confidence is laned by the new thresholds
        new_alert = self._alert(0.85)
        self.assertEqual(new_alert.snapshot_lane, 'MEDIUM')

    def test_snapshot_stores_lane_confidence_model_version_and_scenes(self):
        LaneConfig.objects.create(district=None, high_min=0.80, medium_min=0.50)
        a = self._alert(
            0.83, snapshot_model_version='fixture-v0', snapshot_scene_ids=['S2A_BEFORE', 'S2B_AFTER'],
        )
        a.refresh_from_db()
        self.assertEqual(a.snapshot_lane, 'HIGH')
        self.assertEqual(a.snapshot_confidence, 0.83)
        self.assertEqual(a.snapshot_model_version, 'fixture-v0')
        self.assertEqual(a.snapshot_scene_ids, ['S2A_BEFORE', 'S2B_AFTER'])

    def test_explicit_snapshot_is_never_overwritten(self):
        LaneConfig.objects.create(district=None, high_min=0.80, medium_min=0.50)
        a = self._alert(0.95, snapshot_lane='LOW', snapshot_confidence=0.10)
        self.assertEqual((a.snapshot_lane, a.snapshot_confidence), ('LOW', 0.10))

