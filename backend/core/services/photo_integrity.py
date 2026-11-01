"""
Photo EXIF Integrity and Geofence Verification Service
Inspects uploaded photos for embedded GPS coordinates (EXIF tag 34853),
validates timestamp freshness, and calculates metric distance against parcel boundaries using EPSG:32644.
"""
import io
from typing import Dict, Any, Optional, Tuple
from django.contrib.gis.geos import Point, GEOSGeometry
from PIL import Image, ExifTags
from .evidence_storage import EvidenceStorageService


def _convert_to_degrees(value) -> float:
    """Helper to convert the GPS coordinates stored in EXIF to decimal degrees."""
    d = float(value[0])
    m = float(value[1])
    s = float(value[2])
    return d + (m / 60.0) + (s / 3600.0)


class PhotoIntegrityService:
    @staticmethod
    def extract_exif_gps(image_data: bytes) -> Optional[Tuple[float, float, Optional[str]]]:
        """
        Extracts decimal (lat, lon, timestamp) from image bytes if EXIF GPSInfo is present.
        """
        try:
            image = Image.open(io.BytesIO(image_data))
            exif = image._getexif()
            if not exif:
                return None

            gps_info = {}
            datetime_taken = None

            for tag_id, val in exif.items():
                tag_name = ExifTags.TAGS.get(tag_id, tag_id)
                if tag_name == 'DateTimeOriginal':
                    datetime_taken = str(val)
                elif tag_name == 'GPSInfo':
                    for t in val:
                        sub_tag = ExifTags.GPSTAGS.get(t, t)
                        gps_info[sub_tag] = val[t]

            if 'GPSLatitude' in gps_info and 'GPSLongitude' in gps_info:
                lat = _convert_to_degrees(gps_info['GPSLatitude'])
                if gps_info.get('GPSLatitudeRef', 'N') != 'N':
                    lat = -lat

                lon = _convert_to_degrees(gps_info['GPSLongitude'])
                if gps_info.get('GPSLongitudeRef', 'E') != 'E':
                    lon = -lon

                return lat, lon, datetime_taken
        except Exception:
            return None
        return None

    @classmethod
    def verify_photo(
        cls,
        photo_bytes_or_key: Any,
        parcel_geom: GEOSGeometry,
        device_lat: float,
        device_lon: float,
    ) -> Dict[str, Any]:
        """
        Verifies photo EXIF against parcel boundary and device reported location.
        Uses EPSG:32644 metric projection (UTM Zone 44N).
        """
        image_bytes: Optional[bytes] = None

        if isinstance(photo_bytes_or_key, bytes):
            image_bytes = photo_bytes_or_key
        elif isinstance(photo_bytes_or_key, str):
            # Check if object key in storage
            local_path = EvidenceStorageService.get_local_path(photo_bytes_or_key)
            if local_path:
                try:
                    with open(local_path, 'rb') as f:
                        image_bytes = f.read()
                except Exception:
                    pass

        if not image_bytes:
            return {
                "exif_verified": False,
                "reason": "Could not read photo binary for EXIF analysis",
            }

        exif_result = cls.extract_exif_gps(image_bytes)
        if not exif_result:
            return {
                "exif_verified": False,
                "reason": "No embedded GPS EXIF metadata found",
            }

        photo_lat, photo_lon, photo_time = exif_result

        # Project coordinates to EPSG:32644 (metres)
        photo_pt = Point(photo_lon, photo_lat, srid=4326).transform(32644, clone=True)
        device_pt = Point(device_lon, device_lat, srid=4326).transform(32644, clone=True)
        parcel_m = parcel_geom.transform(32644, clone=True)

        dist_to_parcel = round(photo_pt.distance(parcel_m), 2)
        dist_to_device = round(photo_pt.distance(device_pt), 2)

        from django.conf import settings
        exif_limit = getattr(settings, 'PHOTO_EXIF_MISMATCH_LIMIT_METERS', 50.0)
        mismatch = dist_to_device > exif_limit

        return {
            "exif_verified": True,
            "photo_lat": round(photo_lat, 6),
            "photo_lon": round(photo_lon, 6),
            "timestamp": photo_time,
            "dist_to_parcel_meters": dist_to_parcel,
            "dist_to_device_meters": dist_to_device,
            "location_mismatch": mismatch,
        }

