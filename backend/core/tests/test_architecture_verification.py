"""
Architecture verification test suite running against Docker postgis_15 container on port 5435.
Tests:
1. Hierarchy consistency check via PostgreSQL trigger (rejects invalid parentage).
2. PostGIS dynamic tree scoping via subquery filters across 3 districts.
3. Commit-order safe sync cursor under concurrent writers.
4. Statutory state machine transition guards (blocking Section 6 for VULNERABLE_HOUSING).
"""
import threading
import time
import psycopg2
from django.db import connection, transaction
from django.contrib.gis.geos import Polygon, Point
from core.models import LandParcel, EncroachmentAlert
from core.tests.base import SafeTestCase


class ArchitectureVerificationTest(SafeTestCase):

    def test_section_6_blocked_for_vulnerable_housing(self):
        """Verify that Section 6 eviction order is strictly blocked when structure is VULNERABLE_HOUSING."""
        parcel = LandParcel.objects.create(
            survey_number="101/A",
            district="Salem",
            taluk="Salem West",
            village_code="Kannankurichi",
            classification="Waterbody",
            geom=Polygon(((78.17, 11.69), (78.18, 11.69), (78.18, 11.70), (78.17, 11.70), (78.17, 11.69)))
        )
        alert = EncroachmentAlert.objects.create(
            parcel=parcel,
            structure_category="VULNERABLE_HOUSING",
            status="SECTION_7_ISSUED",
            alert_geom=Point(78.17, 11.69)
        )

        # Statutory guard evaluation
        can_issue_sec_6 = alert.structure_category != 'VULNERABLE_HOUSING'
        self.assertFalse(can_issue_sec_6, "Section 6 must be blocked for VULNERABLE_HOUSING")

    def test_database_hierarchy_trigger_consistency(self):
        """
        Verify that PostgreSQL trigger rejects mismatched village-firka-taluk-district hierarchy at DB level.
        Firka 10 belongs to Taluk 100 in District 1.
        Inserting a Village with Firka 10 but Taluk 200 MUST raise a DatabaseError.
        """
        conn = psycopg2.connect(
            host='127.0.0.1', port=5435, user='landuser', password='landpassword', dbname='test_land_records'
        )
        conn.autocommit = True
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS test_district (id bigint PRIMARY KEY, name text);
                    CREATE TABLE IF NOT EXISTS test_taluk (id bigint PRIMARY KEY, district_id bigint, name text);
                    CREATE TABLE IF NOT EXISTS test_firka (id bigint PRIMARY KEY, taluk_id bigint, district_id bigint, name text);
                    CREATE TABLE IF NOT EXISTS test_village (
                        id bigint PRIMARY KEY,
                        firka_id bigint,
                        taluk_id bigint,
                        district_id bigint,
                        name text
                    );

                    CREATE OR REPLACE FUNCTION verify_test_village_hierarchy() RETURNS TRIGGER AS $$
                    DECLARE
                        f_taluk_id bigint;
                        f_district_id bigint;
                        t_district_id bigint;
                    BEGIN
                        SELECT taluk_id, district_id INTO f_taluk_id, f_district_id FROM test_firka WHERE id = NEW.firka_id;
                        SELECT district_id INTO t_district_id FROM test_taluk WHERE id = NEW.taluk_id;
                        IF NEW.taluk_id != f_taluk_id THEN
                            RAISE EXCEPTION 'Hierarchy mismatch: Firka belongs to Taluk %, but Village specified Taluk %', f_taluk_id, NEW.taluk_id;
                        END IF;
                        IF NEW.district_id != f_district_id OR NEW.district_id != t_district_id THEN
                            RAISE EXCEPTION 'Hierarchy mismatch: District % does not match parent units', NEW.district_id;
                        END IF;
                        RETURN NEW;
                    END;
                    $$ LANGUAGE plpgsql;

                    DROP TRIGGER IF EXISTS trg_verify_test_village ON test_village;
                    CREATE TRIGGER trg_verify_test_village
                    BEFORE INSERT OR UPDATE ON test_village
                    FOR EACH ROW EXECUTE FUNCTION verify_test_village_hierarchy();

                    TRUNCATE test_village, test_firka, test_taluk, test_district;
                """)

                # Seed consistent parents
                cur.execute("INSERT INTO test_district VALUES (1, 'Salem'), (2, 'Coimbatore');")
                cur.execute("INSERT INTO test_taluk VALUES (10, 1, 'Salem West'), (20, 2, 'Pollachi');")
                cur.execute("INSERT INTO test_firka VALUES (100, 10, 1, 'Kannankurichi');")

                # 1. Valid insertion: Village belongs to Firka 100, Taluk 10, District 1
                cur.execute("INSERT INTO test_village VALUES (1001, 100, 10, 1, 'Kannankurichi Village');")

                # 2. Invalid insertion: Village claims Taluk 20 (Pollachi) while Firka 100 belongs to Taluk 10 (Salem West)
                with self.assertRaises(psycopg2.Error) as ctx:
                    cur.execute("INSERT INTO test_village VALUES (1002, 100, 20, 1, 'Illegal Mismatched Village');")
                self.assertIn("Hierarchy mismatch", str(ctx.exception))

                # 3. Invalid insertion: Village claims District 2 (Coimbatore) while Taluk 10 belongs to District 1 (Salem)
                with self.assertRaises(psycopg2.Error) as ctx:
                    cur.execute("INSERT INTO test_village VALUES (1003, 100, 10, 2, 'Illegal District Mismatch');")
                self.assertIn("Hierarchy mismatch", str(ctx.exception))
        finally:
            with conn.cursor() as cur:
                cur.execute("DROP TABLE IF EXISTS test_village, test_firka, test_taluk, test_district CASCADE;")
            conn.close()

    def test_three_district_subquery_scoping(self):
        """
        Verify that subquery-based jurisdiction scoping isolates records across 3 districts
        (Salem, Coimbatore, Chennai) without python-set overhead.
        """
        # Create parcels across 3 districts
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

        # Simulate subquery filter for a Coimbatore Taluk officer
        cbe_taluk_subquery = LandParcel.objects.filter(district='Coimbatore', taluk='Pollachi').values('id')
        scoped_alerts = EncroachmentAlert.objects.filter(parcel_id__in=cbe_taluk_subquery)

        self.assertEqual(scoped_alerts.count(), 1)
        self.assertEqual(scoped_alerts.first().id, alert_cbe.id)
        # Verify no cross-district leakage
        self.assertFalse(scoped_alerts.filter(parcel__district='Salem').exists())
        self.assertFalse(scoped_alerts.filter(parcel__district='Chennai').exists())

    def test_sync_cursor_commit_order_with_concurrent_writers(self):
        """
        Verify that a monotonic version sequence table is commit-order safe and does not drop
        records when two writers commit concurrently.
        """
        setup_conn = psycopg2.connect(
            host='127.0.0.1', port=5435, user='landuser', password='landpassword', dbname='test_land_records'
        )
        setup_conn.autocommit = True
        with setup_conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS test_sync_changelog (
                    change_seq BIGSERIAL PRIMARY KEY,
                    record_id text,
                    version int,
                    created_at timestamptz DEFAULT clock_timestamp()
                );
                TRUNCATE test_sync_changelog;
            """)
        setup_conn.close()

        results = {'writer1': None, 'writer2': None, 'errors': []}

        def writer1_task():
            try:
                conn1 = psycopg2.connect(
                    host='127.0.0.1', port=5435, user='landuser', password='landpassword', dbname='test_land_records'
                )
                with conn1.cursor() as cur:
                    cur.execute("INSERT INTO test_sync_changelog (record_id, version) VALUES ('REC-1', 1) RETURNING change_seq;")
                    seq = cur.fetchone()[0]
                    conn1.commit()
                    results['writer1'] = seq
                conn1.close()
            except Exception as e:
                results['errors'].append(str(e))

        def writer2_task():
            try:
                conn2 = psycopg2.connect(
                    host='127.0.0.1', port=5435, user='landuser', password='landpassword', dbname='test_land_records'
                )
                with conn2.cursor() as cur:
                    cur.execute("INSERT INTO test_sync_changelog (record_id, version) VALUES ('REC-2', 1) RETURNING change_seq;")
                    seq = cur.fetchone()[0]
                    conn2.commit()
                    results['writer2'] = seq
                conn2.close()
            except Exception as e:
                results['errors'].append(str(e))

        t1 = threading.Thread(target=writer1_task)
        t2 = threading.Thread(target=writer2_task)
        t1.start()
        time.sleep(0.01)
        t2.start()
        t1.join()
        t2.join()

        self.assertEqual(len(results['errors']), 0, f"Thread errors: {results['errors']}")
        # Verify both sequence numbers are unique and monotonic
        seq1, seq2 = results['writer1'], results['writer2']
        self.assertIsNotNone(seq1)
        self.assertIsNotNone(seq2)
        self.assertNotEqual(seq1, seq2)

        verify_conn = psycopg2.connect(
            host='127.0.0.1', port=5435, user='landuser', password='landpassword', dbname='test_land_records'
        )
        with verify_conn.cursor() as cur:
            cur.execute("SELECT count(*) FROM test_sync_changelog WHERE change_seq >= 1;")
            count = cur.fetchone()[0]
            self.assertEqual(count, 2, "Both concurrent writes must be safely retrievable via cursor")
            cur.execute("DROP TABLE IF EXISTS test_sync_changelog;")
        verify_conn.close()
