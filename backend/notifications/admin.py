from django.contrib import admin
from .models import Notification, NotificationPreference


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'type', 'title', 'status', 'channel', 'created_at', 'read_at']
    list_filter = ['type', 'status', 'channel', 'created_at', 'read_at']
    search_fields = ['user__email', 'title', 'message', 'type']
    readonly_fields = ['id', 'created_at', 'sent_at', 'delivered_at', 'read_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'user', 'type', 'title', 'message')
        }),
        ('Delivery', {
            'fields': ('channel', 'status', 'email_sent', 'sms_sent', 'push_sent')
        }),
        ('Related Object', {
            'fields': ('related_object_type', 'related_object_id', 'action_url', 'action_text')
        }),
        ('Metadata', {
            'fields': ('data',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'sent_at', 'delivered_at', 'read_at')
        }),
    )


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ['user', 'email_enabled', 'sms_enabled', 'push_enabled', 'in_app_enabled', 'digest_enabled']
    list_filter = ['email_enabled', 'sms_enabled', 'push_enabled', 'in_app_enabled', 'digest_enabled']
    search_fields = ['user__email']
    readonly_fields = ['id', 'created_at', 'updated_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'user')
        }),
        ('Channel Preferences', {
            'fields': ('email_enabled', 'sms_enabled', 'push_enabled', 'in_app_enabled')
        }),
        ('Type Preferences', {
            'fields': ('type_preferences',),
            'classes': ('collapse',)
        }),
        ('Quiet Hours', {
            'fields': ('quiet_hours_start', 'quiet_hours_end')
        }),
        ('Digest Settings', {
            'fields': ('digest_enabled', 'digest_frequency')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )

