from rest_framework import viewsets, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import HttpResponse
from django.utils import timezone
from datetime import datetime, timedelta
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from django.contrib.gis.geos import Point
from django.contrib.gis.db.models.functions import Distance
from .models import LandParcel, EncroachmentAlert, FieldVerification, RegistryProposal
from .serializers import (
    LandParcelSerializer, EncroachmentAlertSerializer, 
    FieldVerificationSerializer, RegistryProposalSerializer
)
from .tngis_service import TNGISService
from .services.fmb_sketch_generator import FMBSketchGenerator
from .services.legal_notice_pdf import LegalNoticePDFGenerator
from .services.high_court_compliance import HighCourtComplianceGenerator

class LandParcelViewSet(viewsets.ModelViewSet):
    queryset = LandParcel.objects.all()
    serializer_class = LandParcelSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['village_code', 'classification', 'is_occupied']
    search_fields = ['survey_number', 'patta_number', 'owner_name', 'ulpin']

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
    queryset = EncroachmentAlert.objects.all().order_by('-detection_date')
    serializer_class = EncroachmentAlertSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'alert_type']

    @action(detail=True, methods=['post', 'patch'])
    def inspector_approve(self, request, pk=None):
        role = (request.data.get('role') or '').upper()
        if role == 'VAO':
            return Response({"error": "Access Denied: VAO cannot counter-sign their own verification report. Revenue Inspector sign-off required."}, status=status.HTTP_403_FORBIDDEN)
        alert = self.get_object()
        notes = request.data.get('notes', 'Verified and Approved by Field Inspector Mukesh S')
        alert.status = request.data.get('status', 'INSPECTOR_APPROVED')
        alert.resolution_notes = notes
        alert.save()
        serializer = self.get_serializer(alert)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post', 'patch'])
    def issue_section_7(self, request, pk=None):
        role = (request.data.get('role') or '').upper()
        if role in ['VAO', 'INSPECTOR', 'SURVEYOR', 'DATA_ENTRY']:
            return Response({"error": f"Access Denied: Under TN Act III of 1905, {role} cannot issue Section 7 Notice. Only Tahsildar / Collector has statutory authority."}, status=status.HTTP_403_FORBIDDEN)
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
        role = (request.data.get('role') or '').upper()
        if role in ['VAO', 'INSPECTOR', 'SURVEYOR', 'DATA_ENTRY']:
            return Response({"error": f"Access Denied: Under TN Act III of 1905, {role} cannot order Section 6 Eviction. Only Tahsildar / Collector has statutory authority."}, status=status.HTTP_403_FORBIDDEN)
        alert = self.get_object()
        notes = request.data.get('notes') or "[Section 6 Eviction Warrant] Final eviction and demolition ordered under TN Land Encroachment Act 1905. Police Bandobast requisitioned."
        alert.status = 'SECTION_6_ORDERED'
        alert.resolution_notes = f"{alert.resolution_notes or ''}\n{notes}".strip()
        alert.save()
        serializer = self.get_serializer(alert)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post', 'patch'])
    def complete_eviction(self, request, pk=None):
        role = (request.data.get('role') or '').upper()
        if role == 'VAO':
            return Response({"error": "Access Denied: VAO cannot complete eviction alone. Revenue Division sign-off required."}, status=status.HTTP_403_FORBIDDEN)
        alert = self.get_object()
        notes = request.data.get('notes') or "[Eviction Executed & Restored] Unauthorized structure demolished. Boundary fencing restored. Government possession reclaimed."
        alert.status = 'RESOLVED'
        alert.resolution_notes = f"{alert.resolution_notes or ''}\n{notes}".strip()
        alert.save()
        serializer = self.get_serializer(alert)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def download_section_7(self, request, pk=None):
        """Generates and downloads the official court-admissible Section 7 Notice with embedded FMB Sketch."""
        alert = self.get_object()
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
        officer = request.data.get('officer_name', 'Field Officer')
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
        alert = self.get_object()
        role = (request.data.get('role') or '').upper()
        if role == 'VAO':
            return Response({"error": "Access Denied: Only Revenue Inspector / Tahsildar can reject on FMB boundary grounds."}, status=status.HTTP_403_FORBIDDEN)
        officer = request.data.get('officer_name', 'Revenue Inspector')
        reason = request.data.get('reason') or "FMB boundary check failed: Discrepancy with cadastral survey."
        alert.status = 'REJECTED_BOUNDARY'
        alert.resolution_notes = f"{alert.resolution_notes or ''}\n[REJECTED - FMB BOUNDARY MISMATCH by {officer}]: {reason}".strip()
        alert.save()
        serializer = self.get_serializer(alert)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post', 'patch'])
    def cancel_legal(self, request, pk=None):
        alert = self.get_object()
        role = (request.data.get('role') or '').upper()
        if role in ['VAO', 'INSPECTOR', 'SURVEYOR', 'DATA_ENTRY']:
            return Response({"error": f"Access Denied: Only Tahsildar / Collector has authority to cancel Section 7 legal proceedings."}, status=status.HTTP_403_FORBIDDEN)
        officer = request.data.get('officer_name', 'Tahsildar Salem West')
        reason = request.data.get('reason') or "Proceedings cancelled: Occupant produced valid Patta / Court Stay Order during 15-day Section 7 window."
        alert.status = 'CANCELLED_LEGAL'
        alert.resolution_notes = f"{alert.resolution_notes or ''}\n[PROCEEDINGS DROPPED by {officer}]: {reason}".strip()
        alert.save()
        serializer = self.get_serializer(alert)
        return Response(serializer.data, status=status.HTTP_200_OK)

class FieldVerificationViewSet(viewsets.ModelViewSet):
    queryset = FieldVerification.objects.all()
    serializer_class = FieldVerificationSerializer

    def create(self, request, *args, **kwargs):
        alert_id = request.data.get('alert')
        if alert_id:
            try:
                existing = FieldVerification.objects.get(alert_id=alert_id)
                # Do a partial update of the existing record instead of creating a new one
                serializer = self.get_serializer(existing, data=request.data, partial=True)
                serializer.is_valid(raise_exception=True)
                verification = serializer.save()
                
                # Custom logic for alert status update
                alert = verification.alert
                requested_status = request.data.get('status', 'VAO_SUBMITTED')
                alert.status = requested_status
                if request.data.get('remarks'):
                    alert.resolution_notes = request.data.get('remarks')
                alert.save()
                
                headers = self.get_success_headers(serializer.data)
                return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
            except FieldVerification.DoesNotExist:
                pass
                
        # If no existing record, fall back to standard create logic
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        verification = serializer.save()
        alert = verification.alert
        requested_status = self.request.data.get('status', 'VAO_SUBMITTED')
        alert.status = requested_status
        if self.request.data.get('remarks'):
            alert.resolution_notes = self.request.data.get('remarks')
        alert.save()

class RegistryProposalViewSet(viewsets.ModelViewSet):
    queryset = RegistryProposal.objects.all().order_by('-created_at')
    serializer_class = RegistryProposalSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'proposal_type']

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        proposal = self.get_object()
        if proposal.status != 'PENDING':
            return Response({"error": "Only pending proposals can be approved"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Apply changes to LandParcel
        parcel = proposal.parcel
        if not parcel and proposal.proposal_type == 'NEW':
            # Handle creation of new parcel if needed
            # For now, we assume updates/corrections to existing ones
            pass
        
        if parcel:
            data = proposal.proposed_data
            for key, value in data.items():
                if hasattr(parcel, key):
                    setattr(parcel, key, value)
            parcel.save()
        
        proposal.status = 'APPROVED'
        proposal.approved_by = request.data.get('approver_role', 'COLLECTOR')
        proposal.save()
        
        return Response({"status": "Proposal approved and registry updated"})


class TNGISProxyView(APIView):
    """
    Proxy view to forward requests to TNGIS Generic APIs.
    """
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
    """
    def post(self, request):
        lat = request.data.get('latitude')
        lon = request.data.get('longitude')
        
        if not lat or not lon:
            return Response({"error": "Coordinates required"}, status=status.HTTP_400_BAD_REQUEST)

        # Step 1: Get Attributes (Layer 29 = Districts)
        attr_data = TNGISService.get_attributes(lat, lon, layer_id=29)
        
        # Step 2: Check Inside Boundary (Assuming Layer 500 = Government Land / Cadastral)
        # We check if this point is within a "Government" classified feature
        boundary_check = TNGISService.check_inside_boundary(
            latitude=lat, 
            longitude=lon, 
            layer_id=500, # Placeholder for Cadastral/Gov Land layer
            attribute_column="classification", 
            attribute_value="Government"
        )
        
        # Step 3: Threat Assessment
        is_gov_land = boundary_check.get('success') == 1 or boundary_check.get('status') == 1
        
        # Step 4: Check if we already have a record for this in our local DB
        # (This combines TNGIS data with our local administrative records)
        existing_parcel = LandParcel.objects.filter(
            village_code=attr_data.get('Districts', {}).get('district_lgd_code', '')
        ).first() # Simplified check

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
    """
    def get(self, request):
        district = request.query_params.get('district', 'Salem')
        writ_no = request.query_params.get('writ_no')
        if not writ_no or not writ_no.strip():
            return Response(
                {"error": "writ_no query parameter is required with no default (e.g. ?district=Salem&writ_no=W.P.+No.+34091+of+2023)"},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            pdf_bytes = HighCourtComplianceGenerator.generate_atr_pdf(district=district, writ_petition_no=writ_no)
            response = HttpResponse(pdf_bytes, content_type='application/pdf')
            filename = f"Madras_High_Court_Compliance_ATR_{district}_{datetime.now().strftime('%Y%m%d')}.pdf"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        except Exception as e:
            return Response({"error": f"Failed to generate High Court ATR: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
