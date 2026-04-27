from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from .models import LandParcel, EncroachmentAlert, FieldVerification

class LandParcelSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = LandParcel
        geo_field = "geom"
        fields = (
            "id", "survey_number", "subdivision", "patta_number", 
            "owner_name", "classification", "village_code", "last_updated"
        )

class EncroachmentAlertSerializer(GeoFeatureModelSerializer):
    parcel_details = serializers.ReadOnlyField(source='parcel.survey_number')
    
    class Meta:
        model = EncroachmentAlert
        geo_field = "alert_geom"
        fields = (
            "id", "parcel", "parcel_details", "detection_date", 
            "confidence_score", "alert_type", "status", "resolution_notes"
        )

class FieldVerificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = FieldVerification
        fields = "__all__"
