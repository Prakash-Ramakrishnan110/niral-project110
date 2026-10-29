import json
from datetime import timedelta
from django.utils import timezone
from django.http import HttpResponse
from django.db.models import Q
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from core.models import (
    EncroachmentAlert,
    CaseAuditEvent,
    FieldVerification,
    LandParcel
)
from core.services.case_state_machine import (
    CaseStateMachine,
    StateMachineError,
    ConcurrencyConflictError,
    IllegalTransitionError,
    TransitionGuardError,
    AuthorizationError
)
from core.services.jurisdiction_scope import JurisdictionScopeService
from core.services.idempotency import handle_idempotent_request
from core.services.change_feed import ChangeFeedService
from core.services.legal_notice_pdf import LegalNoticePDFGenerator
from core.services.high_court_compliance import HighCourtComplianceGenerator


class CaseViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Statutory Encroachment Case Management ViewSet (Part 14 Step 6).
    Enforces statewide administrative jurisdiction scoping, optimistic concurrency (409),
    role-based allowed transitions, ReportLab notice generation, and network idempotency.
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = [
        'id',
        'parcel__survey_number',
        'parcel__patta_number',
        'parcel__owner_name',
        'parcel__ulpin'
    ]

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return EncroachmentAlert.objects.none()

        # Jurisdiction-scoped query
        qs = JurisdictionScopeService.scope_alerts(
            EncroachmentAlert.objects.select_related('parcel', 'parcel__district_ref', 'parcel__taluk_ref', 'parcel__village_ref').all(),
            user
        ).order_by('-detection_date')

        # Additional query param filters
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        lane_filter = self.request.query_params.get('priority_lane')
        if lane_filter:
            qs = qs.filter(priority_lane=lane_filter.upper())

        district_filter = self.request.query_params.get('district')
        if district_filter:
            qs = qs.filter(parcel__district__iexact=district_filter)

        taluk_filter = self.request.query_params.get('taluk')
        if taluk_filter:
            qs = qs.filter(parcel__taluk__iexact=taluk_filter)

        village_filter = self.request.query_params.get('village')
        if village_filter:
            qs = qs.filter(Q(parcel__village_name__iexact=village_filter) | Q(parcel__village_code__iexact=village_filter))

        classification_filter = self.request.query_params.get('classification')
        if classification_filter:
            qs = qs.filter(parcel__classification__iexact=classification_filter)

        is_actionable = self.request.query_params.get('is_actionable')
        if is_actionable in ['true', 'True', '1']:
            role = JurisdictionScopeService.get_primary_role(user)
            role_action_states = {
                'VAO': [EncroachmentAlert.STATE_VAO_ASSIGNED, EncroachmentAlert.STATE_IN_FIELD_VERIFICATION, EncroachmentAlert.STATE_VAO_ASSIGNED_LEGACY],
                'INSPECTOR': [EncroachmentAlert.STATE_VAO_SUBMITTED, EncroachmentAlert.STATE_FALSE_POSITIVE_CLAIMED],
                'TAHSILDAR': [
                    EncroachmentAlert.STATE_INSPECTOR_APPROVED, EncroachmentAlert.STATE_NOTICE_PREPARATION,
                    EncroachmentAlert.STATE_NOTICE_REPLY_PENDING, EncroachmentAlert.STATE_HEARING_SCHEDULED,
                    EncroachmentAlert.STATE_TRIAGE_LEGACY, EncroachmentAlert.STATE_TAHSILDAR_ACCEPTED_LEGACY
                ],
                'COLLECTOR': [
                    EncroachmentAlert.STATE_TIER1_ESCALATED, EncroachmentAlert.STATE_NEW,
                    EncroachmentAlert.STATE_COLLECTOR_ACCEPTED_LEGACY, EncroachmentAlert.STATE_REENCROACHMENT_FLAGGED
                ]
            }
            action_states = role_action_states.get(role, [])
            qs = qs.filter(status__in=action_states)

        return qs

    def _serialize_case_summary(self, alert, user):
        """Serializes alert for list view, including computed allowed_actions."""
        parcel = alert.parcel
        return {
            "id": alert.id,
            "parcel_id": str(parcel.id) if parcel else None,
            "survey_number": parcel.survey_number if parcel else "Unknown",
            "subdivision": parcel.subdivision if parcel else "",
            "ulpin": parcel.ulpin if parcel else None,
            "district": parcel.district if parcel else "",
            "district_ta": parcel.district_ta if parcel else "",
            "taluk": parcel.taluk if parcel else "",
            "taluk_ta": parcel.taluk_ta if parcel else "",
            "village": parcel.village_name if parcel else "",
            "village_ta": parcel.village_ta if parcel else "",
            "classification": parcel.classification if parcel else "Government",
            "owner_name": parcel.owner_name if parcel else None,
            "status": alert.status,
            "status_display": alert.status.replace('_', ' ').title(),
            "priority_lane": alert.priority_lane,
            "confidence_score": alert.confidence_score,
            "confidence_category": alert.confidence_category,
            "structure_category": alert.structure_category,
            "encroached_area_sqft": alert.encroached_area_sqft,
            "detection_date": alert.detection_date.isoformat() if alert.detection_date else None,
            "sla_deadline": alert.sla_deadline.isoformat() if alert.sla_deadline else None,
            "is_sla_breached": alert.is_sla_breached(),
            "version": alert.version,
            "is_synthetic": alert.is_synthetic,
            "approver_unverified": alert.approver_unverified,
            "allowed_actions": CaseStateMachine.get_allowed_transitions(alert, user),
        }

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            data = [self._serialize_case_summary(a, request.user) for a in page]
            return self.get_paginated_response(data)

        data = [self._serialize_case_summary(a, request.user) for a in queryset]
        return Response(data, status=status.HTTP_200_OK)

    def retrieve(self, request, *args, **kwargs):
        alert = self.get_object()
        parcel = alert.parcel

        # Geometry GeoJSON representation
        geom_geojson = None
        centroid_coords = None
        if parcel and parcel.geom:
            geom_geojson = json.loads(parcel.geom.geojson)
            centroid_coords = [parcel.geom.centroid.y, parcel.geom.centroid.x]

        # FMB Measurements with statutory disclaimer
        fmb_data = dict(alert.fmb_measurements or {})
        fmb_data["disclaimer"] = "INDICATIVE - computed from polygon geometry, not a certified survey measurement"
        fmb_data["is_certified_survey"] = fmb_data.get("is_certified_survey", False)

        # Verifications
        verifications = []
        for v in alert.verifications.all().order_by('-verified_at'):
            verifications.append({
                "id": str(v.id),
                "officer_name": v.officer.get_full_name() or v.officer.username if v.officer else "Field Officer",
                "officer_designation": v.officer_designation,
                "officer_badge_number": v.officer_badge_number,
                "verdict": v.verdict,
                "verified_at": v.verified_at.isoformat() if v.verified_at else None,
                "distance_to_boundary_m": v.distance_to_boundary_m,
                "geofence_verified": v.geofence_verified,
                "gps_accuracy_m": v.gps_accuracy_m,
                "photo_urls": v.photo_urls,
                "panchnama_file_url": v.panchnama_file_url,
                "inspection_notes": v.inspection_notes,
                "is_peer_audit": v.audit_of is not None,
                "audit_divergence": v.audit_divergence,
            })

        # Stay Details
        court_stay = {
            "in_force": alert.status == EncroachmentAlert.STATE_COURT_STAY_HOLD,
            "stay_order_number": alert.stay_order_number,
            "stayed_by_court": alert.stayed_by_court,
            "stay_granted_date": alert.stay_granted_date.isoformat() if alert.stay_granted_date else None,
            "stay_vacated_date": alert.stay_vacated_date.isoformat() if alert.stay_vacated_date else None,
            "bench": getattr(alert, 'judicial_bench', 'Madras High Court (Principal Seat)'),
        }

        # Immutable Audit Timeline
        audit_events = []
        for event in alert.audit_events.all().order_by('-created_at'):
            audit_events.append({
                "id": str(event.id),
                "actor_name": event.actor.get_full_name() or event.actor.username if event.actor else "System",
                "actor_role": event.actor_role,
                "action": event.action,
                "from_state": event.from_state,
                "to_state": event.to_state,
                "reason": event.reason,
                "metadata": event.metadata,
                "created_at": event.created_at.isoformat(),
            })

        summary = self._serialize_case_summary(alert, request.user)
        summary.update({
            "parcel": {
                "id": str(parcel.id) if parcel else None,
                "survey_number": parcel.survey_number if parcel else "",
                "subdivision": parcel.subdivision if parcel else "",
                "patta_number": parcel.patta_number if parcel else "",
                "owner_name": parcel.owner_name if parcel else "",
                "classification": parcel.classification if parcel else "",
                "tamil_nilam_meta": parcel.tamil_nilam_meta if parcel else {},
                "area_extent": parcel.area_extent if parcel else "",
                "g_value": parcel.g_value if parcel else "",
                "ulpin": parcel.ulpin if parcel else "",
                "district": parcel.district if parcel else "",
                "district_ta": parcel.district_ta if parcel else "",
                "taluk": parcel.taluk if parcel else "",
                "taluk_ta": parcel.taluk_ta if parcel else "",
                "village_name": parcel.village_name if parcel else "",
                "village_ta": parcel.village_ta if parcel else "",
                "centroid": centroid_coords,
                "geojson": geom_geojson,
            },
            "fmb_measurements": fmb_data,
            "court_stay": court_stay,
            "verifications": verifications,
            "audit_timeline": audit_events,
            "resolution_notes": alert.resolution_notes,
        })

        return Response(summary, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def transitions(self, request, pk=None):
        """
        Executes a validated, guard-checked state transition (Part 14 Step 6).
        Enforces optimistic concurrency (409), statutory authority check,
        network idempotency, and audit logging.
        """
        alert = self.get_object()
        user = request.user

        # 1. Authority & Geographic Jurisdiction Check
        can_write, reason = JurisdictionScopeService.can_write_case(alert, user)
        if not can_write:
            return Response(
                {"error": f"Access Denied: {reason}"},
                status=status.HTTP_403_FORBIDDEN
            )

        # 2. Network Idempotency via Idempotency-Key
        idempotency_key = request.headers.get('Idempotency-Key') or request.META.get('HTTP_IDEMPOTENCY_KEY')
        if idempotency_key:
            endpoint = f"/api/cases/{alert.id}/transitions/"
            def execute_operation():
                return self._perform_transition(alert, request)
            status_code, body, is_replay = handle_idempotent_request(
                key=idempotency_key,
                endpoint=endpoint,
                user=user,
                payload=request.data,
                execute_func=execute_operation
            )
            resp = Response(body, status=status_code)
            if is_replay:
                resp['X-Cache'] = 'HIT-IDEMPOTENT'
            return resp

        # Direct execution without idempotency header
        res_status, res_body = self._perform_transition(alert, request)
        return Response(res_body, status=res_status)

    def _perform_transition(self, alert, request):
        """Helper to execute state machine transition logic."""
        target_state = request.data.get('target_state')
        if not target_state:
            return status.HTTP_400_BAD_REQUEST, {"error": "Missing required field: 'target_state'."}

        expected_version = request.data.get('expected_version')
        if expected_version is not None:
            try:
                expected_version = int(expected_version)
            except (ValueError, TypeError):
                return status.HTTP_400_BAD_REQUEST, {"error": "Invalid 'expected_version'. Must be an integer."}

        reason = request.data.get('reason', '')
        action_name = request.data.get('action') or f"TRANSITION_TO_{target_state}"
        metadata = request.data.get('metadata') or {}

        # Capture statutory acknowledgements (e.g. FMB polygon acknowledgement)
        if request.data.get('officer_fmb_acknowledgement'):
            metadata['officer_fmb_acknowledgement'] = True

        try:
            success, message, audit_event = CaseStateMachine.transition(
                alert=alert,
                target_state=target_state,
                actor=request.user,
                reason=reason,
                action=action_name,
                metadata=metadata,
                expected_version=expected_version
            )

            alert.refresh_from_db()
            response_data = self._serialize_case_summary(alert, request.user)
            response_data["message"] = message
            response_data["transition_success"] = True
            return status.HTTP_200_OK, response_data

        except ConcurrencyConflictError as cce:
            return status.HTTP_409_CONFLICT, {
                "error": str(cce),
                "code": "CONCURRENCY_CONFLICT",
                "current_version": cce.current_version,
                "expected_version": cce.expected_version,
            }
        except AuthorizationError as ae:
            return status.HTTP_403_FORBIDDEN, {"error": str(ae), "code": "UNAUTHORIZED_ACTION"}
        except (TransitionGuardError, IllegalTransitionError) as te:
            return status.HTTP_400_BAD_REQUEST, {"error": str(te), "code": "TRANSITION_BLOCKED"}
        except StateMachineError as sme:
            return status.HTTP_400_BAD_REQUEST, {"error": str(sme)}
        except Exception as ex:
            return status.HTTP_500_INTERNAL_SERVER_ERROR, {"error": f"Internal Transition Error: {str(ex)}"}

    @action(detail=True, methods=['get'], url_path='documents/section-7')
    def document_section_7(self, request, pk=None):
        """
        Generates and serves official draft Section 7 Show-Cause Notice PDF.
        Includes genuine SHA-256 hash header and indicative FMB sketch.
        """
        alert = self.get_object()
        can_read = JurisdictionScopeService.scope_alerts(
            EncroachmentAlert.objects.filter(pk=alert.pk),
            request.user
        ).exists()
        if not can_read:
            return Response({"error": "Access Denied: Alert is outside your administrative jurisdiction."}, status=status.HTTP_403_FORBIDDEN)

        try:
            pdf_bytes = LegalNoticePDFGenerator.generate_section_7_pdf(alert)
            sha256 = LegalNoticePDFGenerator.compute_sha256(pdf_bytes)

            response = HttpResponse(pdf_bytes, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="section-7-notice-{alert.id}.pdf"'
            response['X-Document-SHA256'] = sha256
            response['X-Legal-Status'] = 'DRAFT_PENDING_LEGAL_REVIEW'
            response['X-Cadastral-Disclaimer'] = 'INDICATIVE_POLYGON_DERIVED'
            return response
        except Exception as ex:
            return Response({"error": f"Failed to generate Section 7 PDF: {str(ex)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'], url_path='documents/section-6')
    def document_section_6(self, request, pk=None):
        """
        Generates and serves official draft Section 6 Eviction Warrant PDF.
        Enforces statutory guards (VULNERABLE_HOUSING and COURT_STAY_HOLD must not be ordered).
        """
        alert = self.get_object()
        can_read = JurisdictionScopeService.scope_alerts(
            EncroachmentAlert.objects.filter(pk=alert.pk),
            request.user
        ).exists()
        if not can_read:
            return Response({"error": "Access Denied: Alert is outside your administrative jurisdiction."}, status=status.HTTP_403_FORBIDDEN)

        try:
            pdf_bytes = LegalNoticePDFGenerator.generate_section_6_pdf(alert)
            sha256 = LegalNoticePDFGenerator.compute_sha256(pdf_bytes)

            response = HttpResponse(pdf_bytes, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="section-6-warrant-{alert.id}.pdf"'
            response['X-Document-SHA256'] = sha256
            response['X-Legal-Status'] = 'DRAFT_PENDING_LEGAL_REVIEW'
            response['X-Cadastral-Disclaimer'] = 'INDICATIVE_POLYGON_DERIVED'
            return response
        except ValueError as ve:
            return Response({"error": str(ve)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as ex:
            return Response({"error": f"Failed to generate Section 6 PDF: {str(ex)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'], url_path='documents/atr')
    def document_atr(self, request, pk=None):
        """
        Generates High Court Action Taken Report (ATR) PDF for this case's district.
        """
        alert = self.get_object()
        can_read = JurisdictionScopeService.scope_alerts(
            EncroachmentAlert.objects.filter(pk=alert.pk),
            request.user
        ).exists()
        if not can_read:
            return Response({"error": "Access Denied: Alert is outside your administrative jurisdiction."}, status=status.HTTP_403_FORBIDDEN)

        writ_number = request.query_params.get('writ_number') or "W.P.(MD) No. 18251 of 2023"
        try:
            pdf_bytes = HighCourtComplianceGenerator.generate_atr_pdf(
                district=alert.parcel.district,
                writ_number=writ_number
            )
            response = HttpResponse(pdf_bytes, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="high-court-atr-{alert.parcel.district}.pdf"'
            response['X-Legal-Status'] = 'DRAFT_PENDING_SWORN_ATTESTATION'
            return response
        except Exception as ex:
            return Response({"error": f"Failed to generate ATR PDF: {str(ex)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
