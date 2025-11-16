"""
Django signals for triggering notifications
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from projects.models import Booking
from payments.models import Payment
from .notification_service import NotificationService
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Booking)
def notify_booking_created(sender, instance, created, **kwargs):
    """Notify user when booking is created"""
    if created:
        try:
            NotificationService.notify_booking_created(
                user=instance.buyer,
                booking=instance
            )
            logger.info(f"Booking created notification sent to {instance.buyer.email}")
        except Exception as e:
            logger.error(f"Error sending booking created notification: {str(e)}")


@receiver(post_save, sender=Booking)
def notify_booking_confirmed(sender, instance, created, **kwargs):
    """Notify user when booking is confirmed"""
    # Check if status changed to confirmed
    if not created and instance.status == 'confirmed':
        # Check if it was just confirmed (could use a field to track previous status)
        try:
            NotificationService.notify_booking_confirmed(
                user=instance.buyer,
                booking=instance
            )
            logger.info(f"Booking confirmed notification sent to {instance.buyer.email}")
        except Exception as e:
            logger.error(f"Error sending booking confirmed notification: {str(e)}")


@receiver(post_save, sender=Payment)
def notify_payment_received(sender, instance, created, **kwargs):
    """Notify user when payment is received"""
    # Only notify on status change to completed (not on creation)
    if not created and instance.status == 'completed':
        try:
            # Check if this is the first time it's being marked as completed
            # (to avoid sending duplicate notifications)
            previous = Payment.objects.filter(id=instance.id).first()
            if previous and previous.status != 'completed':
                NotificationService.notify_payment_received(
                    user=instance.user,
                    payment=instance
                )
                logger.info(f"Payment received notification sent to {instance.user.email}")
        except Exception as e:
            logger.error(f"Error sending payment received notification: {str(e)}")


@receiver(post_save, sender=Payment)
def notify_payment_failed(sender, instance, created, **kwargs):
    """Notify user when payment fails"""
    # Only notify on status change to failed (not on creation)
    if not created and instance.status == 'failed':
        try:
            # Check if this is the first time it's being marked as failed
            previous = Payment.objects.filter(id=instance.id).first()
            if previous and previous.status != 'failed':
                NotificationService.notify_payment_failed(
                    user=instance.user,
                    payment=instance
                )
                logger.info(f"Payment failed notification sent to {instance.user.email}")
        except Exception as e:
            logger.error(f"Error sending payment failed notification: {str(e)}")

