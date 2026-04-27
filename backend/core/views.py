from rest_framework import viewsets, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import LandParcel, EncroachmentAlert, FieldVerification
from .serializers import LandParcelSerializer, EncroachmentAlertSerializer, FieldVerificationSerializer
from .tngis_service import TNGISService

class LandParcelViewSet(viewsets.ModelViewSet):
    queryset = LandParcel.objects.all()
    serializer_class = LandParcelSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['village_code', 'classification']
    search_fields = ['survey_number', 'patta_number', 'owner_name']

class EncroachmentAlertViewSet(viewsets.ModelViewSet):
    queryset = EncroachmentAlert.objects.all().order_by('-detection_date')
    serializer_class = EncroachmentAlertSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'alert_type']

class FieldVerificationViewSet(viewsets.ModelViewSet):
    queryset = FieldVerification.objects.all()
    serializer_class = FieldVerificationSerializer

class TNGISProxyView(APIView):
    """
    Proxy view to forward requests to TNGIS Generic APIs.
    """
    def post(self, request, action):
        lat = request.data.get('latitude')
        lon = request.data.get('longitude')
        
        if not lat or not lon:
            return Response({"error": "Latitude and Longitude are required"}, status=status.HTTP_400_BAD_REQUEST)

        if action == 'attributes':
            layer_id = request.data.get('layer_id', 29)
            result = TNGISService.get_attributes(lat, lon, layer_id)
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
