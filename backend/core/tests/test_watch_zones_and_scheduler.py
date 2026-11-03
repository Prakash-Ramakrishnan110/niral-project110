"""
Unit and Integration Test Suite for Step 2:
Watch Zones, Review Scheduler, Risk Scoring, and SLA Watchdog.

Covers:
1. Due-date calculation
2. Idempotent re-run
3. Cloudy scene (NO_CLEAR_OBSERVATION) stays due
4. Per-district cadence with no hidden default
5. Pin permissions (in/out of scope: Tahsildar, RDO, Collector, CLA)
6. VAO request and approval flow
7. District pinned area quota enforcement
8. Audit events written on all lifecycle actions (and system actor recorded)
9. SLA watchdog flags without changing case state
10. No numeric day literals in scheduler code (grep test)
11. Rule-based Risk Score v1 with complete factor breakdown
"""
import re
from pathlib import Path
from datetime import timedelta, date, datetime, timezone as dt_timezone
from django.test import TestCase
from django.utils import timezone
from django.contrib.auth.models import User
from django.core.exceptions import PermissionDenied
from django.contrib.gis.geos import Polygon, MultiPolygon

from core.models import (
    WatchZone, WatchZoneAuditEvent, WatchSubscription, ParcelRisk,
    ParcelCheck, ReviewTask, LandParcel, State, District, Taluk, RevenueDivision,
    RevenueVillage, OfficerAssignment, DistrictLegalConfig, EncroachmentAlert, CaseAuditEvent
)
from core.services.watch_zone_service import (
    pin_watch_zone, approve_pin_request, retire_watch_zone,
    QuotaExceededError, resolve_district_cadence
)
from core.services.watch_scheduler import (
    calculate_zone_due_date, run_watch_zone_cadence_evaluator,
    evaluate_low_lane_recheck_watchdog, run_sla_compliance_watchdog
)
from core.services.parcel_risk_service import (
    calculate_parcel_risk, calculate_and_save_parcel_risk
)
from core.services.notification_adapter import (
    get_sandbox_outbox, clear_sandbox_outbox
)


class WatchZonesAndSchedulerTests(TestCase):
    def setUp(self):
        clear_sandbox_outbox()

        # Administrative Hierarchy
        self.state = State.objects.create(name_en='Tamil Nadu', name_ta='தமிழ்நாடு', code='TN')

        self.salem_district = District.objects.create(state=self.state, name_en='Salem', name_ta='சேலம்', code='TN-SLM')
        self.cbe_district = District.objects.create(state=self.state, name_en='Coimbatore', name_ta='கோயம்புத்தூர்', code='TN-CBE')

        self.salem_division = RevenueDivision.objects.create(
            district=self.salem_district, code='TN-SLM-DIV1', name_en='Salem Division', name_ta='சேலம் கோட்டம்'
        )
        self.mettur_division = RevenueDivision.objects.create(
            district=self.salem_district, code='TN-SLM-DIV2', name_en='Mettur Division', name_ta='மேட்டூர் கோட்டம்'
        )

        self.salem_west_taluk = Taluk.objects.create(
            district=self.salem_district, revenue_division=self.salem_division, code='TN-SLM-TK1', name_en='Salem West', name_ta='சேலம் மேற்கு'
        )
        self.salem_south_taluk = Taluk.objects.create(
            district=self.salem_district, revenue_division=self.salem_division, code='TN-SLM-TK2', name_en='Salem South', name_ta='சேலம் தெற்கு'
        )
        self.mettur_taluk = Taluk.objects.create(
            district=self.salem_district, revenue_division=self.mettur_division, code='TN-SLM-TK3', name_en='Mettur', name_ta='மேட்டூர்'
        )

        # District Legal Config (Salem has configured cadence; CBE has None)
        self.salem_legal_cfg = DistrictLegalConfig.objects.create(
            district='Salem',
            tier1_sla_days=2,
            tier2_sla_days=7,
            tier3_sla_days=30,
            section7_reply_window_days=15,
            section6_vacate_window_days=7,
            recheck_days_low=30,
            watch_zone_cadence_days=14,  # Configured cadence for Salem
        )

        # Users and Officer Assignments
        self.u_tahsildar_west = User.objects.create_user('tah_west', 'tah@tn.gov.in', 'pass')
        self.oa_tahsildar_west = OfficerAssignment.objects.create(
            user=self.u_tahsildar_west,
            role='TAHSILDAR',
            district=self.salem_district,
            taluk=self.salem_west_taluk,
            is_active=True
        )

        self.u_rdo_salem = User.objects.create_user('rdo_salem', 'rdo@tn.gov.in', 'pass')
        self.oa_rdo_salem = OfficerAssignment.objects.create(
            user=self.u_rdo_salem,
            role='RDO',
            district=self.salem_district,
            division=self.salem_division,
            is_active=True
        )

        self.u_collector_salem = User.objects.create_user('coll_salem', 'collector@tn.gov.in', 'pass')
        self.oa_collector_salem = OfficerAssignment.objects.create(
            user=self.u_collector_salem,
            role='COLLECTOR',
            district=self.salem_district,
            is_active=True
        )

        self.u_cla_state = User.objects.create_user('cla_state', 'cla@tn.gov.in', 'pass')
        self.oa_cla_state = OfficerAssignment.objects.create(
            user=self.u_cla_state,
            role='CLA_STATE',
            is_active=True
        )

        self.village_mookaneri = RevenueVillage.objects.create(
            district=self.salem_district,
            taluk=self.salem_west_taluk,
            code='TN-SLM-TK1-V1',
            name_en='Mookaneri Village',
            name_ta='மூக்கனேரி கிராமம்'
        )

        self.u_vao_west = User.objects.create_user('vao_west', 'vao@tn.gov.in', 'pass')
        self.oa_vao_west = OfficerAssignment.objects.create(
            user=self.u_vao_west,
            role='VAO',
            district=self.salem_district,
            taluk=self.salem_west_taluk,
            village=self.village_mookaneri,
            is_active=True
        )

        # Sample Cadastral Parcels
        poly = Polygon([(78.1, 11.6), (78.2, 11.6), (78.2, 11.7), (78.1, 11.7), (78.1, 11.6)], srid=4326)
        self.parcel_waterbody = LandParcel.objects.create(
            survey_number='101/A',
            classification='Waterbody',
            district='Salem',
            taluk='Salem West',
            district_ref=self.salem_district,
            taluk_ref=self.salem_west_taluk,
            village_ref=self.village_mookaneri,
            area_extent=5000.0,
            geom=poly,
        )

    def test_01_due_date_calculation(self):
        """Due date is calculated as valid_from + cadence_days, or last_valid_check + cadence_days."""
        zone = pin_watch_zone(
            user=self.u_tahsildar_west,
            name_en="Mookaneri Waterbody Zone",
            name_ta="மூக்கனேரி நீர்நிலை மண்டலம்",
            category="waterbody",
            district=self.salem_district,
            taluk=self.salem_west_taluk,
            reason="High risk waterbody buffer zone",
            priority=1,
            pinned_area_sqm=10000.0,
            valid_from=date(2026, 11, 1),
        )
        self.assertEqual(zone.cadence_days, 14)

        # Initial due date without any checks
        due = calculate_zone_due_date(zone)
        self.assertEqual(due, date(2026, 11, 1) + timedelta(days=14))

        # Add a CLEAR ParcelCheck
        ParcelCheck.objects.create(
            parcel=self.parcel_waterbody,
            zone=zone,
            checked_at=datetime(2026, 11, 10, 10, 0, tzinfo=dt_timezone.utc),
            method='SATELLITE',
            result='CLEAR',
            scene_ids=['SENTINEL2_20261110']
        )
        updated_due = calculate_zone_due_date(zone)
        self.assertEqual(updated_due, date(2026, 11, 10) + timedelta(days=14))

    def test_02_idempotent_re_run(self):
        """Evaluating due watch zones repeatedly on the same day never creates duplicate ReviewTasks."""
        zone = pin_watch_zone(
            user=self.u_tahsildar_west,
            name_en="Idempotency Test Zone",
            name_ta="மண்டலம்",
            category="waterbody",
            district=self.salem_district,
            taluk=self.salem_west_taluk,
            reason="Test Zone",
            priority=1,
            valid_from=date(2026, 10, 1),
        )
        # Subscribe officer
        WatchSubscription.objects.create(zone=zone, user=self.u_tahsildar_west, role='TAHSILDAR')

        eval_date = date(2026, 11, 1)
        tasks_run_1 = run_watch_zone_cadence_evaluator(target_date=eval_date)
        self.assertEqual(len(tasks_run_1), 1)
        self.assertEqual(ReviewTask.objects.filter(zone=zone).count(), 1)

        # Re-run evaluator on same date
        tasks_run_2 = run_watch_zone_cadence_evaluator(target_date=eval_date)
        self.assertEqual(len(tasks_run_2), 0)
        self.assertEqual(ReviewTask.objects.filter(zone=zone).count(), 1)

    def test_03_cloudy_scene_stays_due(self):
        """A cloudy observation (NO_CLEAR_OBSERVATION) does NOT count as checked clear; zone stays due."""
        zone = pin_watch_zone(
            user=self.u_tahsildar_west,
            name_en="Cloudy Zone",
            name_ta="மண்டலம்",
            category="urban_fringe",
            district=self.salem_district,
            taluk=self.salem_west_taluk,
            reason="Cloud test",
            priority=2,
            valid_from=date(2026, 10, 1),
        )

        # Record cloudy check on Oct 20
        ParcelCheck.objects.create(
            parcel=self.parcel_waterbody,
            zone=zone,
            checked_at=datetime(2026, 10, 20, 10, 0, tzinfo=dt_timezone.utc),
            method='SATELLITE',
            result='NO_CLEAR_OBSERVATION',
            scene_ids=['SENTINEL2_CLOUDY_SCENE']
        )

        # Due date should still be calculated from valid_from (Oct 1 + 14d = Oct 15)
        due_date = calculate_zone_due_date(zone)
        self.assertEqual(due_date, date(2026, 10, 15))

        # On Oct 25, zone remains overdue
        tasks = run_watch_zone_cadence_evaluator(target_date=date(2026, 10, 25))
        self.assertEqual(len(tasks), 1)

    def test_04_per_district_cadence_no_hidden_default(self):
        """Cadence is per-district; absence of setting with no proposed cadence raises error (no hidden default)."""
        # District with setting succeeds
        cadence_salem = resolve_district_cadence(self.salem_district)
        self.assertEqual(cadence_salem, 14)

        # District without setting and no proposal raises ValueError
        with self.assertRaises(ValueError) as ctx:
            resolve_district_cadence(self.cbe_district)
        self.assertIn("no hidden default", str(ctx.exception))

        # Explicit proposal succeeds
        cadence_proposed = resolve_district_cadence(self.cbe_district, proposed_cadence=21)
        self.assertEqual(cadence_proposed, 21)

    def test_05_pin_permissions_in_and_out_of_scope(self):
        """Tests jurisdictional scoping: Tahsildar (own taluk), RDO (division), Collector (district), CLA (any)."""
        # Tahsildar in own taluk -> ALLOWED
        zone_tah = pin_watch_zone(
            user=self.u_tahsildar_west,
            name_en="Salem West Zone",
            name_ta="மண்டலம்",
            category="highway_margin",
            district=self.salem_district,
            taluk=self.salem_west_taluk,
            reason="Test",
            priority=2,
            valid_from=date(2026, 11, 1),
        )
        self.assertEqual(zone_tah.approval_status, 'APPROVED')

        # Tahsildar attempting to pin in Mettur taluk -> 403 PermissionDenied
        with self.assertRaises(PermissionDenied):
            pin_watch_zone(
                user=self.u_tahsildar_west,
                name_en="Cross Taluk Violation",
                name_ta="மண்டலம்",
                category="highway_margin",
                district=self.salem_district,
                taluk=self.mettur_taluk,
                reason="Cross taluk attempt",
                priority=2,
            )

        # RDO in own division (Salem West) -> ALLOWED
        zone_rdo = pin_watch_zone(
            user=self.u_rdo_salem,
            name_en="RDO Division Zone",
            name_ta="மண்டலம்",
            category="waterbody",
            district=self.salem_district,
            taluk=self.salem_south_taluk,
            reason="RDO jurisdiction test",
            priority=1,
            valid_from=date(2026, 11, 1),
        )
        self.assertEqual(zone_rdo.approval_status, 'APPROVED')

        # RDO attempting to pin in Mettur taluk (outside Salem division) -> PermissionDenied
        with self.assertRaises(PermissionDenied):
            pin_watch_zone(
                user=self.u_rdo_salem,
                name_en="RDO Cross Division Violation",
                name_ta="மண்டலம்",
                category="waterbody",
                district=self.salem_district,
                taluk=self.mettur_taluk,
                reason="Cross division attempt",
                priority=1,
            )

        # Collector in own district -> ALLOWED anywhere in district (even Mettur)
        zone_coll = pin_watch_zone(
            user=self.u_collector_salem,
            name_en="Collector District Zone",
            name_ta="மண்டலம்",
            category="canal",
            district=self.salem_district,
            taluk=self.mettur_taluk,
            reason="District wide oversight",
            priority=1,
            valid_from=date(2026, 11, 1),
        )
        self.assertEqual(zone_coll.approval_status, 'APPROVED')

        # Collector attempting to pin in Coimbatore -> PermissionDenied
        with self.assertRaises(PermissionDenied):
            pin_watch_zone(
                user=self.u_collector_salem,
                name_en="Collector Cross District Violation",
                name_ta="மண்டலம்",
                category="canal",
                district=self.cbe_district,
                reason="Cross district attempt",
                priority=1,
                proposed_cadence=14,
            )

        # CLA State -> ALLOWED in any district
        zone_cla = pin_watch_zone(
            user=self.u_cla_state,
            name_en="Statewide CLA Zone",
            name_ta="மண்டலம்",
            category="past_encroachment",
            district=self.cbe_district,
            reason="Statewide prerogative",
            priority=1,
            proposed_cadence=10,
            valid_from=date(2026, 11, 1),
        )
        self.assertEqual(zone_cla.approval_status, 'APPROVED')

    def test_06_vao_request_and_approval_flow(self):
        """VAO cannot pin directly; submits request which is approved by Tahsildar."""
        # VAO pins -> created with PENDING_APPROVAL
        vao_zone = pin_watch_zone(
            user=self.u_vao_west,
            name_en="VAO Proposed Lake Zone",
            name_ta="வி.ஏ.ஓ மண்டலம்",
            category="waterbody",
            district=self.salem_district,
            taluk=self.salem_west_taluk,
            reason="Frequent fencing observed",
            priority=1,
            valid_from=date(2026, 11, 1),
        )
        self.assertEqual(vao_zone.approval_status, 'PENDING_APPROVAL')
        self.assertFalse(vao_zone.is_active)

        # Audit event records PIN_REQUESTED
        audit_req = WatchZoneAuditEvent.objects.filter(zone=vao_zone, action='PIN_REQUESTED').first()
        self.assertIsNotNone(audit_req)
        self.assertEqual(audit_req.actor_role, 'VAO')

        # Tahsildar approves
        approved_zone = approve_pin_request(user=self.u_tahsildar_west, zone=vao_zone)
        self.assertEqual(approved_zone.approval_status, 'APPROVED')
        self.assertTrue(approved_zone.is_active)

        audit_app = WatchZoneAuditEvent.objects.filter(zone=vao_zone, action='PIN_APPROVED').first()
        self.assertIsNotNone(audit_app)
        self.assertEqual(audit_app.actor_role, 'TAHSILDAR')

    def test_07_district_pinned_area_quota(self):
        """District total pinned area cannot exceed PINNED_AREA_MAX_DISTRICT_SQM."""
        with self.settings(PINNED_AREA_MAX_DISTRICT_SQM=50000.0):
            # Pin 30,000 sq.m -> succeeds
            pin_watch_zone(
                user=self.u_tahsildar_west,
                name_en="Zone Quota 1",
                name_ta="மண்டலம்",
                category="waterbody",
                district=self.salem_district,
                taluk=self.salem_west_taluk,
                reason="Quota test",
                priority=1,
                pinned_area_sqm=30000.0,
            )

            # Pinning another 25,000 sq.m (total 55,000 > 50,000) -> QuotaExceededError
            with self.assertRaises(QuotaExceededError) as ctx:
                pin_watch_zone(
                    user=self.u_tahsildar_west,
                    name_en="Zone Quota Exceeded",
                    name_ta="மண்டலம்",
                    category="waterbody",
                    district=self.salem_district,
                    taluk=self.salem_west_taluk,
                    reason="Quota test 2",
                    priority=1,
                    pinned_area_sqm=25000.0,
                )
            self.assertIn("quota exceeded", str(ctx.exception))

    def test_08_audit_events_written_on_all_lifecycle_actions(self):
        """Every create, approve, and retire writes an immutable WatchZoneAuditEvent."""
        zone = pin_watch_zone(
            user=self.u_tahsildar_west,
            name_en="Audit Lifecycle Zone",
            name_ta="மண்டலம்",
            category="complaint",
            district=self.salem_district,
            taluk=self.salem_west_taluk,
            reason="Citizen petition 2026/SLM",
            priority=2,
            valid_from=date(2026, 11, 1),
        )
        self.assertEqual(WatchZoneAuditEvent.objects.filter(zone=zone, action='ZONE_PINNED').count(), 1)

        # Retire zone
        retire_watch_zone(user=self.u_tahsildar_west, zone=zone, reason="Encroachment permanently cleared")
        self.assertEqual(WatchZoneAuditEvent.objects.filter(zone=zone, action='ZONE_RETIRED').count(), 1)

        retire_event = WatchZoneAuditEvent.objects.get(zone=zone, action='ZONE_RETIRED')
        self.assertEqual(retire_event.from_status, 'APPROVED')
        self.assertEqual(retire_event.to_status, 'RETIRED')
        self.assertEqual(retire_event.actor, self.u_tahsildar_west)

    def test_09_sla_watchdog_flags_without_changing_case_state(self):
        """SLA watchdog flags overdue cases and notifies, but strictly NEVER alters alert.status."""
        old_date = timezone.now() - timedelta(days=20)
        overdue_deadline = timezone.now() - timedelta(days=5)
        alert = EncroachmentAlert.objects.create(
            parcel=self.parcel_waterbody,
            status='NOTICE_REPLY_PENDING',
            confidence_score=0.88,
            snapshot_lane='LANE_A_WATERBODY_CRITICAL',
            detection_date=old_date,
            sla_deadline=overdue_deadline,
        )

        initial_status = alert.status
        self.assertEqual(initial_status, 'NOTICE_REPLY_PENDING')

        flagged = run_sla_compliance_watchdog(target_date=timezone.now().date())
        self.assertTrue(any(f['alert_id'] == str(alert.id) for f in flagged))

        # Alert status must NOT have changed!
        alert.refresh_from_db()
        self.assertEqual(alert.status, initial_status)

        # Verify SLA ReviewTask was created
        sla_task = ReviewTask.objects.filter(alert=alert, task_type='SLA_OVERDUE_REVIEW').first()
        self.assertIsNotNone(sla_task)
        self.assertEqual(sla_task.status, 'PENDING')

        # Verify sandbox notification outbox
        outbox = get_sandbox_outbox()
        self.assertTrue(any('Statutory SLA Overdue' in item['subject'] for item in outbox))

    def test_10_no_numeric_day_literals_in_scheduler_code(self):
        """Greps watch_scheduler.py to verify zero hardcoded numeric literals for day durations."""
        scheduler_file = Path(__file__).resolve().parent.parent / 'services' / 'watch_scheduler.py'
        self.assertTrue(scheduler_file.exists(), f"File {scheduler_file} must exist.")

        content = scheduler_file.read_text(encoding='utf-8')

        # Look for patterns like timedelta(days=15), timedelta(days=30), cadence=14, etc.
        hardcoded_patterns = [
            r'timedelta\s*\(\s*days\s*=\s*\d+\s*\)',
            r'cadence_days\s*=\s*\d+',
            r'recheck_days\s*=\s*\d+',
            r'reply_window\s*=\s*\d+',
        ]
        violations = []
        for pat in hardcoded_patterns:
            matches = re.findall(pat, content)
            if matches:
                violations.extend(matches)

        self.assertEqual(
            len(violations), 0,
            f"Statutory compliance failure: Hardcoded numeric day literals found in scheduler: {violations}"
        )

    def test_11_risk_score_v1_breakdown_and_weights(self):
        """Rule-based risk score calculates all 6 factors, factor breakdown is stored and returned."""
        risk_profile = calculate_and_save_parcel_risk(self.parcel_waterbody)
        self.assertGreater(risk_profile.score, 0.0)
        self.assertLessEqual(risk_profile.score, 1.0)
        self.assertEqual(risk_profile.formula_version, 'v1-rule-based')

        breakdown = risk_profile.factor_breakdown
        self.assertIn('land_class', breakdown)
        self.assertIn('past_alerts', breakdown)
        self.assertIn('nearby_construction', breakdown)
        self.assertIn('distance_to_built_up', breakdown)
        self.assertIn('complaints', breakdown)
        self.assertIn('zone_membership', breakdown)
        self.assertIn('total_score', breakdown)

        # Factor weights must sum to 1.0
        weights_sum = sum(breakdown[k]['weight'] for k in [
            'land_class', 'past_alerts', 'nearby_construction', 'distance_to_built_up', 'complaints', 'zone_membership'
        ])
        self.assertAlmostEqual(weights_sum, 1.0, places=4)
