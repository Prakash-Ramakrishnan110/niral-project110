import datetime
from django.test import TestCase
from django.contrib.auth.models import User
from django.contrib.gis.geos import Polygon, Point
from django.utils import timezone
from core.models import (
    State,
    District,
    Taluk,
    RevenueVillage,
    LandParcel,
    EncroachmentAlert,
    DistrictLegalConfig,
    CaseAuditEvent,
    OfficerAssignment,
    StatutoryNoticeAuthority,
)
from core.services.case_state_machine import (
    CaseStateMachine,
    StateMachineError,
    IllegalTransitionError,
    TransitionGuardError,
    AuthorizationError,
)


class CaseStateMachineTests(TestCase):
    def setUp(self):
        # Administrative Hierarchy
        self.state = State.objects.create(code='TN', name_en='Tamil Nadu', name_ta='தமிழ்நாடு')
        self.district = District.objects.create(state=self.state, code='TN-SLM', name_en='Salem', name_ta='சேலம்')
        self.taluk = Taluk.objects.create(district=self.district, code='TN-SLM-SLMW', name_en='Salem West', name_ta='சேலம் மேற்கு')
        self.village = RevenueVillage.objects.create(district=self.district, taluk=self.taluk, code='TN-SLM-SLMW-KNK', name_en='Kannankurichi', name_ta='கண்ணங்குறிச்சி')

        # District Configuration
        self.config = DistrictLegalConfig.objects.create(
            district='Salem',
            fmb_certified_survey_required=True,
            default_no_reply_action=None,  # Unknown rule by default
        )

        # Land Parcel
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

        # Users & Assignments
        self.collector_user = User.objects.create_user(username='col_user', password='Pass@123Collector!')
        OfficerAssignment.objects.create(user=self.collector_user, role='COLLECTOR', district=self.district, is_active=True)

        self.tahsildar_user = User.objects.create_user(username='tah_user', password='Pass@123Tahsildar!')
        OfficerAssignment.objects.create(user=self.tahsildar_user, role='TAHSILDAR', district=self.district, taluk=self.taluk, is_active=True)

        self.inspector_user = User.objects.create_user(username='ri_user', password='Pass@123Inspector!')
        OfficerAssignment.objects.create(user=self.inspector_user, role='INSPECTOR', district=self.district, taluk=self.taluk, is_active=True)

        self.vao_user = User.objects.create_user(username='vao_user', password='Pass@123Vao!')
        OfficerAssignment.objects.create(user=self.vao_user, role='VAO', district=self.district, taluk=self.taluk, village=self.village, is_active=True)

        self.vigilance_user = User.objects.create_user(username='dvac_user', password='Pass@123Vigilance!')
        OfficerAssignment.objects.create(user=self.vigilance_user, role='VIGILANCE', is_active=True)

    def _create_alert(self, status='NEW', structure_category='COMMERCIAL_LAYOUT', confidence=0.85):
        pt = Point(78.151, 11.651, srid=4326)
        return EncroachmentAlert.objects.create(
            parcel=self.parcel,
            alert_geom=pt,
            status=status,
            confidence_score=confidence,
            structure_category=structure_category,
        )

    def test_canonical_pipeline_progression(self):
        """Test legitimate progression through statutory notice and hearing to eviction."""
        alert = self._create_alert(status='NEW')

        # 1. Tahsildar assigns VAO
        success, msg, event = CaseStateMachine.transition(
            alert, CaseStateMachine.STATE_VAO_ASSIGNED,
            actor=self.tahsildar_user, reason="Assigned to Kannankurichi VAO for site inspection."
        )
        self.assertTrue(success)
        self.assertEqual(alert.status, CaseStateMachine.STATE_VAO_ASSIGNED)
        self.assertEqual(event.from_state, 'NEW')
        self.assertEqual(event.to_state, CaseStateMachine.STATE_VAO_ASSIGNED)

        # 2. VAO enters field verification
        CaseStateMachine.transition(
            alert, CaseStateMachine.STATE_IN_FIELD_VERIFICATION,
            actor=self.vao_user, reason="VAO on-site."
        )
        self.assertEqual(alert.status, CaseStateMachine.STATE_IN_FIELD_VERIFICATION)

        # 3. VAO submits encroachment confirmed
        CaseStateMachine.transition(
            alert, CaseStateMachine.STATE_VAO_SUBMITTED,
            actor=self.vao_user, reason="Confirmed commercial shed encroachment."
        )
        self.assertEqual(alert.status, CaseStateMachine.STATE_VAO_SUBMITTED)

        # 4. Inspector endorses
        CaseStateMachine.transition(
            alert, CaseStateMachine.STATE_INSPECTOR_APPROVED,
            actor=self.inspector_user, reason="RI verified survey boundary match."
        )
        self.assertEqual(alert.status, CaseStateMachine.STATE_INSPECTOR_APPROVED)

        # 5. Notice Preparation
        CaseStateMachine.transition(
            alert, CaseStateMachine.STATE_NOTICE_PREPARATION,
            actor=self.tahsildar_user, reason="Preparing Form 7 notice under Act III of 1905."
        )
        self.assertEqual(alert.status, CaseStateMachine.STATE_NOTICE_PREPARATION)

        # 6. Issue Section 7 Notice (with indicative FMB override acknowledgement)
        CaseStateMachine.transition(
            alert, CaseStateMachine.STATE_SECTION_7_ISSUED,
            actor=self.tahsildar_user, reason="Section 7 show cause notice signed.",
            metadata={
                'fmb_certified_acknowledged': True,
                'fmb_acknowledgement_reason': 'Proceeding with verified cadastral polygon pending sub-taluk certified survey.',
            }
        )
        self.assertEqual(alert.status, CaseStateMachine.STATE_SECTION_7_ISSUED)
        self.assertTrue(alert.fmb_certified_acknowledged)

        # 7. Move to Notice Reply Pending
        CaseStateMachine.transition(
            alert, CaseStateMachine.STATE_NOTICE_REPLY_PENDING,
            actor=self.tahsildar_user, reason="Notice served on encroacher."
        )
        self.assertEqual(alert.status, CaseStateMachine.STATE_NOTICE_REPLY_PENDING)

        # 8. Schedule Hearing upon reply
        CaseStateMachine.transition(
            alert, CaseStateMachine.STATE_HEARING_SCHEDULED,
            actor=self.tahsildar_user, reason="Reply received; hearing set for Monday.",
            metadata={'reply_received': True}
        )
        self.assertEqual(alert.status, CaseStateMachine.STATE_HEARING_SCHEDULED)

        # 9. Issue Section 6 Order
        CaseStateMachine.transition(
            alert, CaseStateMachine.STATE_SECTION_6_ORDERED,
            actor=self.tahsildar_user, reason="Hearing concluded; encroacher failed to produce title deed."
        )
        self.assertEqual(alert.status, CaseStateMachine.STATE_SECTION_6_ORDERED)

        # 10. Eviction Scheduled & Executed
        CaseStateMachine.transition(
            alert, CaseStateMachine.STATE_EVICTION_SCHEDULED,
            actor=self.collector_user, reason="Collector approved joint police eviction."
        )
        self.assertEqual(alert.status, CaseStateMachine.STATE_EVICTION_SCHEDULED)

        CaseStateMachine.transition(
            alert, CaseStateMachine.STATE_EVICTION_EXECUTED,
            actor=self.collector_user, reason="Demolition executed; land restored to Waterbody registry."
        )
        self.assertEqual(alert.status, CaseStateMachine.STATE_EVICTION_EXECUTED)

        # 11. Verify Audit Events recorded
        events_count = CaseAuditEvent.objects.filter(alert=alert).count()
        self.assertEqual(events_count, 11)

    def test_illegal_transition_blocked(self):
        """Illegal state transitions must be denied."""
        alert = self._create_alert(status='NEW')

        # NEW directly to SECTION_6_ORDERED is illegal
        with self.assertRaises(IllegalTransitionError):
            CaseStateMachine.transition(
                alert, CaseStateMachine.STATE_SECTION_6_ORDERED,
                actor=self.collector_user, reason="Attempting premature eviction order."
            )

        # Alert status should remain unmodified
        alert.refresh_from_db()
        self.assertEqual(alert.status, 'NEW')

    def test_vulnerable_housing_guard_blocks_section_6(self):
        """Vulnerable housing cannot be ordered for eviction; must route to rehabilitation."""
        alert = self._create_alert(
            status=CaseStateMachine.STATE_HEARING_SCHEDULED,
            structure_category='VULNERABLE_HOUSING'
        )

        # Section 6 MUST be blocked by guard
        with self.assertRaises(TransitionGuardError) as ctx:
            CaseStateMachine.transition(
                alert, CaseStateMachine.STATE_SECTION_6_ORDERED,
                actor=self.tahsildar_user, reason="Attempting eviction of hut."
            )
        self.assertIn("Humanitarian policy mandates routing to TNUHDB", str(ctx.exception))

        # Legitimate humanitarian route to TNUHDB succeeds
        success, msg, event = CaseStateMachine.transition(
            alert, CaseStateMachine.STATE_REHABILITATION_ROUTED,
            actor=self.tahsildar_user, reason="Referred to TNUHDB Salem division for tenement allotment."
        )
        self.assertTrue(success)
        self.assertEqual(alert.status, CaseStateMachine.STATE_REHABILITATION_ROUTED)

    def test_court_stay_hold_pauses_and_resumes_clocks(self):
        """Court stay pauses statutory clocks and restores them upon vacation."""
        now = timezone.now()
        deadline = now + datetime.timedelta(days=10)
        alert = self._create_alert(status=CaseStateMachine.STATE_SECTION_7_ISSUED)
        alert.sla_deadline = deadline
        alert.save()

        # Record Court Stay
        success, msg, event = CaseStateMachine.transition(
            alert, CaseStateMachine.STATE_COURT_STAY_HOLD,
            actor=self.collector_user, reason="High Court interim stay in W.P. No. 1024.",
            metadata={'stay_order_no': 'WP-1024-2026'}
        )
        self.assertTrue(success)
        self.assertEqual(alert.status, CaseStateMachine.STATE_COURT_STAY_HOLD)
        self.assertEqual(alert.previous_state, CaseStateMachine.STATE_SECTION_7_ISSUED)
        self.assertIsNotNone(alert.stay_commenced_at)
        self.assertGreater(alert.paused_sla_remaining_seconds, 800000)

        # Vacate Stay -> returns to previous state and restores deadline
        success, msg, event = CaseStateMachine.transition(
            alert, CaseStateMachine.STATE_SECTION_7_ISSUED,
            actor=self.collector_user, reason="High Court vacated interim stay upon AG counter-affidavit."
        )
        self.assertTrue(success)
        self.assertEqual(alert.status, CaseStateMachine.STATE_SECTION_7_ISSUED)
        self.assertIsNone(alert.previous_state)
        self.assertIsNone(alert.stay_commenced_at)
        self.assertIsNone(alert.paused_sla_remaining_seconds)
        self.assertGreater(alert.sla_deadline, timezone.now())

    def test_section_7_fmb_certified_survey_guard(self):
        """Section 7 without certified FMB requires explicit acknowledgement."""
        alert = self._create_alert(status=CaseStateMachine.STATE_NOTICE_PREPARATION)
        alert.fmb_measurements = {'certified': False}
        alert.save()

        # Issuing Section 7 without acknowledgement fails
        with self.assertRaises(TransitionGuardError) as ctx:
            CaseStateMachine.transition(
                alert, CaseStateMachine.STATE_SECTION_7_ISSUED,
                actor=self.tahsildar_user, reason="Issuing notice with indicative sketch."
            )
        self.assertIn("requires certified FMB survey measurements", str(ctx.exception))

        # With explicit acknowledgement and reason, succeeds
        success, msg, event = CaseStateMachine.transition(
            alert, CaseStateMachine.STATE_SECTION_7_ISSUED,
            actor=self.tahsildar_user, reason="Form 7 issued.",
            metadata={
                'fmb_certified_acknowledged': True,
                'fmb_acknowledgement_reason': 'Urgent public waterbody protection; certified FMB ordered in parallel.',
            }
        )
        self.assertTrue(success)
        self.assertEqual(alert.status, CaseStateMachine.STATE_SECTION_7_ISSUED)

    def test_pandal_grace_period_guard(self):
        """Pandal grace period is only for TEMPORARY_PANDAL and cannot exit directly to eviction."""
        commercial_alert = self._create_alert(
            status=CaseStateMachine.STATE_VAO_ASSIGNED,
            structure_category='COMMERCIAL_LAYOUT'
        )

        # Commercial shed cannot get pandal grace
        with self.assertRaises(TransitionGuardError):
            CaseStateMachine.transition(
                commercial_alert, CaseStateMachine.STATE_PANDAL_GRACE_PERIOD,
                actor=self.tahsildar_user, reason="Granting festival grace."
            )

        # Temporary Pandal alert gets grace
        pandal_alert = self._create_alert(
            status=CaseStateMachine.STATE_VAO_ASSIGNED,
            structure_category='TEMPORARY_PANDAL'
        )
        success, msg, event = CaseStateMachine.transition(
            pandal_alert, CaseStateMachine.STATE_PANDAL_GRACE_PERIOD,
            actor=self.tahsildar_user, reason="Festival pandal granted 7-day permission."
        )
        self.assertTrue(success)

        # Expiry cannot jump directly to Section 6
        with self.assertRaises(StateMachineError) as ctx:
            CaseStateMachine.transition(
                pandal_alert, CaseStateMachine.STATE_SECTION_6_ORDERED,
                actor=self.tahsildar_user, reason="Festival over, ordering eviction."
            )

        # Can resolve cleanly
        success, msg, event = CaseStateMachine.transition(
            pandal_alert, CaseStateMachine.STATE_TEMPORARY_OCCUPANCY_RESOLVED,
            actor=self.tahsildar_user, reason="Organizers dismantled pandal."
        )
        self.assertTrue(success)

    def test_notice_reply_pending_unknown_rule_denies_by_default(self):
        """If notice reply is not received and statutory default rule is unconfigured, transition is denied."""
        alert = self._create_alert(status=CaseStateMachine.STATE_NOTICE_REPLY_PENDING)

        # No reply received, config has default_no_reply_action=None
        with self.assertRaises(TransitionGuardError) as ctx:
            CaseStateMachine.transition(
                alert, CaseStateMachine.STATE_SECTION_6_ORDERED,
                actor=self.tahsildar_user, reason="15 days elapsed.",
                metadata={'reply_received': False}
            )
        self.assertIn("LEGAL RULE UNKNOWN", str(ctx.exception))

    def test_false_positive_peer_audit_guard(self):
        """Field false positive cannot close case directly; must go through independent peer audit."""
        alert = self._create_alert(status=CaseStateMachine.STATE_VAO_ASSIGNED)

        # VAO claims false positive
        success, msg, event = CaseStateMachine.transition(
            alert, CaseStateMachine.STATE_FALSE_POSITIVE_CLAIMED,
            actor=self.vao_user, reason="Agricultural boundary only, not encroachment."
        )
        self.assertTrue(success)
        self.assertTrue(alert.is_peer_audited)

        # Moves to peer audit pending
        CaseStateMachine.transition(
            alert, CaseStateMachine.STATE_PEER_AUDIT_PENDING,
            actor=self.inspector_user, reason="Assigned to Flying Squad RI for independent audit."
        )

        # Peer audit confirmed
        success, msg, event = CaseStateMachine.transition(
            alert, CaseStateMachine.STATE_FALSE_POSITIVE_CONFIRMED,
            actor=self.inspector_user, reason="Peer audit confirmed private patta.",
            metadata={'peer_auditor_name': 'RI Flying Squad'}
        )
        self.assertTrue(success)
        self.assertEqual(alert.status, CaseStateMachine.STATE_FALSE_POSITIVE_CONFIRMED)
        self.assertEqual(alert.peer_auditor_name, 'RI Flying Squad')

    def test_vigilance_read_only_lock(self):
        """Vigilance officers are strictly denied from executing state transitions."""
        alert = self._create_alert(status='NEW')
        with self.assertRaises(AuthorizationError) as ctx:
            CaseStateMachine.transition(
                alert, CaseStateMachine.STATE_VAO_ASSIGNED,
                actor=self.vigilance_user, reason="Vigilance attempting to assign case."
            )
        self.assertIn("read-only audit access", str(ctx.exception))
