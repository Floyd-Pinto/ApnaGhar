from rest_framework import serializers
from .models import AnalyticsEvent, AnalyticsMetric, AnalyticsReport


class AnalyticsEventSerializer(serializers.ModelSerializer):
    """Serializer for AnalyticsEvent model"""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = AnalyticsEvent
        fields = [
            'id', 'event_type', 'user', 'user_email', 'session_id',
            'ip_address', 'user_agent', 'related_object_type', 'related_object_id',
            'metadata', 'properties', 'country', 'region', 'city', 'created_at'
        ]
        read_only_fields = ['id', 'user_email', 'created_at']


class AnalyticsMetricSerializer(serializers.ModelSerializer):
    """Serializer for AnalyticsMetric model"""
    
    class Meta:
        model = AnalyticsMetric
        fields = [
            'id', 'metric_type', 'date', 'total_users', 'new_users', 'active_users',
            'total_projects', 'new_projects', 'project_views',
            'total_properties', 'available_properties', 'booked_properties', 'sold_properties', 'property_views',
            'total_bookings', 'new_bookings', 'confirmed_bookings', 'cancelled_bookings', 'completed_bookings',
            'total_revenue', 'booking_revenue', 'token_revenue', 'pending_revenue',
            'total_payments', 'completed_payments', 'failed_payments', 'payment_amount',
            'booking_conversion_rate', 'payment_conversion_rate',
            'page_views', 'unique_visitors', 'avg_session_duration',
            'metadata', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AnalyticsReportSerializer(serializers.ModelSerializer):
    """Serializer for AnalyticsReport model"""
    generated_by_email = serializers.EmailField(source='generated_by.email', read_only=True)
    
    class Meta:
        model = AnalyticsReport
        fields = [
            'id', 'report_type', 'name', 'description', 'date_from', 'date_to',
            'filters', 'generated_by', 'generated_by_email', 'data',
            'is_archived', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'generated_by_email', 'created_at', 'updated_at']

