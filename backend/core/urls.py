from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LandParcelViewSet, EncroachmentAlertViewSet, 
    FieldVerificationViewSet, RegistryProposalViewSet, DistrictLegalConfigViewSet,
    TNGISProxyView, SmartAlertView, HighCourtATRView
)
from .auth_views import (
    LoginView, CustomTokenRefreshView, LogoutView, CurrentUserView
)

router = DefaultRouter()
router.register(r'parcels', LandParcelViewSet)
router.register(r'alerts', EncroachmentAlertViewSet)
router.register(r'verifications', FieldVerificationViewSet)
router.register(r'registry-proposals', RegistryProposalViewSet)
router.register(r'config/legal', DistrictLegalConfigViewSet, basename='district-legal-config')


urlpatterns = [
    # Officer Authentication Endpoints
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/token/refresh/', CustomTokenRefreshView.as_view(), name='auth-refresh'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('auth/me/', CurrentUserView.as_view(), name='auth-me'),

    # Restful Resources & Domain Workflows
    path('', include(router.urls)),
    path('tngis/<str:action>/', TNGISProxyView.as_view(), name='tngis-proxy'),
    path('smart-alert/', SmartAlertView.as_view(), name='smart-alert'),
    path('compliance/high-court-atr/', HighCourtATRView.as_view(), name='high-court-atr'),
]
