from django.test import TestCase
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from core.models import (
    State,
    District,
    RevenueDivision,
    Taluk,
    Firka,
    RevenueVillage,
    LandParcel,
    EncroachmentAlert,
    OfficerAssignment,
    StatutoryNoticeAuthority
)
from core.services.jurisdiction_scope import JurisdictionScopeService


class OfficerAssignmentAndScopeTests(TestCase):
    def setUp(self):
        # 1. Hierarchy Nodes
        self.state = State.objects.create(code='TN', name_en='Tamil Nadu', name_ta='தமிழ்நாடு')
        self.dist_slm = District.objects.create(state=self.state, code='TN-SLM', name_en='Salem', name_ta='சேலம்')
        self.dist_cbe = District.objects.create(state=self.state, code='TN-CBE', name_en='Coimbatore', name_ta='கோயம்புத்தூர்')

        self.div_slm = RevenueDivision.objects.create(district=self.dist_slm, code='TN-SLM-DIV-SLM', name_en='Salem', name_ta='சேலம்')
        self.taluk_slmw = Taluk.objects.create(district=self.dist_slm, revenue_division=self.div_slm, code='TN-SLM-SLMW', name_en='Salem West', name_ta='சேலம் மேற்கு')
        self.taluk_slms = Taluk.objects.create(district=self.dist_slm, revenue_division=self.div_slm, code='TN-SLM-SLMS', name_en='Salem South', name_ta='சேலம் தெற்கு')
        self.taluk_cbn = Taluk.objects.create(district=self.dist_cbe, code='TN-CBE-CBN', name_en='Coimbatore North', name_ta='கோயம்புத்தூர் வடக்கு')

        self.firka_srm = Firka.objects.create(taluk=self.taluk_slmw, code='TN-SLM-SLMW-FRK-SRM', name_en='Suramangalam', name_ta='சுரமங்கலம்')
        self.vil_knk = RevenueVillage.objects.create(district=self.dist_slm, taluk=self.taluk_slmw, firka=self.firka_srm, code='TN-SLM-SLMW-KNK', name_en='Kannankurichi', name_ta='கண்ணங்குறிச்சி')
        self.vil_srm = RevenueVillage.objects.create(district=self.dist_slm, taluk=self.taluk_slmw, firka=self.firka_srm, code='TN-SLM-SLMW-SRM', name_en='Suramangalam', name_ta='சுரமங்கலம்')
        self.vil_ann = RevenueVillage.objects.create(district=self.dist_slm, taluk=self.taluk_slms, code='TN-SLM-SLMS-ANN', name_en='Annathanapatty', name_ta='அன்னதானப்பட்டி')

        # 2. Users & Assignments
        self.u_apex = User.objects.create_user('test_apex', 'apex@test.com', 'pass')
        OfficerAssignment.objects.create(user=self.u_apex, role='STATE_APEX')

        self.u_vigilance = User.objects.create_user('test_dvac', 'dvac@test.com', 'pass')
        OfficerAssignment.objects.create(user=self.u_vigilance, role='VIGILANCE')

        self.u_admin_gis = User.objects.create_user('test_gis', 'gis@test.com', 'pass')
        OfficerAssignment.objects.create(user=self.u_admin_gis, role='ADMIN_GIS')

        self.u_col_slm = User.objects.create_user('test_col_slm', 'col_slm@test.com', 'pass')
        OfficerAssignment.objects.create(user=self.u_col_slm, role='COLLECTOR', district=self.dist_slm)

        self.u_col_cbe = User.objects.create_user('test_col_cbe', 'col_cbe@test.com', 'pass')
        OfficerAssignment.objects.create(user=self.u_col_cbe, role='COLLECTOR', district=self.dist_cbe)

        self.u_tah_slmw = User.objects.create_user('test_tah_slmw', 'tah@test.com', 'pass')
        OfficerAssignment.objects.create(user=self.u_tah_slmw, role='TAHSILDAR', district=self.dist_slm, taluk=self.taluk_slmw)

        self.u_vao_knk = User.objects.create_user('test_vao_knk', 'vao@test.com', 'pass')
        OfficerAssignment.objects.create(user=self.u_vao_knk, role='VAO', district=self.dist_slm, taluk=self.taluk_slmw, village=self.vil_knk)

        # 3. Parcels & Alerts
        from django.contrib.gis.geos import Polygon, Point
        poly = Polygon(((78.1, 11.6), (78.2, 11.6), (78.2, 11.7), (78.1, 11.7), (78.1, 11.6)))
        
        # Parcel 1 in Kannankurichi (Salem West)
        self.p_knk = LandParcel.objects.create(
            survey_number='101',
            district='Salem',
            taluk='Salem West',
            village_name='Kannankurichi',
            district_ref=self.dist_slm,
            taluk_ref=self.taluk_slmw,
            village_ref=self.vil_knk,
            geom=poly
        )
        self.a_knk = EncroachmentAlert.objects.create(
            parcel=self.p_knk,
            alert_geom=Point(78.15, 11.65),
            confidence_score=0.92,
            tier='TIER_1',
            status='NEW'
        )

        # Parcel 2 in Annathanapatty (Salem South)
        self.p_ann = LandParcel.objects.create(
            survey_number='202',
            district='Salem',
            taluk='Salem South',
            village_name='Annathanapatty',
            district_ref=self.dist_slm,
            taluk_ref=self.taluk_slms,
            village_ref=self.vil_ann,
            geom=poly
        )
        self.a_ann = EncroachmentAlert.objects.create(
            parcel=self.p_ann,
            alert_geom=Point(78.18, 11.62),
            confidence_score=0.85,
            tier='TIER_1',
            status='NEW'
        )

        # 4. Statutory Authorities (use update_or_create since migration 0016 seeds baseline)
        StatutoryNoticeAuthority.objects.update_or_create(role='TAHSILDAR', action='ISSUE_SECTION_7', defaults={'is_allowed': True})
        StatutoryNoticeAuthority.objects.update_or_create(role='VAO', action='ISSUE_SECTION_7', defaults={'is_allowed': False})
        StatutoryNoticeAuthority.objects.update_or_create(role='COLLECTOR', action='PASS_SECTION_6_ORDER', defaults={'is_allowed': True})

    def test_assignment_clean_validation(self):
        """Statewide roles cannot have local district; Collector cannot have taluk."""
        u_temp = User.objects.create_user('temp_u', 'temp@t.com', 'p')
        # Statewide role with local district must fail validation
        with self.assertRaises(ValidationError):
            OfficerAssignment(user=u_temp, role='STATE_APEX', district=self.dist_slm).clean()

        # Collector with taluk must fail validation
        with self.assertRaises(ValidationError):
            OfficerAssignment(user=u_temp, role='COLLECTOR', district=self.dist_slm, taluk=self.taluk_slmw).clean()

    def test_parcel_scoping_per_role(self):
        """Verify database-level subquery scoping for LandParcel across roles."""
        qs = LandParcel.objects.all()

        # Statewide role sees all parcels
        self.assertEqual(JurisdictionScopeService.scope_parcels(qs, self.u_apex).count(), 2)
        # Salem Collector sees both Salem parcels
        self.assertEqual(JurisdictionScopeService.scope_parcels(qs, self.u_col_slm).count(), 2)
        # Coimbatore Collector sees 0 parcels
        self.assertEqual(JurisdictionScopeService.scope_parcels(qs, self.u_col_cbe).count(), 0)
        # Salem West Tahsildar sees only Kannankurichi (Salem West) parcel
        scoped_tah = JurisdictionScopeService.scope_parcels(qs, self.u_tah_slmw)
        self.assertEqual(scoped_tah.count(), 1)
        self.assertEqual(scoped_tah.first().survey_number, '101')
        # Kannankurichi VAO sees only Kannankurichi parcel
        scoped_vao = JurisdictionScopeService.scope_parcels(qs, self.u_vao_knk)
        self.assertEqual(scoped_vao.count(), 1)
        self.assertEqual(scoped_vao.first().survey_number, '101')

    def test_alert_scoping_per_role(self):
        """Verify alert scoping inherits from linked parcel."""
        qs = EncroachmentAlert.objects.all()
        # Salem Collector sees both alerts
        self.assertEqual(JurisdictionScopeService.scope_alerts(qs, self.u_col_slm).count(), 2)
        # Coimbatore Collector sees 0 alerts
        self.assertEqual(JurisdictionScopeService.scope_alerts(qs, self.u_col_cbe).count(), 0)
        # Salem West Tahsildar sees only Salem West alert
        self.assertEqual(JurisdictionScopeService.scope_alerts(qs, self.u_tah_slmw).count(), 1)

    def test_write_permission_and_readonly_guard(self):
        """Statewide read-only roles and out-of-scope officers are denied case writes."""
        # STATE_APEX is read-only
        allowed, reason = JurisdictionScopeService.can_write_case(self.a_knk, self.u_apex)
        self.assertFalse(allowed)
        self.assertIn("strictly read-only", reason)

        # VIGILANCE is read-only
        allowed, reason = JurisdictionScopeService.can_write_case(self.a_knk, self.u_vigilance)
        self.assertFalse(allowed)
        self.assertIn("strictly read-only", reason)

        # ADMIN_GIS has no case workflow authority
        allowed, reason = JurisdictionScopeService.can_write_case(self.a_knk, self.u_admin_gis)
        self.assertFalse(allowed)
        self.assertIn("cannot perform case workflow", reason)

        # Coimbatore Collector cannot write on Salem alert
        allowed, reason = JurisdictionScopeService.can_write_case(self.a_knk, self.u_col_cbe)
        self.assertFalse(allowed)
        self.assertIn("outside your administrative jurisdiction", reason)

        # Salem West Tahsildar is authorized on Salem West alert
        allowed, reason = JurisdictionScopeService.can_write_case(self.a_knk, self.u_tah_slmw)
        self.assertTrue(allowed)

    def test_statutory_notice_authority_deny_by_default(self):
        """Tahsildar is allowed for Sec 7; VAO is denied; unconfigured is denied."""
        # Tahsildar -> ISSUE_SECTION_7: ALLOWED
        ok, _ = JurisdictionScopeService.check_authority(self.u_tah_slmw, 'ISSUE_SECTION_7')
        self.assertTrue(ok)

        # VAO -> ISSUE_SECTION_7: DENIED
        ok, reason = JurisdictionScopeService.check_authority(self.u_vao_knk, 'ISSUE_SECTION_7')
        self.assertFalse(ok)
        self.assertIn("not authorized", reason)

        # Unconfigured action -> DENIED BY DEFAULT
        ok, reason = JurisdictionScopeService.check_authority(self.u_tah_slmw, 'UNCONFIGURED_ACTION')
        self.assertFalse(ok)
        self.assertIn("not authorized", reason)
