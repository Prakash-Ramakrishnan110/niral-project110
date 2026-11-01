import io
from django.test import TestCase
from django.contrib.auth.models import User
from django.contrib.gis.geos import Polygon, Point
from rest_framework.test import APIClient
from rest_framework import status
from PIL import Image
from core.models import LandParcel, EncroachmentAlert, FieldVerification, UserProfile, CaseAuditEvent
from core.services.photo_integrity import PhotoIntegrityService


def create_jpeg_with_gps(lat: float, lon: float) -> bytes:
    """Helper creating a valid JPEG binary with embedded EXIF GPS tags."""
    img = Image.new('RGB', (40, 40), color='forestgreen')
    exif = img.getexif()
    gps_ifd = exif.get_ifd(0x8825)

    # Convert decimal lat/lon to deg, min, sec
    lat_deg = int(abs(lat))
    lat_min = int((abs(lat) - lat_deg) * 60)
    lat_sec = round(((abs(lat) - lat_deg) * 60 - lat_min) * 60, 4)

    lon_deg = int(abs(lon))
    lon_min = int((abs(lon) - lon_deg) * 60)
    lon_sec = round(((abs(lon) - lon_deg) * 60 - lon_min) * 60, 4)

    gps_ifd[1] = 'N' if lat >= 0 else 'S'
    gps_ifd[2] = (lat_deg, lat_min, lat_sec)
    gps_ifd[3] = 'E' if lon >= 0 else 'W'
    gps_ifd[4] = (lon_deg, lon_min, lon_sec)

    bio = io.BytesIO()
    img.save(bio, format='JPEG', exif=exif)
    return bio.getvalue()


class GeofenceAndPhotoIntegrityTests(TestCase):
    def setUp(self):
        self.vao_user = User.objects.create_user(username='vao_kannan_test', password='SecurePassword123!')
        UserProfile.objects.create(
            user=self.vao_user,
            role='VAO',
            district='Salem',
            taluk='Salem West',
            village='Kannankurichi'
        )

        self.tahsildar_user = User.objects.create_user(username='tahsildar_test', password='SecurePassword123!')
        UserProfile.objects.create(
            user=self.tahsildar_user,
            role='TAHSILDAR',
            district='Salem',
            taluk='Salem West'
        )

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

    def test_on_site_verification_within_15m_passes(self):
        client = APIClient()
        client.force_authenticate(user=self.vao_user)

        # Coordinates inside the parcel (approx 11.65, 78.15)
        res = client.post('/api/verifications/', {
            'alert': str(self.alert.id),
            'verdict': 'ENCROACHMENT_CONFIRMED',
            'gps_lat': 11.6500,
            'gps_lon': 78.1500,
            'remarks': 'On-site verification completed within parcel boundary.',
            'photos': []
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res.data['geofence_ok'])
        self.assertLessEqual(res.data['distance_to_parcel_meters'], 15.0)

    def test_off_site_verification_exceeding_15m_rejected_for_vao(self):
        client = APIClient()
        client.force_authenticate(user=self.vao_user)

        # Coordinates 500m away from parcel
        res = client.post('/api/verifications/', {
            'alert': str(self.alert.id),
            'verdict': 'ENCROACHMENT_CONFIRMED',
            'gps_lat': 11.6700,
            'gps_lon': 78.1500,
            'remarks': 'Attempting remote submission without physical presence.',
            'photos': []
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Geofence Check Failed', res.data['error'])

    def test_vao_cannot_override_geofence(self):
        client = APIClient()
        client.force_authenticate(user=self.vao_user)

        res = client.post('/api/verifications/', {
            'alert': str(self.alert.id),
            'verdict': 'ENCROACHMENT_CONFIRMED',
            'gps_lat': 11.6700,
            'gps_lon': 78.1500,
            'supervisor_override': True,
            'supervisor_override_reason': 'Flooding prevents crossing the canal.',
            'remarks': 'Attempting unauthorized VAO override.',
            'photos': []
        })
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('Field VAO cannot unilaterally override', res.data['error'])

    def test_tahsildar_supervisor_override_succeeds_with_audit_trail(self):
        client = APIClient()
        client.force_authenticate(user=self.tahsildar_user)

        res = client.post('/api/verifications/', {
            'alert': str(self.alert.id),
            'verdict': 'ENCROACHMENT_CONFIRMED',
            'gps_lat': 11.6700,
            'gps_lon': 78.1500,
            'supervisor_override': True,
            'supervisor_override_reason': 'Severe waterlogging and physical fence obstruction prevented access closer than 30m.',
            'remarks': 'Supervisory verification with documented physical impediment.',
            'photos': []
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        # Verify CaseAuditEvent was recorded
        audit_event = CaseAuditEvent.objects.filter(
            alert=self.alert,
            action='GEOFENCE_SUPERVISOR_OVERRIDE'
        ).first()
        self.assertIsNotNone(audit_event)
        self.assertEqual(audit_event.actor, self.tahsildar_user)
        self.assertIn('Severe waterlogging', audit_event.reason)

    def test_photo_exif_mismatch_detection(self):
        # Create photo with GPS coordinates 2 km away (11.67, 78.15 vs device 11.65, 78.15)
        photo_bytes = create_jpeg_with_gps(11.6700, 78.1500)

        # Inspect using PhotoIntegrityService directly
        audit = PhotoIntegrityService.verify_photo(
            photo_bytes,
            self.parcel.geom,
            device_lat=11.6500,
            device_lon=78.1500
        )
        self.assertTrue(audit['exif_verified'])
        self.assertTrue(audit['location_mismatch'])
        self.assertGreater(audit['dist_to_device_meters'], 50.0)

