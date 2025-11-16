from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import timedelta, datetime
from .models import AnalyticsEvent, AnalyticsMetric, AnalyticsReport
from .serializers import (
    AnalyticsEventSerializer, AnalyticsMetricSerializer, AnalyticsReportSerializer
)
from .analytics_service import AnalyticsService
import logging

logger = logging.getLogger(__name__)


class AnalyticsEventViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Analytics Event (read-only for tracking)"""
    queryset = AnalyticsEvent.objects.select_related('user')
    serializer_class = AnalyticsEventSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['event_type', 'related_object_type', 'related_object_id']
    
    def get_queryset(self):
        """Filter events based on user role"""
        user = self.request.user
        
        # Staff can see all events
        if user.is_staff:
            return super().get_queryset()
        
        # Regular users can only see their own events
        return super().get_queryset().filter(user=user)
    
    def create(self, request, *args, **kwargs):
        """Create analytics event (public endpoint for tracking)"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Track event
        event = AnalyticsService.track_event(
            event_type=serializer.validated_data.get('event_type'),
            user=request.user if request.user.is_authenticated else None,
            related_object_type=serializer.validated_data.get('related_object_type'),
            related_object_id=serializer.validated_data.get('related_object_id'),
            metadata=serializer.validated_data.get('metadata', {}),
            properties=serializer.validated_data.get('properties', {}),
            session_id=request.META.get('HTTP_X_SESSION_ID'),
            ip_address=self._get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT'),
        )
        
        if event:
            return Response(AnalyticsEventSerializer(event).data, status=status.HTTP_201_CREATED)
        return Response({'error': 'Failed to track event'}, status=status.HTTP_400_BAD_REQUEST)
    
    def _get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class AnalyticsMetricViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Analytics Metrics (read-only)"""
    queryset = AnalyticsMetric.objects.all()
    serializer_class = AnalyticsMetricSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['metric_type', 'date']
    
    @action(detail=False, methods=['post'])
    def calculate_daily(self, request):
        """Calculate daily metrics for a specific date (staff only)"""
        if not request.user.is_staff:
            raise PermissionDenied("Only staff members can calculate metrics")
        
        date_str = request.data.get('date')
        if date_str:
            try:
                date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'error': 'Invalid date format. Use YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            date = timezone.now().date()
        
        metric = AnalyticsService.calculate_daily_metrics(date)
        serializer = self.get_serializer(metric)
        return Response(serializer.data)


class AnalyticsReportViewSet(viewsets.ModelViewSet):
    """ViewSet for Analytics Reports"""
    queryset = AnalyticsReport.objects.all()
    serializer_class = AnalyticsReportSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['report_type', 'is_archived']
    
    def get_queryset(self):
        """Filter reports based on user role"""
        user = self.request.user
        
        # Staff can see all reports
        if user.is_staff:
            return super().get_queryset()
        
        # Regular users can only see their own reports
        return super().get_queryset().filter(generated_by=user)
    
    def perform_create(self, serializer):
        """Set generated_by to current user"""
        serializer.save(generated_by=self.request.user)


class AnalyticsDashboardViewSet(viewsets.ViewSet):
    """ViewSet for Analytics Dashboard"""
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get dashboard statistics"""
        date_from_str = request.query_params.get('date_from')
        date_to_str = request.query_params.get('date_to')
        
        date_from = None
        date_to = None
        
        if date_from_str:
            try:
                date_from = datetime.strptime(date_from_str, '%Y-%m-%d').date()
            except ValueError:
                pass
        
        if date_to_str:
            try:
                date_to = datetime.strptime(date_to_str, '%Y-%m-%d').date()
            except ValueError:
                pass
        
        stats = AnalyticsService.get_dashboard_stats(
            user=request.user,
            date_from=date_from,
            date_to=date_to
        )
        
        return Response(stats)
    
    @action(detail=False, methods=['get'])
    def revenue_chart(self, request):
        """Get revenue chart data"""
        days = int(request.query_params.get('days', 30))
        data = AnalyticsService.get_revenue_chart_data(user=request.user, days=days)
        return Response(data)
    
    @action(detail=False, methods=['get'])
    def booking_chart(self, request):
        """Get booking chart data"""
        days = int(request.query_params.get('days', 30))
        data = AnalyticsService.get_booking_chart_data(user=request.user, days=days)
        return Response(data)
