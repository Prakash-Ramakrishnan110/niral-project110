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
        ]

        password = os.environ.get('DEMO_USER_PASSWORD', 'DemoAdmin@2026!')
        created_count = 0
        updated_count = 0

        for udata in demo_users:
            uname = udata['username']
            user, created = User.objects.get_or_create(username=uname)
            user.set_password(password)
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
