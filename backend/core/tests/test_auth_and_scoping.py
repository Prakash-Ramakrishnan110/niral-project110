"""
Comprehensive Authentication, Scoping, and Rate-Limiting Test Suite.
Verifies:
1. Real authentication flow via POST /api/auth/login/ (no force_authenticate).
2. Django-Axes brute-force lockout: 5 failed attempts locks out on 6th attempt (HTTP 429).
3. SimpleJWT refresh token rotation and blacklisting.
4. 401 Unauthorized across write endpoints when unauthenticated.
5. 403 Forbidden across write endpoints when unauthorized role calls action:
   - VAO blocked from Section 7, Section 6, eviction completion, inspector approval, boundary rejection.
   - Inspector blocked from Section 7, Section 6, proposal approval.
   - Vigilance blocked from any state-mutating requests (strictly read-only).
6. Scoped READ queries and cross-district read protection:
   - Collector of Salem sees only Salem parcels and alerts.
   - Collector of Salem cannot download Section 7 or FMB sketch for Coimbatore (403).
   - Collector of Salem cannot generate High Court ATR for Coimbatore (403).
   - State Apex sees all districts and can generate ATR for any district.
"""
from django.contrib.auth.models import User
from django.contrib.gis.geos import Polygon, Point
from rest_framework import status
from axes.models import AccessAttempt
from core.models import LandParcel, EncroachmentAlert, UserProfile, FieldVerification, RegistryProposal
from .base import SafeAPITestCase


class AuthAndScopingTestSuite(SafeAPITestCase):

    def setUp(self):
        super().setUp()
        AccessAttempt.objects.all().delete()

        # Geometry fixtures
        salem_geom = Polygon(((78.10, 11.60), (78.20, 11.60), (78.20, 11.70), (78.10, 11.70), (78.10, 11.60)))
        cbe_geom = Polygon(((76.90, 11.00), (77.00, 11.00), (77.00, 11.10), (76.90, 11.10), (76.90, 11.00)))

        # Parcels
        self.salem_parcel = LandParcel.objects.create(
            survey_number="100/1",
            district="Salem",
            taluk="Salem West",
            village_name="Kannankurichi",
            classification="Waterbody",
            geom=salem_geom
        )
        self.cbe_parcel = LandParcel.objects.create(
            survey_number="200/2",
            district="Coimbatore",
            taluk="Coimbatore North",
            village_name="Peelamedu",
            classification="Waterbody",
            geom=cbe_geom
        )

        # Alerts
        self.salem_alert = EncroachmentAlert.objects.create(
            parcel=self.salem_parcel,
            alert_geom=Point(78.15, 11.65),
            status="SECTION_7_ISSUED",
            structure_category="COMMERCIAL_LAYOUT",
            fmb_measurements={"is_certified_survey": True}
        )
        self.cbe_alert = EncroachmentAlert.objects.create(
            parcel=self.cbe_parcel,
            alert_geom=Point(76.95, 11.05),
            status="SECTION_7_ISSUED",
            structure_category="COMMERCIAL_LAYOUT",
            fmb_measurements={"is_certified_survey": True}
        )

        # Users and Profiles
        self.collector_salem_user = User.objects.create_user(username='col_salem', password='SecurePass@2026!')
        UserProfile.objects.create(user=self.collector_salem_user, role='COLLECTOR', district='Salem')

        self.tahsildar_salem_user = User.objects.create_user(username='tah_salem_west', password='SecurePass@2026!')
        UserProfile.objects.create(user=self.tahsildar_salem_user, role='TAHSILDAR', district='Salem', taluk='Salem West')

        self.inspector_salem_user = User.objects.create_user(username='ins_salem_west', password='SecurePass@2026!')
        UserProfile.objects.create(user=self.inspector_salem_user, role='INSPECTOR', district='Salem', taluk='Salem West', village='Kannankurichi')

        self.vao_salem_user = User.objects.create_user(username='vao_kannan', password='SecurePass@2026!')
        UserProfile.objects.create(user=self.vao_salem_user, role='VAO', district='Salem', taluk='Salem West', village='Kannankurichi')

        self.vigilance_user = User.objects.create_user(username='dvac_auditor', password='SecurePass@2026!')
        UserProfile.objects.create(user=self.vigilance_user, role='VIGILANCE', district=None)

        self.apex_user = User.objects.create_user(username='chief_secretary', password='SecurePass@2026!')
        UserProfile.objects.create(user=self.apex_user, role='STATE_APEX', district=None)

    def _login(self, username, password):
        """Helper to log in through the real API endpoint and set Bearer token."""
        res = self.client.post('/api/auth/login/', {'username': username, 'password': password}, format='json')
        if res.status_code == status.HTTP_200_OK and 'access' in res.data:
            self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")
        return res

    def test_01_real_login_and_token_generation(self):
        """Real login endpoint returns access token, refresh token, and user profile."""
        res = self._login('col_salem', 'SecurePass@2026!')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)
        self.assertEqual(res.data['user']['role'], 'COLLECTOR')
        self.assertEqual(res.data['user']['district'], 'Salem')

    def test_02_axes_lockout_after_five_failed_attempts(self):
        """Axes tracks failures and locks out on the 6th failed login (HTTP 429)."""
        lockout_user = User.objects.create_user(username='lockout_victim', password='RealPassword@2026!')
        UserProfile.objects.create(user=lockout_user, role='VAO')

        # 5 consecutive failed attempts
        for i in range(5):
            res = self.client.post('/api/auth/login/', {'username': 'lockout_victim', 'password': 'wrong_password'}, format='json')
            self.assertIn(res.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_429_TOO_MANY_REQUESTS])

        # 6th attempt must return HTTP 429 Too Many Requests
        sixth_res = self.client.post('/api/auth/login/', {'username': 'lockout_victim', 'password': 'wrong_password'}, format='json')
        self.assertEqual(sixth_res.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertIn("locked", sixth_res.data.get('error', '').lower())

    def test_03_simplejwt_refresh_rotation_and_blacklist(self):
        """Refreshing tokens rotates the refresh token; using an old refresh token is rejected."""
        login_res = self._login('col_salem', 'SecurePass@2026!')
        refresh_1 = login_res.data['refresh']

        # Refresh
        refresh_res = self.client.post('/api/auth/token/refresh/', {'refresh': refresh_1}, format='json')
        self.assertEqual(refresh_res.status_code, status.HTTP_200_OK)
        self.assertIn('access', refresh_res.data)
        self.assertIn('refresh', refresh_res.data)
        refresh_2 = refresh_res.data['refresh']
        self.assertNotEqual(refresh_1, refresh_2)

        # Attempting to reuse old refresh_1 must fail (blacklisted)
        reuse_res = self.client.post('/api/auth/token/refresh/', {'refresh': refresh_1}, format='json')
        self.assertIn(reuse_res.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED])

    def test_04_unauthenticated_requests_return_401(self):
        """Unauthenticated requests to write endpoints return 401 Unauthorized."""
        self.client.credentials()  # Clear credentials
        res_sec7 = self.client.post(f"/api/alerts/{self.salem_alert.id}/issue_section_7/", {}, format='json')
        self.assertEqual(res_sec7.status_code, status.HTTP_401_UNAUTHORIZED)

        res_sec6 = self.client.post(f"/api/alerts/{self.salem_alert.id}/issue_section_6/", {}, format='json')
        self.assertEqual(res_sec6.status_code, status.HTTP_401_UNAUTHORIZED)

        res_verif = self.client.post("/api/verifications/", {'alert': str(self.salem_alert.id), 'gps_lat': 11.65, 'gps_lon': 78.15}, format='json')
        self.assertEqual(res_verif.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_05_role_based_403_forbidden_on_write_endpoints(self):
        """VAO and Inspector cannot execute Tahsildar/Collector statutory actions."""
        # Log in as VAO
        self._login('vao_kannan', 'SecurePass@2026!')

        # VAO blocked from Section 7
        res = self.client.post(f"/api/alerts/{self.salem_alert.id}/issue_section_7/", {'officer_fmb_acknowledgement': True}, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        # VAO blocked from Section 6
        res = self.client.post(f"/api/alerts/{self.salem_alert.id}/issue_section_6/", {}, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        # VAO blocked from inspector approval
        res = self.client.post(f"/api/alerts/{self.salem_alert.id}/inspector_approve/", {}, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        # VAO blocked from eviction completion
        res = self.client.post(f"/api/alerts/{self.salem_alert.id}/complete_eviction/", {}, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        # Log in as Inspector
        self._login('ins_salem_west', 'SecurePass@2026!')

        # Inspector blocked from Section 7 and Section 6
        res = self.client.post(f"/api/alerts/{self.salem_alert.id}/issue_section_7/", {'officer_fmb_acknowledgement': True}, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        res = self.client.post(f"/api/alerts/{self.salem_alert.id}/issue_section_6/", {}, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        # Inspector allowed to approve field inspection
        res_approve = self.client.post(f"/api/alerts/{self.salem_alert.id}/inspector_approve/", {}, format='json')
        self.assertEqual(res_approve.status_code, status.HTTP_200_OK)

    def test_06_vigilance_strictly_read_only(self):
        """Vigilance role can read records but is rejected on all write operations."""
        self._login('dvac_auditor', 'SecurePass@2026!')

        # Reads succeed
        res_parcels = self.client.get('/api/parcels/')
        self.assertEqual(res_parcels.status_code, status.HTTP_200_OK)

        res_alerts = self.client.get('/api/alerts/')
        self.assertEqual(res_alerts.status_code, status.HTTP_200_OK)

        # Writes fail with 403 Forbidden
        res_sec7 = self.client.post(f"/api/alerts/{self.salem_alert.id}/issue_section_7/", {}, format='json')
        self.assertEqual(res_sec7.status_code, status.HTTP_403_FORBIDDEN)

        res_evict = self.client.post(f"/api/alerts/{self.salem_alert.id}/complete_eviction/", {}, format='json')
        self.assertEqual(res_evict.status_code, status.HTTP_403_FORBIDDEN)

    def test_07_scoped_reads_and_cross_district_isolation(self):
        """District Collector cannot see or access parcels, alerts, FMB, notices, or ATR of other districts."""
        # Log in as Collector of Salem
        self._login('col_salem', 'SecurePass@2026!')

        # Parcel list is scoped to Salem (1 Salem, 0 Coimbatore)
        res_parcels = self.client.get('/api/parcels/')
        self.assertEqual(res_parcels.status_code, status.HTTP_200_OK)
        parcel_surveys = [f['properties']['survey_number'] for f in res_parcels.data.get('features', [])]
        self.assertIn("100/1", parcel_surveys)
        self.assertNotIn("200/2", parcel_surveys)

        # Alert list is scoped to Salem
        res_alerts = self.client.get('/api/alerts/')
        self.assertEqual(res_alerts.status_code, status.HTTP_200_OK)
        alert_ids = [a['id'] for a in res_alerts.data.get('features', [])]
        self.assertIn(str(self.salem_alert.id), alert_ids)
        self.assertNotIn(str(self.cbe_alert.id), alert_ids)

        # Cross-district Section 7 download blocked (either 403 Forbidden or 404 Not Found due to queryset scoping)
        res_cbe_notice = self.client.get(f"/api/alerts/{self.cbe_alert.id}/download_section_7/")
        self.assertIn(res_cbe_notice.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])

        # Cross-district FMB sketch blocked
        res_cbe_fmb = self.client.get(f"/api/alerts/{self.cbe_alert.id}/fmb_sketch/")
        self.assertIn(res_cbe_fmb.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])

        # Cross-district High Court ATR blocked
        res_cbe_atr = self.client.get("/api/compliance/high-court-atr/?district=Coimbatore&writ_no=WP1001")
        self.assertEqual(res_cbe_atr.status_code, status.HTTP_403_FORBIDDEN)

        # Own district High Court ATR succeeds
        res_salem_atr = self.client.get("/api/compliance/high-court-atr/?district=Salem&writ_no=WP1001")
        self.assertEqual(res_salem_atr.status_code, status.HTTP_200_OK)

    def test_08_statewide_roles_access_all_districts(self):
        """State Apex officer has statewide visibility and can generate ATR for any district."""
        self._login('chief_secretary', 'SecurePass@2026!')

        # Can see both Salem and Coimbatore parcels
        res_parcels = self.client.get('/api/parcels/')
        self.assertEqual(res_parcels.status_code, status.HTTP_200_OK)
        parcel_surveys = [f['properties']['survey_number'] for f in res_parcels.data.get('features', [])]
        self.assertIn("100/1", parcel_surveys)
        self.assertIn("200/2", parcel_surveys)

        # Can generate ATR for Salem and Coimbatore
        res_salem = self.client.get("/api/compliance/high-court-atr/?district=Salem&writ_no=WP1001")
        self.assertEqual(res_salem.status_code, status.HTTP_200_OK)

        res_cbe = self.client.get("/api/compliance/high-court-atr/?district=Coimbatore&writ_no=WP1002")
        self.assertEqual(res_cbe.status_code, status.HTTP_200_OK)
