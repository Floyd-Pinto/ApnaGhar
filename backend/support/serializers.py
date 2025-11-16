from rest_framework import serializers
from .models import SupportTicket, SupportMessage, SupportCategory
from django.contrib.auth import get_user_model

User = get_user_model()


class SupportMessageSerializer(serializers.ModelSerializer):
    """Serializer for SupportMessage model"""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = SupportMessage
        fields = [
            'id', 'ticket', 'user', 'user_email', 'user_name',
            'message_type', 'message', 'attachments', 'is_internal',
            'metadata', 'read_by_user', 'read_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user_email', 'user_name', 'read_by_user',
            'read_at', 'created_at', 'updated_at'
        ]
    
    def get_user_name(self, obj):
        """Return user's full name"""
        if obj.user:
            name = f"{obj.user.first_name} {obj.user.last_name}".strip()
            return name if name else obj.user.email
        return None


class SupportTicketSerializer(serializers.ModelSerializer):
    """Serializer for SupportTicket model"""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    assigned_to_email = serializers.EmailField(source='assigned_to.email', read_only=True)
    assigned_to_name = serializers.SerializerMethodField()
    resolved_by_name = serializers.SerializerMethodField()
    closed_by_name = serializers.SerializerMethodField()
    messages_count = serializers.SerializerMethodField()
    unread_messages_count = serializers.SerializerMethodField()
    related_object_url = serializers.SerializerMethodField()
    
    class Meta:
        model = SupportTicket
        fields = [
            'id', 'ticket_number', 'user', 'user_email', 'user_name',
            'category', 'priority', 'status', 'subject', 'description',
            'assigned_to', 'assigned_to_email', 'assigned_to_name',
            'related_object_type', 'related_object_id', 'attachments',
            'resolution', 'resolved_at', 'resolved_by', 'resolved_by_name',
            'closed_at', 'closed_by', 'closed_by_name',
            'metadata', 'internal_notes', 'last_activity_at',
            'last_message_at', 'first_response_at', 'resolution_time',
            'messages_count', 'unread_messages_count', 'related_object_url',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'ticket_number', 'user_email', 'user_name',
            'assigned_to_email', 'assigned_to_name', 'resolved_by_name',
            'closed_by_name', 'resolved_at', 'closed_at', 'last_activity_at',
            'last_message_at', 'first_response_at', 'resolution_time',
            'messages_count', 'unread_messages_count', 'related_object_url',
            'created_at', 'updated_at'
        ]
    
    def get_user_name(self, obj):
        """Return user's full name"""
        if obj.user:
            name = f"{obj.user.first_name} {obj.user.last_name}".strip()
            return name if name else obj.user.email
        return None
    
    def get_assigned_to_name(self, obj):
        """Return assigned staff member's name"""
        if obj.assigned_to:
            name = f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}".strip()
            return name if name else obj.assigned_to.email
        return None
    
    def get_resolved_by_name(self, obj):
        """Return resolver's name"""
        if obj.resolved_by:
            name = f"{obj.resolved_by.first_name} {obj.resolved_by.last_name}".strip()
            return name if name else obj.resolved_by.email
        return None
    
    def get_closed_by_name(self, obj):
        """Return closer's name"""
        if obj.closed_by:
            name = f"{obj.closed_by.first_name} {obj.closed_by.last_name}".strip()
            return name if name else obj.closed_by.email
        return None
    
    def get_messages_count(self, obj):
        """Return count of messages (excluding internal)"""
        return obj.messages.filter(is_internal=False).count()
    
    def get_unread_messages_count(self, obj):
        """Return count of unread messages for the ticket owner"""
        # Count unread staff messages for ticket owner
        return obj.messages.filter(
            message_type='staff',
            is_internal=False,
            read_by_user=False
        ).count()
    
    def get_related_object_url(self, obj):
        """Generate URL for related object"""
        if obj.related_object_type and obj.related_object_id:
            if obj.related_object_type == 'booking':
                return f'/bookings/{obj.related_object_id}'
            elif obj.related_object_type == 'payment':
                return f'/payments/{obj.related_object_id}'
            elif obj.related_object_type == 'property':
                return f'/property/{obj.related_object_id}'
            elif obj.related_object_type == 'project':
                return f'/projects/{obj.related_object_id}'
        return None


class SupportTicketCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating support tickets"""
    
    class Meta:
        model = SupportTicket
        fields = [
            'category', 'priority', 'subject', 'description',
            'related_object_type', 'related_object_id', 'attachments'
        ]
        extra_kwargs = {
            'priority': {'required': False, 'default': 'medium'},
            'related_object_type': {'required': False},
            'related_object_id': {'required': False},
            'attachments': {'required': False},
        }
    
    def create(self, validated_data):
        """Set user to current logged-in user"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class SupportMessageCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating support messages"""
    
    class Meta:
        model = SupportMessage
        fields = ['ticket', 'message', 'attachments', 'is_internal']
        extra_kwargs = {
            'attachments': {'required': False},
            'is_internal': {'required': False, 'default': False},
        }
    
    def create(self, validated_data):
        """Set user to current logged-in user"""
        request = self.context['request']
        validated_data['user'] = request.user
        
        # Determine message type based on user role
        if request.user.is_staff:
            validated_data['message_type'] = 'staff'
        else:
            validated_data['message_type'] = 'user'
        
        # Update ticket status when user responds
        ticket = validated_data['ticket']
        if validated_data['message_type'] == 'user' and ticket.status == 'waiting_for_user':
            ticket.status = 'open'
            ticket.save(update_fields=['status'])
        
        return super().create(validated_data)


class SupportCategorySerializer(serializers.ModelSerializer):
    """Serializer for SupportCategory model"""
    
    class Meta:
        model = SupportCategory
        fields = [
            'id', 'name', 'slug', 'description', 'default_assigned_to',
            'default_priority', 'is_active', 'display_order',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

