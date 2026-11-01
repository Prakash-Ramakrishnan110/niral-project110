import os
import mimetypes
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.http import HttpResponse, FileResponse, Http404
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
from .models import EncroachmentAlert
from .services.evidence_storage import EvidenceStorageService


class EvidenceUploadUrlView(APIView):
    """
    POST /api/evidence/upload-url/
    Generates a presigned PUT upload URL and canonical object key.
    Requires authenticated field officer session.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        alert_id = request.data.get('alert') or request.data.get('alert_id')
        filename = request.data.get('filename', 'photo.jpg')
        content_type = request.data.get('content_type', 'image/jpeg')

        if not alert_id:
            return Response(
                {"error": "alert field is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            alert = EncroachmentAlert.objects.select_related('parcel').get(id=alert_id)
        except EncroachmentAlert.DoesNotExist:
            return Response(
                {"error": "Specified EncroachmentAlert not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        request_host = request.build_absolute_uri('/')

        result = EvidenceStorageService.generate_presigned_upload_url(
            officer_user=request.user,
            alert_id=alert.id,
            filename=filename,
            content_type=content_type,
            request_host=request_host
        )

        return Response(result, status=status.HTTP_200_OK)


class EvidenceDirectUploadView(APIView):
    """
    PUT /api/evidence/upload/<signed_token>/
    Direct binary upload endpoint for local/offline environments.
    Verifies HMAC signature and 10-minute expiry window.
    """
    permission_classes = [AllowAny]

    def put(self, request, signed_token):
        try:
            raw_signed = EvidenceStorageService.decode_token(signed_token)
        except Exception:
            return Response(
                {"error": "Malformed or invalid upload token encoding."},
                status=status.HTTP_400_BAD_REQUEST
            )

        signer = TimestampSigner(salt='evidence_upload_salt')
        try:
            token_data = signer.unsign(raw_signed, max_age=EvidenceStorageService.UPLOAD_EXPIRY)
        except SignatureExpired:
            return Response(
                {"error": "Upload URL expired. Please request a new upload link."},
                status=status.HTTP_403_FORBIDDEN
            )
        except BadSignature:
            return Response(
                {"error": "Invalid upload signature."},
                status=status.HTTP_403_FORBIDDEN
            )

        parts = token_data.split(':', 3)
        if len(parts) != 4:
            return Response(
                {"error": "Malformed upload token payload."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user_id, alert_id, object_key, content_type = parts

        binary_data = request.body
        if not binary_data or len(binary_data) < 32:
            return Response(
                {"error": "Empty or corrupted image payload."},
                status=status.HTTP_400_BAD_REQUEST
            )

        EvidenceStorageService.save_local_binary(object_key, binary_data)

        return Response({
            "status": "UPLOAD_SUCCESS",
            "object_key": object_key,
            "bytes_received": len(binary_data),
        }, status=status.HTTP_200_OK)


class EvidenceViewUrlView(APIView):
    """
    GET /api/evidence/view/<signed_token>/
    Serves evidence photo stream for verified signed view tokens.
    """
    permission_classes = [AllowAny]

    def get(self, request, signed_token):
        try:
            raw_signed = EvidenceStorageService.decode_token(signed_token)
        except Exception:
            return Response(
                {"error": "Malformed or invalid view token encoding."},
                status=status.HTTP_400_BAD_REQUEST
            )

        signer = TimestampSigner(salt='evidence_view_salt')
        try:
            object_key = signer.unsign(raw_signed, max_age=EvidenceStorageService.VIEW_EXPIRY)
        except SignatureExpired:
            return Response(
                {"error": "View link expired."},
                status=status.HTTP_403_FORBIDDEN
            )
        except BadSignature:
            return Response(
                {"error": "Invalid view signature."},
                status=status.HTTP_403_FORBIDDEN
            )

        local_path = EvidenceStorageService.get_local_path(object_key)
        if not local_path or not os.path.isfile(local_path):
            raise Http404("Evidence photo not found.")

        mime_type, _ = mimetypes.guess_type(local_path)
        return FileResponse(open(local_path, 'rb'), content_type=mime_type or 'image/jpeg')
