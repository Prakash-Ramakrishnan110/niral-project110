import json
from datetime import timedelta
from django.test import TestCase
from django.utils import timezone
from django.contrib.auth.models import User
from django.contrib.gis.geos import Polygon, MultiPolygon
from rest_framework.test import APIClient
from rest_framework import status

from core.models import (
    State, District, Taluk, Firka, RevenueVillage,
    LandParcel, EncroachmentAlert, FieldVerification,
    OfficerAssignment, StatutoryNoticeAuthority, CaseAuditEvent
)
from core.services.case_state_machine import CaseStateMachine


class ProductionEndpointsTests(TestCase):
    """
    Comprehensive tests for Part 14 Step 6 Production Endpoints:
    - GET /api/auth/me/ (nested schema + backward compatibility + nav)
    - GET /api/dashboard/summary/ (scoped KPIs, pipeline stages, coverage gaps, integrity indicators)
    - GET /api/cases/ & GET /api/cases/{id}/ (scoped reads, allowed_actions, audit timeline, FMB)
    - POST /api/cases/{id}/transitions/ (optimistic locking 409, authority, idempotency, audit event)
    - Notice PDF generation (Section 7, Section 6, SHA-256 headers, guards)
    """

    def setUp(self):
        self.client = APIClient()

        # 1. Statewide Hierarchy Fixtures
        self.state = State.objects.create(name_en='Tamil Nadu', code='TN', name_ta='தமிழ்நாடு')
        self.dist_salem = District.objects.create(state=self.state, name_en='Salem', code='SLM', name_ta='சேலம்')
        self.dist_cbe = District.objects.create(state=self.state, name_en='Coimbatore', code='CBE', name_ta='கோயம்புத்தூர்')

        self.taluk_slm_w = Taluk.objects.create(district=self.dist_salem, name_en='Salem West', code='SLMW')
        self.taluk_cbe_n = Taluk.objects.create(district=self.dist_cbe, name_en='Coimbatore North', code='CBEN')

        self.firka_knk = Firka.objects.create(taluk=self.taluk_slm_w, name_en='Kannankurichi Firka', code='KNKF')

        self.geom_poly = Polygon(((78.0, 11.0), (78.1, 11.0), (78.1, 11.1), (78.0, 11.1), (78.0, 11.0)))
        self.geom_multi = MultiPolygon(self.geom_poly)
        self.village_knk = RevenueVillage.objects.create(
            firka=self.firka_knk, taluk=self.taluk_slm_w, district=self.dist_salem,
            name_en='Kannankurichi', code='KNK', lgd_code='608142', boundary=self.geom_multi
        )

        # 2. Officer Users & Assignments
        self.u_col_slm = User.objects.create_user(username='collector_salem', password='password123', first_name='Salem', last_name='Collector')
        OfficerAssignment.objects.create(user=self.u_col_slm, role='COLLECTOR', district=self.dist_salem)

        self.u_col_cbe = User.objects.create_user(username='collector_cbe', password='password123')
        OfficerAssignment.objects.create(user=self.u_col_cbe, role='COLLECTOR', district=self.dist_cbe)

        self.u_tah_slmw = User.objects.create_user(username='tah_salem_west', password='password123', first_name='Tahsildar', last_name='West')
        OfficerAssignment.objects.create(user=self.u_tah_slmw, role='TAHSILDAR', district=self.dist_salem, taluk=self.taluk_slm_w)

        self.u_vao_knk = User.objects.create_user(username='vao_kannan', password='password123', first_name='Kannan', last_name='VAO')
        OfficerAssignment.objects.create(user=self.u_vao_knk, role='VAO', district=self.dist_salem, taluk=self.taluk_slm_w, village=self.village_knk)

        self.u_vigilance = User.objects.create_user(username='dvac_auditor', password='password123')
        OfficerAssignment.objects.create(user=self.u_vigilance, role='VIGILANCE')

        # 3. Parcels & Alerts
        self.p_knk = LandParcel.objects.create(
            survey_number='101', subdivision='1A', classification='Government',
            district='Salem', taluk='Salem West', village_name='Kannankurichi',
            district_ref=self.dist_salem, taluk_ref=self.taluk_slm_w, village_ref=self.village_knk,
            geom=self.geom_poly, area_extent='2.50 Acres'
        )

        self.alert_1 = EncroachmentAlert.objects.create(
            parcel=self.p_knk,
            status=EncroachmentAlert.STATE_NEW,
            snapshot_lane='HIGH',
            confidence_score=0.92,
            structure_category='COMMERCIAL_LAYOUT',
            encroached_area_sqft=1200,
            sla_deadline=timezone.now() + timedelta(days=5),
            version=1
        )

        self.alert_stay = EncroachmentAlert.objects.create(
            parcel=self.p_knk,
            status=EncroachmentAlert.STATE_COURT_STAY_HOLD,
            snapshot_lane='MEDIUM',
            confidence_score=0.75,
            structure_category='COMMERCIAL_LAYOUT',
            encroached_area_sqft=800,
            stay_order_number='W.P. 12345/2026',
            stayed_by_court='High Court Madras',
            stay_granted_date=timezone.now().date(),
            sla_deadline=timezone.now() - timedelta(days=2),  # Breached SLA
            version=1
        )

    # ─────────────────────────────────────────────────────────────
    # 1. CurrentUserView (/api/auth/me/)
    # ─────────────────────────────────────────────────────────────
    def test_current_user_me_collector(self):
        self.client.force_authenticate(user=self.u_col_slm)
        resp = self.client.get('/api/auth/me/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        data = resp.data
        # Canonical nested fields
        self.assertEqual(data['role'], 'COLLECTOR')
        self.assertEqual(data['role_display'], 'District Collector / District Magistrate')
        self.assertEqual(data['scope']['level'], 'DISTRICT')
        self.assertEqual(data['scope']['district'], 'Salem')
        self.assertIn('nav', data)
        self.assertTrue(any(n['id'] == 'cases' for n in data['nav']))
        self.assertTrue(any(n['id'] == 'stays' for n in data['nav']))

        # Feature flags
        self.assertTrue(data['feature_flags']['can_sign_atr'])
        self.assertFalse(data['feature_flags']['is_readonly'])

        # Top-level backward compatibility fields
        self.assertEqual(data['id'], self.u_col_slm.id)
        self.assertEqual(data['username'], 'collector_salem')
        self.assertEqual(data['district'], 'Salem')

    def test_current_user_me_tahsildar(self):
        self.client.force_authenticate(user=self.u_tah_slmw)
        resp = self.client.get('/api/auth/me/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = resp.data

        self.assertEqual(data['role'], 'TAHSILDAR')
        self.assertEqual(data['scope']['level'], 'TALUK')
        self.assertEqual(data['scope']['taluk'], 'Salem West')
        self.assertTrue(any(n['id'] == 'hearings' for n in data['nav']))
        self.assertTrue(data['feature_flags']['can_issue_notice'])

    # ─────────────────────────────────────────────────────────────
    # 2. DashboardSummaryView (/api/dashboard/summary/)
    # ─────────────────────────────────────────────────────────────
    def test_dashboard_summary_collector(self):
        self.client.force_authenticate(user=self.u_col_slm)
        resp = self.client.get('/api/dashboard/summary/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        data = resp.data
        self.assertIn('kpis', data)
        self.assertIn('pipeline_stages', data)
        self.assertIn('coverage_gaps', data)
        self.assertIn('integrity_indicators', data)

        # Salem has alert_1 (NEW, actionable for collector) and alert_stay (COURT_STAY_HOLD)
        self.assertEqual(data['kpis']['needs_my_action'], 1)  # alert_1 is STATE_NEW
        self.assertEqual(data['kpis']['court_stays_in_force'], 1)  # alert_stay
        self.assertEqual(data['kpis']['sla_breached'], 1)  # alert_stay is past deadline
        self.assertEqual(data['kpis']['open_cases_total'], 2)

        # Integrity indicators
        self.assertGreaterEqual(data['integrity_indicators']['indicative_fmb_count'], 1)
        self.assertIn('disclaimer', data['integrity_indicators'])

    def test_dashboard_summary_scoped_cbe_empty(self):
        self.client.force_authenticate(user=self.u_col_cbe)
        resp = self.client.get('/api/dashboard/summary/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = resp.data
        self.assertEqual(data['kpis']['open_cases_total'], 0)
        self.assertEqual(data['kpis']['court_stays_in_force'], 0)

    # ─────────────────────────────────────────────────────────────
    # 3. CaseViewSet: List & Retrieve (/api/cases/, /api/cases/{id}/)
    # ─────────────────────────────────────────────────────────────
    def test_cases_list_scoped(self):
        # Salem collector sees 2 cases
        self.client.force_authenticate(user=self.u_col_slm)
        resp = self.client.get('/api/cases/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 2)
        first_case = resp.data[0]
        self.assertIn('allowed_actions', first_case)
        self.assertIn('version', first_case)

        # Coimbatore collector sees 0 cases
        self.client.force_authenticate(user=self.u_col_cbe)
        resp_cbe = self.client.get('/api/cases/')
        self.assertEqual(resp_cbe.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp_cbe.data), 0)

    def test_case_detail_structure(self):
        self.client.force_authenticate(user=self.u_col_slm)
        resp = self.client.get(f'/api/cases/{self.alert_1.id}/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        data = resp.data
        self.assertEqual(data['id'], self.alert_1.id)
        self.assertIn('parcel', data)
        self.assertEqual(data['parcel']['survey_number'], '101')
        self.assertIn('fmb_measurements', data)
        self.assertIn('disclaimer', data['fmb_measurements'])
        self.assertIn('court_stay', data)
        self.assertIn('verifications', data)
        self.assertIn('audit_timeline', data)
        self.assertIn('allowed_actions', data)

    # ─────────────────────────────────────────────────────────────
    # 4. Case Transitions (/api/cases/{id}/transitions/)
    # ─────────────────────────────────────────────────────────────
    def test_case_transition_success(self):
        self.client.force_authenticate(user=self.u_col_slm)
        payload = {
            "target_state": EncroachmentAlert.STATE_COLLECTOR_REVIEWED,
            "expected_version": 1,
            "reason": "Collector reviewed satellite footprint and approved for VAO dispatch.",
            "action": "COLLECTOR_REVIEW_PASS"
        }
        resp = self.client.post(f'/api/cases/{self.alert_1.id}/transitions/', data=payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        self.alert_1.refresh_from_db()
        self.assertEqual(self.alert_1.status, EncroachmentAlert.STATE_COLLECTOR_REVIEWED)
        self.assertEqual(self.alert_1.version, 2)  # Incremented version

        # Audit event recorded
        self.assertTrue(CaseAuditEvent.objects.filter(alert=self.alert_1, to_state=EncroachmentAlert.STATE_COLLECTOR_REVIEWED).exists())

    def test_case_transition_concurrency_conflict_409(self):
        self.client.force_authenticate(user=self.u_col_slm)
        payload = {
            "target_state": EncroachmentAlert.STATE_COLLECTOR_REVIEWED,
            "expected_version": 99,  # Mismatched version
            "reason": "Stale update attempt"
        }
        resp = self.client.post(f'/api/cases/{self.alert_1.id}/transitions/', data=payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(resp.data['code'], 'CONCURRENCY_CONFLICT')
        self.assertEqual(resp.data['current_version'], 1)
        self.assertEqual(resp.data['expected_version'], 99)

    def test_case_transition_vigilance_forbidden(self):
        self.client.force_authenticate(user=self.u_vigilance)
        payload = {
            "target_state": EncroachmentAlert.STATE_COLLECTOR_REVIEWED,
            "expected_version": 1,
            "reason": "Vigilance trying to modify case"
        }
        resp = self.client.post(f'/api/cases/{self.alert_1.id}/transitions/', data=payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_case_transition_idempotency(self):
        self.client.force_authenticate(user=self.u_col_slm)
        payload = {
            "target_state": EncroachmentAlert.STATE_VAO_ASSIGNED,
            "expected_version": 1,
            "reason": "Assign to VAO for field survey",
            "action": "DISPATCH_VAO"
        }
        headers = {'HTTP_IDEMPOTENCY_KEY': 'idem-test-key-case-transition-001'}

        # First attempt
        resp1 = self.client.post(f'/api/cases/{self.alert_1.id}/transitions/', data=payload, format='json', **headers)
        self.assertEqual(resp1.status_code, status.HTTP_200_OK)

        # Second attempt with same key (simulate rural network retry)
        resp2 = self.client.post(f'/api/cases/{self.alert_1.id}/transitions/', data=payload, format='json', **headers)
        self.assertEqual(resp2.status_code, status.HTTP_200_OK)
        self.assertEqual(resp2.headers.get('X-Cache'), 'HIT-IDEMPOTENT')

    # ─────────────────────────────────────────────────────────────
    # 5. ReportLab Notice PDF Endpoints
    # ─────────────────────────────────────────────────────────────
    def test_generate_section_7_pdf(self):
        self.client.force_authenticate(user=self.u_tah_slmw)
        resp = self.client.get(f'/api/cases/{self.alert_1.id}/documents/section-7/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp['Content-Type'], 'application/pdf')
        self.assertTrue(resp.content.startswith(b'%PDF'))
        self.assertIn('X-Document-SHA256', resp)
        self.assertEqual(len(resp['X-Document-SHA256']), 64)  # Valid SHA-256 string
        self.assertEqual(resp['X-Cadastral-Disclaimer'], 'INDICATIVE_POLYGON_DERIVED')

    def test_generate_section_6_pdf_success(self):
        self.client.force_authenticate(user=self.u_tah_slmw)
        resp = self.client.get(f'/api/cases/{self.alert_1.id}/documents/section-6/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp['Content-Type'], 'application/pdf')
        self.assertTrue(resp.content.startswith(b'%PDF'))
        self.assertIn('X-Document-SHA256', resp)

    def test_generate_section_6_pdf_guard_court_stay_blocks(self):
        # Case under court stay cannot have Section 6 eviction ordered
        self.client.force_authenticate(user=self.u_tah_slmw)
        resp = self.client.get(f'/api/cases/{self.alert_stay.id}/documents/section-6/')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Injunction in force', resp.data['error'])

    def test_generate_section_6_pdf_guard_vulnerable_housing_blocks(self):
        vulnerable_alert = EncroachmentAlert.objects.create(
            parcel=self.p_knk,
            status=EncroachmentAlert.STATE_NEW,
            structure_category='VULNERABLE_HOUSING',
            version=1
        )
        self.client.force_authenticate(user=self.u_tah_slmw)
        resp = self.client.get(f'/api/cases/{vulnerable_alert.id}/documents/section-6/')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('VULNERABLE_HOUSING', resp.data['error'])
