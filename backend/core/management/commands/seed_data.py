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
        
        parcels_data = [
            {"survey": "412/1A", "class": "Government", "village": "Salem West", "offset": [0.001, 0.001]},
            {"survey": "88/4", "class": "Waterbody", "village": "Mettur Node", "offset": [0.045, -0.035]},
            {"survey": "12/9B", "class": "Temple", "village": "Omalur Hub", "offset": [0.055, 0.015]},
            {"survey": "225/C", "class": "Government", "village": "Attur Gateway", "offset": [-0.025, 0.085]},
            {"survey": "19/3", "class": "Waterbody", "village": "Salem South", "offset": [-0.015, -0.012]},
            {"survey": "502/Z", "class": "Forest", "village": "Yercaud Hills", "offset": [0.085, 0.065]},
            {"survey": "77/1", "class": "Government", "village": "Edappadi Center", "offset": [0.015, -0.075]},
        ]

        for p in parcels_data:
            lat, lon = base_lat + p['offset'][0], base_lon + p['offset'][1]
            
            # Create a small square polygon for the parcel
            poly = Polygon.from_bbox((lon, lat, lon + 0.002, lat + 0.002))
            
            parcel = LandParcel.objects.create(
                survey_number=p['survey'],
                owner_name="TN Revenue Dept" if p['class'] == 'Government' else "Public Trust",
                classification=p['class'],
                village_code=p['village'],
                geom=poly
            )
            
            # Initial alerts for variety
            if p['class'] in ['Government', 'Waterbody', 'Forest']:
                EncroachmentAlert.objects.create(
                    parcel=parcel,
                    confidence_score=round(random.uniform(0.85, 0.98), 2),
                    alert_type=f"{p['class']} Alert",
                    status="Resolved" if random.random() > 0.8 else "Pending",
                    resolution_notes="Pre-verified field inspection: All clear." if random.random() > 0.8 else "",
                    alert_geom=Point(lon + 0.001, lat + 0.001)
                )

        self.stdout.write(self.style.SUCCESS('Successfully seeded distributed SALEM District land records'))
