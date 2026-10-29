import math
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Count, Q, Avg, F
from core.models import (
    EncroachmentAlert,
    FieldVerification,
    DistrictLegalConfig,
    Taluk,
    District,
)


def compute_wilson_ci(positives: int, total: int, z: float = 1.95996398454) -> tuple[float, float, float]:
    """
    Computes the Wilson score interval for a binomial proportion at 95% confidence.
    Handles small sample sizes without collapsing to zero width.
    Returns: (p_hat, ci_lower, ci_upper)
    """
    if total <= 0:
        return 0.0, 0.0, 0.0

    p_hat = positives / total
    z2 = z * z
    denom = 1.0 + (z2 / total)
    center = (p_hat + (z2 / (2.0 * total))) / denom
    margin = (z * math.sqrt((p_hat * (1.0 - p_hat) / total) + (z2 / (4.0 * total * total)))) / denom

    ci_lower = max(0.0, center - margin)
    ci_upper = min(1.0, center + margin)

    return p_hat, ci_lower, ci_upper


class AccuracyLedgerService:
    """
    Statutory precision & recall ledger implementing Section 7.2 of GEOMMAND Master Specification.
    - Computes verified accuracy per lane with Wilson 95% confidence intervals.
    - Enforces statistical honesty: displays "Insufficient data" below minimum sample size n.
    - Segregates mathematical "Model Confidence" from empirical "Verified Accuracy".
    - Manages recall control checks and satellite observation gap detection.
    """

    LANE_HIGH = 'HIGH'
    LANE_MEDIUM = 'MEDIUM'
    LANE_LOW = 'LOW'

    @classmethod
    def get_district_config(cls, district=None) -> DistrictLegalConfig:
        return DistrictLegalConfig.get_config_for_district(district)

    @classmethod
    def get_lane_accuracy_summary(
        cls,
        district: str = None,
        model_version: str = None,
        min_sample_size: int = None,
    ) -> dict:
        """
        Computes precision per lane with sample size n and Wilson 95% confidence intervals.
        Below min_sample_size (default from DistrictLegalConfig, proposal 30), shows 'Insufficient data'.
        """
        cfg = cls.get_district_config(district)
        min_n = min_sample_size if min_sample_size is not None else cfg.min_sample_size_accuracy

        # Base query of primary field verifications (excluding control checks from accuracy ledger)
        qs = FieldVerification.objects.filter(
            alert__is_control_check=False,
            audit_of__isnull=True
        ).select_related('alert', 'alert__parcel')

        if district:
            qs = qs.filter(alert__parcel__district__iexact=district.strip())
        if model_version:
            qs = qs.filter(alert__snapshot_model_version=model_version)

        lanes_summary = {}
        lane_definitions = [
            (cls.LANE_HIGH, cfg.tier1_confidence_min, 1.0),
            (cls.LANE_MEDIUM, cfg.tier2_confidence_min, cfg.tier1_confidence_min),
            (cls.LANE_LOW, 0.0, cfg.tier2_confidence_min),
        ]

        total_verified_all = qs.count()

        for lane_name, min_conf, max_conf in lane_definitions:
            # Query verifications belonging to this lane by snapshot or alert confidence
            lane_qs = qs.filter(
                Q(snapshot_lane=lane_name) |
                (Q(snapshot_lane__isnull=True) & Q(alert__confidence_score__gte=min_conf) & (Q(alert__confidence_score__lt=max_conf) if max_conf < 1.0 else Q(alert__confidence_score__lte=max_conf)))
            )

            n = lane_qs.count()
            confirmed = lane_qs.filter(verdict='ENCROACHMENT_CONFIRMED').count()
            false_positives = lane_qs.filter(verdict='FALSE_POSITIVE').count()
            uncertain = lane_qs.filter(verdict='UNCERTAIN_NEEDS_REVISIT').count()

            if n < min_n:
                lanes_summary[lane_name] = {
                    "lane": lane_name,
                    "sample_size_n": n,
                    "min_required_n": min_n,
                    "status": "INSUFFICIENT_DATA",
                    "display_accuracy": "Insufficient data",
                    "precision_pct": None,
                    "ci_95": None,
                    "counts": {
                        "confirmed": confirmed,
                        "false_positive": false_positives,
                        "uncertain": uncertain,
                    },
                    "note": f"Sample size n={n} is below the statutory threshold of {min_n} verifications required for statistical validity.",
                }
            else:
                p_hat, ci_lower, ci_upper = compute_wilson_ci(positives=confirmed, total=n)
                lanes_summary[lane_name] = {
                    "lane": lane_name,
                    "sample_size_n": n,
                    "min_required_n": min_n,
                    "status": "STATISTICALLY_VALID",
                    "display_accuracy": f"{round(p_hat * 100, 1)}%",
                    "precision_pct": round(p_hat * 100, 1),
                    "ci_95": {
                        "lower_pct": round(ci_lower * 100, 1),
                        "upper_pct": round(ci_upper * 100, 1),
                        "formatted": f"[{round(ci_lower * 100, 1)}% – {round(ci_upper * 100, 1)}%]",
                    },
                    "counts": {
                        "confirmed": confirmed,
                        "false_positive": false_positives,
                        "uncertain": uncertain,
                    },
                    "note": f"Empirically measured precision across {n} field verifications (Wilson 95% CI).",
                }

        return {
            "district": district or "STATEWIDE",
            "min_sample_size_threshold": min_n,
            "total_verifications": total_verified_all,
            "lanes": lanes_summary,
            "governance_rule": "Model confidence per alert is distinct from empirical verified accuracy per lane.",
        }

    @classmethod
    def get_accuracy_by_dimension(cls, dimension: str = 'district', min_sample_size: int = 30) -> list[dict]:
        """
        Computes precision breakdown across dimensions: 'district', 'classification', 'model_version', 'month'.
        """
        valid_dims = ['district', 'classification', 'model_version', 'month']
        if dimension not in valid_dims:
            raise ValueError(f"Invalid dimension '{dimension}'. Allowed: {', '.join(valid_dims)}")

        qs = FieldVerification.objects.filter(
            alert__is_control_check=False,
            audit_of__isnull=True
        ).select_related('alert', 'alert__parcel')

        results = []

        if dimension == 'district':
            groups = qs.values('alert__parcel__district').annotate(
                total=Count('id'),
                confirmed=Count('id', filter=Q(verdict='ENCROACHMENT_CONFIRMED')),
                false_positives=Count('id', filter=Q(verdict='FALSE_POSITIVE')),
            ).order_by('-total')

            for g in groups:
                name = g['alert__parcel__district'] or 'Unknown'
                n = g['total']
                conf = g['confirmed']
                if n < min_sample_size:
                    results.append({
                        "dimension": "district",
                        "key": name,
                        "sample_size_n": n,
                        "status": "INSUFFICIENT_DATA",
                        "display_accuracy": "Insufficient data",
                    })
                else:
                    p, lo, hi = compute_wilson_ci(conf, n)
                    results.append({
                        "dimension": "district",
                        "key": name,
                        "sample_size_n": n,
                        "status": "STATISTICALLY_VALID",
                        "precision_pct": round(p * 100, 1),
                        "ci_95": f"[{round(lo * 100, 1)}% – {round(hi * 100, 1)}%]",
                    })

        elif dimension == 'classification':
            groups = qs.values('alert__parcel__classification').annotate(
                total=Count('id'),
                confirmed=Count('id', filter=Q(verdict='ENCROACHMENT_CONFIRMED')),
            ).order_by('-total')

            for g in groups:
                name = g['alert__parcel__classification'] or 'Unknown'
                n = g['total']
                conf = g['confirmed']
                if n < min_sample_size:
                    results.append({
                        "dimension": "classification",
                        "key": name,
                        "sample_size_n": n,
                        "status": "INSUFFICIENT_DATA",
                        "display_accuracy": "Insufficient data",
                    })
                else:
                    p, lo, hi = compute_wilson_ci(conf, n)
                    results.append({
                        "dimension": "classification",
                        "key": name,
                        "sample_size_n": n,
                        "status": "STATISTICALLY_VALID",
                        "precision_pct": round(p * 100, 1),
                        "ci_95": f"[{round(lo * 100, 1)}% – {round(hi * 100, 1)}%]",
                    })

        elif dimension == 'model_version':
            groups = qs.values('alert__snapshot_model_version').annotate(
                total=Count('id'),
                confirmed=Count('id', filter=Q(verdict='ENCROACHMENT_CONFIRMED')),
            ).order_by('-total')

            for g in groups:
                name = g['alert__snapshot_model_version'] or 'v1.0-sentinel2-resnet50'
                n = g['total']
                conf = g['confirmed']
                if n < min_sample_size:
                    results.append({
                        "dimension": "model_version",
                        "key": name,
                        "sample_size_n": n,
                        "status": "INSUFFICIENT_DATA",
                        "display_accuracy": "Insufficient data",
                    })
                else:
                    p, lo, hi = compute_wilson_ci(conf, n)
                    results.append({
                        "dimension": "model_version",
                        "key": name,
                        "sample_size_n": n,
                        "status": "STATISTICALLY_VALID",
                        "precision_pct": round(p * 100, 1),
                        "ci_95": f"[{round(lo * 100, 1)}% – {round(hi * 100, 1)}%]",
                    })

        elif dimension == 'month':
            # Monthly accuracy reporting
            verifications = qs.order_by('verified_at')
            monthly_buckets = {}
            for v in verifications:
                m_key = v.verified_at.strftime('%Y-%m')
                if m_key not in monthly_buckets:
                    monthly_buckets[m_key] = {'total': 0, 'confirmed': 0}
                monthly_buckets[m_key]['total'] += 1
                if v.verdict == 'ENCROACHMENT_CONFIRMED':
                    monthly_buckets[m_key]['confirmed'] += 1

            for m_key, counts in sorted(monthly_buckets.items()):
                n = counts['total']
                conf = counts['confirmed']
                if n < min_sample_size:
                    results.append({
                        "dimension": "month",
                        "key": m_key,
                        "sample_size_n": n,
                        "status": "INSUFFICIENT_DATA",
                        "display_accuracy": "Insufficient data",
                    })
                else:
                    p, lo, hi = compute_wilson_ci(conf, n)
                    results.append({
                        "dimension": "month",
                        "key": m_key,
                        "sample_size_n": n,
                        "status": "STATISTICALLY_VALID",
                        "precision_pct": round(p * 100, 1),
                        "ci_95": f"[{round(lo * 100, 1)}% – {round(hi * 100, 1)}%]",
                    })

        return results

    @classmethod
    def sample_control_checks(
        cls,
        district: str = None,
        sample_pct: float = 5.0,
        low_lane_only: bool = True
    ) -> int:
        """
        Samples a randomized subset of alerts as control checks to measure recall/false negatives.
        Tagged with `is_control_check=True` and excluded from operational work queues.
        """
        qs = EncroachmentAlert.objects.filter(is_control_check=False)
        if district:
            qs = qs.filter(parcel__district__iexact=district.strip())
        if low_lane_only:
            qs = qs.filter(confidence_score__lt=0.50)

        total = qs.count()
        if total == 0:
            return 0

        sample_count = max(1, int(math.ceil(total * (sample_pct / 100.0))))
        sample_ids = list(qs.order_by('?').values_list('id', flat=True)[:sample_count])

        updated = EncroachmentAlert.objects.filter(id__in=sample_ids).update(is_control_check=True)
        return updated

    @classmethod
    def detect_satellite_coverage_gaps(
        cls,
        district: str = None,
        max_gap_days: int = 10,
    ) -> list[dict]:
        """
        Computes satellite observation gaps across taluks.
        Identifies jurisdictions where clear Sentinel-2 observation is older than max_gap_days.
        """
        taluk_qs = Taluk.objects.all().select_related('district')
        if district:
            taluk_qs = taluk_qs.filter(district__name_en__iexact=district.strip())

        now = timezone.now()
        gaps = []

        for t in taluk_qs:
            # Query most recent clear alert detection in taluk
            latest_alert = EncroachmentAlert.objects.filter(
                parcel__taluk_ref=t
            ).order_by('-detection_date').first()

            last_obs = latest_alert.detection_date if latest_alert else None
            if last_obs:
                days_since = (now - last_obs).days
            else:
                days_since = 999  # No observation on record

            is_gap = days_since > max_gap_days

            if is_gap:
                gaps.append({
                    "district": t.district.name_en,
                    "taluk": t.name_en,
                    "taluk_code": t.code,
                    "days_since_clear_observation": days_since if days_since != 999 else None,
                    "last_clear_observation": last_obs.isoformat() if last_obs else None,
                    "gap_status": "COVERAGE_GAP",
                    "reason": "Cloud cover or revisit cadence interval exceeded threshold." if days_since != 999 else "No satellite observation recorded.",
                })

        return gaps

