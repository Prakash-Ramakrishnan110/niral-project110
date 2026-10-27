"""
Architecture verification test suite running against Docker postgis_15 container on port 5435.

Tests:
1. Real Section 6 endpoint statutory guards (rejecting VULNERABLE_HOUSING & COURT_STAY_HOLD, allowing COMMERCIAL_LAYOUT).
2. Real models and constraints:
   - ForeignKey cascade from LandParcel to EncroachmentAlert.
   - OneToOne uniqueness on FieldVerification.
   - Real PostGIS spatial containment query on LandParcel.geom and EncroachmentAlert.alert_geom.
   - Subquery-based jurisdiction scoping across 3 districts (Salem, Coimbatore, Chennai).
3. Monotonic safe-horizon sync cursor under concurrent transactions:
   - Writer A takes lower sequence number and holds transaction.
   - Writer B takes higher sequence number and commits first.
   - Reader polls with safe-horizon read (cannot skip uncommitted in-flight transactions).
   - Writer A commits.
   - Reader polls and safely receives Writer A's change.
"""
import threading
import psycopg2
from django.db import IntegrityError
from django.contrib.gis.geos import Polygon, Point
from rest_framework.test import APIClient
from rest_framework import status
from core.models import LandParcel, EncroachmentAlert, FieldVerification
from core.tests.base import SafeTransactionTestCase


class ArchitectureVerificationTest(SafeTransactionTestCase):

    def setUp(self):
        super().setUp()
        self.client = APIClient()

    def test_real_section_6_endpoint_statutory_guards(self):
        """
        Verify the REAL Section 6 API endpoint enforces statutory guards:
        1. Blocks Section 6 order for VULNERABLE_HOUSING (must route to TNUHDB rehabilitation).
        2. Blocks Section 6 order when case is under COURT_STAY_HOLD.
        3. Allows Section 6 order for COMMERCIAL_LAYOUT when invoked by authorized officer.
        """
        parcel = LandParcel.objects.create(
            survey_number="101/A",
            district="Salem",
            taluk="Salem West",
            village_code="Kannankurichi",
            classification="Waterbody",
            geom=Polygon(((78.17, 11.69), (78.18, 11.69), (78.18, 11.70), (78.17, 11.70), (78.17, 11.69)))
        )

        # 1. Test VULNERABLE_HOUSING rejection
        alert_vulnerable = EncroachmentAlert.objects.create(
            parcel=parcel,
            structure_category="VULNERABLE_HOUSING",
            status="SECTION_7_ISSUED",
            alert_geom=Point(78.17, 11.69)
        )
        url_vulnerable = f"/api/alerts/{alert_vulnerable.id}/issue_section_6/"
        res_vulnerable = self.client.post(url_vulnerable, {'role': 'COLLECTOR'}, format='json')
        self.assertEqual(res_vulnerable.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("VULNERABLE_HOUSING", res_vulnerable.data.get("error", ""))

        # 2. Test COURT_STAY_HOLD rejection
        alert_stay = EncroachmentAlert.objects.create(
            parcel=parcel,
            structure_category="COMMERCIAL_LAYOUT",
            status="COURT_STAY_HOLD",
            alert_geom=Point(78.17, 11.69)
        )
        url_stay = f"/api/alerts/{alert_stay.id}/issue_section_6/"
        res_stay = self.client.post(url_stay, {'role': 'COLLECTOR'}, format='json')
        self.assertEqual(res_stay.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("COURT_STAY_HOLD", res_stay.data.get("error", ""))

        # 3. Test success path for COMMERCIAL_LAYOUT
        alert_valid = EncroachmentAlert.objects.create(
            parcel=parcel,
            structure_category="COMMERCIAL_LAYOUT",
            status="SECTION_7_ISSUED",
            alert_geom=Point(78.17, 11.69)
        )
        url_valid = f"/api/alerts/{alert_valid.id}/issue_section_6/"
        res_valid = self.client.post(url_valid, {'role': 'COLLECTOR', 'notes': 'Demolition warrant issued'}, format='json')
        self.assertEqual(res_valid.status_code, status.HTTP_200_OK)
        alert_valid.refresh_from_db()
        self.assertEqual(alert_valid.status, "SECTION_6_ORDERED")
        self.assertIn("Demolition warrant issued", alert_valid.resolution_notes)

    def test_real_model_constraints_and_spatial_integrity(self):
        """
        Verify real database-level constraints on LandParcel, EncroachmentAlert, and FieldVerification:
        1. CASCADE deletion from LandParcel to EncroachmentAlert.
        2. OneToOne constraint on FieldVerification (duplicate verification must fail).
        3. Real PostGIS spatial containment query on parcel geometry and alert point.
        """
        parcel = LandParcel.objects.create(
            survey_number="202/B",
            district="Salem",
            taluk="Salem West",
            village_code="Kannankurichi",
            classification="Government",
            geom=Polygon(((78.15, 11.65), (78.20, 11.65), (78.20, 11.70), (78.15, 11.70), (78.15, 11.65)))
        )
        inside_point = Point(78.17, 11.67)
        outside_point = Point(78.30, 11.80)

        alert = EncroachmentAlert.objects.create(
            parcel=parcel,
            status="NEW",
            alert_geom=inside_point
        )

        # 1. PostGIS Spatial containment check
        parcels_containing_alert = LandParcel.objects.filter(geom__contains=alert.alert_geom)
        self.assertEqual(parcels_containing_alert.count(), 1)
        self.assertEqual(parcels_containing_alert.first().id, parcel.id)

        parcels_containing_outside = LandParcel.objects.filter(geom__contains=outside_point)
        self.assertEqual(parcels_containing_outside.count(), 0)

        # 2. OneToOne constraint on FieldVerification
        FieldVerification.objects.create(
            alert=alert,
            officer_name="VAO Raman",
            gps_lat=11.67,
            gps_lon=78.17,
            remarks="Ground encroachment verified"
        )
        from django.db import transaction
        with transaction.atomic():
            with self.assertRaises(IntegrityError):
                FieldVerification.objects.create(
                    alert=alert,
                    officer_name="VAO Duplicate",
                    gps_lat=11.67,
                    gps_lon=78.17,
                    remarks="Illegal duplicate verification"
                )

        # 3. CASCADE deletion: deleting LandParcel must delete child EncroachmentAlert and FieldVerification
        alert_id = alert.id
        parcel.delete()
        self.assertFalse(EncroachmentAlert.objects.filter(id=alert_id).exists())
        self.assertFalse(FieldVerification.objects.filter(alert_id=alert_id).exists())

    def test_three_district_subquery_scoping(self):
        """
        Verify subquery-based jurisdiction scoping isolates records across 3 districts
        (Salem, Coimbatore, Chennai) without python-set overhead or cross-district leakage.
        """
        p_salem = LandParcel.objects.create(
            survey_number="S-1", district="Salem", taluk="Salem West",
            village_code="V-Salem", classification="Waterbody",
            geom=Polygon(((78.1, 11.6), (78.2, 11.6), (78.2, 11.7), (78.1, 11.7), (78.1, 11.6)))
        )
        p_cbe = LandParcel.objects.create(
            survey_number="C-1", district="Coimbatore", taluk="Pollachi",
            village_code="V-Pollachi", classification="Waterbody",
            geom=Polygon(((76.9, 10.9), (77.0, 10.9), (77.0, 11.0), (76.9, 11.0), (76.9, 10.9)))
        )
        p_chn = LandParcel.objects.create(
            survey_number="CH-1", district="Chennai", taluk="Mylapore",
            village_code="V-Mylapore", classification="Waterbody",
            geom=Polygon(((80.2, 13.0), (80.3, 13.0), (80.3, 13.1), (80.2, 13.1), (80.2, 13.0)))
        )

        alert_salem = EncroachmentAlert.objects.create(
            parcel=p_salem, status="NEW", alert_geom=Point(78.15, 11.65)
        )
        alert_cbe = EncroachmentAlert.objects.create(
            parcel=p_cbe, status="NEW", alert_geom=Point(76.95, 10.95)
        )
        alert_chn = EncroachmentAlert.objects.create(
            parcel=p_chn, status="NEW", alert_geom=Point(80.25, 13.05)
        )

        # Subquery filter for a Coimbatore Taluk officer
        cbe_taluk_subquery = LandParcel.objects.filter(district='Coimbatore', taluk='Pollachi').values('id')
        scoped_alerts = EncroachmentAlert.objects.filter(parcel_id__in=cbe_taluk_subquery)

        self.assertEqual(scoped_alerts.count(), 1)
        self.assertEqual(scoped_alerts.first().id, alert_cbe.id)
        # Verify strict isolation: zero cross-district leakage
        self.assertFalse(scoped_alerts.filter(parcel__district='Salem').exists())
        self.assertFalse(scoped_alerts.filter(parcel__district='Chennai').exists())

    def test_sync_safe_horizon_read_under_concurrent_writers(self):
        """
        Verify safe-horizon sync read semantics:
        - Writer A takes lower sequence number (seq 1), but holds transaction uncommitted.
        - Writer B takes higher sequence number (seq 2), and commits first.
        - A reader polling with safe horizon (txid < pg_snapshot_xmin) does NOT skip
          Writer A or prematurely advance past Writer A's uncommitted transaction.
        - Writer A commits.
        - Reader polls again and receives BOTH Writer A (seq 1) and Writer B (seq 2) in monotonic sequence.
        """
        setup_conn = psycopg2.connect(
            host='127.0.0.1', port=5435, user='landuser', password='landpassword', dbname='test_land_records'
        )
        setup_conn.autocommit = True
        with setup_conn.cursor() as cur:
            cur.execute("DROP SEQUENCE IF EXISTS test_sync_seq CASCADE;")
            cur.execute("CREATE SEQUENCE test_sync_seq;")
            cur.execute("DROP TABLE IF EXISTS test_sync_changelog CASCADE;")
            cur.execute("""
                CREATE TABLE test_sync_changelog (
                    seq bigint PRIMARY KEY,
                    record_id text,
                    txid xid8
                );
            """)
        setup_conn.close()

        ready_event = threading.Event()
        commit_event = threading.Event()
        writer_results = {}

        def writer_a_task():
            conn_a = psycopg2.connect(
                host='127.0.0.1', port=5435, user='landuser', password='landpassword', dbname='test_land_records'
            )
            with conn_a.cursor() as cur:
                cur.execute(
                    "INSERT INTO test_sync_changelog (seq, record_id, txid) "
                    "VALUES (nextval('test_sync_seq'), 'REC-WRITER-A', pg_current_xact_id()) "
                    "RETURNING seq, txid;"
                )
                seq, txid = cur.fetchone()
                writer_results['a_seq'] = seq
                writer_results['a_txid'] = txid
            ready_event.set()
            commit_event.wait()
            conn_a.commit()
            conn_a.close()

        def writer_b_task():
            ready_event.wait()
            conn_b = psycopg2.connect(
                host='127.0.0.1', port=5435, user='landuser', password='landpassword', dbname='test_land_records'
            )
            with conn_b.cursor() as cur:
                cur.execute(
                    "INSERT INTO test_sync_changelog (seq, record_id, txid) "
                    "VALUES (nextval('test_sync_seq'), 'REC-WRITER-B', pg_current_xact_id()) "
                    "RETURNING seq, txid;"
                )
                seq, txid = cur.fetchone()
                writer_results['b_seq'] = seq
                writer_results['b_txid'] = txid
            conn_b.commit()
            conn_b.close()

        t_a = threading.Thread(target=writer_a_task)
        t_b = threading.Thread(target=writer_b_task)
        t_a.start()
        t_b.start()
        t_b.join()

        # Writer B is committed with higher sequence number; Writer A is still in-flight
        self.assertGreater(writer_results['b_seq'], writer_results['a_seq'])

        reader_conn = psycopg2.connect(
            host='127.0.0.1', port=5435, user='landuser', password='landpassword', dbname='test_land_records'
        )
        reader_conn.autocommit = True

        try:
            # First poll: safe horizon query while Writer A is uncommitted
            with reader_conn.cursor() as cur:
                cur.execute(
                    "SELECT seq, record_id FROM test_sync_changelog "
                    "WHERE txid < pg_snapshot_xmin(pg_current_snapshot()) "
                    "ORDER BY seq ASC;"
                )
                first_poll = cur.fetchall()

            # Safe horizon must not expose Writer B while lower sequence Writer A is in-flight
            self.assertEqual(len(first_poll), 0, "Safe horizon must not advance past in-flight transactions")

            # Now Writer A commits
            commit_event.set()
            t_a.join()

            # Second poll: safe horizon query after Writer A commits
            with reader_conn.cursor() as cur:
                cur.execute(
                    "SELECT seq, record_id FROM test_sync_changelog "
                    "WHERE txid < pg_snapshot_xmin(pg_current_snapshot()) "
                    "ORDER BY seq ASC;"
                )
                second_poll = cur.fetchall()

            # Both records must now be present in strictly monotonic order
            self.assertEqual(len(second_poll), 2)
            self.assertEqual(second_poll[0][0], writer_results['a_seq'])
            self.assertEqual(second_poll[0][1], 'REC-WRITER-A')
            self.assertEqual(second_poll[1][0], writer_results['b_seq'])
            self.assertEqual(second_poll[1][1], 'REC-WRITER-B')
        finally:
            reader_conn.close()
            cleanup_conn = psycopg2.connect(
                host='127.0.0.1', port=5435, user='landuser', password='landpassword', dbname='test_land_records'
            )
            cleanup_conn.autocommit = True
            with cleanup_conn.cursor() as cur:
                cur.execute("DROP TABLE IF EXISTS test_sync_changelog CASCADE; DROP SEQUENCE IF EXISTS test_sync_seq CASCADE;")
            cleanup_conn.close()
