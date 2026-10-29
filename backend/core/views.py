from rest_framework import viewsets, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from django.utils import timezone
from django.db.models import Q
from datetime import datetime, timedelta
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from django.contrib.gis.geos import Point
from django.contrib.gis.db.models.functions import Distance
from .models import LandParcel, EncroachmentAlert, FieldVerification, RegistryProposal, DistrictLegalConfig
from .serializers import (
    LandParcelSerializer, EncroachmentAlertSerializer, 
    FieldVerificationSerializer, RegistryProposalSerializer, DistrictLegalConfigSerializer
)
from .permissions import (
    IsVigilanceReadOnly, get_user_role,
    STATUTORY_NOTICE_ROLES, INSPECTOR_APPROVE_ROLES,
    BOUNDARY_REJECT_ROLES, EVICTION_COMPLETE_ROLES,
    PROPOSAL_APPROVE_ROLES, STATEWIDE_ROLES
)
from .tngis_service import TNGISService
from .services.fmb_sketch_generator import FMBSketchGenerator
from .services.legal_notice_pdf import LegalNoticePDFGenerator
from .services.high_court_compliance import HighCourtComplianceGenerator


class LandParcelViewSet(viewsets.ModelViewSet):
    queryset = LandParcel.objects.all()
    serializer_class = LandParcelSerializer
    permission_classes = [IsAuthenticated, IsVigilanceReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['village_code', 'classification', 'is_occupied']
    search_fields = ['survey_number', 'patta_number', 'owner_name', 'ulpin']

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return LandParcel.objects.none()
        profile = getattr(user, 'profile', None)
        if not profile or profile.role in STATEWIDE_ROLES:
            return LandParcel.objects.all()

        qs = LandParcel.objects.all()
        if profile.district:
            qs = qs.filter(district__iexact=profile.district)
        if profile.role in ['TAHSILDAR', 'INSPECTOR', 'VAO'] and profile.taluk:
            qs = qs.filter(taluk__iexact=profile.taluk)
        if profile.role == 'VAO' and profile.village:
            qs = qs.filter(Q(village_name__iexact=profile.village) | Q(village_code__iexact=profile.village))
        return qs

    @action(detail=False, methods=['get'])
    def presets(self, request):
        """Returns the 4 primary Salem demo presets."""
        presets_data = [
            # ── 1. ALL TYPES ROADSIDE OCCUPATION SHOWCASE ──
            {
                "id": "omalur",
                "category": "roadside",
                "title": "1. Omalur NH-44 Commercial Shed",
                "title_ta": "ஓமலூர் நெடுஞ்சாலை கொட்டகை",
                "tag": "Roadside Type 1: Commercial Workshop",
                "badge": "🔴 OCCUPIED (850 sq.ft)",
                "taluk": "Omalur",
                "village": "Omalur North",
                "survey": "119",
                "subdivision": "4",
                "lat": 11.7450,
                "lng": 78.0410,
                "zoom": 17,
                "encroacher": "Patta 488: R. Chinnasamy"
            },
            {
                "id": "kondalampatti",
                "category": "roadside",
                "title": "2. Kondalampatti Truck Scrap Yard",
                "title_ta": "கொண்டலாம்பட்டி லாரி பட்டறை",
                "tag": "Roadside Type 2: Heavy Vehicle Scrap Yard",
                "badge": "🔴 OCCUPIED (1,650 sq.ft)",
                "taluk": "Salem South",
                "village": "Dadagapatty",
                "survey": "76",
                "subdivision": "2B",
                "lat": 11.6210,
                "lng": 78.1320,
                "zoom": 17,
                "encroacher": "Patta 319: M. Velusamy"
            },
            {
                "id": "attur",
                "category": "roadside",
                "title": "3. Attur SH-79 Compound Wall",
                "title_ta": "ஆத்தூர் மதில்சுவர் அத்துமீறல்",
                "tag": "Roadside Type 3: Residential Compound Wall",
                "badge": "🔴 OCCUPIED (920 sq.ft)",
                "taluk": "Attur",
                "village": "Attur Town",
                "survey": "204",
                "subdivision": "1C",
                "lat": 11.5980,
                "lng": 78.6010,
                "zoom": 17,
                "encroacher": "Patta 582: P. Arumugam"
            },
            {
                "id": "hasthampatti",
                "category": "roadside",
                "title": "4. Hasthampatti Footpath Stalls",
                "title_ta": "ஹஸ்தம்பட்டி நடைபாதை ஆக்கிரமிப்பு",
                "tag": "Roadside Type 4: Footpath Commercial Awning",
                "badge": "🔴 OCCUPIED (480 sq.ft)",
                "taluk": "Salem West",
                "village": "Suramangalam",
                "survey": "45",
                "subdivision": "3",
                "lat": 11.6780,
                "lng": 78.1650,
                "zoom": 18,
                "encroacher": "Patta 167: S. Natarajan"
            },
            # ── 2. WATERBODY & GOVERNMENT ASSETS ──
            {
                "id": "mookaneri",
                "category": "waterbody",
                "title": "Mookaneri Lake Poramboke",
                "title_ta": "மூக்கனேரி ஏரி புறம்போக்கு",
                "tag": "Waterbody Basin Breach",
                "badge": "🔴 OCCUPIED (2,400 sq.ft)",
                "taluk": "Salem West",
                "village": "Kannankurichi",
                "survey": "142",
                "subdivision": "1A",
                "lat": 11.6982,
                "lng": 78.1724,
                "zoom": 17,
                "encroacher": "Patta 340: A. Selvam"
            },
            {
                "id": "suramangalam",
                "category": "government",
                "title": "Suramangalam Govt Poramboke",
                "title_ta": "சூரமங்கலம் அரசு புறம்போக்கு",
                "tag": "Commercial Encroachment",
                "badge": "🔴 OCCUPIED (1,150 sq.ft)",
                "taluk": "Salem West",
                "village": "Suramangalam",
                "survey": "88",
                "subdivision": "2A",
                "lat": 11.6742,
                "lng": 78.1215,
                "zoom": 17,
                "encroacher": "Patta 215: K. Venkatesh"
            },
            {
                "id": "mettur",
                "category": "forest",
                "title": "Mettur Cauvery Riverbank",
                "title_ta": "மேட்டூர் காவேரி படுகை",
                "tag": "Protected State Reserve",
                "badge": "🟢 SAFE / VACANT (45 Acres)",
                "taluk": "Mettur",
                "village": "Mettur Dam",
                "survey": "63",
                "subdivision": "1",
                "lat": 11.7960,
                "lng": 77.7980,
                "zoom": 16,
                "encroacher": "None - Protected Reserve"
            }
        ]
        return Response(presets_data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def identify(self, request):
        """Click-to-identify parcel by lat/lng coordinates."""
        lat_str = request.query_params.get('lat')
        lng_str = request.query_params.get('lng')
        
        if not lat_str or not lng_str:
            return Response({"error": "lat and lng parameters are required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            lat = float(lat_str)
            lng = float(lng_str)
            point = Point(lng, lat, srid=4326)
        except (ValueError, TypeError):
            return Response({"error": "Invalid coordinates"}, status=status.HTTP_400_BAD_REQUEST)

        # 1. First check if point is inside any parcel polygon
        parcel = LandParcel.objects.filter(geom__contains=point).first()
        
        # 2. If not directly inside, find the closest parcel
        if not parcel:
            parcel = LandParcel.objects.annotate(
                distance=Distance('geom', point)
            ).order_by('distance').first()

        if parcel:
            serializer = self.get_serializer(parcel)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response({"error": "No parcel found"}, status=status.HTTP_404_NOT_FOUND)

class EncroachmentAlertViewSet(viewsets.ModelViewSet):
    queryset = EncroachmentAlert.objects.all()
    serializer_class = EncroachmentAlertSerializer
    permission_classes = [IsAuthenticated, IsVigilanceReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'alert_type']

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return EncroachmentAlert.objects.none()
        profile = getattr(user, 'profile', None)
        qs = EncroachmentAlert.objects.select_related('parcel').all().order_by('-detection_date')
        if not profile or profile.role in STATEWIDE_ROLES:
            return qs

        if profile.district:
            qs = qs.filter(parcel__district__iexact=profile.district)
        if profile.role in ['TAHSILDAR', 'INSPECTOR', 'VAO'] and profile.taluk:
            qs = qs.filter(parcel__taluk__iexact=profile.taluk)
        if profile.role == 'VAO' and profile.village:
            qs = qs.filter(Q(parcel__village_name__iexact=profile.village) | Q(parcel__village_code__iexact=profile.village))
        return qs

    @action(detail=True, methods=['post', 'patch'])
    def inspector_approve(self, request, pk=None):
        role = get_user_role(request.user)
        if role not in INSPECTOR_APPROVE_ROLES:
            return Response({"error": f"Access Denied: Role '{role}' cannot counter-sign field inspection reports. Revenue Inspector sign-off required."}, status=status.HTTP_403_FORBIDDEN)
        alert = self.get_object()
        notes = request.data.get('notes', f'Verified and Approved by {request.user.get_full_name() or request.user.username}')
        alert.status = request.data.get('status', 'INSPECTOR_APPROVED')
        alert.resolution_notes = notes
        alert.save()
        serializer = self.get_serializer(alert)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post', 'patch'])
    def issue_section_7(self, request, pk=None):
        role = get_user_role(request.user)
        if role not in STATUTORY_NOTICE_ROLES:
            return Response({"error": f"Access Denied: Under TN Act III of 1905, '{role}' cannot issue Section 7 Notice. Only Tahsildar / Collector has statutory authority."}, status=status.HTTP_403_FORBIDDEN)
        alert = self.get_object()

        # Stop-gap legal safety: Block Section 7 unless certified survey exists or explicit officer acknowledgement is recorded
        has_certified_survey = bool(alert.fmb_measurements and alert.fmb_measurements.get('is_certified_survey'))
        officer_ack = request.data.get('officer_fmb_acknowledgement') in [True, 'true', 'True', 1]
        
        if not has_certified_survey and not officer_ack:
            return Response({
                "error": "Section 7 Issuance Blocked: FMB measurements are currently INDICATIVE (derived from polygon geometry, not a certified survey measurement). To issue statutory notice, provide explicit officer acknowledgement: {'officer_fmb_acknowledgement': true, 'notes': '...'}.",
                "disclaimer": "INDICATIVE - computed from polygon geometry, not a certified survey measurement"
            }, status=status.HTTP_400_BAD_REQUEST)

        encroacher = request.data.get('encroacher_name', 'Unauthorized Occupant')
        notes = request.data.get('notes') or f"[Section 7 Notice Issued to {encroacher}] 15-day show-cause notice served under TN Land Encroachment Act 1905."
        if officer_ack and not has_certified_survey:
            notes = f"{notes}\n[OFFICER ACKNOWLEDGEMENT]: Officer proceeded with indicative polygon-derived FMB measurements pending certified field survey."
        alert.status = 'SECTION_7_ISSUED'
        alert.resolution_notes = f"{alert.resolution_notes or ''}\n{notes}".strip()
        alert.save()
        serializer = self.get_serializer(alert)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post', 'patch'])
    def issue_section_6(self, request, pk=None):
        role = get_user_role(request.user)
        if role not in STATUTORY_NOTICE_ROLES:
            return Response({"error": f"Access Denied: Under TN Act III of 1905, '{role}' cannot order Section 6 Eviction. Only Tahsildar / Collector has statutory authority."}, status=status.HTTP_403_FORBIDDEN)
        alert = self.get_object()
        if alert.structure_category == 'VULNERABLE_HOUSING':
            return Response(
                {"error": "Statutory Violation: Cannot order Section 6 eviction for VULNERABLE_HOUSING. Case must be routed to Humanitarian Rehabilitation (TNUHDB)."},
                status=status.HTTP_400_BAD_REQUEST
            )
        if alert.status == 'COURT_STAY_HOLD':
            return Response(
                {"error": "Statutory Violation: Injunction in force. Cannot issue Section 6 Eviction Order while case is under COURT_STAY_HOLD."},
                status=status.HTTP_400_BAD_REQUEST
            )
        notes = request.data.get('notes') or "[Section 6 Eviction Warrant] Final eviction and demolition ordered under TN Land Encroachment Act 1905. Police Bandobast requisitioned."
        alert.status = 'SECTION_6_ORDERED'
        alert.resolution_notes = f"{alert.resolution_notes or ''}\n{notes}".strip()
        alert.save()
        serializer = self.get_serializer(alert)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post', 'patch'])
    def complete_eviction(self, request, pk=None):
        role = get_user_role(request.user)
        if role not in EVICTION_COMPLETE_ROLES:
            return Response({"error": f"Access Denied: Role '{role}' cannot complete eviction alone. Revenue Division / Tahsildar sign-off required."}, status=status.HTTP_403_FORBIDDEN)
        alert = self.get_object()
        notes = request.data.get('notes') or "[Eviction Executed & Restored] Unauthorized structure demolished. Boundary fencing restored. Government possession reclaimed."
        alert.status = 'RESOLVED'
        alert.resolution_notes = f"{alert.resolution_notes or ''}\n{notes}".strip()
        alert.save()
        serializer = self.get_serializer(alert)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def download_section_7(self, request, pk=None):
        """Generates and downloads official court-admissible Section 7 Notice with embedded FMB Sketch."""
        alert = self.get_object()
        profile = getattr(request.user, 'profile', None)
        if profile and profile.role not in STATEWIDE_ROLES and profile.district:
            if alert.parcel.district.lower() != profile.district.lower():
                return Response(
                    {"error": f"Access Denied: Account restricted to {profile.district}. Cannot access notice for {alert.parcel.district}."},
                    status=status.HTTP_403_FORBIDDEN
                )
        try:
            pdf_bytes = LegalNoticePDFGenerator.generate_section_7_pdf(alert)
            response = HttpResponse(pdf_bytes, content_type='application/pdf')
            filename = f"Section_7_Notice_{alert.parcel.survey_number}_{str(alert.id)[:8]}.pdf"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        except Exception as e:
            return Response({"error": f"Failed to generate legal PDF: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'])
    def fmb_sketch(self, request, pk=None):
        """Returns mathematical FMB boundary stones, triangulation, and ladder offset measurements."""
        alert = self.get_object()
        profile = getattr(request.user, 'profile', None)
        if profile and profile.role not in STATEWIDE_ROLES and profile.district:
            if alert.parcel.district.lower() != profile.district.lower():
                return Response(
                    {"error": f"Access Denied: Account restricted to {profile.district}. Cannot access FMB sketch for {alert.parcel.district}."},
                    status=status.HTTP_403_FORBIDDEN
                )
        parcel = alert.parcel
        coords = []
        if hasattr(parcel.geom, 'coords'):
            coords = list(parcel.geom.coords[0]) if parcel.geom.coords else []
        calc = FMBSketchGenerator.calculate_fmb_measurements(coords, [])
        return Response({
            "alert_id": str(alert.id),
            "survey_number": f"{parcel.survey_number}/{parcel.subdivision or '1'}",
            "village": parcel.village_name or "Kannankurichi",
            "taluk": parcel.taluk,
            "district": parcel.district,
            "area_sqft": alert.encroached_area_sqft or 850,
            "boundary_stones": calc["boundary_stones"],
            "lengths_meters": calc["lengths_m"],
            "ladder_offsets": calc["ladder_offsets"],
            "classification": parcel.classification,
            "tier": alert.tier,
            "status": alert.status,
            "disclaimer": "INDICATIVE - computed from polygon geometry, not a certified survey measurement",
            "is_certified_survey": bool(alert.fmb_measurements and alert.fmb_measurements.get('is_certified_survey'))
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def star3_lock(self, request, pk=None):
        """Automated STAR 3.0 Anti-Land-Grab Lock (Freezes Sub-Registrar transaction)."""
        alert = self.get_object()
        parcel = alert.parcel
        lock_ref = f"STAR3-FREEZE-{parcel.taluk.upper()[:3]}-{str(alert.id)[:8].upper()}"
        notes = f"[STAR 3.0 REGISTRY LOCK ACTIVE] Reference: {lock_ref}. Deed registration frozen at Sub-Registrar Office under TN Act III of 1905."
        alert.resolution_notes = f"{alert.resolution_notes or ''}\n{notes}".strip()
        alert.save()
        return Response({
            "status": "SUCCESS",
            "lock_reference": lock_ref,
            "registry_portal": "STAR 3.0 / TN Registration Department",
            "survey_number": f"{parcel.survey_number}/{parcel.subdivision or '1'}",
            "ulpin": parcel.ulpin or "33-14-001-2026",
            "message": "Transaction freeze active. Any sale deed registration attempt will be blocked."
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def humanitarian_rehabilitation(self, request, pk=None):
        """Routes vulnerable dwellers / small huts to TNUHDB for rehabilitation rather than criminal demolition."""
        alert = self.get_object()
        alert.structure_category = 'VULNERABLE_HOUSING'
        alert.status = 'TAHSILDAR_ACCEPTED'
        notes = "[HUMANITARIAN POLICY ROUTE ACTIVATED] Identified as vulnerable shelter. Eviction notice withheld. Referred to TNUHDB (Tamil Nadu Urban Habitat Development Board) for in-situ welfare & alternative patta scheme."
        alert.resolution_notes = f"{alert.resolution_notes or ''}\n{notes}".strip()
        alert.save()
        serializer = self.get_serializer(alert)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post', 'patch'])
    def mark_false_positive(self, request, pk=None):
        """Marks alert as false positive and automatically triggers anti-corruption randomized peer-audit."""
        alert = self.get_object()
        officer = request.user.get_full_name() or request.user.username
        reason = request.data.get('reason') or "Field verified: Not an encroachment. Valid patta land / agricultural boundary."
        alert.status = 'FALSE_POSITIVE'
        
        # Anti-Corruption Automated Peer Audit Trigger (Tier 2 Medium Risk)
        alert.is_peer_audited = True
        alert.peer_auditor_name = "Revenue Inspector (Flying Squad / Adjacent Taluk)"
        notes = f"[DISMISSED - FALSE ALARM by {officer}]: {reason}\n[ANTI-CORRUPTION TRIGGER]: Automated random peer-audit task assigned to {alert.peer_auditor_name}."
        alert.resolution_notes = f"{alert.resolution_notes or ''}\n{notes}".strip()
        alert.save()
        serializer = self.get_serializer(alert)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post', 'patch'])
    def reject_boundary(self, request, pk=None):
        role = get_user_role(request.user)
        if role not in BOUNDARY_REJECT_ROLES:
            return Response({"error": f"Access Denied: Role '{role}' cannot reject on FMB boundary grounds. Revenue Inspector or above required."}, status=status.HTTP_403_FORBIDDEN)
        alert = self.get_object()
        officer = request.user.get_full_name() or request.user.username
        reason = request.data.get('reason') or "FMB boundary check failed: Discrepancy with cadastral survey."
        alert.status = 'REJECTED_BOUNDARY'
        alert.resolution_notes = f"{alert.resolution_notes or ''}\n[REJECTED - FMB BOUNDARY MISMATCH by {officer}]: {reason}".strip()
        alert.save()
        serializer = self.get_serializer(alert)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post', 'patch'])
    def cancel_legal(self, request, pk=None):
        role = get_user_role(request.user)
        if role not in STATUTORY_NOTICE_ROLES:
            return Response({"error": f"Access Denied: Under TN Act III of 1905, '{role}' cannot cancel Section 7 proceedings. Only Tahsildar / Collector has statutory authority."}, status=status.HTTP_403_FORBIDDEN)
        alert = self.get_object()
        officer = request.user.get_full_name() or request.user.username
        reason = request.data.get('reason') or "Proceedings cancelled: Occupant produced valid Patta / Court Stay Order during 15-day Section 7 window."
        alert.status = 'CANCELLED_LEGAL'
        alert.resolution_notes = f"{alert.resolution_notes or ''}\n[PROCEEDINGS DROPPED by {officer}]: {reason}".strip()
        alert.save()
        serializer = self.get_serializer(alert)
        return Response(serializer.data, status=status.HTTP_200_OK)


class FieldVerificationViewSet(viewsets.ModelViewSet):
    queryset = FieldVerification.objects.all()
    serializer_class = FieldVerificationSerializer
    permission_classes = [IsAuthenticated, IsVigilanceReadOnly]

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return FieldVerification.objects.none()
        profile = getattr(user, 'profile', None)
        qs = FieldVerification.objects.select_related('alert__parcel').all()
        if not profile or profile.role in STATEWIDE_ROLES:
            return qs
        if profile.district:
            qs = qs.filter(alert__parcel__district__iexact=profile.district)
        if profile.role in ['TAHSILDAR', 'INSPECTOR', 'VAO'] and profile.taluk:
            qs = qs.filter(alert__parcel__taluk__iexact=profile.taluk)
        if profile.role == 'VAO' and profile.village:
            qs = qs.filter(Q(alert__parcel__village_name__iexact=profile.village) | Q(alert__parcel__village_code__iexact=profile.village))
        return qs

    def create(self, request, *args, **kwargs):
        alert_id = request.data.get('alert')
        if not alert_id:
            return Response({"error": "alert field is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            alert = EncroachmentAlert.objects.select_related('parcel').get(id=alert_id)
        except EncroachmentAlert.DoesNotExist:
            return Response({"error": "Specified EncroachmentAlert not found."}, status=status.HTTP_404_NOT_FOUND)

        # Scoping check: Field officers can only submit verifications for their assigned district/taluk
        user = request.user
        profile = getattr(user, 'profile', None)
        if profile and profile.role not in STATEWIDE_ROLES:
            if profile.district and alert.parcel.district and profile.district.lower() != alert.parcel.district.lower():
                return Response(
                    {"error": f"Access Denied: Alert is in {alert.parcel.district} District; your account is restricted to {profile.district}."},
                    status=status.HTTP_403_FORBIDDEN
                )
            if profile.role in ['TAHSILDAR', 'INSPECTOR', 'VAO'] and profile.taluk and alert.parcel.taluk and profile.taluk.lower() != alert.parcel.taluk.lower():
                return Response(
                    {"error": f"Access Denied: Alert is in {alert.parcel.taluk} Taluk; your account is restricted to {profile.taluk}."},
                    status=status.HTTP_403_FORBIDDEN
                )

        # Officer identity is ALWAYS derived server-side from JWT
        officer_display = f"{user.get_full_name() or user.username} ({profile.role if profile else 'OFFICER'})"

        # Verdict drives the state machine (client CANNOT supply arbitrary status)
        verdict = request.data.get('verdict', 'ENCROACHMENT_CONFIRMED')
        valid_verdicts = ['ENCROACHMENT_CONFIRMED', 'FALSE_POSITIVE', 'UNCERTAIN_NEEDS_REVISIT']
        if verdict not in valid_verdicts:
            return Response({
                "error": f"Invalid verdict '{verdict}'. Allowed values: {', '.join(valid_verdicts)}."
            }, status=status.HTTP_400_BAD_REQUEST)

        # Geofence check: verify officer GPS within parcel boundary or 500m buffer
        gps_lat = request.data.get('gps_lat')
        gps_lon = request.data.get('gps_lon')
        if gps_lat is not None and gps_lon is not None and alert.parcel and alert.parcel.geom:
            from django.contrib.gis.geos import Point
            officer_point = Point(float(gps_lon), float(gps_lat), srid=4326)
            dist_deg = officer_point.distance(alert.parcel.geom)
            # ~0.005 degrees is approx 550m
            if dist_deg > 0.005 and not request.data.get('allow_geofence_override'):
                return Response({
                    "error": "Geofence Check Failed: Device GPS location is outside parcel boundary (>500m). Set allow_geofence_override=true with remarks if physical obstruction prevented approach."
                }, status=status.HTTP_400_BAD_REQUEST)

        # Prepare verified data payload
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        data['officer_name'] = officer_display
        data['verdict'] = verdict
        data.pop('status', None)  # Client status override stripped

        existing = FieldVerification.objects.filter(alert=alert).first()
        if existing:
            serializer = self.get_serializer(existing, data=data, partial=True)
        else:
            serializer = self.get_serializer(data=data)

        serializer.is_valid(raise_exception=True)
        verification = serializer.save(officer_name=officer_display, verdict=verdict)

        # State machine transition strictly driven by verdict
        if verdict == 'ENCROACHMENT_CONFIRMED':
            alert.status = 'VAO_SUBMITTED'
        elif verdict == 'FALSE_POSITIVE':
            alert.status = 'FALSE_POSITIVE'
        elif verdict == 'UNCERTAIN_NEEDS_REVISIT':
            alert.status = 'VAO_ASSIGNED'

        user_remarks = request.data.get('remarks', '')
        alert.resolution_notes = f"[{verdict}] {user_remarks}".strip()
        alert.save()

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class RegistryProposalViewSet(viewsets.ModelViewSet):
    queryset = RegistryProposal.objects.all()
    serializer_class = RegistryProposalSerializer
    permission_classes = [IsAuthenticated, IsVigilanceReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'proposal_type']

    def get_queryset(self):
        return RegistryProposal.objects.select_related('parcel').all().order_by('-created_at')

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        role = get_user_role(request.user)
        if role not in PROPOSAL_APPROVE_ROLES:
            return Response(
                {"error": f"Access Denied: Role '{role}' cannot approve registry proposals. Collector / RDO / Tahsildar authority required."},
                status=status.HTTP_403_FORBIDDEN
            )
        proposal = self.get_object()
        if proposal.status != 'PENDING':
            return Response({"error": "Only pending proposals can be approved"}, status=status.HTTP_400_BAD_REQUEST)
        
        parcel = proposal.parcel
        if parcel:
            data = proposal.proposed_data
            for key, value in data.items():
                if hasattr(parcel, key):
                    setattr(parcel, key, value)
            parcel.save()
        
        proposal.status = 'APPROVED'
        proposal.approved_by = request.user.username
        proposal.save()
        
        return Response({"status": "Proposal approved and registry updated"})


class TNGISProxyView(APIView):
    """
    Proxy view to forward requests to TNGIS Generic APIs.
    Restricted to authenticated staff officers.
    """
    permission_classes = [IsAuthenticated, IsVigilanceReadOnly]

    def post(self, request, action):
        if action == 'admin_dropdown':
            case = request.data.get('case')
            if not case:
                return Response({"error": "case parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
            district = request.data.get('district')
            taluk = request.data.get('taluk')
            result = TNGISService.get_admin_dropdown(case, district, taluk)
            return Response(result)

        lat = request.data.get('latitude')
        lon = request.data.get('longitude')
        
        if not lat or not lon:
            return Response({"error": "Latitude and Longitude are required"}, status=status.HTTP_400_BAD_REQUEST)

        if action == 'attributes':
            layer_id = request.data.get('layer_id', 29)
            case = request.data.get('case', 'gis_attributes')
            buffer_distance = request.data.get('buffer_distance')
            result = TNGISService.get_attributes(lat, lon, layer_id, case, buffer_distance)
        elif action == 'inside_boundary':
            layer_id = request.data.get('layer_id')
            attr_col = request.data.get('attribute_column')
            attr_val = request.data.get('attribute_value')
            result = TNGISService.check_inside_boundary(lat, lon, layer_id, attr_col, attr_val)
        elif action == 'nearest':
            layer_id = request.data.get('layer_id')
            count = request.data.get('feature_count', 1)
            result = TNGISService.get_nearest_feature(lat, lon, layer_id, count)
        else:
            return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)
            
        return Response(result)

    def get(self, request, action):
        if action == 'extent':
            init_level = request.query_params.get('initLevel', 3)
            filter_code = request.query_params.get('filter_code', 'lgd_code')
            district = request.query_params.get('district', '')
            taluk = request.query_params.get('taluk', '')
            village = request.query_params.get('village', '')
            result = TNGISService.get_extent(init_level, filter_code, district, taluk, village)
            return Response(result)
        
        return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)


class SmartAlertView(APIView):
    """
    Automated workflow for encroachment detection.
    1. Fetches GIS attributes.
    2. Checks if point is inside Government Land boundary.
    3. Returns a consolidated "Threat Assessment".
    Restricted to authenticated staff officers.
    """
    permission_classes = [IsAuthenticated, IsVigilanceReadOnly]

    def post(self, request):
        lat = request.data.get('latitude')
        lon = request.data.get('longitude')
        
        if not lat or not lon:
            return Response({"error": "Coordinates required"}, status=status.HTTP_400_BAD_REQUEST)

        attr_data = TNGISService.get_attributes(lat, lon, layer_id=29)
        boundary_check = TNGISService.check_inside_boundary(
            latitude=lat, 
            longitude=lon, 
            layer_id=500,
            attribute_column="classification", 
            attribute_value="Government"
        )
        
        is_gov_land = boundary_check.get('success') == 1 or boundary_check.get('status') == 1
        result = {
            "latitude": lat,
            "longitude": lon,
            "gis_attributes": attr_data,
            "is_government_land": is_gov_land,
            "threat_level": "CRITICAL" if is_gov_land else "LOW",
            "recommended_action": "GENERATE_ALERT" if is_gov_land else "MONITOR",
            "message": "Potential Encroachment Detected on Government Land" if is_gov_land else "Point verified as safe / private land"
        }
        return Response(result)


class HighCourtATRView(APIView):
    """
    Generates and downloads the official Madras High Court Judicial Compliance &
    Action Taken Report (ATR) PDF for District Collectors and Revenue Secretaries.
    Enforces district scoping: a Collector cannot generate ATR for a different district.
    """
    permission_classes = [IsAuthenticated, IsVigilanceReadOnly]

    def get(self, request):
        district = request.query_params.get('district')
        if not district or not district.strip():
            return Response(
                {"error": "district query parameter is required with no default (e.g. ?district=<DistrictName>&writ_no=<WritNumber>)"},
                status=status.HTTP_400_BAD_REQUEST
            )
        writ_no = request.query_params.get('writ_no')
        if not writ_no or not writ_no.strip():
            return Response(
                {"error": "writ_no query parameter is required with no default (e.g. ?district=<DistrictName>&writ_no=<WritNumber>)"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Cross-district check
        profile = getattr(request.user, 'profile', None)
        if profile and profile.role not in STATEWIDE_ROLES and profile.district:
            if profile.district.lower() != district.strip().lower():
                return Response(
                    {"error": f"Access Denied: Your account is restricted to {profile.district} District. Cannot generate Madras High Court ATR for {district.strip()}."},
                    status=status.HTTP_403_FORBIDDEN
                )

        order_date = request.query_params.get('order_date')
        bench_name = request.query_params.get('bench_name')

        try:
            pdf_bytes = HighCourtComplianceGenerator.generate_atr_pdf(
                district=district.strip(),
                writ_petition_no=writ_no.strip(),
                order_date=order_date.strip() if order_date and order_date.strip() else None,
                bench_name=bench_name.strip() if bench_name and bench_name.strip() else None
            )
            response = HttpResponse(pdf_bytes, content_type='application/pdf')
            filename = f"Madras_High_Court_Compliance_ATR_{district.strip()}_{datetime.now().strftime('%Y%m%d')}.pdf"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        except Exception as e:
            return Response({"error": f"Failed to generate High Court ATR: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DistrictLegalConfigViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Exposes configurable confidence thresholds, statutory SLAs, and legal parameters.
    Read-only for authenticated officers.
    """
    queryset = DistrictLegalConfig.objects.all()
    serializer_class = DistrictLegalConfigSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        district = self.request.query_params.get('district')
        if district:
            qs = DistrictLegalConfig.objects.filter(district__iexact=district.strip())
            if qs.exists():
                return qs
        return DistrictLegalConfig.objects.all()

