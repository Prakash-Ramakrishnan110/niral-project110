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

    @property
    def tamil_nilam_meta(self):
        from .services.tamil_nilam_classifier import TamilNilamClassifier
        return TamilNilamClassifier.classify(self.classification)

    @property
    def is_waterbody_protected(self):
        from .services.tamil_nilam_classifier import TamilNilamClassifier
        return TamilNilamClassifier.is_waterbody(self.classification)

    @property
    def is_protected_government_land(self):
        from .services.tamil_nilam_classifier import TamilNilamClassifier
        return TamilNilamClassifier.is_protected_government_land(self.classification)

    def __str__(self):
        return f"{self.survey_number}/{self.subdivision} ({self.village_code})"

class DistrictLegalConfig(models.Model):
    """
    Configurable confidence thresholds, statutory SLAs, and legal court order mappings.
    Eliminates hardcoded tier percentages, SLA timers, and notice windows.
    If district is None, serves as statewide fallback configuration.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    district = models.CharField(max_length=100, blank=True, null=True, unique=True, help_text="District name or NULL for statewide default")
    
    # Confidence Tier Thresholds
    tier1_confidence_min = models.FloatField(default=0.80, help_text="Minimum confidence for Tier 1 Critical (default 0.80 / 80%)")
    tier2_confidence_min = models.FloatField(default=0.50, help_text="Minimum confidence for Tier 2 Medium Risk (default 0.50 / 50%)")
    
    # Operational SLA Timers (in days)
    tier1_sla_days = models.IntegerField(default=2, help_text="SLA in days for Tier 1 Critical alerts (e.g. 2 days / 48 hrs)")
    tier2_sla_days = models.IntegerField(default=7, help_text="SLA in days for Tier 2 Medium alerts (e.g. 7 days)")
    tier3_sla_days = models.IntegerField(default=30, help_text="SLA in days for Tier 3 Monitoring alerts (e.g. 30 days)")
    
    # Statutory Windows under TN Act III of 1905
    section7_reply_window_days = models.IntegerField(default=15, help_text="Statutory show-cause reply deadline in days")
    section6_vacate_window_days = models.IntegerField(default=7, help_text="Eviction warrant vacate grace period in days")
    
    # Judicial Order Registry Configuration
    operative_writ_petition_no = models.CharField(max_length=150, blank=True, null=True, help_text="Writ petition case number for High Court compliance ATR")
    high_court_bench_name = models.CharField(max_length=200, blank=True, null=True, help_text="Designated High Court bench")
    high_court_order_date = models.CharField(max_length=50, blank=True, null=True, help_text="Operative High Court order date (DD-MM-YYYY)")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @classmethod
    def get_config_for_district(cls, district=None):
        if district:
            cfg = cls.objects.filter(district__iexact=district.strip()).first()
            if cfg:
                return cfg
        state_cfg = cls.objects.filter(district__isnull=True).first()
        if state_cfg:
            return state_cfg
        return cls(district=None)

    def resolve_tier_and_sla(self, confidence_score: float, base_time=None):
        from datetime import timedelta
        from django.utils import timezone
        now = base_time or timezone.now()
        if confidence_score >= self.tier1_confidence_min:
            return 'TIER_1_CRITICAL', now + timedelta(days=self.tier1_sla_days)
        elif confidence_score >= self.tier2_confidence_min:
            return 'TIER_2_MEDIUM', now + timedelta(days=self.tier2_sla_days)
        else:
            return 'TIER_3_MONITORING', now + timedelta(days=self.tier3_sla_days)

    def __str__(self):
        return f"Legal Config ({self.district or 'Statewide Default'})"


# Alias for LaneConfig
LaneConfig = DistrictLegalConfig


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
        ('TIER_1_CRITICAL', 'Tier 1 Critical'),
        ('TIER_2_MEDIUM', 'Tier 2 Medium'),
        ('TIER_3_MONITORING', 'Tier 3 Monitoring'),
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

    # Court Stay & SLA Clock Pause
    stay_commenced_at = models.DateTimeField(null=True, blank=True, help_text="Timestamp when court stay commenced; pauses SLA clocks")
    paused_sla_remaining_seconds = models.IntegerField(null=True, blank=True, help_text="Remaining seconds on statutory SLA when stay commenced")

    def is_sla_breached(self):
        from django.utils import timezone
        if self.sla_deadline and self.status in ['NEW', 'Pending', 'VAO_ASSIGNED']:
            return timezone.now() > self.sla_deadline
        return False

    def save(self, *args, **kwargs):
        if not self.tier or not self.sla_deadline:
            district = getattr(getattr(self, 'parcel', None), 'district', None)
            cfg = DistrictLegalConfig.get_config_for_district(district)
            calc_tier, calc_sla = cfg.resolve_tier_and_sla(self.confidence_score)
            if not self.tier:
                self.tier = calc_tier
            if not self.sla_deadline:
                self.sla_deadline = calc_sla
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Alert {self.id} - {self.tier} - {self.status}"

class FieldVerification(models.Model):
    VERDICT_CHOICES = [
        ('ENCROACHMENT_CONFIRMED', 'Encroachment Confirmed'),
        ('FALSE_POSITIVE', 'False Positive (No Encroachment Found)'),
        ('UNCERTAIN_NEEDS_REVISIT', 'Uncertain / Joint Survey Needed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    alert = models.OneToOneField(EncroachmentAlert, on_delete=models.CASCADE, related_name='verification')
    officer_name = models.CharField(max_length=255)
    verdict = models.CharField(max_length=40, choices=VERDICT_CHOICES, default='ENCROACHMENT_CONFIRMED')
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


class UserProfile(models.Model):
    """
    Stop-gap officer profile and jurisdiction binding.
    Targeted for replacement by OfficerAssignment and explicit LGD-keyed jurisdiction hierarchy
    once Workstream 1 (Statewide Administrative Hierarchy) is deployed (TD-05).
    """
    ROLE_CHOICES = [
        ('STATE_APEX', 'State Apex / Chief Secretary'),
        ('CLA_STATE', 'Commissioner of Land Administration (CLA)'),
        ('COLLECTOR', 'District Collector / District Magistrate'),
        ('RDO', 'Revenue Divisional Officer (RDO) / Sub-Collector'),
        ('TAHSILDAR', 'Tahsildar (Taluk Magistrate)'),
        ('INSPECTOR', 'Revenue Inspector (Firka Level)'),
        ('VAO', 'Village Administrative Officer (VAO)'),
        ('ADMIN_GIS', 'GIS & State Data Administrator'),
        ('VIGILANCE', 'Vigilance & Anti-Corruption Officer (Read-Only Audit)'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField('auth.User', on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default='VAO')
    district = models.CharField(max_length=100, blank=True, null=True, help_text="Case-insensitive district match (e.g. Salem, Coimbatore)")
    taluk = models.CharField(max_length=100, blank=True, null=True, help_text="Case-insensitive taluk match (e.g. Salem West)")
    village = models.CharField(max_length=100, blank=True, null=True, help_text="Case-insensitive village name or code match")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} ({self.role}) - {self.district or 'Statewide'}"


# ==============================================================================
# STATEWIDE ADMINISTRATIVE JURISDICTION HIERARCHY (PART 4.1)
# State › District › Revenue Division (RDO) › Taluk › Firka › Revenue Village
# ==============================================================================

class State(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=10, unique=True, help_text="e.g. TN")
    lgd_code = models.IntegerField(unique=True, null=True, blank=True)
    name_en = models.CharField(max_length=100)
    name_ta = models.CharField(max_length=100)

    class Meta:
        ordering = ['name_en']

    def __str__(self):
        return f"{self.name_en} ({self.code})"


class District(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    state = models.ForeignKey(State, on_delete=models.CASCADE, related_name='districts')
    code = models.CharField(max_length=20, unique=True, help_text="e.g. TN-SLM")
    lgd_code = models.IntegerField(unique=True, null=True, blank=True)
    name_en = models.CharField(max_length=100, db_index=True)
    name_ta = models.CharField(max_length=100)

    class Meta:
        ordering = ['name_en']

    def __str__(self):
        return f"{self.name_en} District ({self.code})"


class RevenueDivision(models.Model):
    """
    RDO Circle / Sub-Collector Division under Revenue Administration.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    district = models.ForeignKey(District, on_delete=models.CASCADE, related_name='revenue_divisions')
    code = models.CharField(max_length=30, unique=True, help_text="e.g. TN-SLM-RDO-SLM")
    name_en = models.CharField(max_length=100)
    name_ta = models.CharField(max_length=100)

    class Meta:
        ordering = ['district__name_en', 'name_en']
        unique_together = ('district', 'name_en')

    def __str__(self):
        return f"{self.name_en} Division ({self.district.name_en})"


class Taluk(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    district = models.ForeignKey(District, on_delete=models.CASCADE, related_name='taluks')
    revenue_division = models.ForeignKey(RevenueDivision, on_delete=models.SET_NULL, null=True, blank=True, related_name='taluks')
    code = models.CharField(max_length=30, unique=True, help_text="e.g. TN-SLM-SLMW")
    lgd_code = models.IntegerField(null=True, blank=True)
    name_en = models.CharField(max_length=100, db_index=True)
    name_ta = models.CharField(max_length=100)

    class Meta:
        ordering = ['district__name_en', 'name_en']
        unique_together = ('district', 'name_en')

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.revenue_division and self.revenue_division.district_id != self.district_id:
            raise ValidationError("Taluk's Revenue Division must belong to the same District.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name_en} Taluk ({self.district.name_en})"


class Firka(models.Model):
    """
    Revenue Inspector (RI) Circle.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    taluk = models.ForeignKey(Taluk, on_delete=models.CASCADE, related_name='firkas')
    code = models.CharField(max_length=40, unique=True, help_text="e.g. TN-SLM-SLMW-SRM")
    name_en = models.CharField(max_length=100, db_index=True)
    name_ta = models.CharField(max_length=100)

    class Meta:
        ordering = ['taluk__name_en', 'name_en']
        unique_together = ('taluk', 'name_en')

    def __str__(self):
        return f"{self.name_en} Firka ({self.taluk.name_en})"


class RevenueVillage(models.Model):
    """
    Revenue Village presided by Village Administrative Officer (VAO).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    district = models.ForeignKey(District, on_delete=models.CASCADE, related_name='villages')
    taluk = models.ForeignKey(Taluk, on_delete=models.CASCADE, related_name='villages')
    firka = models.ForeignKey(Firka, on_delete=models.SET_NULL, null=True, blank=True, related_name='villages')
    code = models.CharField(max_length=50, unique=True, help_text="e.g. TN-SLM-SLMW-KNK")
    lgd_code = models.IntegerField(null=True, blank=True)
    name_en = models.CharField(max_length=150, db_index=True)
    name_ta = models.CharField(max_length=150)
    boundary = models.MultiPolygonField(srid=4326, null=True, blank=True)

    class Meta:
        ordering = ['district__name_en', 'taluk__name_en', 'name_en']
        unique_together = ('taluk', 'name_en')

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.taluk and self.taluk.district_id != self.district_id:
            raise ValidationError("Village's Taluk must belong to the Village's District.")
        if self.firka and self.firka.taluk_id != self.taluk_id:
            raise ValidationError("Village's Firka must belong to the Village's Taluk.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name_en} ({self.taluk.name_en}, {self.district.name_en})"


class DistrictAdjacency(models.Model):
    """
    Pairwise district adjacency for cross-district peer audit selection.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    district = models.ForeignKey(District, on_delete=models.CASCADE, related_name='adjacencies_from')
    adjacent_district = models.ForeignKey(District, on_delete=models.CASCADE, related_name='adjacencies_to')

    class Meta:
        unique_together = ('district', 'adjacent_district')

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.district_id == self.adjacent_district_id:
            raise ValidationError("A district cannot be adjacent to itself.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.district.name_en} <-> {self.adjacent_district.name_en}"

