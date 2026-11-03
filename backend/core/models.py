from django.contrib.gis.db import models
from django.utils import timezone
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
    
    # Canonical Hierarchy References (Part 4.1)
    district_ref = models.ForeignKey('District', on_delete=models.SET_NULL, null=True, blank=True, related_name='parcels')
    taluk_ref = models.ForeignKey('Taluk', on_delete=models.SET_NULL, null=True, blank=True, related_name='parcels')
    village_ref = models.ForeignKey('RevenueVillage', on_delete=models.SET_NULL, null=True, blank=True, related_name='parcels')
    
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
    
    # Operative Judicial Order Registry Configuration
    operative_writ_petition_no = models.CharField(max_length=150, blank=True, null=True, help_text="Writ petition case number for High Court compliance ATR")
    high_court_bench_name = models.CharField(max_length=200, blank=True, null=True, help_text="Designated High Court bench")
    high_court_order_date = models.CharField(max_length=50, blank=True, null=True, help_text="Operative High Court order date (DD-MM-YYYY)")

    # Statutory Evidence and Procedural Guards
    fmb_certified_survey_required = models.BooleanField(
        default=True,
        help_text="Requires certified FMB survey measurements or explicit officer override before issuing Section 7 notice"
    )
    default_no_reply_action = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Action when Section 7 reply window elapses without reply. If NULL, action is unknown and transitions are denied by default."
    )

    # Lane Configuration & Audit Sampling (Section 7.1)
    fast_lane_audit_pct = models.FloatField(
        default=20.0,
        help_text="Percentage of high-lane alerts automatically sampled for independent peer audit"
    )
    min_sample_size_accuracy = models.IntegerField(
        default=30,
        help_text="Minimum verification count n before publishing verified accuracy percentage"
    )
    recheck_days_low = models.IntegerField(
        default=30,
        help_text="Observation window days for low lane watching"
    )
    watch_zone_cadence_days = models.IntegerField(
        null=True,
        blank=True,
        help_text="Per-district cadence in days with no hidden default; demo seeds are labelled proposal, for the department to set"
    )

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


class LaneConfig(models.Model):
    """
    Dedicated priority lane configuration and statutory sampling model (M2 Step 1).
    Decoupled from DistrictLegalConfig so districts without legal config still have calibrated lanes.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    district = models.ForeignKey(
        'core.District',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='lane_configs',
        help_text="District or NULL for state-wide default"
    )
    high_min = models.FloatField(
        default=0.80,
        help_text="initial, to be calibrated"
    )
    medium_min = models.FloatField(
        default=0.50,
        help_text="initial, to be calibrated"
    )
    fast_lane_audit_pct = models.FloatField(
        default=20.0,
        help_text="initial, to be calibrated"
    )
    min_sample_size = models.IntegerField(
        default=30,
        help_text="initial, to be calibrated"
    )
    recheck_days_low = models.IntegerField(
        default=30,
        help_text="initial, to be calibrated"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=models.Q(medium_min__gte=0.0) & models.Q(medium_min__lt=models.F('high_min')) & models.Q(high_min__lte=1.0),
                name='check_lane_threshold_bounds'
            ),
        ]

    def __str__(self):
        dist_name = self.district.name_en if self.district else "Statewide Default"
        return f"LaneConfig({dist_name}: High>={self.high_min}, Med>={self.medium_min})"

    @classmethod
    def get_config_for_district(cls, district=None):
        if district:
            if hasattr(district, 'id'):
                cfg = cls.objects.filter(district=district).first()
            else:
                cfg = cls.objects.filter(district__name_en__iexact=str(district).strip()).first()
            if cfg:
                return cfg
        state_cfg = cls.objects.filter(district__isnull=True).first()
        if state_cfg:
            return state_cfg
        return cls(district=None)

    def classify(self, confidence):
        """Returns 'HIGH' / 'MEDIUM' / 'LOW' for a confidence score using THIS row's thresholds."""
        if confidence is None:
            return 'LOW'
        if confidence >= self.high_min:
            return 'HIGH'
        if confidence >= self.medium_min:
            return 'MEDIUM'
        return 'LOW'


class EncroachmentAlert(models.Model):
    # Canonical Lifecycle States (28 States)
    STATE_NEW = 'NEW'
    STATE_TIER1_ESCALATED = 'TIER1_ESCALATED'
    STATE_COLLECTOR_REVIEWED = 'COLLECTOR_REVIEWED'
    STATE_WATCHING = 'WATCHING'
    STATE_VAO_ASSIGNED = 'VAO_ASSIGNED'
    STATE_IN_FIELD_VERIFICATION = 'IN_FIELD_VERIFICATION'
    STATE_VAO_SUBMITTED = 'VAO_SUBMITTED'
    STATE_FALSE_POSITIVE_CLAIMED = 'FALSE_POSITIVE_CLAIMED'
    STATE_PEER_AUDIT_PENDING = 'PEER_AUDIT_PENDING'
    STATE_FALSE_POSITIVE_CONFIRMED = 'FALSE_POSITIVE_CONFIRMED'
    STATE_REINSTATED = 'REINSTATED'
    STATE_INSPECTOR_APPROVED = 'INSPECTOR_APPROVED'
    STATE_REJECTED_BOUNDARY = 'REJECTED_BOUNDARY'
    STATE_CLOSED_PRIVATE_PATTA = 'CLOSED_PRIVATE_PATTA'
    STATE_PANDAL_GRACE_PERIOD = 'PANDAL_GRACE_PERIOD'
    STATE_TEMPORARY_OCCUPANCY_RESOLVED = 'TEMPORARY_OCCUPANCY_RESOLVED'
    STATE_NOTICE_PREPARATION = 'NOTICE_PREPARATION'
    STATE_SECTION_7_ISSUED = 'SECTION_7_ISSUED'
    STATE_NOTICE_REPLY_PENDING = 'NOTICE_REPLY_PENDING'
    STATE_HEARING_SCHEDULED = 'HEARING_SCHEDULED'
    STATE_SECTION_6_ORDERED = 'SECTION_6_ORDERED'
    STATE_EVICTION_SCHEDULED = 'EVICTION_SCHEDULED'
    STATE_EVICTION_EXECUTED = 'EVICTION_EXECUTED'
    STATE_REENCROACHMENT_FLAGGED = 'REENCROACHMENT_FLAGGED'
    STATE_COURT_STAY_HOLD = 'COURT_STAY_HOLD'
    STATE_CLOSED_COURT_QUASHED = 'CLOSED_COURT_QUASHED'
    STATE_REHABILITATION_ROUTED = 'REHABILITATION_ROUTED'
    STATE_REHABILITATION_COMPLETED = 'REHABILITATION_COMPLETED'
    STATE_EXPIRED_NO_RECURRENCE = 'EXPIRED_NO_RECURRENCE'

    # Legacy Transition States
    STATE_TRIAGE_LEGACY = 'TRIAGE_LEGACY'
    STATE_TAHSILDAR_ACCEPTED_LEGACY = 'TAHSILDAR_ACCEPTED_LEGACY'
    STATE_VAO_ASSIGNED_LEGACY = 'VAO_ASSIGNED_LEGACY'
    STATE_COLLECTOR_ACCEPTED_LEGACY = 'COLLECTOR_ACCEPTED_LEGACY'

    STATUS_CHOICES = [
        (STATE_NEW, 'New Detection Flagged'),
        (STATE_TIER1_ESCALATED, 'Tier 1 Critical Escalated'),
        (STATE_COLLECTOR_REVIEWED, 'Collector Reviewed'),
        (STATE_WATCHING, 'Satellite Observation Window / Watching'),
        (STATE_VAO_ASSIGNED, 'VAO Field Assigned'),
        (STATE_IN_FIELD_VERIFICATION, 'In Field Verification'),
        (STATE_VAO_SUBMITTED, 'VAO Findings Submitted'),
        (STATE_FALSE_POSITIVE_CLAIMED, 'False Positive Claimed (Field Officer)'),
        (STATE_PEER_AUDIT_PENDING, 'Peer Audit Pending (Independent Officer)'),
        (STATE_FALSE_POSITIVE_CONFIRMED, 'False Positive Confirmed (Case Closed)'),
        (STATE_REINSTATED, 'Reinstated (Peer Audit Overturned False Positive)'),
        (STATE_INSPECTOR_APPROVED, 'Revenue Inspector Endorsed'),
        (STATE_REJECTED_BOUNDARY, 'Boundary Rejected (Re-demarcation Required)'),
        (STATE_CLOSED_PRIVATE_PATTA, 'Closed (Valid Private Patta Verified)'),
        (STATE_PANDAL_GRACE_PERIOD, 'Temporary Pandal Grace Period (Tahsildar Approved)'),
        (STATE_TEMPORARY_OCCUPANCY_RESOLVED, 'Temporary Occupancy Resolved (Dismantled)'),
        (STATE_NOTICE_PREPARATION, 'Statutory Notice Preparation'),
        (STATE_SECTION_7_ISSUED, 'Section 7 Show-Cause Notice Issued'),
        (STATE_NOTICE_REPLY_PENDING, 'Notice Reply Period Pending (15 Days)'),
        (STATE_HEARING_SCHEDULED, 'Personal Hearing Scheduled'),
        (STATE_SECTION_6_ORDERED, 'Section 6 Eviction Order Passed'),
        (STATE_EVICTION_SCHEDULED, 'Eviction Scheduled with Bandobast'),
        (STATE_EVICTION_EXECUTED, 'Eviction Executed (Land Restored)'),
        (STATE_REENCROACHMENT_FLAGGED, 'Re-encroachment Detected on Restored Land'),
        (STATE_COURT_STAY_HOLD, 'Court Stay Order in Force (Clocks Paused)'),
        (STATE_CLOSED_COURT_QUASHED, 'Closed (Proceedings Quashed by Court Order)'),
        (STATE_REHABILITATION_ROUTED, 'TNUHDB Humanitarian Rehabilitation Routed'),
        (STATE_REHABILITATION_COMPLETED, 'TNUHDB Rehabilitation Allotment Completed'),
        (STATE_EXPIRED_NO_RECURRENCE, 'Expired (No Recurrence Observed)'),

        # Legacy
        (STATE_TRIAGE_LEGACY, 'Legacy Triage (Unmigrated Pending)'),
        (STATE_TAHSILDAR_ACCEPTED_LEGACY, 'Legacy Tahsildar Accepted (Unmigrated)'),
        (STATE_VAO_ASSIGNED_LEGACY, 'Legacy VAO Assigned (Unmigrated)'),
        (STATE_COLLECTOR_ACCEPTED_LEGACY, 'Legacy Collector Accepted (Unmigrated)'),

        # Deprecated raw statuses retained during transition
        ('Pending', 'Legacy Pending'),
        ('TAHSILDAR_ACCEPTED', 'Legacy Tahsildar Accepted'),
        ('COLLECTOR_ACCEPTED', 'Legacy Collector Accepted'),
        ('Confirmed', 'Legacy Confirmed'),
        ('False-Positive', 'Legacy False-Positive'),
        ('Resolved', 'Legacy Resolved'),
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
    version = models.PositiveIntegerField(default=1, db_index=True, help_text="Optimistic concurrency version; increments on every mutation")
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
    alert_geom = models.PointField(srid=4326, null=True, blank=True)
    resolution_notes = models.TextField(blank=True, null=True)
    is_synthetic = models.BooleanField(
        default=False,
        db_index=True,
        help_text="True if generated by ai_simulation.py or simulation/testing script"
    )

    # Court Stay & SLA Clock Pause
    stay_commenced_at = models.DateTimeField(null=True, blank=True, help_text="Timestamp when court stay commenced; pauses SLA clocks")
    paused_sla_remaining_seconds = models.IntegerField(null=True, blank=True, help_text="Remaining seconds on statutory SLA when stay commenced")
    previous_state = models.CharField(max_length=50, blank=True, null=True, help_text="State prior to court stay hold or temporary divergence")
    stay_order_number = models.CharField(max_length=100, blank=True, null=True, help_text="Court writ or stay order reference number")
    stayed_by_court = models.CharField(max_length=150, blank=True, null=True, help_text="Judicial forum / bench issuing stay order")
    stay_granted_date = models.DateField(null=True, blank=True, help_text="Date interim stay was granted")
    stay_vacated_date = models.DateField(null=True, blank=True, help_text="Date stay was vacated or dismissed")

    # Workflow Governance & Legal Safety Overrides
    legacy_status = models.CharField(max_length=50, blank=True, null=True, db_index=True, help_text="Original raw status string prior to Part 14 state machine migration")
    approver_unverified = models.BooleanField(default=False, help_text="True if action/order was approved under unverified legacy workflow")
    fmb_certified_acknowledged = models.BooleanField(default=False, help_text="Explicit officer acknowledgement if Section 7 notice is issued with indicative FMB sketch")
    fmb_acknowledgement_reason = models.TextField(blank=True, null=True, help_text="Mandatory officer explanation when proceeding with indicative FMB sketch")

    # Detection Snapshots & Recall Control Checks (Section 7.1 - 7.2)
    snapshot_confidence = models.FloatField(null=True, blank=True, help_text="Model confidence score at time of detection")
    snapshot_lane = models.CharField(max_length=30, blank=True, null=True, help_text="HIGH, MEDIUM, or LOW lane at detection time")
    snapshot_model_version = models.CharField(max_length=50, default='none-simulated', help_text="Model version identifier")
    snapshot_scene_ids = models.JSONField(default=list, blank=True, help_text="Sentinel-2 or satellite scene identifiers used for detection")
    detected_area_sqm = models.FloatField(default=0.0, help_text="Detected change area in square meters")
    is_control_check = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Sampled control check parcel to measure recall/false negatives; excluded from officer work queues"
    )

    @property
    def verification(self):
        """Returns primary non-peer-audit verification, or latest verification."""
        v = self.verifications.filter(audit_of__isnull=True).order_by('-verified_at').first()
        return v or self.verifications.order_by('-verified_at').first()

    @property
    def priority_lane(self) -> str:
        """Derives lane (HIGH, MEDIUM, LOW) from snapshot_lane or confidence_score."""
        if self.snapshot_lane:
            return self.snapshot_lane.upper()
        if self.confidence_score >= 0.80:
            return 'HIGH'
        if self.confidence_score >= 0.50:
            return 'MEDIUM'
        return 'LOW'

    @property
    def confidence_category(self) -> str:
        """Categorical confidence bucket."""
        if self.confidence_score >= 0.80:
            return 'HIGH'
        if self.confidence_score >= 0.50:
            return 'MEDIUM'
        return 'LOW'

    def is_sla_breached(self):
        from django.utils import timezone
        if self.sla_deadline and self.status in ['NEW', 'Pending', 'VAO_ASSIGNED']:
            return timezone.now() > self.sla_deadline
        return False

    def save(self, *args, **kwargs):
        # Detection-time snapshot (frozen at creation): confidence and lane use the LaneConfig in
        # force at that moment, so later threshold changes never re-lane existing alerts.
        # snapshot_model_version / snapshot_scene_ids are supplied by the detector.
        if self._state.adding and not self.snapshot_lane:
            _district = getattr(getattr(self, 'parcel', None), 'district', None)
            _lane_cfg = LaneConfig.get_config_for_district(_district)
            if self.snapshot_confidence is None:
                self.snapshot_confidence = self.confidence_score
            self.snapshot_lane = _lane_cfg.classify(self.snapshot_confidence)
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
    alert = models.ForeignKey(EncroachmentAlert, on_delete=models.CASCADE, related_name='verifications')
    verifier = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='verifications')
    officer_assignment = models.ForeignKey('core.OfficerAssignment', on_delete=models.SET_NULL, null=True, blank=True, related_name='verifications')
    officer_name = models.CharField(max_length=255)
    verdict = models.CharField(max_length=40, choices=VERDICT_CHOICES, default='ENCROACHMENT_CONFIRMED')
    gps_lat = models.FloatField()
    gps_lon = models.FloatField()
    distance_to_parcel_meters = models.FloatField(default=0.0)
    geofence_ok = models.BooleanField(default=True)
    photos = models.JSONField(default=list, blank=True, null=True)
    remarks = models.TextField()
    action_plan = models.TextField(blank=True, null=True)
    implementation_details = models.TextField(blank=True, null=True)

    # Immutability snapshots captured at time of verification (Section 7.2)
    snapshot_confidence = models.FloatField(null=True, blank=True)
    snapshot_lane = models.CharField(max_length=30, blank=True, null=True)
    snapshot_model_version = models.CharField(max_length=50, blank=True, default='')
    client_created_at = models.DateTimeField(null=True, blank=True)
    idempotency_key = models.CharField(max_length=100, blank=True, null=True, db_index=True)

    # Peer Audit Link (Section 7.2)
    audit_of = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='peer_audits',
        help_text="Links an independent peer audit to the original field verification"
    )

    verified_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['alert'],
                condition=models.Q(audit_of__isnull=True),
                name='unique_primary_verification_per_alert'
            )
        ]

    def __str__(self):
        return f"Verification for {self.alert.id} ({self.verdict})"


class CaseAuditEvent(models.Model):
    """
    Immutable audit log for state machine transitions and statutory compliance actions.
    Records transition actor, from/to states, rationale, and metadata.
    Enforces a cryptographic SHA-256 hash chain linking each event to its chronological predecessor.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    alert = models.ForeignKey(EncroachmentAlert, on_delete=models.CASCADE, related_name='audit_events')
    actor = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='case_audit_actions')
    actor_role = models.CharField(max_length=30, blank=True, default='')
    action = models.CharField(max_length=80)
    from_state = models.CharField(max_length=50)
    to_state = models.CharField(max_length=50)
    reason = models.TextField(blank=True, default='')
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.alert_id} | {self.from_state} -> {self.to_state} by {self.actor or 'System'}"

    @property
    def previous_event_hash(self) -> str:
        return (self.metadata or {}).get('previous_event_hash', '0' * 64)

    @property
    def current_hash(self) -> str:
        return (self.metadata or {}).get('current_hash', '')

    def compute_event_hash(self, prev_hash: str) -> str:
        import hashlib, json
        canonical = {
            'id': str(self.id),
            'alert_id': str(self.alert_id),
            'actor_id': self.actor_id,
            'actor_role': self.actor_role or '',
            'action': self.action or '',
            'from_state': self.from_state or '',
            'to_state': self.to_state or '',
            'reason': self.reason or '',
            'previous_event_hash': prev_hash,
        }
        serialized = json.dumps(canonical, sort_keys=True)
        return hashlib.sha256(serialized.encode('utf-8')).hexdigest()

    def save(self, *args, **kwargs):
        if self.metadata is None:
            self.metadata = {}
        if not self.metadata.get('current_hash'):
            # Fetch chronologically preceding audit event for this alert
            prev = CaseAuditEvent.objects.filter(alert_id=self.alert_id).exclude(id=self.id).order_by('created_at', 'id').last()
            prev_hash = prev.current_hash if (prev and prev.current_hash) else ('0' * 64)
            self.metadata['previous_event_hash'] = prev_hash
            self.metadata['current_hash'] = self.compute_event_hash(prev_hash)
        super().save(*args, **kwargs)


class IdempotencyKeyRecord(models.Model):
    """
    Network idempotency store for field officer submissions and state transitions.
    Prevents duplicate submissions over flaky rural networks (Section 8).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    key = models.CharField(max_length=120, unique=True, db_index=True)
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE, null=True, blank=True)
    endpoint = models.CharField(max_length=255)
    request_hash = models.CharField(max_length=64, blank=True)
    response_status = models.IntegerField(default=200)
    response_body = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"IdempotencyKey {self.key} ({self.endpoint})"


class ChangeFeedEvent(models.Model):
    """
    Commit-safe append-only change feed for real-time dashboard and mobile sync (Section 8).
    Enables cursor-based incremental sync without 5-second polling loops.
    """
    id = models.BigAutoField(primary_key=True)
    entity_type = models.CharField(max_length=40, db_index=True)
    entity_id = models.CharField(max_length=64, db_index=True)
    version = models.PositiveIntegerField(default=1)
    action = models.CharField(max_length=100, db_index=True)  # CREATED, UPDATED, TRANSITIONED, DELETEDTED, UPDATED, TRANSITIONED, DELETED
    scope_district = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    scope_taluk = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    scope_village = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    payload = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        ordering = ['created_at', 'id']
        indexes = [
            models.Index(fields=['created_at', 'id'], name='change_feed_cursor_idx'),
            models.Index(fields=['scope_district', 'created_at'], name='change_feed_dist_idx'),
        ]

    def cursor(self) -> str:
        return f"{self.created_at.isoformat()}:{self.id}"

    def __str__(self):
        return f"Change {self.id}: {self.entity_type} {self.entity_id} ({self.action})"


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


# ==============================================================================
# GOVERNMENT OFFICER ASSIGNMENTS & STATUTORY AUTHORITY (PART 4.2)
# ==============================================================================

class OfficerAssignment(models.Model):
    """
    Effective-dated officer assignment binding a user to an administrative post and jurisdiction node.
    Supports transfers, vacancies, and additional charges.
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
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE, related_name='assignments')
    role = models.CharField(max_length=30, choices=ROLE_CHOICES)
    designation = models.CharField(max_length=150, blank=True, null=True, help_text="Official designation title")
    
    # Jurisdiction Node References
    district = models.ForeignKey(District, on_delete=models.CASCADE, null=True, blank=True, related_name='officer_assignments')
    division = models.ForeignKey(RevenueDivision, on_delete=models.SET_NULL, null=True, blank=True, related_name='officer_assignments')
    taluk = models.ForeignKey(Taluk, on_delete=models.SET_NULL, null=True, blank=True, related_name='officer_assignments')
    firka = models.ForeignKey(Firka, on_delete=models.SET_NULL, null=True, blank=True, related_name='officer_assignments')
    village = models.ForeignKey(RevenueVillage, on_delete=models.SET_NULL, null=True, blank=True, related_name='officer_assignments')

    # Effective-dating & charge flags
    start_date = models.DateField(default=timezone.now)
    end_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_additional_charge = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_date', 'user__username']

    def is_currently_effective(self):
        from django.utils import timezone
        today = timezone.now().date()
        if not self.is_active:
            return False
        if self.start_date > today:
            return False
        if self.end_date and self.end_date < today:
            return False
        return True

    def clean(self):
        from django.core.exceptions import ValidationError
        # Statewide roles must have no local jurisdiction
        if self.role in ('STATE_APEX', 'CLA_STATE', 'ADMIN_GIS', 'VIGILANCE'):
            if self.district or self.taluk or self.village or self.firka or self.division:
                raise ValidationError(f"Statewide role {self.role} must not be scoped to a local jurisdiction node.")
        elif self.role == 'COLLECTOR':
            if not self.district:
                raise ValidationError("Collector assignment must have a valid District.")
            if self.taluk or self.village:
                raise ValidationError("Collector assignment must be district-scoped only (taluk/village must be null).")
        elif self.role == 'RDO':
            if not self.district:
                raise ValidationError("RDO assignment must have a valid District.")
            if not (self.division or self.taluk):
                raise ValidationError("RDO assignment must specify a Revenue Division or Taluk.")
        elif self.role == 'TAHSILDAR':
            if not self.district or not self.taluk:
                raise ValidationError("Tahsildar assignment must have both District and Taluk.")
            if self.taluk.district_id != self.district_id:
                raise ValidationError("Taluk does not belong to the selected District.")
        elif self.role == 'INSPECTOR':
            if not self.district or not self.taluk:
                raise ValidationError("Inspector assignment must have District and Taluk.")
            if self.firka and self.firka.taluk_id != self.taluk_id:
                raise ValidationError("Firka does not belong to the selected Taluk.")
        elif self.role == 'VAO':
            if not self.district or not self.taluk or not self.village:
                raise ValidationError("VAO assignment must have District, Taluk, and Revenue Village.")
            if self.village.taluk_id != self.taluk_id:
                raise ValidationError("Village does not belong to the selected Taluk.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        scope = self.village or self.firka or self.taluk or self.division or self.district or "Statewide"
        chg = " [ADDITIONAL CHARGE]" if self.is_additional_charge else ""
        return f"{self.user.username} as {self.role} @ {scope}{chg}"


class StatutoryNoticeAuthority(models.Model):
    """
    Deny-by-default legal authority registry controlling statutory actions under TN Act III of 1905.
    Every non-configured authority defaults to NOT ALLOWED.
    """
    ACTION_CHOICES = [
        ('ISSUE_SECTION_7', 'Issue Section 7 Show-Cause Notice'),
        ('RECORD_SERVICE_7', 'Record Service of Section 7 Notice'),
        ('SCHEDULE_HEARING', 'Schedule Statutory Hearing'),
        ('PASS_SECTION_6_ORDER', 'Pass Section 6 Eviction Order'),
        ('ISSUE_SECTION_6_WARRANT', 'Issue Section 6 Eviction Warrant'),
        ('GRANT_PANDAL_GRACE', 'Grant Temporary Pandal Grace Period'),
        ('RECLASSIFY_STRUCTURE', 'Reclassify Structure Category'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=30, choices=OfficerAssignment.ROLE_CHOICES)
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    is_allowed = models.BooleanField(default=False)
    
    # Compliance metadata (Part 0 Step 5: zero fabricated facts)
    legal_source_reference = models.CharField(max_length=255, default='UNVERIFIED – pending legal review')
    verified_by_legal_officer = models.BooleanField(default=False)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ('role', 'action')
        ordering = ['action', 'role']

    @classmethod
    def check_authority(cls, role, action):
        """
        Deny-by-default check: Returns True only if explicitly configured as is_allowed=True.
        """
        auth = cls.objects.filter(role=role, action=action).first()
        return bool(auth and auth.is_allowed)

    def __str__(self):
        status = "ALLOWED" if self.is_allowed else "DENIED"
        return f"[{status}] {self.role} -> {self.action}"


# ==============================================================================
# WATCH ZONES, RISK SCORING & REVIEW SCHEDULER (STEP 2)
# ==============================================================================

class WatchZone(models.Model):
    """
    Geographic or parcel-based watch zone for proactive periodic surveillance.
    Zone priority (1-3) is separate from statutory land classification (A-D).
    Cadence is a per-district setting with no hidden default.
    """
    CATEGORY_CHOICES = [
        ('waterbody', 'Waterbody / Riverbed'),
        ('canal', 'Irrigation Canal / Channel'),
        ('highway_margin', 'Highway Margin / Road Poramboke'),
        ('past_encroachment', 'Past Encroachment Site'),
        ('urban_fringe', 'Rapid Urban Fringe'),
        ('complaint', 'Citizen / Department Complaint'),
        ('other', 'Other Critical Poramboke'),
    ]

    PRIORITY_CHOICES = [
        (1, 'Priority 1 - High Frequency'),
        (2, 'Priority 2 - Medium Frequency'),
        (3, 'Priority 3 - Standard Frequency'),
    ]

    APPROVAL_CHOICES = [
        ('PENDING_APPROVAL', 'Pending Officer Approval'),
        ('APPROVED', 'Approved & Active'),
        ('REJECTED', 'Rejected'),
        ('RETIRED', 'Retired'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name_en = models.CharField(max_length=200)
    name_ta = models.CharField(max_length=200)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)

    # Geometry or parcel set
    geom = models.MultiPolygonField(srid=4326, null=True, blank=True)
    parcels = models.ManyToManyField(LandParcel, blank=True, related_name='watch_zones')

    reason = models.TextField()
    priority = models.IntegerField(choices=PRIORITY_CHOICES, default=2)

    # Cadence: Per-district setting with no hidden default; demo seeds are labelled "proposal, for the department to set"
    cadence_days = models.IntegerField(
        help_text="Per-district setting with no hidden default; demo seeds are labelled 'proposal, for the department to set'"
    )

    # Optional lane-threshold override
    lane_threshold_override = models.JSONField(
        null=True,
        blank=True,
        help_text="Optional threshold overrides for priority lanes within this zone"
    )

    # Owner assignment and jurisdiction scoping
    owner_assignment = models.ForeignKey(
        OfficerAssignment,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='owned_watch_zones'
    )
    district = models.ForeignKey(
        District,
        on_delete=models.CASCADE,
        related_name='watch_zones'
    )
    taluk = models.ForeignKey(
        Taluk,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='watch_zones'
    )

    # Active and lifecycle flags
    is_active = models.BooleanField(default=True)
    approval_status = models.CharField(max_length=30, choices=APPROVAL_CHOICES, default='APPROVED')
    valid_from = models.DateField(default=timezone.now)
    valid_to = models.DateField(null=True, blank=True)
    version = models.IntegerField(default=1)

    # Quota accounting (in square meters)
    pinned_area_sqm = models.FloatField(default=0.0)

    # Pinning officer attribution
    pinned_by = models.ForeignKey(
        'auth.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='pinned_zones'
    )
    pinned_by_role = models.CharField(max_length=50, blank=True, default='')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['priority', '-created_at']

    def __str__(self):
        return f"WatchZone [{self.category}] {self.name_en} (P{self.priority}, {self.cadence_days}d)"


class WatchZoneAuditEvent(models.Model):
    """
    Immutable audit ledger for WatchZone lifecycle actions:
    pinning, scope modification, retirement, and approval flows.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    zone = models.ForeignKey(WatchZone, on_delete=models.CASCADE, related_name='audit_events')
    actor = models.ForeignKey('auth.User', null=True, blank=True, on_delete=models.SET_NULL, related_name='zone_audit_events')
    actor_role = models.CharField(max_length=50, blank=True, default='')
    action = models.CharField(max_length=80)
    from_status = models.CharField(max_length=50, blank=True, default='')
    to_status = models.CharField(max_length=50, blank=True, default='')
    reason = models.TextField(blank=True, default='')
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"ZoneAudit {self.zone_id} | {self.action} by {self.actor_role or self.actor}"


class WatchSubscription(models.Model):
    """
    Subscription binding an officer/user to automated review task alerts for a watch zone.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    zone = models.ForeignKey(WatchZone, on_delete=models.CASCADE, related_name='subscriptions')
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE, related_name='watch_subscriptions')
    role = models.CharField(max_length=50, blank=True, default='')
    channel = models.CharField(max_length=50, default='SANDBOX_NOTIFICATION')
    is_active = models.BooleanField(default=True)
    subscribed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('zone', 'user')
        ordering = ['-subscribed_at']

    def __str__(self):
        return f"Subscription {self.user.username} -> {self.zone.name_en}"


class ParcelRisk(models.Model):
    """
    Deterministic rule-based risk score (v1) for cadastral parcels.
    Combines: land class, past alerts, nearby construction, distance to built-up area, complaints, zone membership.
    Weights in configuration; the factor breakdown is stored and displayed.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    parcel = models.OneToOneField(LandParcel, on_delete=models.CASCADE, related_name='risk_profile')
    score = models.FloatField(help_text="Calculated risk score between 0.0 and 1.0")
    factor_breakdown = models.JSONField(
        default=dict,
        help_text="Rule-based factors: land_class, past_alerts, nearby_construction, distance_to_built_up, complaints, zone_membership"
    )
    formula_version = models.CharField(max_length=50, default='v1-rule-based')
    calculated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-score']

    def __str__(self):
        return f"ParcelRisk {self.parcel.survey_number} -> score={self.score:.3f} ({self.formula_version})"


class ParcelCheck(models.Model):
    """
    Observation check history on a parcel from satellite imagery or field visits.
    A cloudy scene is recorded as NO_CLEAR_OBSERVATION and does NOT count as 'checked clear'.
    """
    METHOD_CHOICES = [
        ('SATELLITE', 'Satellite Observation'),
        ('FIELD', 'Ground Field Verification'),
    ]

    RESULT_CHOICES = [
        ('CLEAR', 'Clear (No Activity Observed)'),
        ('ALERT', 'Alert Flagged (Encroachment Detected)'),
        ('NO_CLEAR_OBSERVATION', 'No Clear Observation (Cloud / Obscured / Pending Revisit)'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    parcel = models.ForeignKey(LandParcel, on_delete=models.CASCADE, related_name='checks')
    zone = models.ForeignKey(WatchZone, null=True, blank=True, on_delete=models.SET_NULL, related_name='checks')
    checked_at = models.DateTimeField()
    method = models.CharField(max_length=20, choices=METHOD_CHOICES)
    result = models.CharField(max_length=30, choices=RESULT_CHOICES)
    scene_ids = models.JSONField(default=list, help_text="Satellite scene identifiers used in the observation")
    verification_link = models.CharField(max_length=500, blank=True, default='')
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-checked_at']

    def __str__(self):
        return f"ParcelCheck {self.parcel.survey_number} | {self.method} -> {self.result} ({self.checked_at.date()})"


class ReviewTask(models.Model):
    """
    Automated review task generated by Celery beat scheduler when:
    1. A watch zone periodic cadence check is due.
    2. A low-lane alert observation window elapses (recheck_days_low).
    3. An SLA timeline is overdue.
    """
    TASK_TYPE_CHOICES = [
        ('ZONE_CADENCE_REVIEW', 'Watch Zone Periodic Review Due'),
        ('LOW_LANE_RECHECK', 'Low Lane Periodic Recheck (LaneConfig)'),
        ('SLA_OVERDUE_REVIEW', 'Statutory SLA Overdue Review'),
    ]

    STATUS_CHOICES = [
        ('PENDING', 'Pending Review'),
        ('COMPLETED', 'Completed'),
        ('ESCALATED', 'Escalated'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    zone = models.ForeignKey(WatchZone, null=True, blank=True, on_delete=models.CASCADE, related_name='review_tasks')
    parcel = models.ForeignKey(LandParcel, null=True, blank=True, on_delete=models.CASCADE, related_name='review_tasks')
    alert = models.ForeignKey(EncroachmentAlert, null=True, blank=True, on_delete=models.SET_NULL, related_name='review_tasks')
    task_type = models.CharField(max_length=50, choices=TASK_TYPE_CHOICES)
    due_date = models.DateField(help_text="Calculated statutory or cadence review due date")
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='PENDING')
    details = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['due_date', '-created_at']

    def __str__(self):
        target = self.zone.name_en if self.zone else (f"Alert {self.alert_id}" if self.alert else f"Parcel {self.parcel_id}")
        return f"ReviewTask [{self.task_type}] {target} (Due: {self.due_date}) [{self.status}]"


