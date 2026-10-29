import sys
from django.core.management.base import BaseCommand
from core.models import LandParcel, UserProfile, District, Taluk, RevenueVillage, Firka, RevenueDivision


class Command(BaseCommand):
    help = "Generate a real dry-run mapping report of LandParcels and UserProfiles to the canonical jurisdiction hierarchy"

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("=== GEOMMAND JURISDICTION MAPPING DRY-RUN REPORT ==="))
        self.stdout.write("Checking exact database resolution against canonical hierarchy models...\n")

        # -------------------------------------------------------------
        # 1. LAND PARCELS MAPPING AUDIT
        # -------------------------------------------------------------
        total_parcels = LandParcel.objects.count()
        parcel_success = 0
        parcel_failures = []
        parcel_rows = []

        for p in LandParcel.objects.all().order_by('district', 'taluk', 'village_name', 'survey_number'):
            # Match District
            dist_obj = District.objects.filter(name_en__iexact=p.district.strip()).first()
            # Match Taluk
            taluk_obj = None
            if dist_obj:
                taluk_obj = Taluk.objects.filter(district=dist_obj, name_en__iexact=p.taluk.strip()).first()
            # Match Village
            vil_obj = None
            if taluk_obj and p.village_name:
                vil_obj = RevenueVillage.objects.filter(taluk=taluk_obj, name_en__iexact=p.village_name.strip()).first()

            status = "RESOLVED" if (dist_obj and taluk_obj and vil_obj) else "UNRESOLVED"
            if status == "RESOLVED":
                parcel_success += 1
            else:
                parcel_failures.append({
                    'id': str(p.id)[:8],
                    'survey': p.survey_number,
                    'district': p.district,
                    'dist_match': dist_obj.name_en if dist_obj else "NONE",
                    'taluk': p.taluk,
                    'taluk_match': taluk_obj.name_en if taluk_obj else "NONE",
                    'village': p.village_name,
                    'vil_match': vil_obj.name_en if vil_obj else "NONE",
                })

            parcel_rows.append({
                'id': str(p.id)[:8],
                'survey': p.survey_number,
                'subdivision': p.subdivision or "-",
                'district': p.district,
                'taluk': p.taluk,
                'village': p.village_name,
                'resolved_dist': dist_obj.code if dist_obj else "FAIL",
                'resolved_taluk': taluk_obj.code if taluk_obj else "FAIL",
                'resolved_village': vil_obj.code if vil_obj else "FAIL",
                'status': status
            })

        # -------------------------------------------------------------
        # 2. USER PROFILES MAPPING AUDIT
        # -------------------------------------------------------------
        total_users = UserProfile.objects.count()
        user_success = 0
        user_failures = []
        user_rows = []

        for u in UserProfile.objects.select_related('user').all().order_by('role', 'user__username'):
            dist_obj = None
            taluk_obj = None
            vil_obj = None

            if u.district:
                dist_obj = District.objects.filter(name_en__iexact=u.district.strip()).first()
            if dist_obj and u.taluk:
                taluk_obj = Taluk.objects.filter(district=dist_obj, name_en__iexact=u.taluk.strip()).first()
            if taluk_obj and u.village:
                vil_obj = RevenueVillage.objects.filter(taluk=taluk_obj, name_en__iexact=u.village.strip()).first()

            # Statewide roles require district/taluk/village to be None
            is_statewide = u.role in ('STATE_APEX', 'CLA_STATE', 'ADMIN_GIS', 'VIGILANCE')
            if is_statewide:
                status = "RESOLVED (STATEWIDE)" if (u.district is None and u.taluk is None and u.village is None) else "CHECK"
            else:
                dist_ok = (dist_obj is not None) if u.district else True
                taluk_ok = (taluk_obj is not None) if u.taluk else True
                vil_ok = (vil_obj is not None) if u.village else True
                status = "RESOLVED" if (dist_ok and taluk_ok and vil_ok) else "UNRESOLVED"

            if "RESOLVED" in status:
                user_success += 1
            else:
                user_failures.append({
                    'username': u.user.username,
                    'role': u.role,
                    'district': u.district,
                    'taluk': u.taluk,
                    'village': u.village,
                })

            user_rows.append({
                'username': u.user.username,
                'role': u.role,
                'district': u.district or "[STATEWIDE]",
                'taluk': u.taluk or "-",
                'village': u.village or "-",
                'resolved_dist': dist_obj.code if dist_obj else ("[STATEWIDE]" if is_statewide else "FAIL"),
                'resolved_taluk': taluk_obj.code if taluk_obj else "-",
                'resolved_vil': vil_obj.code if vil_obj else "-",
                'status': status
            })

        # -------------------------------------------------------------
        # PRINT STATISTICAL SUMMARY & TABLE
        # -------------------------------------------------------------
        self.stdout.write("--- 1. LAND PARCEL RESOLUTION TABLE (ALL 39 PARCELS) ---")
        self.stdout.write(f"{'Survey':<10} | {'District':<10} | {'Taluk':<14} | {'Village':<24} | {'Target Codes (Dist/Tal/Vil)':<28} | {'Status'}")
        self.stdout.write("-" * 105)
        for r in parcel_rows:
            target = f"{r['resolved_dist']} / {r['resolved_taluk']} / {r['resolved_village']}"
            self.stdout.write(f"{r['survey']:<10} | {r['district']:<10} | {r['taluk']:<14} | {r['village']:<24} | {target:<28} | {r['status']}")

        self.stdout.write("\n--- 2. USER PROFILE RESOLUTION TABLE (ALL 19 USERS) ---")
        self.stdout.write(f"{'Username':<26} | {'Role':<12} | {'District':<12} | {'Taluk':<18} | {'Village':<16} | {'Status'}")
        self.stdout.write("-" * 105)
        for r in user_rows:
            self.stdout.write(f"{r['username']:<26} | {r['role']:<12} | {r['district']:<12} | {r['taluk']:<18} | {r['village']:<16} | {r['status']}")

        self.stdout.write("\n=== DRY-RUN VERIFICATION SUMMARY ===")
        self.stdout.write(f"LandParcels:   {parcel_success} / {total_parcels} successfully mapped ({parcel_success/total_parcels*100:.1f}%)")
        self.stdout.write(f"UserProfiles:  {user_success} / {total_users} successfully mapped ({user_success/total_users*100:.1f}%)")
        self.stdout.write(f"Parcels Unresolved: {len(parcel_failures)}")
        self.stdout.write(f"Users Unresolved:   {len(user_failures)}")

        if parcel_failures or user_failures:
            self.stderr.write(self.style.ERROR("\n[BLOCKER] Dry-run found unresolved rows. Data migration cannot proceed."))
            sys.exit(1)
        else:
            self.stdout.write(self.style.SUCCESS("\n[SUCCESS] 100% of database records match canonical hierarchy! Ready for migration approval."))
