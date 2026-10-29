from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db import DatabaseError
from core.models import State, District, RevenueDivision, Taluk, Firka, RevenueVillage, DistrictAdjacency


class JurisdictionHierarchyTests(TestCase):
    def setUp(self):
        self.state = State.objects.create(code='TN', name_en='Tamil Nadu', name_ta='தமிழ்நாடு')
        self.dist_slm = District.objects.create(state=self.state, code='TN-SLM', name_en='Salem', name_ta='சேலம்')
        self.dist_cbe = District.objects.create(state=self.state, code='TN-CBE', name_en='Coimbatore', name_ta='கோயம்புத்தூர்')

        self.rdo_slm = RevenueDivision.objects.create(district=self.dist_slm, code='TN-SLM-DIV-SLM', name_en='Salem', name_ta='சேலம்')
        self.taluk_slmw = Taluk.objects.create(
            district=self.dist_slm,
            revenue_division=self.rdo_slm,
            code='TN-SLM-SLMW',
            name_en='Salem West',
            name_ta='சேலம் மேற்கு'
        )
        self.firka_srm = Firka.objects.create(
            taluk=self.taluk_slmw,
            code='TN-SLM-SLMW-FRK-SRM',
            name_en='Suramangalam',
            name_ta='சுரமங்கலம்'
        )

    def test_hierarchy_creation(self):
        vil = RevenueVillage.objects.create(
            district=self.dist_slm,
            taluk=self.taluk_slmw,
            firka=self.firka_srm,
            code='TN-SLM-SLMW-SRM',
            name_en='Suramangalam',
            name_ta='சுரமங்கலம்'
        )
        self.assertEqual(vil.district.name_en, 'Salem')
        self.assertEqual(vil.taluk.name_en, 'Salem West')
        self.assertEqual(vil.firka.name_en, 'Suramangalam')

    def test_database_and_model_consistency_guard(self):
        """Ensure mismatch between village.district and taluk.district is strictly rejected."""
        taluk_cbe = Taluk.objects.create(
            district=self.dist_cbe,
            code='TN-CBE-CBN',
            name_en='Coimbatore North',
            name_ta='கோயம்புத்தூர் வடக்கு'
        )

        with self.assertRaises((ValidationError, DatabaseError)):
            RevenueVillage.objects.create(
                district=self.dist_slm, # Salem District
                taluk=taluk_cbe,        # But Coimbatore Taluk!
                code='TN-ERR-MISMATCH',
                name_en='Illegal Village',
                name_ta='தவறான கிராமம்'
            )

    def test_district_adjacency(self):
        """Test bidirectional adjacency between Salem and Coimbatore."""
        adj1 = DistrictAdjacency.objects.create(district=self.dist_slm, adjacent_district=self.dist_cbe)
        adj2 = DistrictAdjacency.objects.create(district=self.dist_cbe, adjacent_district=self.dist_slm)

        self.assertIn(self.dist_cbe, [a.adjacent_district for a in self.dist_slm.adjacencies_from.all()])
        self.assertIn(self.dist_slm, [a.adjacent_district for a in self.dist_cbe.adjacencies_from.all()])

        # Self-adjacency must be prevented
        with self.assertRaises(ValidationError):
            DistrictAdjacency(district=self.dist_slm, adjacent_district=self.dist_slm).clean()

