from django.contrib import admin
from .models import AnalyticsEvent, AnalyticsMetric, AnalyticsReport


@admin.register(AnalyticsEvent)
class AnalyticsEventAdmin(admin.ModelAdmin):
    list_display = ['id', 'event_type', 'user', 'related_object_type', 'created_at', 'country', 'city']
    list_filter = ['event_type', 'related_object_type', 'created_at', 'country']
    search_fields = ['user__email', 'session_id', 'ip_address', 'related_object_id']
    readonly_fields = ['id', 'created_at']
    fieldsets = (
        ('Event Information', {
            'fields': ('id', 'event_type', 'user', 'session_id', 'created_at')
        }),
        ('Location', {
            'fields': ('ip_address', 'country', 'region', 'city', 'user_agent')
        }),
        ('Related Object', {
            'fields': ('related_object_type', 'related_object_id')
        }),
        ('Data', {
            'fields': ('metadata', 'properties'),
            'classes': ('collapse',)
        }),
    )


@admin.register(AnalyticsMetric)
class AnalyticsMetricAdmin(admin.ModelAdmin):
    list_display = ['id', 'metric_type', 'date', 'total_users', 'total_bookings', 'total_revenue', 'created_at']
    list_filter = ['metric_type', 'date', 'created_at']
    search_fields = ['date']
    readonly_fields = ['id', 'created_at', 'updated_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'metric_type', 'date')
        }),
        ('User Metrics', {
            'fields': ('total_users', 'new_users', 'active_users')
        }),
        ('Project Metrics', {
            'fields': ('total_projects', 'new_projects', 'project_views')
        }),
        ('Property Metrics', {
            'fields': ('total_properties', 'available_properties', 'booked_properties', 'sold_properties', 'property_views')
        }),
        ('Booking Metrics', {
            'fields': ('total_bookings', 'new_bookings', 'confirmed_bookings', 'cancelled_bookings', 'completed_bookings')
        }),
        ('Revenue Metrics', {
            'fields': ('total_revenue', 'booking_revenue', 'token_revenue', 'pending_revenue')
        }),
        ('Payment Metrics', {
            'fields': ('total_payments', 'completed_payments', 'failed_payments', 'payment_amount')
        }),
        ('Conversion Metrics', {
            'fields': ('booking_conversion_rate', 'payment_conversion_rate')
        }),
        ('Engagement Metrics', {
            'fields': ('page_views', 'unique_visitors', 'avg_session_duration')
        }),
        ('Metadata', {
            'fields': ('metadata',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(AnalyticsReport)
class AnalyticsReportAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'report_type', 'generated_by', 'date_from', 'date_to', 'is_archived', 'created_at']
    list_filter = ['report_type', 'is_archived', 'created_at']
    search_fields = ['name', 'description', 'generated_by__email']
    readonly_fields = ['id', 'created_at', 'updated_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'report_type', 'name', 'description')
        }),
        ('Date Range', {
            'fields': ('date_from', 'date_to')
        }),
        ('Configuration', {
            'fields': ('filters', 'generated_by', 'data'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_archived',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
