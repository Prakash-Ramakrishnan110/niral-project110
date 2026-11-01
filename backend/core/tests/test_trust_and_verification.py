import json
from io import StringIO
from django.test import TestCase
from django.contrib.auth.models import User
from django.contrib.gis.geos import Polygon, Point
from django.core.management import call_command
from django.core.management.base import CommandError
from rest_framework.test import APIClient
from rest_framework import status
from core.models import LandParcel, EncroachmentAlert, CaseAuditEvent
from core.services.legal_notice_pdf import LegalNoticePDFGenerator


class TrustAndVerificationTests(TestCase):
    """
    Test suite for Trust Features (Item 6):
    - CaseAuditEvent SHA-256 cryptographic hash chaining
    - verify_audit_chain tamper-check CLI command
    - LegalNoticePDFGenerator QR code embedding & deterministic digests
    - PublicNoticeVerifyView (/api/notices/verify/<hash>/ and /api/v1/verify/<hash>/)
    """

    def setUp(self):
        self.user = User.objects.create_user(username='test_tahsildar', password='Password123!')
        poly = Polygon(((78.14, 11.64), (78.16, 11.64), (78.16, 11.66), (78.14, 11.66), (78.14, 11.64)))
        self.parcel = LandParcel.objects.create(
            survey_number='101',
            subdivision='1A',
            district='Salem',
            taluk='Salem West',
            village_name='Kannankurichi',
            classification='Government Poramboke',
            owner_name='Encroacher A',
            geom=poly,
        )
        self.alert = EncroachmentAlert.objects.create(
            parcel=self.parcel,
            alert_geom=Point(78.15, 11.65),
            encroached_area_sqft=1250.0,
            status=EncroachmentAlert.STATE_NEW,
            snapshot_model_version='none-simulated'
        )
        self.client = APIClient()

    def test_audit_event_hash_chain_creation(self):
        """Sequential audit events form an immutable SHA-256 hash chain."""
        # Genesis event
        e1 = CaseAuditEvent.objects.create(
            alert=self.alert,
            actor=self.user,
            actor_role='TAHSILDAR',
            action='CASE_INITIATED',
            from_state='NEW',
            to_state='VAO_ASSIGNED',
            reason='Initial case trigger'
        )
        self.assertEqual(e1.previous_event_hash, '0' * 64)
        self.assertTrue(len(e1.current_hash) == 64)
        self.assertEqual(e1.current_hash, e1.compute_event_hash('0' * 64))

        # Second event
        e2 = CaseAuditEvent.objects.create(
            alert=self.alert,
            actor=self.user,
            actor_role='TAHSILDAR',
            action='NOTICE_ISSUED',
            from_state='VAO_ASSIGNED',
            to_state='SECTION_7_ISSUED',
            reason='Issued Section 7 notice'
        )
        self.assertEqual(e2.previous_event_hash, e1.current_hash)
        self.assertEqual(e2.current_hash, e2.compute_event_hash(e1.current_hash))

        # Third event
        e3 = CaseAuditEvent.objects.create(
            alert=self.alert,
            actor=self.user,
            actor_role='TAHSILDAR',
            action='HEARING_CALLED',
            from_state='SECTION_7_ISSUED',
            to_state='HEARING_SCHEDULED',
            reason='Hearing fixed'
        )
        self.assertEqual(e3.previous_event_hash, e2.current_hash)
        self.assertEqual(e3.current_hash, e3.compute_event_hash(e2.current_hash))

    def test_verify_audit_chain_management_command_success(self):
        """verify_audit_chain passes when all events are unmolested."""
        CaseAuditEvent.objects.create(
            alert=self.alert,
            actor=self.user,
            actor_role='TAHSILDAR',
            action='STEP_1',
            from_state='NEW',
            to_state='STEP_1'
        )
        CaseAuditEvent.objects.create(
            alert=self.alert,
            actor=self.user,
            actor_role='TAHSILDAR',
            action='STEP_2',
            from_state='STEP_1',
            to_state='STEP_2'
        )
        out = StringIO()
        call_command('verify_audit_chain', stdout=out)
        self.assertIn("Cryptographic SHA-256 hash chain is 100% valid (0 tamper violations)", out.getvalue())

    def test_verify_audit_chain_tamper_detection(self):
        """verify_audit_chain detects malicious modifications to historic events."""
        e1 = CaseAuditEvent.objects.create(
            alert=self.alert,
            actor=self.user,
            actor_role='TAHSILDAR',
            action='STEP_1',
            from_state='NEW',
            to_state='STEP_1',
            reason='Legitimate reason'
        )
        e2 = CaseAuditEvent.objects.create(
            alert=self.alert,
            actor=self.user,
            actor_role='TAHSILDAR',
            action='STEP_2',
            from_state='STEP_1',
            to_state='STEP_2',
            reason='Next action'
        )

        # Maliciously tamper with historic reason directly in DB without recalculating hash
        CaseAuditEvent.objects.filter(id=e1.id).update(reason='TAMPERED REASON BY ADVERSARY')

        with self.assertRaises(CommandError) as ctx:
            call_command('verify_audit_chain')
        self.assertIn("Audit chain verification failed", str(ctx.exception))

    def test_pdf_qr_and_digest_generation(self):
        """LegalNoticePDFGenerator embeds QR code and records document generation in audit chain."""
        pdf_bytes = LegalNoticePDFGenerator.generate_section_7_pdf(self.alert)
        self.assertTrue(len(pdf_bytes) > 2000)
        self.assertTrue(pdf_bytes.startswith(b'%PDF'))

        # Check that CaseAuditEvent was created with notice hash
        digest = LegalNoticePDFGenerator.compute_notice_digest(self.alert, '7')
        audit_ev = CaseAuditEvent.objects.filter(alert=self.alert, action='STATUTORY_NOTICE_7_GENERATED').first()
        self.assertIsNotNone(audit_ev)
        self.assertEqual(audit_ev.metadata['notice_hash'], digest)
        self.assertIn('/verify/', audit_ev.metadata['verify_url'])

    def test_public_verify_endpoint_valid_digest(self):
        """Public endpoint GET /api/notices/verify/<hash>/ verifies valid document."""
        # Generate notice to register it
        LegalNoticePDFGenerator.generate_section_7_pdf(self.alert)
        digest = LegalNoticePDFGenerator.compute_notice_digest(self.alert, '7')

        url = f'/api/notices/verify/{digest}/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(data['verified'])
        self.assertEqual(data['statutory_status'], 'VALID_TAMPER_EVIDENT_DOCUMENT')
        self.assertEqual(data['cadastral_details']['survey_number'], '101/1A')
        self.assertEqual(data['cadastral_details']['district'], 'Salem')
        self.assertTrue(data['audit_chain_verified'])

        # Test alternative v1 alias
        v1_url = f'/api/v1/verify/{digest}/'
        v1_resp = self.client.get(v1_url)
        self.assertEqual(v1_resp.status_code, status.HTTP_200_OK)

    def test_public_verify_endpoint_invalid_or_tampered_digest(self):
        """Public endpoint returns 404 for unknown or tampered digest."""
        fake_hash = 'a' * 64
        url = f'/api/notices/verify/{fake_hash}/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertFalse(response.json()['verified'])
        self.assertEqual(response.json()['error'], 'DOCUMENT_NOT_FOUND_OR_TAMPERED')

    def test_public_verify_endpoint_malformed_hash(self):
        """Public endpoint returns 400 for bad hash length/format."""
        url = '/api/notices/verify/short-hash/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.json()['error'], 'INVALID_HASH_FORMAT')
