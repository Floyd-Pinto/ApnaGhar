from django.contrib import admin
from .models import SupportTicket, SupportMessage, SupportCategory


@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ['ticket_number', 'user', 'category', 'priority', 'status', 'assigned_to', 'created_at', 'last_activity_at']
    list_filter = ['status', 'priority', 'category', 'assigned_to', 'created_at']
    search_fields = ['ticket_number', 'subject', 'user__email', 'user__first_name', 'user__last_name']
    readonly_fields = ['id', 'ticket_number', 'created_at', 'updated_at', 'last_activity_at', 'last_message_at', 'first_response_at', 'resolved_at', 'closed_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'ticket_number', 'user', 'subject', 'description')
        }),
        ('Classification', {
            'fields': ('category', 'priority', 'status')
        }),
        ('Assignment', {
            'fields': ('assigned_to',)
        }),
        ('Related Object', {
            'fields': ('related_object_type', 'related_object_id'),
            'classes': ('collapse',)
        }),
        ('Attachments', {
            'fields': ('attachments',),
            'classes': ('collapse',)
        }),
        ('Resolution', {
            'fields': ('resolution', 'resolved_at', 'resolved_by', 'resolution_time'),
            'classes': ('collapse',)
        }),
        ('Closure', {
            'fields': ('closed_at', 'closed_by'),
            'classes': ('collapse',)
        }),
        ('Tracking', {
            'fields': ('last_activity_at', 'last_message_at', 'first_response_at'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('metadata', 'internal_notes'),
            'classes': ('collapse',)
        }),
    )


@admin.register(SupportMessage)
class SupportMessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'ticket', 'user', 'message_type', 'is_internal', 'created_at', 'read_by_user']
    list_filter = ['message_type', 'is_internal', 'read_by_user', 'created_at']
    search_fields = ['ticket__ticket_number', 'message', 'user__email']
    readonly_fields = ['id', 'created_at', 'updated_at', 'read_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'ticket', 'user', 'message_type', 'message')
        }),
        ('Attachments', {
            'fields': ('attachments',),
            'classes': ('collapse',)
        }),
        ('Visibility', {
            'fields': ('is_internal',)
        }),
        ('Read Tracking', {
            'fields': ('read_by_user', 'read_at')
        }),
        ('Metadata', {
            'fields': ('metadata',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(SupportCategory)
class SupportCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'default_priority', 'default_assigned_to', 'is_active', 'display_order']
    list_filter = ['is_active', 'default_priority']
    search_fields = ['name', 'description']
    readonly_fields = ['id', 'created_at', 'updated_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'name', 'slug', 'description')
        }),
        ('Settings', {
            'fields': ('default_priority', 'default_assigned_to')
        }),
        ('Display', {
            'fields': ('is_active', 'display_order')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
