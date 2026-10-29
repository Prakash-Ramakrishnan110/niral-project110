import os
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User
from core.models import UserProfile


class Command(BaseCommand):
    help = 'Provisions demonstration officer accounts across multiple Tamil Nadu districts. Refuses to run unless GEOMMAND_ENV=demo.'

    def handle(self, *args, **options):
        if os.environ.get('GEOMMAND_ENV') != 'demo':
            raise CommandError(
                "[BLOCKED] seed_demo_users refuses to execute: GEOMMAND_ENV != 'demo'. "
                "Production environments must provision users via official identity management."
            )

        demo_users = [
            # Statewide / Apex Officers
            {
                'username': 'state_apex_officer',
                'first_name': 'Dr. K.',
                'last_name': 'Manivasan IAS',
                'role': 'STATE_APEX',
                'district': None,
                'taluk': None,
                'village': None,
            },
            {
                'username': 'cla_state_officer',
                'first_name': 'Thiru S.',
                'last_name': 'Nagarajan IAS',
                'role': 'CLA_STATE',
                'district': None,
                'taluk': None,
                'village': None,
            },
            {
                'username': 'admin_gis_officer',
                'first_name': 'GIS',
                'last_name': 'Administrator',
                'role': 'ADMIN_GIS',
                'district': None,
                'taluk': None,
                'village': None,
                'is_staff': True,
            },
            {
                'username': 'vigilance_officer',
                'first_name': 'DVAC',
                'last_name': 'Auditor',
                'role': 'VIGILANCE',
                'district': None,
                'taluk': None,
                'village': None,
            },

            # District 1: Salem
            {
                'username': 'collector_salem',
                'first_name': 'R.',
                'last_name': 'Brindha Devi IAS',
                'role': 'COLLECTOR',
                'district': 'Salem',
                'taluk': None,
                'village': None,
            },
            {
                'username': 'rdo_salem',
                'first_name': 'Revenue',
                'last_name': 'Divisional Officer',
                'role': 'RDO',
                'district': 'Salem',
                'taluk': 'Salem West',
                'village': None,
            },
            {
                'username': 'tahsildar_salem_west',
                'first_name': 'S.',
                'last_name': 'Murugan',
                'role': 'TAHSILDAR',
                'district': 'Salem',
                'taluk': 'Salem West',
                'village': None,
            },
            {
                'username': 'inspector_salem_west',
                'first_name': 'M.',
                'last_name': 'Mukesh',
                'role': 'INSPECTOR',
                'district': 'Salem',
                'taluk': 'Salem West',
                'village': 'Suramangalam',
            },
            {
                'username': 'vao_kannankurichi',
                'first_name': 'K.',
                'last_name': 'Prakash',
                'role': 'VAO',
                'district': 'Salem',
                'taluk': 'Salem West',
                'village': 'Kannankurichi',
            },

            # District 2: Coimbatore
            {
                'username': 'collector_coimbatore',
                'first_name': 'K.',
                'last_name': 'Kranthi Kumar IAS',
                'role': 'COLLECTOR',
                'district': 'Coimbatore',
                'taluk': None,
                'village': None,
            },
            {
                'username': 'tahsildar_coimbatore_north',
                'first_name': 'V.',
                'last_name': 'Anand',
                'role': 'TAHSILDAR',
                'district': 'Coimbatore',
                'taluk': 'Coimbatore North',
                'village': None,
            },
            {
                'username': 'vao_coimbatore_north',
                'first_name': 'S.',
                'last_name': 'Ramesh',
                'role': 'VAO',
                'district': 'Coimbatore',
                'taluk': 'Coimbatore North',
                'village': 'Kalapatti',
            },

            # District 3: Chennai
            {
                'username': 'collector_chennai',
                'first_name': 'Rashmi',
                'last_name': 'Siddharth IAS',
                'role': 'COLLECTOR',
                'district': 'Chennai',
                'taluk': None,
                'village': None,
            },

            # Demo Portal Aliases (Quick-preset matching)
            {
                'username': 'tah_salem_west',
                'first_name': 'S.',
                'last_name': 'Murugan',
                'role': 'TAHSILDAR',
                'district': 'Salem',
                'taluk': 'Salem West',
                'village': None,
            },
            {
                'username': 'col_salem',
                'first_name': 'R.',
                'last_name': 'Brindha Devi IAS',
                'role': 'COLLECTOR',
                'district': 'Salem',
                'taluk': None,
                'village': None,
            },
            {
                'username': 'apex_tn',
                'first_name': 'Dr. K.',
                'last_name': 'Manivasan IAS',
                'role': 'STATE_APEX',
                'district': None,
                'taluk': None,
                'village': None,
            },
            {
                'username': 'dvac_auditor',
                'first_name': 'DVAC',
                'last_name': 'Auditor',
                'role': 'VIGILANCE',
                'district': None,
                'taluk': None,
                'village': None,
            },
            {
                'username': 'vao_kannan',
                'first_name': 'K.',
                'last_name': 'Prakash',
                'role': 'VAO',
                'district': 'Salem',
                'taluk': 'Salem West',
                'village': 'Kannankurichi',
            },
            {
                'username': 'admin',
                'first_name': 'GIS',
                'last_name': 'Administrator',
                'role': 'ADMIN_GIS',
                'district': None,
                'taluk': None,
                'village': None,
                'is_staff': True,
            },
        ]

        DEMO_ROLE_PASSWORDS = {
            'TAHSILDAR': 'Demo@TahSalem2026!',
            'COLLECTOR': 'Demo@ColSalem2026!',
            'STATE_APEX': 'Demo@StateApex2026!',
            'CLA_STATE': 'Demo@ClaState2026!',
            'ADMIN_GIS': 'Demo@GisAdmin2026!',
            'VIGILANCE': 'Demo@Vigilance2026!',
            'RDO': 'Demo@RdoSalem2026!',
            'INSPECTOR': 'Demo@InspSalem2026!',
            'VAO': 'Demo@VaoKannan2026!',
        }

        def resolve_user_password(udata):
            if os.environ.get('DEMO_USER_PASSWORD'):
                return os.environ.get('DEMO_USER_PASSWORD')
            role = udata.get('role', 'OFFICER')
            dist = udata.get('district') or 'TN'
            base = DEMO_ROLE_PASSWORDS.get(role, 'Demo@Officer2026!')
            if dist == 'Coimbatore':
                return base.replace('Salem', 'Cbe')
            elif dist == 'Chennai':
                return base.replace('Salem', 'Chn')
            return base

        created_count = 0
        updated_count = 0

        for udata in demo_users:
            uname = udata['username']
            user, created = User.objects.get_or_create(username=uname)
            user_pwd = resolve_user_password(udata)
            user.set_password(user_pwd)
            user.first_name = udata['first_name']
            user.last_name = udata['last_name']
            user.email = f"{uname}@tn.gov.in"
            user.is_staff = udata.get('is_staff', False)
            user.save()

            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.role = udata['role']
            profile.district = udata['district']
            profile.taluk = udata['taluk']
            profile.village = udata['village']
            profile.save()

            if created:
                created_count += 1
            else:
                updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"[SUCCESS] Provisioned {created_count} new demo users ({updated_count} updated) across Salem, Coimbatore, and Chennai."
            )
        )
