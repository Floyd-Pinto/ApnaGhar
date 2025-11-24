"""
Django signals for triggering notifications
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from projects.models import Booking, ConstructionUpdate, Property
from payments.models import Payment
from blockchain.models import BlockchainProgressUpdate, BlockchainDocument
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


@receiver(post_save, sender=ConstructionUpdate)
def notify_construction_update(sender, instance, created, **kwargs):
    """Notify property buyers when construction update is posted"""
    if created:
        try:
            # Get all buyers who have properties in this project
            project = instance.project
            buyers = Property.objects.filter(
                project=project,
                buyer__isnull=False
            ).values_list('buyer', flat=True).distinct()
            
            # Create notification for each buyer
            for buyer_id in buyers:
                from users.models import CustomUser
                buyer = CustomUser.objects.get(id=buyer_id)
                
                NotificationService.create_notification(
                    user=buyer,
                    notification_type='construction_update',
                    title=f'New Construction Update: {project.name}',
                    message=f'A new construction update has been posted for {project.name}. {instance.title}',
                    data={
                        'project_id': str(project.id),
                        'update_id': str(instance.id),
                        'update_type': instance.update_type,
                    }
                )
            
            logger.info(f"Construction update notifications sent for project {project.name}")
        except Exception as e:
            logger.error(f"Error sending construction update notification: {str(e)}")


@receiver(post_save, sender=BlockchainProgressUpdate)
def notify_progress_update(sender, instance, created, **kwargs):
    """Notify property buyers when progress update is uploaded"""
    if created:
        try:
            # Notify buyers based on project or property
            if instance.property:
                # Notify specific property buyer
                if instance.property.buyer:
                    NotificationService.create_notification(
                        user=instance.property.buyer,
                        notification_type='progress_update',
                        title=f'New Progress Update: Unit {instance.property.unit_number}',
                        message=f'A new progress update has been uploaded for your unit {instance.property.unit_number}.',
                        data={
                            'property_id': str(instance.property.id),
                            'progress_id': str(instance.progress_id),
                            'ipfs_hash': instance.ipfs_hash,
                        }
                    )
            elif instance.project:
                # Notify all buyers in the project
                buyers = Property.objects.filter(
                    project=instance.project,
                    buyer__isnull=False
                ).values_list('buyer', flat=True).distinct()
                
                for buyer_id in buyers:
                    from users.models import CustomUser
                    buyer = CustomUser.objects.get(id=buyer_id)
                    
                    NotificationService.create_notification(
                        user=buyer,
                        notification_type='progress_update',
                        title=f'New Progress Update: {instance.project.name}',
                        message=f'A new progress update has been uploaded for {instance.project.name}.',
                        data={
                            'project_id': str(instance.project.id),
                            'progress_id': str(instance.progress_id),
                            'ipfs_hash': instance.ipfs_hash,
                        }
                    )
            
            logger.info(f"Progress update notifications sent")
        except Exception as e:
            logger.error(f"Error sending progress update notification: {str(e)}")


@receiver(post_save, sender=BlockchainDocument)
def notify_document_upload(sender, instance, created, **kwargs):
    """Notify property buyers when document is uploaded"""
    if created:
        try:
            # Notify buyers based on project or property
            if instance.property:
                # Notify specific property buyer
                if instance.property.buyer:
                    NotificationService.create_notification(
                        user=instance.property.buyer,
                        notification_type='document_upload',
                        title=f'New Document: {instance.document_name}',
                        message=f'A new {instance.document_type} document has been uploaded for your unit {instance.property.unit_number}.',
                        data={
                            'property_id': str(instance.property.id),
                            'document_id': str(instance.document_id),
                            'document_type': instance.document_type,
                            'ipfs_hash': instance.ipfs_hash,
                        }
                    )
            elif instance.project:
                # Notify all buyers in the project
                buyers = Property.objects.filter(
                    project=instance.project,
                    buyer__isnull=False
                ).values_list('buyer', flat=True).distinct()
                
                for buyer_id in buyers:
                    from users.models import CustomUser
                    buyer = CustomUser.objects.get(id=buyer_id)
                    
                    NotificationService.create_notification(
                        user=buyer,
                        notification_type='document_upload',
                        title=f'New Document: {instance.document_name}',
                        message=f'A new {instance.document_type} document has been uploaded for {instance.project.name}.',
                        data={
                            'project_id': str(instance.project.id),
                            'document_id': str(instance.document_id),
                            'document_type': instance.document_type,
                            'ipfs_hash': instance.ipfs_hash,
                        }
                    )
            
            logger.info(f"Document upload notifications sent")
        except Exception as e:
            logger.error(f"Error sending document upload notification: {str(e)}")

