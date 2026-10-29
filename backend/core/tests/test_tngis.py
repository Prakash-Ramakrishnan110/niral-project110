"""
Unit tests for TNGIS integration service.
Verifies:
1. TNGIS_DEMO_MODE is False by default.
2. In demo mode, all endpoints return 'demo': True and honesty badge 'DEMO/SYNTHETIC'.
3. check_inside_boundary is 100% deterministic (no random coin flips); evaluates against local PostGIS geometries.
4. Non-demo mode attempts live requests and attaches demo: False.
"""
from django.conf import settings
from django.contrib.gis.geos import Polygon
from unittest.mock import patch
from core.models import LandParcel
from core.tngis_service import TNGISService
from .base import SafeAPITestCase


class TNGISServiceTests(SafeAPITestCase):

    def setUp(self):
        super().setUp()
        poly = Polygon(((78.10, 11.60), (78.20, 11.60), (78.20, 11.70), (78.10, 11.70), (78.10, 11.60)))
        self.parcel = LandParcel.objects.create(
            survey_number="500/1",
            subdivision="A",
            district="Salem",
            taluk="Salem West",
            village_name="Kannankurichi",
            classification="Waterbody",
            geom=poly
        )

    def test_default_tngis_demo_mode_is_false(self):
        """In production settings, TNGIS_DEMO_MODE must default to False."""
        self.assertFalse(
            settings.TNGIS_DEMO_MODE,
            "TNGIS_DEMO_MODE must default to False in settings.py"
        )

    def test_demo_mode_attaches_demo_flag_and_honesty_badge(self):
        """When TNGIS_DEMO_MODE is True, all responses carry demo: True and honesty badge."""
        with patch.object(settings, 'TNGIS_DEMO_MODE', True):
            attr = TNGISService.get_attributes(latitude=11.65, longitude=78.15)
            self.assertTrue(attr.get("demo"))
            self.assertEqual(attr.get("honesty_badge"), "DEMO/SYNTHETIC")

            dropdowns = TNGISService.get_admin_dropdown(case="district")
            self.assertTrue(dropdowns[0].get("demo"))
            self.assertEqual(dropdowns[0].get("honesty_badge"), "DEMO/SYNTHETIC")

            extent = TNGISService.get_extent(district="Salem")
            self.assertTrue(extent.get("demo"))
            self.assertEqual(extent.get("honesty_badge"), "DEMO/SYNTHETIC")

            nearest = TNGISService.get_nearest_feature(latitude=11.65, longitude=78.15, layer_id=29)
            self.assertTrue(nearest.get("demo"))
            self.assertEqual(nearest.get("honesty_badge"), "DEMO/SYNTHETIC")

    def test_check_inside_boundary_is_deterministic_no_random(self):
        """check_inside_boundary uses PostGIS spatial intersection and produces identical results across calls."""
        with patch.object(settings, 'TNGIS_DEMO_MODE', True):
            # Point inside test parcel (11.65, 78.15)
            inside_res = TNGISService.check_inside_boundary(latitude=11.65, longitude=78.15, layer_id=29)
            self.assertTrue(inside_res["is_inside"])
            self.assertEqual(inside_res["matched_survey"], "500/1/A")
            self.assertTrue(inside_res["demo"])

            # Verify 10 repeat calls return identical results (zero randomness)
            for _ in range(10):
                repeat = TNGISService.check_inside_boundary(latitude=11.65, longitude=78.15, layer_id=29)
                self.assertTrue(repeat["is_inside"])
                self.assertEqual(repeat["matched_survey"], "500/1/A")

            # Point outside test parcel (12.50, 79.50)
            outside_res = TNGISService.check_inside_boundary(latitude=12.50, longitude=79.50, layer_id=29)
            self.assertFalse(outside_res["is_inside"])
            self.assertIsNone(outside_res["matched_survey"])
            self.assertTrue(outside_res["demo"])

    def test_live_mode_flags_demo_false_on_connection_error(self):
        """When TNGIS_DEMO_MODE is False, live requests flag demo: False."""
        with patch.object(settings, 'TNGIS_DEMO_MODE', False):
            res = TNGISService.get_attributes(latitude=11.65, longitude=78.15)
            self.assertFalse(res.get("demo"))
