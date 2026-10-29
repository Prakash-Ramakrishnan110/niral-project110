from datetime import timedelta
from django.test import TestCase
from django.utils import timezone
from django.contrib.auth.models import User
from django.contrib.gis.geos import Polygon, Point
from rest_framework.test import APIClient
from rest_framework import status
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
    ChangeFeedEvent,
    IdempotencyKeyRecord,
)
from core.services.case_state_machine import (
    CaseStateMachine,
    ConcurrencyConflictError,
)
from core.services.idempotency import handle_idempotent_request
from core.services.change_feed import ChangeFeedService


class ConcurrencyAndSyncTests(TestCase):
    def setUp(self):
        # 1. Administrative Hierarchy
        self.state = State.objects.create(code='TN', name_en='Tamil Nadu', name_ta='தமிழ்நாடு')
        self.district = District.objects.create(state=self.state, code='TN-SLM', name_en='Salem', name_ta='சேலம்')
        self.taluk = Taluk.objects.create(district=self.district, code='TN-SLM-SLMW', name_en='Salem West', name_ta='சேலம் மேற்கு')
        self.village = RevenueVillage.objects.create(district=self.district, taluk=self.taluk, code='TN-SLM-SLMW-KNK', name_en='Kannankurichi', name_ta='கண்ணங்குறிச்சி')

        # 2. District Legal Config
        self.config = DistrictLegalConfig.objects.create(
            district='Salem',
            tier1_confidence_min=0.80,
            tier2_confidence_min=0.50,
            fmb_certified_survey_required=False,
        )

        # 3. Parcel
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

        # 4. Users
        self.tahsildar = User.objects.create_user(username='tah_user', password='Pass@123Tahsildar!')
        OfficerAssignment.objects.create(user=self.tahsildar, role='TAHSILDAR', district=self.district, taluk=self.taluk, is_active=True)

        self.vao = User.objects.create_user(username='vao_user', password='Pass@123Vao!')
        OfficerAssignment.objects.create(user=self.vao, role='VAO', district=self.district, taluk=self.taluk, village=self.village, is_active=True)

        self.client = APIClient()

    def _create_alert(self, status='NEW', version=1):
        pt = Point(78.151, 11.651, srid=4326)
        return EncroachmentAlert.objects.create(
            parcel=self.parcel,
            alert_geom=pt,
            status=status,
            confidence_score=0.85,
            version=version,
        )

    def test_optimistic_concurrency_locking(self):
        """Alert update with matching version succeeds and increments; stale version raises ConcurrencyConflictError."""
        alert = self._create_alert(status='NEW', version=1)

        # 1. Update with matching expected_version=1 succeeds
        success, msg, event = CaseStateMachine.transition(
            alert, CaseStateMachine.STATE_VAO_ASSIGNED,
            actor=self.tahsildar, reason="Assigning to VAO",
            expected_version=1
        )
        self.assertTrue(success)
        alert.refresh_from_db()
        self.assertEqual(alert.version, 2)
        self.assertEqual(alert.status, CaseStateMachine.STATE_VAO_ASSIGNED)

        # 2. Concurrent update from second officer with stale expected_version=1 must be blocked
        with self.assertRaises(ConcurrencyConflictError) as ctx:
            CaseStateMachine.transition(
                alert, CaseStateMachine.STATE_WATCHING,
                actor=self.tahsildar, reason="Concurrent update attempt",
                expected_version=1  # Stale version!
            )
        self.assertEqual(ctx.exception.current_version, 2)
        self.assertEqual(ctx.exception.expected_version, 1)

    def test_idempotency_handling(self):
        """Duplicate request with same idempotency key returns cached response without duplicate DB insert."""
        key = "idemp-mobile-uuid-999"
        endpoint = "/api/verifications/"
        payload = {"alert": "alert-uuid", "verdict": "ENCROACHMENT_CONFIRMED"}

        call_count = [0]

        def _execute():
            call_count[0] += 1
            return 201, {"id": "v-123", "status": "SAVED"}

        # First call: executes function
        code1, resp1, cached1 = handle_idempotent_request(key, endpoint, self.vao, payload, _execute)
        self.assertEqual(code1, 201)
        self.assertFalse(cached1)
        self.assertEqual(call_count[0], 1)
        self.assertEqual(IdempotencyKeyRecord.objects.filter(key=key).count(), 1)

        # Second call with same key and payload: returns cached result without re-executing
        code2, resp2, cached2 = handle_idempotent_request(key, endpoint, self.vao, payload, _execute)
        self.assertEqual(code2, 201)
        self.assertTrue(cached2)
        self.assertEqual(call_count[0], 1)  # Execute was NOT called again!
        self.assertEqual(resp2, resp1)

        # Third call with same key but altered payload: 422 conflict
        altered_payload = {"alert": "alert-uuid", "verdict": "FALSE_POSITIVE"}
        code3, resp3, cached3 = handle_idempotent_request(key, endpoint, self.vao, altered_payload, _execute)
        self.assertEqual(code3, 422)
        self.assertFalse(cached3)
        self.assertIn("Idempotency Conflict", resp3['error'])

    def test_commit_safe_change_feed(self):
        """State transitions automatically publish ChangeFeedEvent queryable via safe-horizon cursor."""
        alert = self._create_alert(status='NEW', version=1)

        # 1. State machine transition generates ChangeFeedEvent
        CaseStateMachine.transition(
            alert, CaseStateMachine.STATE_VAO_ASSIGNED,
            actor=self.tahsildar, reason="Assigned to VAO",
            expected_version=1
        )

        # Verify ChangeFeedEvent was created
        events = ChangeFeedEvent.objects.filter(entity_id=str(alert.id))
        self.assertEqual(events.count(), 1)
        ev = events.first()
        self.assertEqual(ev.entity_type, 'ALERT')
        self.assertEqual(ev.version, 2)
        self.assertEqual(ev.scope_district, 'Salem')

        # 2. ChangeFeedService retrieves changes with safe horizon
        res = ChangeFeedService.get_changes(since_cursor=None, limit=10, district='Salem', safe_horizon_seconds=0.0)
        self.assertGreaterEqual(res['count'], 1)
        found = any(c['entity_id'] == str(alert.id) for c in res['changes'])
        self.assertTrue(found)

        # 3. Next cursor query returns 0 new changes
        next_cursor = res['next_cursor']
        res2 = ChangeFeedService.get_changes(since_cursor=next_cursor, limit=10, district='Salem', safe_horizon_seconds=0.0)
        self.assertEqual(res2['count'], 0)

    def test_sync_changes_api_endpoint(self):
        """GET /api/sync/changes/ returns authenticated officer changes."""
        self.client.force_authenticate(user=self.tahsildar)
        alert = self._create_alert(status='NEW')

        # Transition alert
        CaseStateMachine.transition(
            alert, CaseStateMachine.STATE_VAO_ASSIGNED,
            actor=self.tahsildar, reason="Assigned"
        )

        response = self.client.get('/api/sync/changes/', {'limit': 20})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('changes', data)
        self.assertIn('next_cursor', data)
        self.assertIn('safe_horizon_timestamp', data)
