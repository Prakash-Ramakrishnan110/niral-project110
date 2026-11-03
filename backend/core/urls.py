from .evidence_views import (
    EvidenceUploadUrlView, EvidenceDirectUploadView, EvidenceViewUrlView
)
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LandParcelViewSet, EncroachmentAlertViewSet, 
    FieldVerificationViewSet, RegistryProposalViewSet, DistrictLegalConfigViewSet,
    WatchZoneViewSet,
    TNGISProxyView, SmartAlertView, HighCourtATRView, PublicNoticeVerifyView
)
from .auth_views import (
    LoginView, CustomTokenRefreshView, LogoutView, CurrentUserView
)
from .sync_views import SyncChangesView
from .dashboard_views import DashboardSummaryView
from .case_views import CaseViewSet

router = DefaultRouter()
router.register(r'cases', CaseViewSet, basename='cases')
router.register(r'parcels', LandParcelViewSet)
router.register(r'alerts', EncroachmentAlertViewSet)
router.register(r'verifications', FieldVerificationViewSet)
router.register(r'registry-proposals', RegistryProposalViewSet)
router.register(r'config/legal', DistrictLegalConfigViewSet, basename='district-legal-config')
router.register(r'watch-zones', WatchZoneViewSet, basename='watch-zones')


urlpatterns = [
    # Officer Authentication Endpoints
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/token/refresh/', CustomTokenRefreshView.as_view(), name='auth-refresh'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('auth/me/', CurrentUserView.as_view(), name='auth-me'),

    # Operational & Executive Dashboard
    path('dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),

    # Restful Resources & Domain Workflows
    path('', include(router.urls)),
    path('sync/changes/', SyncChangesView.as_view(), name='sync-changes'),
    path('tngis/<str:action>/', TNGISProxyView.as_view(), name='tngis-proxy'),
    path('smart-alert/', SmartAlertView.as_view(), name='smart-alert'),
    path('compliance/high-court-atr/', HighCourtATRView.as_view(), name='high-court-atr'),

    # Public Statutory Document Verification Endpoints (TD-04)
    path('notices/verify/<str:doc_hash>/', PublicNoticeVerifyView.as_view(), name='public-notice-verify'),
    path('v1/verify/<str:doc_hash>/', PublicNoticeVerifyView.as_view(), name='public-notice-verify-v1'),

    # Evidence Object Storage & Presigned URLs (M1-02)
    path('evidence/upload-url/', EvidenceUploadUrlView.as_view(), name='evidence-upload-url'),
    path('evidence/upload/<str:signed_token>/', EvidenceDirectUploadView.as_view(), name='evidence-direct-upload'),
    path('evidence/view/<str:signed_token>/', EvidenceViewUrlView.as_view(), name='evidence-view-file'),
]