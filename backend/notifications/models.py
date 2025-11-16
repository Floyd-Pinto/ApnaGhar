from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import uuid

User = get_user_model()


class Notification(models.Model):
    """Notification model for user notifications"""
    NOTIFICATION_TYPE = [
        ('booking_created', 'Booking Created'),
        ('booking_confirmed', 'Booking Confirmed'),
        ('booking_cancelled', 'Booking Cancelled'),
        ('payment_received', 'Payment Received'),
        ('payment_failed', 'Payment Failed'),
        ('payment_refunded', 'Payment Refunded'),
        ('property_updated', 'Property Updated'),
        ('construction_progress', 'Construction Progress'),
        ('document_uploaded', 'Document Uploaded'),
        ('milestone_reached', 'Milestone Reached'),
        ('system', 'System Notification'),
        ('other', 'Other'),
    ]
    
    CHANNEL = [
        ('in_app', 'In-App'),
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('push', 'Push Notification'),
    ]
    
    STATUS = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('read', 'Read'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    
    # Notification Details
    type = models.CharField(max_length=50, choices=NOTIFICATION_TYPE)
    title = models.CharField(max_length=255)
    message = models.TextField()
    channel = models.CharField(max_length=20, choices=CHANNEL, default='in_app')
    status = models.CharField(max_length=20, choices=STATUS, default='pending')
    
    # Related Objects (for linking to specific items)
    related_object_type = models.CharField(max_length=50, blank=True, null=True)  # e.g., 'booking', 'payment', 'property'
    related_object_id = models.UUIDField(blank=True, null=True)  # ID of related object
    
    # Additional Data
    data = models.JSONField(default=dict, blank=True)  # Additional context data
    action_url = models.URLField(blank=True, null=True)  # URL for action button
    action_text = models.CharField(max_length=100, blank=True, null=True)  # Text for action button
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(blank=True, null=True)
    delivered_at = models.DateTimeField(blank=True, null=True)
    read_at = models.DateTimeField(blank=True, null=True)
    
    # Email/SMS specific
    email_sent = models.BooleanField(default=False)
    sms_sent = models.BooleanField(default=False)
    push_sent = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'notifications'
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['user', 'read_at']),
            models.Index(fields=['type', 'created_at']),
            models.Index(fields=['related_object_type', 'related_object_id']),
        ]
    
    def __str__(self):
        return f"{self.type} - {self.user.email} - {self.status}"
    
    def mark_as_read(self):
        """Mark notification as read"""
        if not self.read_at:
            self.read_at = timezone.now()
            self.status = 'read'
            self.save(update_fields=['read_at', 'status'])
    
    def mark_as_sent(self, channel=None):
        """Mark notification as sent for a specific channel"""
        if channel == 'email':
            self.email_sent = True
        elif channel == 'sms':
            self.sms_sent = True
        elif channel == 'push':
            self.push_sent = True
        
        if not self.sent_at:
            self.sent_at = timezone.now()
        
        if self.status == 'pending':
            self.status = 'sent'
        
        self.save(update_fields=['email_sent', 'sms_sent', 'push_sent', 'sent_at', 'status'])


class NotificationPreference(models.Model):
    """User preferences for notifications"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_preferences')
    
    # Channel Preferences
    email_enabled = models.BooleanField(default=True)
    sms_enabled = models.BooleanField(default=False)
    push_enabled = models.BooleanField(default=True)
    in_app_enabled = models.BooleanField(default=True)
    
    # Type Preferences (JSON field with type -> enabled mapping)
    type_preferences = models.JSONField(default=dict, blank=True)  # e.g., {'booking_created': True, 'payment_received': False}
    
    # Quiet Hours (times when notifications should not be sent)
    quiet_hours_start = models.TimeField(blank=True, null=True)  # e.g., 22:00
    quiet_hours_end = models.TimeField(blank=True, null=True)  # e.g., 08:00
    
    # Frequency
    digest_enabled = models.BooleanField(default=False)  # Receive digest instead of individual notifications
    digest_frequency = models.CharField(
        max_length=20,
        choices=[('daily', 'Daily'), ('weekly', 'Weekly'), ('never', 'Never')],
        default='never'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notification_preferences'
        verbose_name = 'Notification Preference'
        verbose_name_plural = 'Notification Preferences'
    
    def __str__(self):
        return f"Notification Preferences - {self.user.email}"
    
    def is_type_enabled(self, notification_type):
        """Check if a notification type is enabled for this user"""
        # If type preferences exist, check them first
        if self.type_preferences and notification_type in self.type_preferences:
            return self.type_preferences[notification_type]
        
        # Default to enabled if not specified
        return True
    
    def is_channel_enabled(self, channel):
        """Check if a channel is enabled for this user"""
        channel_map = {
            'email': self.email_enabled,
            'sms': self.sms_enabled,
            'push': self.push_enabled,
            'in_app': self.in_app_enabled,
        }
        return channel_map.get(channel, False)
    
    def is_quiet_hours(self):
        """Check if current time is within quiet hours"""
        if not self.quiet_hours_start or not self.quiet_hours_end:
            return False
        
        now = timezone.now().time()
        start = self.quiet_hours_start
        end = self.quiet_hours_end
        
        # Handle quiet hours that span midnight
        if start <= end:
            return start <= now <= end
        else:
            return now >= start or now <= end

