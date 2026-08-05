import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import FieldVerification

verifications = FieldVerification.objects.all()
print(f"Total verifications: {verifications.count()}")
for v in verifications:
    photos_count = len(v.photos) if v.photos else 0
    print(f"ID: {v.id}, Alert: {v.alert.id}, Photos: {photos_count}")
    if photos_count > 0:
        print(f"  First photo sample: {v.photos[0][:50]}...")
