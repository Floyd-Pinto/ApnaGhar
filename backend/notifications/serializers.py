from rest_framework import serializers
from .models import Notification, NotificationPreference
from django.contrib.auth import get_user_model

User = get_user_model()


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification model"""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    related_object_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'user', 'user_email', 'type', 'title', 'message',
            'channel', 'status', 'related_object_type', 'related_object_id',
            'data', 'action_url', 'action_text', 'created_at',
            'sent_at', 'delivered_at', 'read_at', 'email_sent',
            'sms_sent', 'push_sent', 'related_object_url'
        ]
        read_only_fields = [
            'id', 'user_email', 'created_at', 'sent_at', 'delivered_at',
            'read_at', 'email_sent', 'sms_sent', 'push_sent', 'related_object_url'
        ]
    
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


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """Serializer for NotificationPreference model"""
    
    class Meta:
        model = NotificationPreference
        fields = [
            'id', 'user', 'email_enabled', 'sms_enabled', 'push_enabled',
            'in_app_enabled', 'type_preferences', 'quiet_hours_start',
            'quiet_hours_end', 'digest_enabled', 'digest_frequency',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        """Set user from request context"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class NotificationMarkReadSerializer(serializers.Serializer):
    """Serializer for marking notifications as read"""
    notification_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=True,
        help_text="List of notification IDs to mark as read"
    )

