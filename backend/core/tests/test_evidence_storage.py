import base64
import os
from io import StringIO
from django.test import TestCase
from django.contrib.auth.models import User
from django.contrib.gis.geos import Polygon, Point
from django.core.management import call_command
from rest_framework.test import APIClient
from rest_framework import status
from core.models import LandParcel, EncroachmentAlert, FieldVerification, UserProfile
from core.services.evidence_storage import EvidenceStorageService


class EvidenceStorageTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='test_vao_evidence', password='SecurePassword123!')
        UserProfile.objects.create(
            user=self.user,
            role='VAO',
            district='Salem',
            taluk='Salem West',
            village='Kannankurichi'
        )
        self.client.force_authenticate(user=self.user)

        poly = Polygon(((78.14, 11.64), (78.16, 11.64), (78.16, 11.66), (78.14, 11.66), (78.14, 11.64)))
        self.parcel = LandParcel.objects.create(
            survey_number='142',
            subdivision='1',
            district='Salem',
            taluk='Salem West',
            village_name='Kannankurichi',
            village_code='636008',
            classification='Government',
            geom=poly,
        )

        self.alert = EncroachmentAlert.objects.create(
            parcel=self.parcel,
            alert_geom=Point(78.15, 11.65),
            confidence_score=0.92,
            status='VAO_ASSIGNED',
            snapshot_model_version='none-simulated'
        )

    def test_upload_url_requires_authentication(self):
        unauth_client = APIClient()
        res = unauth_client.post('/api/evidence/upload-url/', {'alert': str(self.alert.id)})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_upload_url_requires_alert_id(self):
        res = self.client.post('/api/evidence/upload-url/', {})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('alert field is required', res.data['error'])

    def test_generate_presigned_upload_and_direct_upload_lifecycle(self):
        res = self.client.post('/api/evidence/upload-url/', {
            'alert': str(self.alert.id),
            'filename': 'canal_encroachment.jpg',
            'content_type': 'image/jpeg'
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('upload_url', res.data)
        self.assertIn('object_key', res.data)
        self.assertIn(str(self.alert.id), res.data['object_key'])

        upload_url = res.data['upload_url']
        object_key = res.data['object_key']

        # Extract signed token from upload_url
        token = upload_url.split('/api/evidence/upload/')[1].rstrip('/')

        # Perform direct binary upload via PUT
        test_binary = b"GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;"
        put_res = self.client.put(
            f'/api/evidence/upload/{token}/',
            data=test_binary,
            content_type='image/gif'
        )
        self.assertEqual(put_res.status_code, status.HTTP_200_OK)
        self.assertEqual(put_res.data['status'], 'UPLOAD_SUCCESS')
        self.assertEqual(put_res.data['object_key'], object_key)

        # Verify signed view link
        view_info = EvidenceStorageService.generate_presigned_view_url(object_key)
        self.assertIn('view_url', view_info)
        view_token = view_info['view_url'].split('/api/evidence/view/')[1].rstrip('/')

        get_res = self.client.get(f'/api/evidence/view/{view_token}/')
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)
        self.assertEqual(get_res.getvalue(), test_binary)

    def test_upload_rejects_tampered_token(self):
        tampered_token = EvidenceStorageService.encode_token("tampered_token_data:invalid_signature")
        put_res = self.client.put(
            f'/api/evidence/upload/{tampered_token}/',
            data=b"dummy bytes",
            content_type='image/jpeg'
        )
        self.assertEqual(put_res.status_code, status.HTTP_403_FORBIDDEN)

    def test_migrate_base64_photos_command(self):
        # Create a verification with a legacy base64 photo
        tiny_gif_b64 = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        fv = FieldVerification.objects.create(
            alert=self.alert,
            officer_name='VAO Kannankurichi',
            verdict='ENCROACHMENT_CONFIRMED',
            gps_lat=11.65,
            gps_lon=78.15,
            photos=[tiny_gif_b64],
            remarks='Testing base64 migration command safety'
        )

        # 1. Dry run should NOT mutate database
        out_dry = StringIO()
        call_command('migrate_base64_photos', '--dry-run', stdout=out_dry)
        output_str = out_dry.getvalue()
        self.assertIn('DRY RUN', output_str)
        self.assertIn('Verifications needing migration: 1', output_str)

        fv.refresh_from_db()
        self.assertTrue(fv.photos[0].startswith('data:image'))

        # 2. Live migration with --confirm should migrate and update photo key
        out_live = StringIO()
        call_command('migrate_base64_photos', '--confirm', stdout=out_live)
        live_str = out_live.getvalue()
        self.assertIn('COMMITTED TO DATABASE', live_str)

        fv.refresh_from_db()
        self.assertFalse(fv.photos[0].startswith('data:image'))
        self.assertTrue(fv.photos[0].startswith('evidence/'))
