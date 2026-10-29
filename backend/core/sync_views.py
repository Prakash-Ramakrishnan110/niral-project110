from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.services.change_feed import ChangeFeedService
from core.services.jurisdiction_scope import JurisdictionScopeService


class SyncChangesView(APIView):
    """
    Commit-safe cursor-based change feed endpoint implementing Section 8 of Master Prompt.
    GET /api/sync/changes/?since_cursor=...&limit=50
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        since_cursor = request.query_params.get('since_cursor')
        limit = request.query_params.get('limit', 50)
        try:
            limit = int(limit)
        except (ValueError, TypeError):
            limit = 50

        # Scoping: derive user jurisdiction from OfficerAssignment / profile
        scope = JurisdictionScopeService.get_user_scope(user)
        district = scope.get('district')
        taluk = scope.get('taluk')
        village = scope.get('village')

        result = ChangeFeedService.get_changes(
            since_cursor=since_cursor,
            limit=limit,
            district=district,
            taluk=taluk,
            village=village,
        )

        return Response(result)
