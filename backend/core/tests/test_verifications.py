"""
Unit tests for FieldVerification endpoint and server-driven state machine.
Verifies:
1. Officer identity is derived strictly from authenticated JWT user (client override ignored).
2. Client cannot supply arbitrary alert status; verdict drives the state transition.
3. Verdict ENCROACHMENT_CONFIRMED sets alert status to VAO_SUBMITTED.
4. Verdict FALSE_POSITIVE sets alert status to FALSE_POSITIVE.
5. Verdict UNCERTAIN_NEEDS_REVISIT sets alert status to VAO_ASSIGNED.
6. Geofence violation (>500m) returns 400 unless explicit override flag is provided.
7. Cross-jurisdictional verification returns 403 Forbidden.
8. Verification records are persisted in the database.
"""
from django.contrib.auth.models import User
from django.contrib.gis.geos import Polygon, Point
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from core.models import LandParcel, EncroachmentAlert, FieldVerification, UserProfile
from .base import SafeAPITestCase


class FieldVerificationWorkflowTests(SafeAPITestCase):

    def setUp(self):
        super().setUp()
        self.vao_user = User.objects.create_user(username='vao_test', first_name='Murugan', last_name='VAO', password='TestPass@2026!')
        UserProfile.objects.create(user=self.vao_user, role='VAO', district='Salem', taluk='Salem West', village='Kannankurichi')
        token = RefreshToken.for_user(self.vao_user).access_token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        # Salem Parcel & Alert (within VAO jurisdiction)
        # Bounded around (78.15, 11.65)
        poly = Polygon(((78.14, 11.64), (78.16, 11.64), (78.16, 11.66), (78.14, 11.66), (78.14, 11.64)))
        self.parcel = LandParcel.objects.create(
            survey_number="150/1",
            district="Salem",
            taluk="Salem West",
            village_name="Kannankurichi",
            classification="Water Body Poramboke",
            geom=poly
        )
        self.alert = EncroachmentAlert.objects.create(
            parcel=self.parcel,
            alert_geom=Point(78.15, 11.65),
            status="NEW",
            confidence_score=0.88
        )

        # Coimbatore Parcel & Alert (outside VAO jurisdiction)
        cbe_poly = Polygon(((76.95, 11.00), (76.96, 11.00), (76.96, 11.01), (76.95, 11.01), (76.95, 11.00)))
        self.cbe_parcel = LandParcel.objects.create(
            survey_number="300/1",
            district="Coimbatore",
            taluk="Coimbatore North",
            village_name="Peelamedu",
            classification="Waterbody",
            geom=cbe_poly
        )
        self.cbe_alert = EncroachmentAlert.objects.create(
            parcel=self.cbe_parcel,
            alert_geom=Point(76.955, 11.005),
            status="NEW",
            confidence_score=0.90
        )

    def test_verdict_encroachment_confirmed_transitions_to_vao_submitted(self):
        """Submitting ENCROACHMENT_CONFIRMED transitions alert to VAO_SUBMITTED and records server officer."""
        url = '/api/verifications/'
        payload = {
            "alert": str(self.alert.id),
            "verdict": "ENCROACHMENT_CONFIRMED",
            "gps_lat": 11.6501,
            "gps_lon": 78.1501,
            "remarks": "Concrete foundation encroaching into waterbody boundary",
            "officer_name": "FAKE_CLIENT_NAME",  # Must be ignored
            "status": "SECTION_7_ISSUED"          # Must be ignored
        }
        res = self.client.post(url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        # Verify FieldVerification record
        verif = FieldVerification.objects.get(alert=self.alert)
        self.assertEqual(verif.verdict, "ENCROACHMENT_CONFIRMED")
        self.assertIn("Murugan VAO (VAO)", verif.officer_name)
        self.assertNotIn("FAKE_CLIENT_NAME", verif.officer_name)

        # Verify state machine transition
        self.alert.refresh_from_db()
        self.assertEqual(self.alert.status, "VAO_SUBMITTED")
        self.assertNotEqual(self.alert.status, "SECTION_7_ISSUED")
        self.assertIn("[ENCROACHMENT_CONFIRMED]", self.alert.resolution_notes)

    def test_verdict_false_positive_transitions_to_false_positive(self):
        """VAO reporting no encroachment transitions alert directly to FALSE_POSITIVE."""
        url = '/api/verifications/'
        payload = {
            "alert": str(self.alert.id),
            "verdict": "FALSE_POSITIVE",
            "gps_lat": 11.6501,
            "gps_lon": 78.1501,
            "remarks": "On-site inspection confirms seasonal water siltation, no physical structure"
        }
        res = self.client.post(url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        self.alert.refresh_from_db()
        self.assertEqual(self.alert.status, "FALSE_POSITIVE")
        self.assertIn("[FALSE_POSITIVE]", self.alert.resolution_notes)

    def test_verdict_uncertain_needs_revisit(self):
        """Uncertain verdict retains alert at VAO_ASSIGNED with revisit notes."""
        url = '/api/verifications/'
        payload = {
            "alert": str(self.alert.id),
            "verdict": "UNCERTAIN_NEEDS_REVISIT",
            "gps_lat": 11.6501,
            "gps_lon": 78.1501,
            "remarks": "Dense thorny vegetation obscures baseline stone, joint survey scheduled"
        }
        res = self.client.post(url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        self.alert.refresh_from_db()
        self.assertEqual(self.alert.status, "VAO_ASSIGNED")

    def test_geofence_violation_blocks_submission(self):
        """GPS coordinate far outside parcel (>15m) returns 400, and requires audited supervisor override."""
        url = '/api/verifications/'
        payload = {
            "alert": str(self.alert.id),
            "verdict": "ENCROACHMENT_CONFIRMED",
            "gps_lat": 12.5000, # Far away
            "gps_lon": 79.5000,
            "remarks": "Trying to verify from afar"
        }
        res = self.client.post(url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Geofence Check Failed", res.data.get("error", ""))
        self.assertIn("statutory limit of 15.0m", res.data.get("error", ""))

        # VAO attempting to override unilaterally is rejected with 403 Forbidden
        payload["supervisor_override"] = True
        payload["supervisor_override_reason"] = "Physical flooding prevented approach within 15m"
        res_vao_override = self.client.post(url, payload, format='json')
        self.assertEqual(res_vao_override.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("restricted to authorized supervisors", res_vao_override.data.get("error", ""))

        # Switch to supervisor credentials
        supervisor_user = User.objects.create_user(username='tah_sup', first_name='Tahsildar', last_name='Sup', password='TestPass@2026!')
        UserProfile.objects.create(user=supervisor_user, role='TAHSILDAR', district='Salem', taluk='Salem West')
        sup_token = RefreshToken.for_user(supervisor_user).access_token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {sup_token}')

        # Supervisor with short reason (<15 chars) is rejected
        payload["supervisor_override_reason"] = "Flooded area"
        res_short = self.client.post(url, payload, format='json')
        self.assertEqual(res_short.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("minimum 15 characters", res_short.data.get("error", ""))

        # Supervisor with detailed justification succeeds and creates CaseAuditEvent
        payload["supervisor_override_reason"] = "Severe monsoon flash flood inundated approach road; remote boundary triangulation verified."
        res_override = self.client.post(url, payload, format='json')
        self.assertEqual(res_override.status_code, status.HTTP_201_CREATED)

        from core.models import CaseAuditEvent
        audit = CaseAuditEvent.objects.filter(alert=self.alert, action='GEOFENCE_SUPERVISOR_OVERRIDE').first()
        self.assertIsNotNone(audit)
        self.assertEqual(audit.actor, supervisor_user)
        self.assertEqual(audit.actor_role, 'TAHSILDAR')
        self.assertIn("Severe monsoon", audit.reason)

    def test_cross_jurisdiction_verification_forbidden(self):
        """VAO assigned to Salem West cannot verify an alert in Coimbatore."""
        url = '/api/verifications/'
        payload = {
            "alert": str(self.cbe_alert.id),
            "verdict": "ENCROACHMENT_CONFIRMED",
            "gps_lat": 11.005,
            "gps_lon": 76.955,
            "remarks": "Attempting cross-district submission"
        }
        res = self.client.post(url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Access Denied", res.data.get("error", ""))
