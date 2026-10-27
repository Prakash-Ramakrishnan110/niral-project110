from django.contrib.gis.db import models
import uuid

class LandParcel(models.Model):
    CLASSIFICATION_CHOICES = [
        ('Government', 'Government'),
        ('Private', 'Private'),
        ('Waterbody', 'Waterbody'),
        ('Temple', 'Temple'),
        ('Forest', 'Forest'),
        ('Roadside', 'Roadside'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    survey_number = models.CharField(max_length=50)
    subdivision = models.CharField(max_length=10, blank=True, null=True)
    patta_number = models.CharField(max_length=50, blank=True, null=True)
    owner_name = models.CharField(max_length=255, blank=True, null=True)
    classification = models.CharField(max_length=50, choices=CLASSIFICATION_CHOICES, default='Government')
    village_code = models.CharField(max_length=50)
    taluk = models.CharField(max_length=50, default='Salem West')
    district = models.CharField(max_length=50, default='Salem')
    
    # Cadastral & Bilingual Fields (Tamil Nilam standard)
    ulpin = models.CharField(max_length=30, blank=True, null=True, db_index=True)
    district_ta = models.CharField(max_length=100, default='சேலம்', blank=True, null=True)
    taluk_ta = models.CharField(max_length=100, default='சேலம் மேற்கு', blank=True, null=True)
    village_name = models.CharField(max_length=100, blank=True, null=True)
    village_ta = models.CharField(max_length=100, blank=True, null=True)
    village_lgd_code = models.CharField(max_length=20, default='608142', blank=True, null=True)
    area_extent = models.CharField(max_length=50, default='2.50 Acres', blank=True, null=True)
    occupied_extent = models.CharField(max_length=50, blank=True, null=True)
    is_occupied = models.BooleanField(default=False)
    g_value = models.CharField(max_length=50, default='₹1,450 / sq.ft', blank=True, null=True)
    adjacent_neighbors = models.JSONField(default=list, blank=True, null=True)
    fmb_data = models.JSONField(default=dict, blank=True, null=True)

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
        ('NEW', 'NEW'),
        ('COLLECTOR_ACCEPTED', 'COLLECTOR_ACCEPTED'),
        ('TAHSILDAR_ACCEPTED', 'TAHSILDAR_ACCEPTED'),
        ('VAO_ASSIGNED', 'VAO_ASSIGNED'),
        ('VAO_SUBMITTED', 'VAO_SUBMITTED'),
        ('INSPECTOR_APPROVED', 'INSPECTOR_APPROVED'),
        ('SECTION_7_ISSUED', 'SECTION_7_ISSUED'),
        ('SECTION_6_ORDERED', 'SECTION_6_ORDERED'),
        ('FALSE_POSITIVE', 'FALSE_POSITIVE'),
        ('REJECTED_BOUNDARY', 'REJECTED_BOUNDARY'),
        ('CANCELLED_LEGAL', 'CANCELLED_LEGAL'),
    ]

    TIER_CHOICES = [
        ('TIER_1_CRITICAL', 'Tier 1: Critical (80-100% - Collector Direct)'),
        ('TIER_2_MEDIUM', 'Tier 2: Medium Risk (50-79% - VAO 7-Day SLA)'),
        ('TIER_3_MONITORING', 'Tier 3: Low (<50% - Satellite Sentinel Watch)'),
    ]

    STRUCTURE_CHOICES = [
        ('COMMERCIAL_LAYOUT', 'Commercial Layout / Concrete Shed / Warehouse'),
        ('TEMPORARY_PANDAL', 'Temporary Event / Wedding Pandal / Festival Tent'),
        ('VULNERABLE_HOUSING', 'Vulnerable Dweller / Thatched Hut (TNUHDB Rehabilitation)'),
        ('BOUNDARY_FENCE', 'Boundary Wall / Agricultural Fencing Encroachment'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    parcel = models.ForeignKey(LandParcel, on_delete=models.CASCADE, related_name='alerts')
    detection_date = models.DateTimeField(auto_now_add=True)
    confidence_score = models.FloatField(default=0.0)
    alert_type = models.CharField(max_length=100, default='New Structure')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Pending')
    
    # 3-Tier Governance & SLA Tracking
    tier = models.CharField(max_length=30, choices=TIER_CHOICES, default='TIER_2_MEDIUM')
    sla_deadline = models.DateTimeField(null=True, blank=True)
    is_peer_audited = models.BooleanField(default=False)
    peer_auditor_name = models.CharField(max_length=150, null=True, blank=True)

    # Social & Humanitarian Categorization
    structure_category = models.CharField(max_length=40, choices=STRUCTURE_CHOICES, default='COMMERCIAL_LAYOUT')
    pass_count = models.IntegerField(default=1) # Satellite observation passes

    # Exact Encroached Area and FMB Ladder Measurements
    encroached_area_sqft = models.FloatField(default=0.0)
    fmb_measurements = models.JSONField(default=dict, blank=True, null=True)
    
    # Point where the change was detected
    alert_geom = models.PointField(srid=4326)
    resolution_notes = models.TextField(blank=True, null=True)
    is_synthetic = models.BooleanField(
        default=False,
        db_index=True,
        help_text="True if generated by ai_simulation.py or simulation/testing script"
    )

    def is_sla_breached(self):
        from django.utils import timezone
        if self.sla_deadline and self.status in ['NEW', 'Pending', 'VAO_ASSIGNED']:
            return timezone.now() > self.sla_deadline
        return False

    def __str__(self):
        return f"Alert {self.id} - {self.tier} - {self.status}"

class FieldVerification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    alert = models.OneToOneField(EncroachmentAlert, on_delete=models.CASCADE, related_name='verification')
    officer_name = models.CharField(max_length=255)
    gps_lat = models.FloatField()
    gps_lon = models.FloatField()
    photos = models.JSONField(default=list, blank=True, null=True)
    remarks = models.TextField()
    action_plan = models.TextField(blank=True, null=True)
    implementation_details = models.TextField(blank=True, null=True)
    verified_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Verification for {self.alert.id}"

class RegistryProposal(models.Model):
    TYPE_CHOICES = [
        ('UPDATE', 'Update Details'),
        ('CORRECTION', 'Registry Correction'),
        ('NEW', 'New Entry'),
    ]
    STATUS_CHOICES = [
        ('PENDING', 'Pending Approval'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('ACTION_REQUIRED', 'Action Required'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    parcel = models.ForeignKey(LandParcel, on_delete=models.SET_NULL, null=True, blank=True, related_name='proposals')
    proposal_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='UPDATE')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    # Proposed changes as JSON
    proposed_data = models.JSONField()
    
    proposed_by = models.CharField(max_length=100) # Role or Username
    approved_by = models.CharField(max_length=100, null=True, blank=True)
    
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.proposal_type} for {self.parcel} - {self.status}"

