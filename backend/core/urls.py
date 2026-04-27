from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LandParcelViewSet, EncroachmentAlertViewSet, FieldVerificationViewSet, TNGISProxyView, SmartAlertView

router = DefaultRouter()
router.register(r'parcels', LandParcelViewSet)
router.register(r'alerts', EncroachmentAlertViewSet)
router.register(r'verifications', FieldVerificationViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('tngis/<str:action>/', TNGISProxyView.as_view(), name='tngis-proxy'),
    path('smart-alert/', SmartAlertView.as_view(), name='smart-alert'),
]
