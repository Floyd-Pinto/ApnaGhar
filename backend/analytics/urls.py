from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AnalyticsEventViewSet, AnalyticsMetricViewSet,
    AnalyticsReportViewSet, AnalyticsDashboardViewSet
)

router = DefaultRouter()
router.register(r'events', AnalyticsEventViewSet, basename='analytics-event')
router.register(r'metrics', AnalyticsMetricViewSet, basename='analytics-metric')
router.register(r'reports', AnalyticsReportViewSet, basename='analytics-report')
router.register(r'dashboard', AnalyticsDashboardViewSet, basename='analytics-dashboard')

urlpatterns = [
    path('', include(router.urls)),
]

