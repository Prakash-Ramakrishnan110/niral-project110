from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from .models import LandParcel, EncroachmentAlert, FieldVerification, RegistryProposal

class LandParcelSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = LandParcel
        geo_field = "geom"
        fields = (
            "id", "survey_number", "subdivision", "patta_number", 
            "owner_name", "classification", "village_code", "taluk", "district",
            "ulpin", "district_ta", "taluk_ta", "village_name", "village_ta", "village_lgd_code",
            "area_extent", "occupied_extent", "is_occupied", "g_value",
            "adjacent_neighbors", "fmb_data", "last_updated"
        )

class FieldVerificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = FieldVerification
        fields = "__all__"

class EncroachmentAlertSerializer(GeoFeatureModelSerializer):
    parcel_details = serializers.ReadOnlyField(source='parcel.survey_number')
    parcel_classification = serializers.ReadOnlyField(source='parcel.classification')
    parcel_taluk = serializers.ReadOnlyField(source='parcel.taluk')
    parcel_village = serializers.ReadOnlyField(source='parcel.village_name')
    parcel_district = serializers.ReadOnlyField(source='parcel.district')
    is_sla_breached = serializers.SerializerMethodField()
    verification = FieldVerificationSerializer(read_only=True)

    def get_is_sla_breached(self, obj):
        return obj.is_sla_breached()
    
    class Meta:
        model = EncroachmentAlert
        geo_field = "alert_geom"
        fields = (
            "id", "parcel", "parcel_details", "parcel_classification", 
            "parcel_taluk", "parcel_village", "parcel_district",
            "detection_date", "confidence_score", "alert_type", "status", 
            "tier", "sla_deadline", "is_sla_breached", "is_peer_audited", "peer_auditor_name",
            "structure_category", "pass_count", "encroached_area_sqft", "fmb_measurements",
            "resolution_notes", "verification"
        )



class RegistryProposalSerializer(serializers.ModelSerializer):
    parcel_details = LandParcelSerializer(source='parcel', read_only=True)
    
    class Meta:
        model = RegistryProposal
        fields = "__all__"

