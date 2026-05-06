from django.core.management.base import BaseCommand
from core.models import LandParcel, EncroachmentAlert
from django.contrib.gis.geos import Polygon, Point
import random

class Command(BaseCommand):
    help = 'Seed the database with sample Salem land records'

    def handle(self, *args, **kwargs):
        # Clear existing data to prevent duplicates
        LandParcel.objects.all().delete()
        EncroachmentAlert.objects.all().delete()

        # Salem Center Coordinates
        base_lat, base_lon = 11.6643, 78.1460
        
        taluks = [
            {"name": "Salem West", "villages": ["Kandhampatty", "Suramangalam", "Jagir Ammapalayam"]},
            {"name": "Salem South", "villages": ["Dadagapatty", "Annathanapatty", "Linemedu"]},
            {"name": "Mettur", "villages": ["Mettur Dam", "Kolathur", "Mecheri"]},
            {"name": "Omalur", "villages": ["Omalur North", "Omalur South", "Tharamangalam"]},
            {"name": "Attur", "villages": ["Attur Town", "Narasingapuram", "Thalaivasal"]},
            {"name": "Edappadi", "villages": ["Edappadi Town", "Poolampatti", "Konganapuram"]},
            {"name": "Yercaud", "villages": ["Yercaud Town", "Kiliyur", "Nagallur"]},
            {"name": "Sankagiri", "villages": ["Sankagiri Town", "Thevur", "Macdonalds Choultry"]},
        ]

        classifications = ["Government", "Waterbody", "Forest", "Temple", "Roadside"]

        for t in taluks:
            for v in t['villages']:
                # Create 3-5 parcels per village
                num_parcels = random.randint(3, 5)
                for i in range(num_parcels):
                    lat_off = random.uniform(-0.05, 0.05)
                    lon_off = random.uniform(-0.05, 0.05)
                    lat, lon = base_lat + lat_off, base_lon + lon_off
                    
                    cls = random.choice(classifications)
                    survey = f"{random.randint(10, 500)}/{random.choice(['1A', '2', 'B', '4C', '9'])}"
                    
                    poly = Polygon.from_bbox((lon, lat, lon + 0.002, lat + 0.002))
                    
                    parcel = LandParcel.objects.create(
                        survey_number=survey,
                        owner_name="TN Revenue Dept" if cls != 'Temple' else "Public Trust",
                        classification=cls,
                        village_code=v,
                        taluk=t['name'],
                        district="Salem",
                        geom=poly
                    )
                    
                    # Update the record with taluk and district if those fields exist or in the future
                    # For now, we use village_code as the primary filter key in our current implementation
                    
                    # Random Alerts
                    if random.random() > 0.6:
                        s = random.choice(["Resolved", "COLLECTOR_ACCEPTED", "TAHSILDAR_ACCEPTED", "NEW", "PENDING"])
                        EncroachmentAlert.objects.create(
                            parcel=parcel,
                            confidence_score=round(random.uniform(0.75, 0.99), 2),
                            alert_type=f"{cls} Threat Detection",
                            status=s,
                            resolution_notes="Field investigation notes logged." if s == "Resolved" else "",
                            alert_geom=Point(lon + 0.001, lat + 0.001)
                        )

        self.stdout.write(self.style.SUCCESS('Successfully seeded 100+ distributed SALEM District land records across all Taluks and Villages.'))
