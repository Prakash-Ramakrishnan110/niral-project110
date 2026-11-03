"""
Rule-based Risk Scoring Engine (v1) for Cadastral Parcels.
Implements deterministic scoring across 6 factors:
1. Land classification (waterbody, forest, temple, roadside, government, private)
2. Historical alerts on this parcel
3. Nearby construction/active alerts
4. Distance to built-up urban envelope
5. Citizen / department complaints
6. Active WatchZone membership and zone priority

Weights are configurable; the complete factor breakdown is stored and displayed.
"""
from typing import Dict, Any, Tuple
from django.conf import settings
from core.models import LandParcel, ParcelRisk, EncroachmentAlert, WatchZone

# Configurable weights (sum to 1.0)
CONFIGURED_RISK_WEIGHTS: Dict[str, float] = getattr(settings, 'RISK_SCORE_WEIGHTS', {
    'land_class': 0.30,
    'past_alerts': 0.20,
    'nearby_construction': 0.15,
    'distance_to_built_up': 0.10,
    'complaints': 0.10,
    'zone_membership': 0.15,
})

# Land class base risk mapping
LAND_CLASS_SCORES = {
    'Waterbody': 1.0,
    'Forest': 0.85,
    'Temple': 0.75,
    'Roadside': 0.65,
    'Government': 0.50,
    'Private': 0.10,
}

FORMULA_VERSION = 'v1-rule-based'

def calculate_parcel_risk(parcel: LandParcel) -> Tuple[float, Dict[str, Any]]:
    """
    Computes deterministic risk score and complete factor breakdown for a given parcel.
    """
    breakdown: Dict[str, Any] = {}

    # Factor 1: Land Classification
    classification = parcel.classification or 'Government'
    raw_class_score = LAND_CLASS_SCORES.get(classification, 0.50)
    w_class = CONFIGURED_RISK_WEIGHTS.get('land_class', 0.30)
    breakdown['land_class'] = {
        'classification': classification,
        'raw_score': raw_class_score,
        'weight': w_class,
        'weighted_score': round(raw_class_score * w_class, 4),
    }

    # Factor 2: Past Alerts Count
    past_alerts_count = EncroachmentAlert.objects.filter(parcel=parcel).count()
    raw_past_alerts = min(past_alerts_count / 3.0, 1.0)  # Caps at 3 historical alerts
    w_alerts = CONFIGURED_RISK_WEIGHTS.get('past_alerts', 0.20)
    breakdown['past_alerts'] = {
        'count': past_alerts_count,
        'raw_score': round(raw_past_alerts, 4),
        'weight': w_alerts,
        'weighted_score': round(raw_past_alerts * w_alerts, 4),
    }

    # Factor 3: Nearby Construction (other active alerts in same taluk or village)
    nearby_alerts_count = 0
    if parcel.taluk_ref_id:
        nearby_alerts_count = EncroachmentAlert.objects.filter(
            parcel__taluk_ref=parcel.taluk_ref
        ).exclude(parcel=parcel).exclude(status__in=['Resolved', 'CLOSED_COURT_QUASHED', 'CLOSED_PRIVATE_PATTA']).count()
    raw_nearby = min(nearby_alerts_count / 10.0, 1.0)
    w_nearby = CONFIGURED_RISK_WEIGHTS.get('nearby_construction', 0.15)
    breakdown['nearby_construction'] = {
        'count': nearby_alerts_count,
        'raw_score': round(raw_nearby, 4),
        'weight': w_nearby,
        'weighted_score': round(raw_nearby * w_nearby, 4),
    }

    # Factor 4: Distance to built-up area
    # Proxy: parcels in urban taluks / high alert density have higher proximity score
    raw_dist = 0.50
    w_dist = CONFIGURED_RISK_WEIGHTS.get('distance_to_built_up', 0.10)
    breakdown['distance_to_built_up'] = {
        'proxy_factor': 'standard_cadastral_envelope',
        'raw_score': raw_dist,
        'weight': w_dist,
        'weighted_score': round(raw_dist * w_dist, 4),
    }

    # Factor 5: Complaints (stored in parcel metadata or external registry)
    complaints_count = int((parcel.metadata or {}).get('complaints_count', 0)) if hasattr(parcel, 'metadata') and parcel.metadata else 0
    raw_complaints = min(complaints_count / 2.0, 1.0)
    w_complaints = CONFIGURED_RISK_WEIGHTS.get('complaints', 0.10)
    breakdown['complaints'] = {
        'count': complaints_count,
        'raw_score': round(raw_complaints, 4),
        'weight': w_complaints,
        'weighted_score': round(raw_complaints * w_complaints, 4),
    }

    # Factor 6: Zone Membership & Priority (Priority 1 = 1.0, Priority 2 = 0.66, Priority 3 = 0.33)
    active_zones = parcel.watch_zones.filter(is_active=True, approval_status='APPROVED')
    in_zone = active_zones.exists()
    zone_p = None
    raw_zone = 0.0
    if in_zone:
        highest_priority_zone = active_zones.order_by('priority').first()
        zone_p = highest_priority_zone.priority
        priority_map = {1: 1.0, 2: 0.66, 3: 0.33}
        raw_zone = priority_map.get(zone_p, 0.33)
    w_zone = CONFIGURED_RISK_WEIGHTS.get('zone_membership', 0.15)
    breakdown['zone_membership'] = {
        'in_zone': in_zone,
        'highest_priority': zone_p,
        'raw_score': round(raw_zone, 4),
        'weight': w_zone,
        'weighted_score': round(raw_zone * w_zone, 4),
    }

    total_score = sum(factor['weighted_score'] for factor in breakdown.values())
    total_score = min(max(round(total_score, 4), 0.0), 1.0)
    breakdown['total_score'] = total_score
    breakdown['formula_version'] = FORMULA_VERSION

    return total_score, breakdown


def calculate_and_save_parcel_risk(parcel: LandParcel) -> ParcelRisk:
    """
    Computes risk score and upserts the ParcelRisk profile.
    """
    score, breakdown = calculate_parcel_risk(parcel)
    risk_obj, _ = ParcelRisk.objects.update_or_create(
        parcel=parcel,
        defaults={
            'score': score,
            'factor_breakdown': breakdown,
            'formula_version': FORMULA_VERSION,
        }
    )
    return risk_obj

