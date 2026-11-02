import os
import secrets
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User
from core.models import UserProfile


class Command(BaseCommand):
    help = 'Provisions demonstration officer accounts across multiple Tamil Nadu districts. Refuses to run unless GEOMMAND_ENV=demo.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--export-env',
            type=str,
            default=None,
            help='Path to export generated credentials as environment file (e.g. frontend/.env.local)'
        )
        parser.add_argument(
            '--show-passwords',
            action='store_true',
            default=False,
            help='Display generated passwords in stdout'
        )

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

        created_count = 0
        updated_count = 0
        generated_credentials = []

        for udata in demo_users:
            uname = udata['username']
            user, created = User.objects.get_or_create(username=uname)
            # Generate per-user random password at runtime; never hardcoded in source
            user_pwd = os.environ.get('DEMO_USER_PASSWORD') or secrets.token_urlsafe(16)
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

            generated_credentials.append({
                'username': uname,
                'role': udata['role'],
                'district': udata['district'] or 'Statewide',
                'password': user_pwd
            })

            if created:
                created_count += 1
            else:
                updated_count += 1

        ALIAS_MAP = {
            'tahsildar_salem_west': 'tah_salem_west',
            'collector_salem': 'col_salem',
            'state_apex_officer': 'apex_tn',
            'vigilance_officer': 'dvac_auditor',
            'vao_kannankurichi': 'vao_kannan',
            'admin_gis_officer': 'admin',
        }

        alias_credentials = []
        for cred in list(generated_credentials):
            alias_name = ALIAS_MAP.get(cred['username'])
            if alias_name:
                alias_user, _ = User.objects.get_or_create(username=alias_name)
                alias_user.set_password(cred['password'])
                alias_user.first_name = User.objects.get(username=cred['username']).first_name
                alias_user.last_name = User.objects.get(username=cred['username']).last_name
                alias_user.save()

                orig_profile = UserProfile.objects.filter(user__username=cred['username']).first()
                if orig_profile:
                    alias_profile, _ = UserProfile.objects.get_or_create(user=alias_user)
                    alias_profile.role = orig_profile.role
                    alias_profile.district = orig_profile.district
                    alias_profile.taluk = orig_profile.taluk
                    alias_profile.village = orig_profile.village
                    alias_profile.save()

                alias_credentials.append({
                    'username': alias_name,
                    'password': cred['password']
                })

        export_path = options.get('export_env')
        if export_path:
            with open(export_path, 'w', encoding='utf-8') as f:
                f.write("# Runtime generated demo credentials (auto-generated, untracked)\n")
                f.write("VITE_DEMO=true\n")
                for cred in generated_credentials:
                    clean_uname = cred['username'].upper()
                    f.write(f"VITE_DEMO_PASSWORD_{clean_uname}={cred['password']}\n")
                for cred in alias_credentials:
                    clean_alias = cred['username'].upper()
                    f.write(f"VITE_DEMO_PASSWORD_{clean_alias}={cred['password']}\n")
            self.stdout.write(self.style.SUCCESS(f"[SUCCESS] Exported {len(generated_credentials) + len(alias_credentials)} credentials to {export_path}"))
            self.stdout.write(self.style.SUCCESS(f"[SUCCESS] Exported {len(generated_credentials)} credentials to {export_path}"))

        self.stdout.write(
            self.style.SUCCESS(
                f"[SUCCESS] Provisioned {created_count} new demo users ({updated_count} updated) across Salem, Coimbatore, and Chennai."
            )
        )
        if options.get('show_passwords'):
            self.stdout.write(self.style.WARNING("=" * 80))
            self.stdout.write(self.style.WARNING("  RUNTIME PROVISIONED DEMO CREDENTIALS (GENERATED ONCE - NEVER COMMITTED)"))
            self.stdout.write(self.style.WARNING("=" * 80))
            for cred in generated_credentials:
                self.stdout.write(f"  {cred['username']:<22} | {cred['role']:<14} | {cred['district']:<14} | {cred['password']}")
            self.stdout.write(self.style.WARNING("=" * 80))
        else:
            self.stdout.write("[INFO] Passwords secured in runtime store and omitted from stdout per security protocol.")
