import json
import os

from django.core.management.base import BaseCommand, CommandError
from django.db import connection


class Command(BaseCommand):
    help = (
        "Creates deterministic Playwright fixtures (3 alerts with E2E-* survey numbers). "
        "REFUSES to run unless GEOMMAND_ENV=demo AND the connected database name ends with '_e2e', "
        "so it can never touch land_records."
    )

    def handle(self, *args, **options):
        from core.models import LandParcel, EncroachmentAlert, FieldVerification, CaseAuditEvent

        db_name = connection.settings_dict.get('NAME') or ''
        if os.environ.get('GEOMMAND_ENV') != 'demo':
            raise CommandError("[BLOCKED] seed_e2e_fixtures requires GEOMMAND_ENV=demo.")
        if not db_name.endswith('_e2e'):
            raise CommandError(
                f"[BLOCKED] seed_e2e_fixtures refuses to run on database '{db_name}'. "
                "Only databases whose name ends with '_e2e' are allowed."
            )

        template = (
            LandParcel.objects.filter(village_name__icontains='Kannan')
            .exclude(survey_number__startswith='E2E-')
            .first()
        )
        if template is None:
            raise CommandError("No Kannankurichi template parcel found in the e2e database copy.")

        # Idempotent: remove previous E2E fixtures
        old_parcels = LandParcel.objects.filter(survey_number__startswith='E2E-')
        old_alerts = EncroachmentAlert.objects.filter(parcel__in=old_parcels)
        CaseAuditEvent.objects.filter(alert__in=old_alerts).delete()
        FieldVerification.objects.filter(alert__in=old_alerts).delete()
        old_alerts.delete()
        old_parcels.delete()

        specs = {
            'vao': ('E2E-VAO', EncroachmentAlert.STATE_VAO_ASSIGNED),
            'assign': ('E2E-ASSIGN', EncroachmentAlert.STATE_NEW),
            'hearing': ('E2E-HEAR', EncroachmentAlert.STATE_NOTICE_REPLY_PENDING),
        }
        out = {}
        for key, (survey, status) in specs.items():
            parcel = LandParcel.objects.get(pk=template.pk)
            parcel.pk = None
            parcel._state.adding = True
            parcel.survey_number = survey
            parcel.subdivision = '1'
            parcel.save()
            alert = EncroachmentAlert.objects.create(
                parcel=parcel,
                alert_geom=parcel.geom.centroid if parcel.geom else None,
                confidence_score=0.91,
                status=status,
            )
            out[key] = {'alert_id': str(alert.id), 'survey_number': survey, 'status': alert.status}

        self.stdout.write('E2E_FIXTURES_JSON=' + json.dumps(out))

