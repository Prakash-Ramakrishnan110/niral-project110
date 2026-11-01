"""
Evidence Object Storage Service
Supports MinIO / S3 object storage with fallback to HMAC-SHA256 signed local media storage.
Generates short-lived presigned upload (PUT) and view (GET) URLs.
"""
import os
import hmac
import hashlib
import time
import uuid
import base64
from typing import Dict, Any, Optional
from django.conf import settings
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired

try:
    import boto3
    from botocore.client import Config
    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False


class EvidenceStorageService:
    BUCKET_NAME = getattr(settings, 'MINIO_BUCKET_NAME', 'geommand-evidence')
    UPLOAD_EXPIRY = 600  # 10 minutes
    VIEW_EXPIRY = 900    # 15 minutes

    @classmethod
    def is_s3_enabled(cls) -> bool:
        return bool(
            BOTO3_AVAILABLE and
            getattr(settings, 'MINIO_ENDPOINT', None) and
            getattr(settings, 'MINIO_ACCESS_KEY', None) and
            getattr(settings, 'MINIO_SECRET_KEY', None)
        )

    @classmethod
    def get_s3_client(cls):
        if not cls.is_s3_enabled():
            return None
        return boto3.client(
            's3',
            endpoint_url=settings.MINIO_ENDPOINT,
            aws_access_key_id=settings.MINIO_ACCESS_KEY,
            aws_secret_access_key=settings.MINIO_SECRET_KEY,
            config=Config(signature_version='s3v4'),
            region_name=getattr(settings, 'MINIO_REGION', 'us-east-1'),
        )

    @classmethod
    def ensure_bucket_exists(cls) -> bool:
        client = cls.get_s3_client()
        if not client:
            return False
        try:
            client.head_bucket(Bucket=cls.BUCKET_NAME)
            return True
        except Exception:
            try:
                client.create_bucket(Bucket=cls.BUCKET_NAME)
                return True
            except Exception:
                return False

    @classmethod
    def generate_object_key(cls, alert_id: Any, filename: str) -> str:
        now = time.gmtime()
        year = now.tm_year
        month = f"{now.tm_mon:02d}"
        ext = os.path.splitext(filename)[1].lower() or '.jpg'
        rand_id = uuid.uuid4().hex[:12]
        return f"evidence/{year}/{month}/alert_{alert_id}_{rand_id}{ext}"

    @classmethod
    def encode_token(cls, raw_string: str) -> str:
        return base64.urlsafe_b64encode(raw_string.encode('utf-8')).decode('utf-8').rstrip('=')

    @classmethod
    def decode_token(cls, token: str) -> str:
        padding = 4 - (len(token) % 4)
        if padding != 4:
            token += '=' * padding
        return base64.urlsafe_b64decode(token.encode('utf-8')).decode('utf-8')

    @classmethod
    def generate_presigned_upload_url(
        cls,
        officer_user,
        alert_id: Any,
        filename: str,
        content_type: str = 'image/jpeg',
        request_host: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generates a presigned PUT URL and object key for field upload.
        """
        object_key = cls.generate_object_key(alert_id, filename)

        if cls.is_s3_enabled():
            cls.ensure_bucket_exists()
            client = cls.get_s3_client()
            url = client.generate_presigned_url(
                ClientMethod='put_object',
                Params={
                    'Bucket': cls.BUCKET_NAME,
                    'Key': object_key,
                    'ContentType': content_type,
                },
                ExpiresIn=cls.UPLOAD_EXPIRY,
            )
            return {
                'upload_url': url,
                'object_key': object_key,
                'expires_in': cls.UPLOAD_EXPIRY,
                'storage_backend': 'minio_s3',
            }

        # Local Signed Storage Fallback (HMAC-SHA256 Token)
        signer = TimestampSigner(salt='evidence_upload_salt')
        token_data = f"{officer_user.id}:{alert_id}:{object_key}:{content_type}"
        raw_signed = signer.sign(token_data)
        safe_token = cls.encode_token(raw_signed)

        base_url = request_host or 'http://localhost:8000'
        upload_url = f"{base_url.rstrip('/')}/api/evidence/upload/{safe_token}/"

        return {
            'upload_url': upload_url,
            'object_key': object_key,
            'expires_in': cls.UPLOAD_EXPIRY,
            'storage_backend': 'local_signed',
        }

    @classmethod
    def generate_presigned_view_url(
        cls,
        object_key: str,
        request_host: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generates a short-lived signed GET URL for viewing an evidence photo.
        """
        if cls.is_s3_enabled():
            client = cls.get_s3_client()
            url = client.generate_presigned_url(
                ClientMethod='get_object',
                Params={
                    'Bucket': cls.BUCKET_NAME,
                    'Key': object_key,
                },
                ExpiresIn=cls.VIEW_EXPIRY,
            )
            return {
                'view_url': url,
                'object_key': object_key,
                'expires_in': cls.VIEW_EXPIRY,
                'storage_backend': 'minio_s3',
            }

        # Local Signed Storage Fallback
        signer = TimestampSigner(salt='evidence_view_salt')
        raw_signed = signer.sign(object_key)
        safe_token = cls.encode_token(raw_signed)
        base_url = request_host or 'http://localhost:8000'
        view_url = f"{base_url.rstrip('/')}/api/evidence/view/{safe_token}/"

        return {
            'view_url': view_url,
            'object_key': object_key,
            'expires_in': cls.VIEW_EXPIRY,
            'storage_backend': 'local_signed',
        }

    @classmethod
    def save_local_binary(cls, object_key: str, data: bytes) -> str:
        """
        Saves raw bytes into local media storage under the specified object key.
        """
        media_root = getattr(settings, 'MEDIA_ROOT', os.path.join(settings.BASE_DIR, 'media'))
        target_path = os.path.join(media_root, object_key.replace('/', os.sep))
        os.makedirs(os.path.dirname(target_path), exist_ok=True)
        with open(target_path, 'wb') as f:
            f.write(data)
        return target_path

    @classmethod
    def get_local_path(cls, object_key: str) -> Optional[str]:
        media_root = getattr(settings, 'MEDIA_ROOT', os.path.join(settings.BASE_DIR, 'media'))
        target_path = os.path.join(media_root, object_key.replace('/', os.sep))
        if os.path.isfile(target_path):
            return target_path
        return None
