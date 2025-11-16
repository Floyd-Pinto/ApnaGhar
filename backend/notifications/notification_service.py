"""
Notification Service
Handles sending notifications via various channels (email, SMS, push, in-app)
"""
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from .models import Notification, NotificationPreference
from django.contrib.auth import get_user_model
import logging
from typing import Optional, Dict, Any, List

User = get_user_model()
logger = logging.getLogger(__name__)


class NotificationService:
    """Service for creating and sending notifications"""
    
    @staticmethod
    def get_or_create_preferences(user):
        """Get or create notification preferences for a user"""
        preferences, created = NotificationPreference.objects.get_or_create(user=user)
        return preferences
    
    @staticmethod
    def create_notification(
        user: User,
        notification_type: str,
        title: str,
        message: str,
        channel: str = 'in_app',
        related_object_type: Optional[str] = None,
        related_object_id: Optional[str] = None,
        data: Optional[Dict[str, Any]] = None,
        action_url: Optional[str] = None,
        action_text: Optional[str] = None,
    ) -> Notification:
        """
        Create a notification record
        
        Args:
            user: User to notify
            notification_type: Type of notification (e.g., 'booking_created')
            title: Notification title
            message: Notification message
            channel: Preferred channel ('in_app', 'email', 'sms', 'push')
            related_object_type: Type of related object (e.g., 'booking')
            related_object_id: ID of related object
            data: Additional context data
            action_url: URL for action button
            action_text: Text for action button
            
        Returns:
            Notification instance
        """
        notification = Notification.objects.create(
            user=user,
            type=notification_type,
            title=title,
            message=message,
            channel=channel,
            related_object_type=related_object_type,
            related_object_id=related_object_id,
            data=data or {},
            action_url=action_url,
            action_text=action_text,
        )
        
        # Auto-send based on user preferences
        NotificationService.send_notification(notification)
        
        return notification
    
    @staticmethod
    def send_notification(notification: Notification, channels: Optional[List[str]] = None):
        """
        Send notification via specified channels
        
        Args:
            notification: Notification instance
            channels: List of channels to send to (if None, uses notification.channel and preferences)
        """
        preferences = NotificationService.get_or_create_preferences(notification.user)
        
        # Determine which channels to use
        if channels is None:
            channels = [notification.channel]
        
        # Filter channels based on user preferences and quiet hours
        if preferences.is_quiet_hours():
            # During quiet hours, only send in-app notifications
            channels = ['in_app'] if 'in_app' in channels else []
        else:
            # Filter out disabled channels
            channels = [ch for ch in channels if preferences.is_channel_enabled(ch)]
        
        # Check if notification type is enabled
        if not preferences.is_type_enabled(notification.type):
            logger.info(f"Notification type {notification.type} disabled for user {notification.user.email}")
            return
        
        # Send via each enabled channel
        for channel in channels:
            try:
                if channel == 'email':
                    NotificationService._send_email(notification)
                elif channel == 'sms':
                    NotificationService._send_sms(notification)
                elif channel == 'push':
                    NotificationService._send_push(notification)
                elif channel == 'in_app':
                    # In-app notifications are already created, just mark as sent
                    notification.mark_as_sent(channel)
            except Exception as e:
                logger.error(f"Error sending notification via {channel}: {str(e)}")
                notification.status = 'failed'
                notification.save(update_fields=['status'])
    
    @staticmethod
    def _send_email(notification: Notification):
        """Send email notification"""
        try:
            subject = notification.title
            message = notification.message
            
            # Try to render HTML email template
            try:
                html_message = render_to_string(
                    'notifications/email_template.html',
                    {
                        'notification': notification,
                        'user': notification.user,
                        'action_url': notification.action_url,
                        'action_text': notification.action_text,
                    }
                )
                plain_message = strip_tags(html_message)
            except Exception:
                # If template doesn't exist, use plain text
                html_message = None
                plain_message = message
            
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@apnaghar.com'),
                recipient_list=[notification.user.email],
                html_message=html_message,
                fail_silently=False,
            )
            
            notification.mark_as_sent('email')
            logger.info(f"Email notification sent to {notification.user.email}")
        
        except Exception as e:
            logger.error(f"Error sending email notification: {str(e)}")
            raise
    
    @staticmethod
    def _send_sms(notification: Notification):
        """Send SMS notification (placeholder - integrate with SMS service)"""
        try:
            # TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
            # For now, just log and mark as sent
            logger.info(f"SMS notification would be sent to {notification.user.phone if notification.user.phone else 'N/A'}")
            notification.mark_as_sent('sms')
        except Exception as e:
            logger.error(f"Error sending SMS notification: {str(e)}")
            raise
    
    @staticmethod
    def _send_push(notification: Notification):
        """Send push notification (placeholder - integrate with push service)"""
        try:
            # TODO: Integrate with push notification service (FCM, OneSignal, etc.)
            # For now, just log and mark as sent
            logger.info(f"Push notification would be sent to user {notification.user.email}")
            notification.mark_as_sent('push')
        except Exception as e:
            logger.error(f"Error sending push notification: {str(e)}")
            raise
    
    @staticmethod
    def notify_booking_created(user: User, booking):
        """Create notification for booking creation"""
        return NotificationService.create_notification(
            user=user,
            notification_type='booking_created',
            title=f'Booking Confirmed: {booking.booking_number}',
            message=f'Your booking for Unit {booking.property_unit_number} has been created successfully.',
            channel='in_app',
            related_object_type='booking',
            related_object_id=str(booking.id),
            data={'booking_number': booking.booking_number, 'property_unit_number': booking.property_unit_number},
            action_url=f'/bookings/{booking.id}',
            action_text='View Booking',
        )
    
    @staticmethod
    def notify_booking_confirmed(user: User, booking):
        """Create notification for booking confirmation"""
        return NotificationService.create_notification(
            user=user,
            notification_type='booking_confirmed',
            title=f'Booking Confirmed: {booking.booking_number}',
            message=f'Your booking for Unit {booking.property_unit_number} has been confirmed by the builder.',
            channel='email',
            related_object_type='booking',
            related_object_id=str(booking.id),
            data={'booking_number': booking.booking_number},
            action_url=f'/bookings/{booking.id}',
            action_text='View Booking',
        )
    
    @staticmethod
    def notify_payment_received(user: User, payment):
        """Create notification for payment received"""
        return NotificationService.create_notification(
            user=user,
            notification_type='payment_received',
            title=f'Payment Received: ₹{payment.amount}',
            message=f'Your payment of ₹{payment.amount} has been received successfully.',
            channel='email',
            related_object_type='payment',
            related_object_id=str(payment.id),
            data={'amount': str(payment.amount), 'transaction_id': payment.transaction_id},
            action_url=f'/payments/{payment.id}',
            action_text='View Payment',
        )
    
    @staticmethod
    def notify_payment_failed(user: User, payment):
        """Create notification for payment failure"""
        return NotificationService.create_notification(
            user=user,
            notification_type='payment_failed',
            title=f'Payment Failed: ₹{payment.amount}',
            message=f'Your payment of ₹{payment.amount} could not be processed. {payment.failure_reason or "Please try again."}',
            channel='email',
            related_object_type='payment',
            related_object_id=str(payment.id),
            data={'amount': str(payment.amount), 'failure_reason': payment.failure_reason},
            action_url=f'/payments/{payment.id}',
            action_text='Retry Payment',
        )

