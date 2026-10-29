"""
Unit tests for Tamil Nilam classification table and statutory categorization engine.
Verifies:
1. Canonical category resolution across official Tamil Nilam designations.
2. Protection flags (waterbodies and poramboke protected, ryotwari private excluded).
3. Unmapped codes strictly return NEEDS_REVIEW (zero silent defaults).
4. LandParcel model properties and API serialization reflect Tamil Nilam metadata.
"""
from django.contrib.auth.models import User
from django.contrib.gis.geos import Polygon
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from core.models import LandParcel, UserProfile
from core.services.tamil_nilam_classifier import TamilNilamClassifier
from .base import SafeAPITestCase


class TamilNilamClassificationTests(SafeAPITestCase):

    def setUp(self):
        super().setUp()
        self.user = User.objects.create_user(username='tn_officer', password='TestPassword@2026!')
        UserProfile.objects.create(user=self.user, role='TAHSILDAR', district='Salem')
        token = RefreshToken.for_user(self.user).access_token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        poly = Polygon(((78.10, 11.60), (78.20, 11.60), (78.20, 11.70), (78.10, 11.70), (78.10, 11.60)))
        self.water_parcel = LandParcel.objects.create(
            survey_number="10/1",
            district="Salem",
            classification="Water Body Poramboke",
            geom=poly
        )
        self.private_parcel = LandParcel.objects.create(
            survey_number="20/2",
            district="Salem",
            classification="Ryotwari Nanjai Patta",
            geom=poly
        )

    def test_waterbody_classifications_absolute_protection(self):
        """Waterbody variants map to WATERBODY with non-alienable protection."""
        for term in ["Eri", "Kulam", "Odai", "Water Body Poramboke", "River Channel"]:
            res = TamilNilamClassifier.classify(term)
            self.assertEqual(res['canonical_category'], 'WATERBODY', f"Failed for {term}")
            self.assertTrue(res['is_protected_government_land'])
            self.assertFalse(res['can_be_patta_assigned'])
            self.assertIn("Protection of Tanks", res['statutory_act'])

    def test_government_poramboke_and_grazing(self):
        """Sarkar Poramboke and Meikkal map to protected government land."""
        poramboke = TamilNilamClassifier.classify("Sarkar Poramboke")
        self.assertEqual(poramboke['canonical_category'], 'PORAMBOKE_PROTECTED')
        self.assertTrue(poramboke['is_protected_government_land'])

        meikkal = TamilNilamClassifier.classify("Meikkal Poramboke")
        self.assertEqual(meikkal['canonical_category'], 'MEIKKAL_GRAZING')
        self.assertTrue(meikkal['is_protected_government_land'])
        self.assertFalse(meikkal['can_be_patta_assigned'])

    def test_roadside_forest_temple(self):
        """Highways, Reserved Forest, and Temple lands map to respective protective statutory regimes."""
        road = TamilNilamClassifier.classify("Salai Poramboke")
        self.assertEqual(road['canonical_category'], 'ROADSIDE_HIGHWAY')
        self.assertTrue(road['is_protected_government_land'])

        forest = TamilNilamClassifier.classify("Reserved Forest")
        self.assertEqual(forest['canonical_category'], 'FOREST_RESERVED')
        self.assertTrue(forest['is_protected_government_land'])

        temple = TamilNilamClassifier.classify("HR&CE Temple Inam")
        self.assertEqual(temple['canonical_category'], 'TEMPLE_HRCE')
        self.assertTrue(temple['is_protected_government_land'])

    def test_ryotwari_private_and_grama_natham(self):
        """Private Ryotwari Patta is not government land; Grama Natham is communal habitation."""
        patta = TamilNilamClassifier.classify("Ryotwari Punjai Patta")
        self.assertEqual(patta['canonical_category'], 'RYOTWARI_PRIVATE')
        self.assertFalse(patta['is_protected_government_land'])

        natham = TamilNilamClassifier.classify("Grama Natham")
        self.assertEqual(natham['canonical_category'], 'GRAMA_NATHAM')
        self.assertFalse(natham['is_protected_government_land'])

    def test_unmapped_codes_return_needs_review(self):
        """Unknown or unmapped classifications strictly return NEEDS_REVIEW without defaulting."""
        unknown = TamilNilamClassifier.classify("Arbitrary Unknown Code 12345")
        self.assertEqual(unknown['canonical_category'], 'NEEDS_REVIEW')
        self.assertIsNone(unknown['is_protected_government_land'])
        self.assertEqual(unknown['honesty_badge'], 'NEEDS_REVIEW')

        empty = TamilNilamClassifier.classify("")
        self.assertEqual(empty['canonical_category'], 'NEEDS_REVIEW')

    def test_land_parcel_properties_and_api_serialization(self):
        """LandParcel model properties evaluate correctly and API serializer outputs tamil_nilam_meta."""
        self.assertTrue(self.water_parcel.is_waterbody_protected)
        self.assertTrue(self.water_parcel.is_protected_government_land)
        self.assertEqual(self.water_parcel.tamil_nilam_meta['canonical_category'], 'WATERBODY')

        self.assertFalse(self.private_parcel.is_waterbody_protected)
        self.assertFalse(self.private_parcel.is_protected_government_land)
        self.assertEqual(self.private_parcel.tamil_nilam_meta['canonical_category'], 'RYOTWARI_PRIVATE')

        # API Check
        res = self.client.get(f'/api/parcels/{self.water_parcel.id}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        meta = res.data.get('properties', {}).get('tamil_nilam_meta') or res.data.get('tamil_nilam_meta')
        self.assertIsNotNone(meta)
        self.assertEqual(meta['canonical_category'], 'WATERBODY')
        self.assertIn("நீர்நிலை", meta['tamil_title'])
