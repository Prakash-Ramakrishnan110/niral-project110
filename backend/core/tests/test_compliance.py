"""
Comprehensive judicial compliance and legal-safety tests.
Tests real EncroachmentAlert and LandParcel database fixtures under an isolated test database.
Covers:
1. Madras High Court Action Taken Report (ATR) for district with waterbody alerts (counts, rows, district scoping, no leakage).
2. Madras High Court ATR for district with zero data (no fake rows, draft watermark, explicit empty notice).
3. HighCourtATRView endpoint 400 when writ_no is missing, and 200 on valid request.
4. Section 7 issuance endpoint 400 when FMB measurements are indicative without officer acknowledgement.
5. Section 7 issuance endpoint 200 when officer acknowledges indicative measurements.
6. Section 7 PDF generation from real database alert: asserts INDICATIVE disclaimer, absence of fake SHA256 hash claim, and accurate parcel details.
"""
import io
from django.contrib.gis.geos import Point, Polygon, MultiPolygon
from rest_framework import status
from core.models import LandParcel, EncroachmentAlert
from core.services.high_court_compliance import HighCourtComplianceGenerator
from core.services.legal_notice_pdf import LegalNoticePDFGenerator
from .base import SafeAPITestCase


def extract_pdf_text(pdf_bytes: bytes) -> str:
    """Extract plain text from rendered PDF bytes using pdfplumber with pypdf fallback."""
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as p:
            text = "\n".join(page.extract_text() or "" for page in p.pages)
    except Exception:
        try:
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(pdf_bytes))
            text = "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception:
            text = pdf_bytes.decode('latin-1', errors='replace')
    return text


class JudicialComplianceAndLegalSafetyTests(SafeAPITestCase):
    """Verifies statutory compliance generators, endpoints, and PDF disclaimers."""

    def setUp(self):
        super().setUp()

        # Real geometry polygons for land parcels (WGS84)
        cbe_poly = Polygon(((76.95, 11.00), (76.96, 11.00), (76.96, 11.01), (76.95, 11.01), (76.95, 11.00)))
        salem_poly = Polygon(((78.15, 11.65), (78.16, 11.65), (78.16, 11.66), (78.15, 11.66), (78.15, 11.65)))

        # 1. Coimbatore: Waterbody parcel with active alert
        self.cbe_waterbody = LandParcel.objects.create(
            survey_number="101/1",
            subdivision="A",
            district="Coimbatore",
            taluk="Coimbatore North",
            village_name="Peelamedu",
            classification="Water Body Poramboke",
            owner_name="Public Works Department (PWD)",
            area_extent="2.45 Hectares",
            adjacent_neighbors="North: Odai, South: Road, East: SF 102, West: SF 100",
            geom=cbe_poly
        )
        self.cbe_alert = EncroachmentAlert.objects.create(
            parcel=self.cbe_waterbody,
            alert_geom=Point(76.955, 11.005),
            confidence_score=0.94,
            alert_type="New Permanent Structure",
            status="NEW",
            tier="TIER_1_CRITICAL",
            structure_category="COMMERCIAL_LAYOUT",
            encroached_area_sqft=1450.0,
            fmb_measurements={"is_certified_survey": False, "notes": "indicative vector polygon"}
        )

        # 2. Coimbatore: Non-waterbody parcel (Roadside Poramboke) to verify classification filtering
        self.cbe_roadside = LandParcel.objects.create(
            survey_number="101/2",
            subdivision="B",
            district="Coimbatore",
            taluk="Coimbatore North",
            village_name="Peelamedu",
            classification="Roadside Poramboke",
            owner_name="Highways Department",
            area_extent="0.80 Hectares",
            geom=cbe_poly
        )
        self.cbe_road_alert = EncroachmentAlert.objects.create(
            parcel=self.cbe_roadside,
            alert_geom=Point(76.956, 11.006),
            confidence_score=0.72,
            alert_type="Boundary Fence",
            status="NEW",
            tier="TIER_2_MEDIUM",
            structure_category="BOUNDARY_FENCE",
            encroached_area_sqft=320.0
        )

        # 3. Salem: Waterbody parcel with active alert (for cross-district isolation testing)
        self.salem_waterbody = LandParcel.objects.create(
            survey_number="305/7",
            subdivision="2",
            district="Salem",
            taluk="Omalur",
            village_name="Omalur North",
            classification="Water Body Poramboke",
            owner_name="Water Resources Organisation (WRO)",
            area_extent="4.10 Hectares",
            adjacent_neighbors="North: Tank Bund, South: Channel, East: Patta 44, West: Poramboke",
            geom=salem_poly
        )
        self.salem_alert = EncroachmentAlert.objects.create(
            parcel=self.salem_waterbody,
            alert_geom=Point(78.155, 11.655),
            confidence_score=0.89,
            alert_type="Commercial Layout",
            status="SECTION_7_ISSUED",
            tier="TIER_1_CRITICAL",
            structure_category="COMMERCIAL_LAYOUT",
            encroached_area_sqft=2800.0,
            fmb_measurements={"is_certified_survey": False}
        )

    def test_atr_district_with_waterbody_alerts(self):
        """ATR for a district with waterbody alerts must include district data and avoid cross-district leakage."""
        pdf_bytes = HighCourtComplianceGenerator.generate_atr_pdf(
            district="Coimbatore",
            writ_petition_no="W.P. No. 18420 of 2024"
        )
        text = extract_pdf_text(pdf_bytes)

        # Header and district identification
        self.assertIn("DRAFT", text.upper())
        self.assertIn("COIMBATORE", text.upper())
        self.assertIn("W.P. NO. 18420 OF 2024", text.upper())

        # Coimbatore waterbody alert must be listed
        self.assertIn("101/1", text)
        self.assertIn("Peelamedu", text)

        # Cross-district isolation: Salem survey number 305/7 must NOT appear in Coimbatore ATR
        self.assertNotIn("305/7", text)
        self.assertNotIn("Omalur North", text)

        # Classification filtering: Roadside Poramboke 101/2 must NOT be in the waterbody itemized table
        self.assertNotIn("101/2", text)

    def test_atr_district_with_zero_data(self):
        """ATR for a district with zero data returns explicit empty statement and zero fake rows."""
        pdf_bytes = HighCourtComplianceGenerator.generate_atr_pdf(
            district="Madurai",
            writ_petition_no="W.P. No. 9999 of 2025"
        )
        text = extract_pdf_text(pdf_bytes)

        self.assertIn("DRAFT", text.upper())
        self.assertIn("MADURAI", text.upper())
        normalized_text = text.replace("-", "").replace("  ", " ")
        self.assertTrue(
            "no waterbody encroachments recorded" in normalized_text.lower() or "encroachments recorded for madurai" in text.lower(),
            f"Expected empty statement in text, got: {text[:300]}"
        )

        # Confirm old hard-coded Salem fallback rows are completely absent
        self.assertNotIn("Kannankurichi", text)
        self.assertNotIn("Dadagapatty", text)
        self.assertNotIn("Omalur North", text)

    def test_atr_view_missing_writ_no_400(self):
        """HighCourtATRView returns 400 Bad Request when writ_no is omitted or whitespace."""
        # 1. Missing writ_no parameter
        res_missing = self.client.get('/api/compliance/high-court-atr/?district=Salem')
        self.assertEqual(res_missing.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("writ_no query parameter is required", res_missing.data.get("error", ""))

        # 2. Empty string writ_no parameter
        res_empty = self.client.get('/api/compliance/high-court-atr/?district=Salem&writ_no=   ')
        self.assertEqual(res_empty.status_code, status.HTTP_400_BAD_REQUEST)

        # 3. Valid call returns 200 with PDF content type
        res_valid = self.client.get('/api/compliance/high-court-atr/?district=Coimbatore&writ_no=W.P.+No.+18420+of+2024')
        self.assertEqual(res_valid.status_code, status.HTTP_200_OK)
        self.assertEqual(res_valid['Content-Type'], 'application/pdf')
        self.assertGreater(len(res_valid.content), 2000)

    def test_section_7_without_fmb_acknowledgement_400(self):
        """Section 7 issuance without certified survey and without explicit officer acknowledgement returns 400."""
        url = f'/api/alerts/{self.cbe_alert.id}/issue_section_7/'
        res = self.client.post(url, {
            "encroacher_name": "Unauthorized Encroacher",
            "notes": "Issuing without acknowledgement"
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Section 7 Issuance Blocked", res.data.get("error", ""))
        self.assertIn("INDICATIVE", res.data.get("disclaimer", ""))

        # Ensure database alert status was NOT updated
        self.cbe_alert.refresh_from_db()
        self.assertEqual(self.cbe_alert.status, "NEW")

    def test_section_7_with_fmb_acknowledgement_200(self):
        """Section 7 issuance succeeds (200 OK) when officer explicitly acknowledges indicative FMB data."""
        url = f'/api/alerts/{self.cbe_alert.id}/issue_section_7/'
        res = self.client.post(url, {
            "officer_fmb_acknowledgement": True,
            "encroacher_name": "K. Sengottaiyan",
            "notes": "Show cause notice served under TN Act III of 1905."
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        returned_status = res.data.get("properties", {}).get("status") if "properties" in res.data else res.data.get("status")
        self.assertEqual(returned_status, "SECTION_7_ISSUED")

        # Verify database alert state was persisted
        self.cbe_alert.refresh_from_db()
        self.assertEqual(self.cbe_alert.status, "SECTION_7_ISSUED")
        self.assertIn("[OFFICER ACKNOWLEDGEMENT]", self.cbe_alert.resolution_notes)

    def test_section_7_pdf_from_real_alert(self):
        """Section 7 PDF generated from a real database alert asserts INDICATIVE watermark and absence of fake hash."""
        pdf_bytes = LegalNoticePDFGenerator.generate_section_7_pdf(self.cbe_alert)
        text = extract_pdf_text(pdf_bytes)

        # 1. INDICATIVE disclaimer must be prominently present
        self.assertTrue(
            "INDICATIVE" in text.upper() or "NOT A CERTIFIED" in text.upper(),
            "INDICATIVE disclaimer missing from Section 7 PDF text"
        )

        # 2. Cryptographic fake hash claim must be absent
        self.assertNotIn("SHA256-", text)
        self.assertNotIn("Cryptographic Hash", text)

        # 3. Real cadastral data from database fixture must be rendered
        self.assertIn("101/1", text)
        self.assertIn("Coimbatore", text)
        self.assertIn("Water Body Poramboke", text)

        # 4. Structure category must render without any MagicMock leak
        self.assertNotIn("<Mock", text)
        self.assertNotIn("MagicMock", text)
        self.assertIn("Commercial Layout", text)

    def test_database_guard_refuses_non_test_db(self):
        """Database guard must refuse to execute and raise RuntimeError if db name does not start with test_."""
        from django.db import connection
        from unittest.mock import patch
        from core.tests.base import DatabaseGuardMixin

        with patch.dict(connection.settings_dict, {'NAME': 'govland_shield'}):
            with self.assertRaises(RuntimeError) as ctx:
                class GuardCheck(DatabaseGuardMixin):
                    pass
                GuardCheck.setUpClass()
            self.assertIn("DATABASE GUARD BLOCKED", str(ctx.exception))
