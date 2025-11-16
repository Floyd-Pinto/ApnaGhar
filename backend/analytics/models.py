from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import uuid

User = get_user_model()


class AnalyticsEvent(models.Model):
    """Model for tracking analytics events"""
    EVENT_TYPE = [
        ('page_view', 'Page View'),
        ('project_view', 'Project View'),
        ('property_view', 'Property View'),
        ('booking_created', 'Booking Created'),
        ('booking_confirmed', 'Booking Confirmed'),
        ('booking_cancelled', 'Booking Cancelled'),
        ('payment_completed', 'Payment Completed'),
        ('payment_failed', 'Payment Failed'),
        ('user_registered', 'User Registered'),
        ('user_login', 'User Login'),
        ('search_performed', 'Search Performed'),
        ('filter_applied', 'Filter Applied'),
        ('document_viewed', 'Document Viewed'),
        ('document_downloaded', 'Document Downloaded'),
        ('contact_form_submitted', 'Contact Form Submitted'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event_type = models.CharField(max_length=50, choices=EVENT_TYPE)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='analytics_events')
    
    # Event Details
    session_id = models.CharField(max_length=255, blank=True, null=True)  # Session identifier
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)
    
    # Related Objects
    related_object_type = models.CharField(max_length=50, blank=True, null=True)  # e.g., 'project', 'property', 'booking'
    related_object_id = models.UUIDField(blank=True, null=True)
    
    # Event Data
    metadata = models.JSONField(default=dict, blank=True)  # Additional event data
    properties = models.JSONField(default=dict, blank=True)  # Event properties
    
    # Location
    country = models.CharField(max_length=100, blank=True, null=True)
    region = models.CharField(max_length=100, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'analytics_events'
        verbose_name = 'Analytics Event'
        verbose_name_plural = 'Analytics Events'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['event_type', 'created_at']),
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['related_object_type', 'related_object_id']),
            models.Index(fields=['created_at']),
            models.Index(fields=['session_id', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.event_type} - {self.created_at}"


class AnalyticsMetric(models.Model):
    """Model for storing aggregated analytics metrics"""
    METRIC_TYPE = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('yearly', 'Yearly'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    metric_type = models.CharField(max_length=20, choices=METRIC_TYPE)
    date = models.DateField()
    
    # User Metrics
    total_users = models.IntegerField(default=0)
    new_users = models.IntegerField(default=0)
    active_users = models.IntegerField(default=0)
    
    # Project Metrics
    total_projects = models.IntegerField(default=0)
    new_projects = models.IntegerField(default=0)
    project_views = models.IntegerField(default=0)
    
    # Property Metrics
    total_properties = models.IntegerField(default=0)
    available_properties = models.IntegerField(default=0)
    booked_properties = models.IntegerField(default=0)
    sold_properties = models.IntegerField(default=0)
    property_views = models.IntegerField(default=0)
    
    # Booking Metrics
    total_bookings = models.IntegerField(default=0)
    new_bookings = models.IntegerField(default=0)
    confirmed_bookings = models.IntegerField(default=0)
    cancelled_bookings = models.IntegerField(default=0)
    completed_bookings = models.IntegerField(default=0)
    
    # Revenue Metrics
    total_revenue = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    booking_revenue = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    token_revenue = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    pending_revenue = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Payment Metrics
    total_payments = models.IntegerField(default=0)
    completed_payments = models.IntegerField(default=0)
    failed_payments = models.IntegerField(default=0)
    payment_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Conversion Metrics
    booking_conversion_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text='Percentage')
    payment_conversion_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text='Percentage')
    
    # Engagement Metrics
    page_views = models.IntegerField(default=0)
    unique_visitors = models.IntegerField(default=0)
    avg_session_duration = models.IntegerField(default=0, help_text='In seconds')
    
    # Additional Data
    metadata = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'analytics_metrics'
        verbose_name = 'Analytics Metric'
        verbose_name_plural = 'Analytics Metrics'
        ordering = ['-date', '-metric_type']
        unique_together = [['metric_type', 'date']]
        indexes = [
            models.Index(fields=['metric_type', 'date']),
            models.Index(fields=['date']),
        ]
    
    def __str__(self):
        return f"{self.metric_type} - {self.date}"


class AnalyticsReport(models.Model):
    """Model for storing generated analytics reports"""
    REPORT_TYPE = [
        ('user_report', 'User Report'),
        ('project_report', 'Project Report'),
        ('booking_report', 'Booking Report'),
        ('revenue_report', 'Revenue Report'),
        ('performance_report', 'Performance Report'),
        ('custom', 'Custom Report'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report_type = models.CharField(max_length=50, choices=REPORT_TYPE)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # Report Configuration
    date_from = models.DateField(null=True, blank=True)
    date_to = models.DateField(null=True, blank=True)
    
    # Filters
    filters = models.JSONField(default=dict, blank=True)  # Report filters
    
    # Generated By
    generated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Report Data
    data = models.JSONField(default=dict, blank=True)  # Report data
    
    # Status
    is_archived = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'analytics_reports'
        verbose_name = 'Analytics Report'
        verbose_name_plural = 'Analytics Reports'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['report_type', 'created_at']),
            models.Index(fields=['generated_by', 'created_at']),
            models.Index(fields=['is_archived', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.report_type}"
