"""
Unit tests for configurable confidence thresholds, SLA timers, and DistrictLegalConfig.
Verifies:
1. DistrictLegalConfig resolves district-specific configs and falls back to statewide default.
2. resolve_tier_and_sla computes correct tier and deadline dynamically from config (zero hardcoding).
3. Custom district thresholds (e.g. higher bar for Tier 1) are respected.
4. EncroachmentAlert auto-resolves tier and SLA on save when not explicitly specified.
5. GET /api/config/legal/ endpoint returns configured rules to authenticated officers.
"""
from datetime import datetime, timedelta
from django.utils import timezone
from django.contrib.auth.models import User
from django.contrib.gis.geos import Polygon, Point
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from core.models import LandParcel, EncroachmentAlert, DistrictLegalConfig, UserProfile
from .base import SafeAPITestCase


class ThresholdsAndSLAConfigTests(SafeAPITestCase):

    def setUp(self):
        super().setUp()
        self.user = User.objects.create_user(username='sla_officer', password='TestPassword@2026!')
        UserProfile.objects.create(user=self.user, role='COLLECTOR', district='Salem')
        token = RefreshToken.for_user(self.user).access_token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        # Default Statewide config
        self.state_cfg, _ = DistrictLegalConfig.objects.get_or_create(
            district=None,
            defaults={
                'tier1_confidence_min': 0.80,
                'tier2_confidence_min': 0.50,
                'tier1_sla_days': 2,
                'tier2_sla_days': 7,
                'tier3_sla_days': 30,
            }
        )

        # Custom Coimbatore config with stricter tier 1 threshold (0.90) and 1-day SLA
        self.cbe_cfg, _ = DistrictLegalConfig.objects.get_or_create(
            district='Coimbatore',
            defaults={
                'tier1_confidence_min': 0.90,
                'tier2_confidence_min': 0.60,
                'tier1_sla_days': 1,
                'tier2_sla_days': 5,
                'tier3_sla_days': 15,
                'operative_writ_petition_no': 'W.P. No. 18420 of 2024'
            }
        )

        poly = Polygon(((78.10, 11.60), (78.20, 11.60), (78.20, 11.70), (78.10, 11.70), (78.10, 11.60)))
        self.salem_parcel = LandParcel.objects.create(
            survey_number="12/1",
            district="Salem",
            taluk="Salem West",
            village_name="Kannankurichi",
            classification="Waterbody",
            geom=poly
        )

    def test_district_resolution_and_statewide_fallback(self):
        """District lookup finds exact district and falls back to statewide default for unknown districts."""
        cbe = DistrictLegalConfig.get_config_for_district('Coimbatore')
        self.assertEqual(cbe.district, 'Coimbatore')
        self.assertEqual(cbe.tier1_confidence_min, 0.90)

        unknown = DistrictLegalConfig.get_config_for_district('Madurai')
        self.assertIsNone(unknown.district)
        self.assertEqual(unknown.tier1_confidence_min, 0.80)

    def test_resolve_tier_and_sla_dynamic_calculation(self):
        """Tiers and SLA deadlines are calculated from configuration values rather than frozen in code."""
        base_time = timezone.now()

        # Statewide default: 0.85 -> Tier 1 (+2 days)
        tier, sla = self.state_cfg.resolve_tier_and_sla(0.85, base_time=base_time)
        self.assertEqual(tier, 'TIER_1_CRITICAL')
        self.assertEqual((sla - base_time).days, 2)

        # Statewide default: 0.65 -> Tier 2 (+7 days)
        tier2, sla2 = self.state_cfg.resolve_tier_and_sla(0.65, base_time=base_time)
        self.assertEqual(tier2, 'TIER_2_MEDIUM')
        self.assertEqual((sla2 - base_time).days, 7)

        # Statewide default: 0.30 -> Tier 3 (+30 days)
        tier3, sla3 = self.state_cfg.resolve_tier_and_sla(0.30, base_time=base_time)
        self.assertEqual(tier3, 'TIER_3_MONITORING')
        self.assertEqual((sla3 - base_time).days, 30)

        # Coimbatore custom: 0.85 is NOT Tier 1 in Coimbatore (threshold is 0.90) -> Tier 2 (+5 days)
        cbe_tier, cbe_sla = self.cbe_cfg.resolve_tier_and_sla(0.85, base_time=base_time)
        self.assertEqual(cbe_tier, 'TIER_2_MEDIUM')
        self.assertEqual((cbe_sla - base_time).days, 5)

    def test_alert_save_auto_populates_tier_and_sla(self):
        """Saving an EncroachmentAlert with unpopulated tier/sla automatically resolves via DistrictLegalConfig."""
        alert = EncroachmentAlert.objects.create(
            parcel=self.salem_parcel,
            alert_geom=Point(78.15, 11.65),
            confidence_score=0.92,
            tier=None,
            sla_deadline=None
        )
        alert.refresh_from_db()
        self.assertEqual(alert.tier, 'TIER_1_CRITICAL')
        self.assertIsNotNone(alert.sla_deadline)

    def test_legal_config_endpoint_200(self):
        """GET /api/config/legal/ returns list of legal configs to authenticated officers."""
        res = self.client.get('/api/config/legal/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res.data), 2)

        # Query filter by district
        res_cbe = self.client.get('/api/config/legal/?district=Coimbatore')
        self.assertEqual(res_cbe.status_code, status.HTTP_200_OK)
        self.assertEqual(res_cbe.data[0]['district'], 'Coimbatore')
        self.assertEqual(res_cbe.data[0]['tier1_confidence_min'], 0.90)
