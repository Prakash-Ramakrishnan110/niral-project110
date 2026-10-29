from django.core.management.base import BaseCommand
from core.models import LandParcel, EncroachmentAlert
from django.contrib.gis.geos import Polygon, Point
import random
import os

class Command(BaseCommand):
    help = 'Seed the database with demo cadastral & encroachment records (requires GEOMMAND_ENV=demo)'

    def handle(self, *args, **kwargs):
        if os.environ.get('GEOMMAND_ENV') != 'demo':
            self.stdout.write(
                self.style.ERROR(
                    "[BLOCKED] seed_data refuses to run without GEOMMAND_ENV=demo to protect live/prototype database records."
                )
            )
            return

        LandParcel.objects.all().delete()
        EncroachmentAlert.objects.all().delete()

        # ── 1. PRIMARY SALEM DEMO PARCELS ───────────────────────────────────────────
        
        # Scenario 1: Mookaneri Lake Poramboke (Kannankurichi, Salem West) - WATERBODY ENCROACHMENT
        mookaneri_poly = Polygon((
            (78.1710, 11.6970),
            (78.1740, 11.6970),
            (78.1745, 11.6995),
            (78.1715, 11.6998),
            (78.1710, 11.6970)
        ))
        p1 = LandParcel.objects.create(
            survey_number="142",
            subdivision="1A",
            patta_number="Govt Poramboke / நஞ்சை நீர்நிலை",
            owner_name="நீர்வளத்துறை (TN Water Resources Dept - PWD)",
            classification="Waterbody",
            village_code="Kannankurichi",
            village_name="Kannankurichi",
            village_ta="கன்னங்குறிச்சி",
            taluk="Salem West",
            taluk_ta="சேலம் மேற்கு",
            district="Salem",
            district_ta="சேலம்",
            village_lgd_code="608142",
            ulpin="608W14201A9876",
            area_extent="12.40 Acres",
            occupied_extent="2,400 sq.ft (5.5 Cents)",
            is_occupied=True,
            g_value="₹2,100 / sq.ft",
            adjacent_neighbors=[
                {
                    "survey_number": "141/2",
                    "subdivision": "2",
                    "patta_number": "340",
                    "owner_name": "A. Selvam (ஏ. செல்வம்)",
                    "direction": "Northern Bund",
                    "land_type": "நஞ்சை (Wetland)",
                    "extent": "1.20 Acres",
                    "encroachment_status": "Suspected Encroacher - Concrete compound wall extended 18m into waterbody basin"
                },
                {
                    "survey_number": "143/1",
                    "subdivision": "1",
                    "patta_number": "512",
                    "owner_name": "M. Palanisamy (எம். பழனிசாமி)",
                    "direction": "Eastern Bund",
                    "land_type": "புஞ்சை (Dryland)",
                    "extent": "0.85 Acres",
                    "encroachment_status": "Boundary Clear - Verified by VAO"
                }
            ],
            fmb_data={
                "f_lines": [
                    {"from": "A", "to": "B", "dist": "142.5m"},
                    {"from": "B", "to": "C", "dist": "88.2m"},
                    {"from": "C", "to": "D", "dist": "135.0m"},
                    {"from": "D", "to": "A", "dist": "94.6m"}
                ],
                "g_lines": [{"from": "A", "to": "C", "dist": "166.4m"}],
                "ladder_offsets": [
                    {"chainage": "35m", "offset": "18.2m", "side": "Left (Lake Basin)"},
                    {"chainage": "72m", "offset": "12.0m", "side": "Left"}
                ],
                "encroached_zone": {
                    "label": "Encroached Lake Basin Area",
                    "area": "2,400 sq.ft",
                    "intruder_patta": "340 (A. Selvam)",
                    "breach_type": "Illegal Masonry Wall"
                }
            },
            geom=mookaneri_poly
        )
        EncroachmentAlert.objects.create(
            parcel=p1,
            confidence_score=0.96,
            alert_type="Waterbody Basin Encroachment",
            status="NEW",
            resolution_notes="Satellite change detection flagged new concrete wall inside Mookaneri lake cadastral polygon.",
            alert_geom=Point(78.1725, 11.6983)
        )

        # Scenario 2: Suramangalam Commercial Poramboke (Salem West)
        suramangalam_poly = Polygon((
            (78.1200, 11.6730),
            (78.1230, 11.6730),
            (78.1230, 11.6755),
            (78.1200, 11.6755),
            (78.1200, 11.6730)
        ))
        p2 = LandParcel.objects.create(
            survey_number="88",
            subdivision="2A",
            patta_number="அரசு புறம்போக்கு / நத்தம்",
            owner_name="வருவாய்த்துறை (TN Revenue Dept)",
            classification="Government",
            village_code="Suramangalam",
            village_name="Suramangalam",
            village_ta="சூரமங்கலம்",
            taluk="Salem West",
            taluk_ta="சேலம் மேற்கு",
            district="Salem",
            district_ta="சேலம்",
            village_lgd_code="608120",
            ulpin="608W08802A5412",
            area_extent="1.75 Acres",
            occupied_extent="1,150 sq.ft",
            is_occupied=True,
            g_value="₹3,850 / sq.ft (Prime Commercial)",
            adjacent_neighbors=[
                {
                    "survey_number": "87/1",
                    "subdivision": "1",
                    "patta_number": "215",
                    "owner_name": "K. Venkatesh (கே. வெங்கடேஷ்)",
                    "direction": "West Roadside",
                    "land_type": "நத்தம் மனை",
                    "extent": "0.35 Acres",
                    "encroachment_status": "Suspected Encroacher - Unauthorized commercial tin shed extended 11m"
                }
            ],
            fmb_data={
                "f_lines": [
                    {"from": "A", "to": "B", "dist": "75.0m"},
                    {"from": "B", "to": "C", "dist": "48.0m"},
                    {"from": "C", "to": "D", "dist": "72.0m"},
                    {"from": "D", "to": "A", "dist": "50.0m"}
                ],
                "g_lines": [{"from": "A", "to": "C", "dist": "89.0m"}],
                "encroached_zone": {
                    "label": "Commercial Tin Shed Overlap",
                    "area": "1,150 sq.ft",
                    "intruder_patta": "215 (K. Venkatesh)"
                }
            },
            geom=suramangalam_poly
        )
        EncroachmentAlert.objects.create(
            parcel=p2,
            confidence_score=0.91,
            alert_type="Commercial Structure on Govt Poramboke",
            status="VAO_ASSIGNED",
            resolution_notes="Inspection assigned to VAO Suramangalam.",
            alert_geom=Point(78.1215, 11.6742)
        )

        # Scenario 3: Mettur Dam Cauvery Riverbank Reserve (Mettur Taluk) - SAFE
        mettur_poly = Polygon((
            (77.7960, 11.7945),
            (77.8000, 11.7945),
            (77.8000, 11.7975),
            (77.7960, 11.7975),
            (77.7960, 11.7945)
        ))
        LandParcel.objects.create(
            survey_number="63",
            subdivision="1",
            patta_number="அரசு நதிப்படுகை புறம்போக்கு",
            owner_name="வனத்துறை & நீர்வளத்துறை (Forest & WRD)",
            classification="Forest",
            village_code="Mettur Dam",
            village_name="Mettur Dam",
            village_ta="மேட்டூர் அணை",
            taluk="Mettur",
            taluk_ta="மேட்டூர்",
            district="Salem",
            district_ta="சேலம்",
            village_lgd_code="608201",
            ulpin="608M0630107721",
            area_extent="45.0 Acres",
            occupied_extent="0 sq.ft",
            is_occupied=False,
            g_value="₹850 / sq.ft",
            adjacent_neighbors=[],
            fmb_data={
                "f_lines": [{"from": "A", "to": "B", "dist": "250m"}, {"from": "B", "to": "C", "dist": "180m"}],
                "encroached_zone": None
            },
            geom=mettur_poly
        )

        # Scenario 4: Omalur Highway Roadside Poramboke (Omalur Taluk)
        omalur_poly = Polygon((
            (78.0395, 11.7435),
            (78.0425, 11.7435),
            (78.0425, 11.7465),
            (78.0395, 11.7465),
            (78.0395, 11.7435)
        ))
        p4 = LandParcel.objects.create(
            survey_number="119",
            subdivision="4",
            patta_number="நெடுஞ்சாலை புறம்போக்கு",
            owner_name="நெடுஞ்சாலைத்துறை (Highways Dept)",
            classification="Roadside",
            village_code="Omalur North",
            village_name="Omalur North",
            village_ta="ஓமலூர் வடக்கு",
            taluk="Omalur",
            taluk_ta="ஓமலூர்",
            district="Salem",
            district_ta="சேலம்",
            village_lgd_code="608305",
            ulpin="608O1190403319",
            area_extent="0.80 Acres",
            occupied_extent="850 sq.ft",
            is_occupied=True,
            g_value="₹1,650 / sq.ft",
            adjacent_neighbors=[
                {
                    "survey_number": "119/3",
                    "subdivision": "3",
                    "patta_number": "488",
                    "owner_name": "R. Chinnasamy (ஆர். சின்னசாமி)",
                    "direction": "Highway Frontage",
                    "land_type": "புஞ்சை",
                    "extent": "0.50 Acres",
                    "encroachment_status": "Suspected Encroacher - Vehicle workshop shed erected on highway margin"
                }
            ],
            fmb_data={
                "f_lines": [{"from": "A", "to": "B", "dist": "62.0m"}, {"from": "B", "to": "C", "dist": "34.0m"}],
                "encroached_zone": {
                    "label": "Workshop Shed on Highway Margin",
                    "area": "850 sq.ft",
                    "intruder_patta": "488 (R. Chinnasamy)"
                }
            },
            geom=omalur_poly
        )
        EncroachmentAlert.objects.create(
            parcel=p4,
            confidence_score=0.88,
            alert_type="Roadside Margin Occupation",
            status="COLLECTOR_ACCEPTED",
            resolution_notes="Notice under Highway Act proposed.",
            alert_geom=Point(78.0410, 11.7450)
        )

        # Scenario 5: Kondalampatti Bypass (Salem South) - HEAVY VEHICLE SCRAP & MECHANIC ENCHROACHMENT
        kondalampatti_poly = Polygon((
            (78.1305, 11.6195),
            (78.1335, 11.6195),
            (78.1335, 11.6225),
            (78.1305, 11.6225),
            (78.1305, 11.6195)
        ))
        p5 = LandParcel.objects.create(
            survey_number="76",
            subdivision="2B",
            patta_number="தேசிய நெடுஞ்சாலை புறம்போக்கு (NHAI RoW)",
            owner_name="தேசிய நெடுஞ்சாலை ஆணையம் (NHAI) & மாநில நெடுஞ்சாலை",
            classification="Roadside",
            village_code="Dadagapatty",
            village_name="Kondalampatti Bypass",
            village_ta="கொண்டலாம்பட்டி பைபாஸ்",
            taluk="Salem South",
            taluk_ta="சேலம் தெற்கு",
            district="Salem",
            district_ta="சேலம்",
            village_lgd_code="608102",
            ulpin="608S07602B8814",
            area_extent="1.40 Acres",
            occupied_extent="1,650 sq.ft",
            is_occupied=True,
            g_value="₹2,450 / sq.ft",
            adjacent_neighbors=[
                {
                    "survey_number": "76/1",
                    "subdivision": "1",
                    "patta_number": "319",
                    "owner_name": "M. Velusamy (எம். வேலுசாமி)",
                    "direction": "Highway Shoulder Margin",
                    "land_type": "நத்தம் மனை",
                    "extent": "0.45 Acres",
                    "encroachment_status": "Suspected Encroacher - Truck repair shed, grease pit, and parked scrap trailers occupying 18m of paved highway shoulder"
                }
            ],
            fmb_data={
                "f_lines": [{"from": "A", "to": "B", "dist": "88.0m"}, {"from": "B", "to": "C", "dist": "42.0m"}],
                "encroached_zone": {
                    "label": "Truck Mechanic & Scrap Yard on Shoulder",
                    "area": "1,650 sq.ft",
                    "intruder_patta": "319 (M. Velusamy)"
                }
            },
            geom=kondalampatti_poly
        )
        EncroachmentAlert.objects.create(
            parcel=p5,
            confidence_score=0.94,
            alert_type="Heavy Vehicle Workshop Shoulder Breach",
            status="NEW",
            resolution_notes="Satellite change detection flagged high-density metal structures & scrap metal on highway shoulder.",
            alert_geom=Point(78.1320, 11.6210)
        )

        # Scenario 6: Attur NH-79 Corridor - RESIDENTIAL COMPOUND WALL TRESPASS
        attur_poly = Polygon((
            (78.5995, 11.5965),
            (78.6025, 11.5965),
            (78.6025, 11.5995),
            (78.5995, 11.5995),
            (78.5995, 11.5965)
        ))
        p6 = LandParcel.objects.create(
            survey_number="204",
            subdivision="1C",
            patta_number="மாநில நெடுஞ்சாலை எல்லை புறம்போக்கு (SH-79)",
            owner_name="நெடுஞ்சாலைத்துறை (State Highways C&M)",
            classification="Roadside",
            village_code="Attur Town",
            village_name="Attur NH-79 Corridor",
            village_ta="ஆத்தூர் நெடுஞ்சாலை",
            taluk="Attur",
            taluk_ta="ஆத்தூர்",
            district="Salem",
            district_ta="சேலம்",
            village_lgd_code="608401",
            ulpin="608A20401C4129",
            area_extent="0.65 Acres",
            occupied_extent="920 sq.ft",
            is_occupied=True,
            g_value="₹1,850 / sq.ft",
            adjacent_neighbors=[
                {
                    "survey_number": "203/2",
                    "subdivision": "2",
                    "patta_number": "582",
                    "owner_name": "P. Arumugam (பி. ஆறுமுகம்)",
                    "direction": "Northern Highway Boundary",
                    "land_type": "புஞ்சை மனை",
                    "extent": "0.60 Acres",
                    "encroachment_status": "Suspected Encroacher - Permanent RCC compound wall and entrance gate extended 14m into classified highway reserve"
                }
            ],
            fmb_data={
                "f_lines": [{"from": "A", "to": "B", "dist": "72.0m"}, {"from": "B", "to": "C", "dist": "28.0m"}],
                "encroached_zone": {
                    "label": "Concrete Compound Wall Trespass",
                    "area": "920 sq.ft",
                    "intruder_patta": "582 (P. Arumugam)"
                }
            },
            geom=attur_poly
        )
        EncroachmentAlert.objects.create(
            parcel=p6,
            confidence_score=0.91,
            alert_type="Permanent Boundary Wall Trespass on Road Margin",
            status="TAHSILDAR_ACCEPTED",
            resolution_notes="Notice under Tamil Nadu Highways Act 2001 Section 28 issued.",
            alert_geom=Point(78.6010, 11.5980)
        )

        # Scenario 7: Hasthampatti Roundtana (Salem City) - FOOTPATH COMMERCIAL VENDOR AWNING
        hastham_poly = Polygon((
            (78.1635, 11.6765),
            (78.1665, 11.6765),
            (78.1665, 11.6795),
            (78.1635, 11.6795),
            (78.1635, 11.6765)
        ))
        p7 = LandParcel.objects.create(
            survey_number="45",
            subdivision="3",
            patta_number="மாநகராட்சி சாலை நடைபாதை புறம்போக்கு",
            owner_name="சேலம் மாநகராட்சி (Salem City Municipal Corporation)",
            classification="Roadside",
            village_code="Suramangalam",
            village_name="Hasthampatti Roundtana",
            village_ta="ஹஸ்தம்பட்டி சந்திப்பு",
            taluk="Salem West",
            taluk_ta="சேலம் மேற்கு",
            district="Salem",
            district_ta="சேலம்",
            village_lgd_code="608115",
            ulpin="608W0450309923",
            area_extent="0.30 Acres",
            occupied_extent="480 sq.ft",
            is_occupied=True,
            g_value="₹4,200 / sq.ft (Prime City Commercial)",
            adjacent_neighbors=[
                {
                    "survey_number": "44/1",
                    "subdivision": "1",
                    "patta_number": "167",
                    "owner_name": "S. Natarajan (எஸ். நடராஜன்)",
                    "direction": "Footpath Margin",
                    "land_type": "வணிக மனை",
                    "extent": "0.15 Acres",
                    "encroachment_status": "Suspected Encroacher - Permanent steel awning, tea stall, and display counters blocking pedestrian walkway"
                }
            ],
            fmb_data={
                "f_lines": [{"from": "A", "to": "B", "dist": "35.0m"}, {"from": "B", "to": "C", "dist": "18.0m"}],
                "encroached_zone": {
                    "label": "Footpath Commercial Stalls",
                    "area": "480 sq.ft",
                    "intruder_patta": "167 (S. Natarajan)"
                }
            },
            geom=hastham_poly
        )
        EncroachmentAlert.objects.create(
            parcel=p7,
            confidence_score=0.97,
            alert_type="Footpath & Pedestrian Right-of-Way Blockade",
            status="VAO_ASSIGNED",
            resolution_notes="Corporation Town Planning and Revenue inspection scheduled.",
            alert_geom=Point(78.1650, 11.6780)
        )

        # ── 2. DISTRIBUTED SALEM PARCELS ACROSS ALL TALUKS ─────────────────────────
        taluk_configs = [
            {"name": "Salem West", "ta": "சேலம் மேற்கு", "villages": [("Kandhampatty", "கந்தம்பட்டி"), ("Jagir Ammapalayam", "ஜாகீர் அம்மாபாளையம்")], "lat": 11.664, "lon": 78.130},
            {"name": "Salem South", "ta": "சேலம் தெற்கு", "villages": [("Dadagapatty", "தாதகாபட்டி"), ("Annathanapatty", "அன்னதானபட்டி")], "lat": 11.640, "lon": 78.150},
            {"name": "Mettur", "ta": "மேட்டூர்", "villages": [("Kolathur", "கொளத்தூர்"), ("Mecheri", "மேச்சேரி")], "lat": 11.830, "lon": 77.850},
            {"name": "Omalur", "ta": "ஓமலூர்", "villages": [("Omalur South", "ஓமலூர் தெற்கு"), ("Tharamangalam", "தாரமங்கலம்")], "lat": 11.730, "lon": 78.020},
            {"name": "Attur", "ta": "ஆத்தூர்", "villages": [("Attur Town", "ஆத்தூர் நகரம்"), ("Narasingapuram", "நரசிங்கபுரம்")], "lat": 11.590, "lon": 78.600},
            {"name": "Edappadi", "ta": "எடப்பாடி", "villages": [("Edappadi Town", "எடப்பாடி நகரம்"), ("Poolampatti", "பூலாம்பட்டி")], "lat": 11.580, "lon": 77.840},
            {"name": "Yercaud", "ta": "ஏற்காடு", "villages": [("Yercaud Town", "ஏற்காடு நகரம்"), ("Kiliyur", "கிளியூர்")], "lat": 11.770, "lon": 78.200},
            {"name": "Sankagiri", "ta": "சங்ககிரி", "villages": [("Sankagiri Town", "சங்ககிரி நகரம்"), ("Thevur", "தேவூர்")], "lat": 11.480, "lon": 77.870},
        ]

        class_types = [
            ("Waterbody", "நீர்நிலை புறம்போக்கு"),
            ("Government", "அரசு தரிசு / புறம்போக்கு"),
            ("Roadside", "நெடுஞ்சாலை புறம்போக்கு"),
            ("Temple", "கோயில் நிலம்"),
            ("Forest", "காப்புக் காடு")
        ]

        for tc in taluk_configs:
            for v_en, v_ta in tc["villages"]:
                for i in range(2):
                    c_type, c_ta = random.choice(class_types)
                    lat_o = tc["lat"] + random.uniform(-0.015, 0.015)
                    lon_o = tc["lon"] + random.uniform(-0.015, 0.015)
                    s_no = random.randint(25, 380)
                    sub_div = random.choice(["1", "2A", "3B", "1C"])
                    is_occ = random.random() > 0.45
                    occ_ext = f"{random.randint(600, 2200)} sq.ft" if is_occ else "0 sq.ft"
                    
                    poly = Polygon((
                        (lon_o, lat_o),
                        (lon_o + 0.0025, lat_o),
                        (lon_o + 0.0025, lat_o + 0.0025),
                        (lon_o, lat_o + 0.0025),
                        (lon_o, lat_o)
                    ))

                    neighbors = []
                    if is_occ:
                        n_patta = random.randint(100, 750)
                        n_survey = f"{s_no - 1}/{random.choice(['1', '2'])}"
                        neighbors.append({
                            "survey_number": n_survey,
                            "subdivision": "1",
                            "patta_number": str(n_patta),
                            "owner_name": random.choice(["K. Periyasamy", "M. Rajendran", "S. Kuppusamy", "V. Arumugam"]),
                            "direction": random.choice(["North Boundary", "South Road Margin", "East Bund"]),
                            "land_type": "நஞ்சை / புஞ்சை",
                            "extent": f"{random.uniform(0.5, 2.5):.2f} Acres",
                            "encroachment_status": f"Suspected Encroacher - Overlap of {occ_ext} detected"
                        })

                    parcel = LandParcel.objects.create(
                        survey_number=str(s_no),
                        subdivision=sub_div,
                        patta_number=f"Govt Poramboke ({c_ta})",
                        owner_name=f"அரசு ({c_ta})" if c_type != "Temple" else "இந்து சமய அறநிலையத்துறை (HR&CE)",
                        classification=c_type,
                        village_code=v_en,
                        village_name=v_en,
                        village_ta=v_ta,
                        taluk=tc["name"],
                        taluk_ta=tc["ta"],
                        district="Salem",
                        district_ta="சேலம்",
                        village_lgd_code=f"608{random.randint(100, 400)}",
                        ulpin=f"608{tc['name'][:2].upper()}{s_no}{sub_div}{random.randint(1000, 9999)}",
                        area_extent=f"{random.uniform(1.2, 8.5):.2f} Acres",
                        occupied_extent=occ_ext,
                        is_occupied=is_occ,
                        g_value=f"₹{random.randint(900, 3200)} / sq.ft",
                        adjacent_neighbors=neighbors,
                        fmb_data={
                            "f_lines": [{"from": "A", "to": "B", "dist": f"{random.randint(40, 110)}m"}],
                            "encroached_zone": {"label": "Encroached Boundary", "area": occ_ext} if is_occ else None
                        },
                        geom=poly
                    )

                    if is_occ:
                        EncroachmentAlert.objects.create(
                            parcel=parcel,
                            confidence_score=round(random.uniform(0.82, 0.98), 2),
                            alert_type=f"{c_type} Occupation Threat",
                            status=random.choice(["NEW", "VAO_ASSIGNED", "COLLECTOR_ACCEPTED", "TAHSILDAR_ACCEPTED"]),
                            resolution_notes="Automated change detection alert.",
                            alert_geom=Point(lon_o + 0.0012, lat_o + 0.0012)
                        )

        self.stdout.write(self.style.SUCCESS('Successfully seeded Salem District Government Land & Encroachment Cadastral Records!'))
