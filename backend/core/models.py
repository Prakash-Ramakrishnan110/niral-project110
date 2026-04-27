from django.contrib.gis.db import models
import uuid

class LandParcel(models.Model):
    CLASSIFICATION_CHOICES = [
        ('Government', 'Government'),
        ('Private', 'Private'),
        ('Waterbody', 'Waterbody'),
        ('Temple', 'Temple'),
        ('Forest', 'Forest'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    survey_number = models.CharField(max_length=50)
    subdivision = models.CharField(max_length=10, blank=True, null=True)
    patta_number = models.CharField(max_length=50, blank=True, null=True)
    owner_name = models.CharField(max_length=255, blank=True, null=True)
    classification = models.CharField(max_length=50, choices=CLASSIFICATION_CHOICES, default='Government')
    village_code = models.CharField(max_length=20)
    
    # Spatial Field
    geom = models.PolygonField(srid=4326)
    
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.survey_number}/{self.subdivision} ({self.village_code})"

class EncroachmentAlert(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('In-Verification', 'In-Verification'),
        ('Confirmed', 'Confirmed'),
        ('False-Positive', 'False-Positive'),
        ('Resolved', 'Resolved'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    parcel = models.ForeignKey(LandParcel, on_delete=models.CASCADE, related_name='alerts')
    detection_date = models.DateTimeField(auto_now_add=True)
    confidence_score = models.FloatField(default=0.0)
    alert_type = models.CharField(max_length=100, default='New Structure')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Pending')
    
    # Point where the change was detected
    alert_geom = models.PointField(srid=4326)
    resolution_notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Alert {self.id} - {self.status}"

class FieldVerification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    alert = models.OneToOneField(EncroachmentAlert, on_delete=models.CASCADE, related_name='verification')
    officer_name = models.CharField(max_length=255)
    gps_lat = models.FloatField()
    gps_lon = models.FloatField()
    photo_url = models.URLField(max_length=500, blank=True, null=True)
    remarks = models.TextField()
    verified_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Verification for {self.alert.id}"
