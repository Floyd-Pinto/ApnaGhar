from django.db import models
from django.db.models import Sum
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator
from decimal import Decimal
import uuid
from django.utils import timezone

User = get_user_model()


class Payment(models.Model):
    """Payment transaction model for tracking all payments"""
    PAYMENT_STATUS = [
        ('pending', 'Pending'),  # Payment initiated, waiting for user action
        ('processing', 'Processing'),  # Payment is being processed
        ('completed', 'Completed'),  # Payment successful
        ('failed', 'Failed'),  # Payment failed
        ('cancelled', 'Cancelled'),  # Payment cancelled by user
        ('refunded', 'Refunded'),  # Payment refunded
        ('partially_refunded', 'Partially Refunded'),  # Partial refund processed
    ]
    
    PAYMENT_METHOD = [
        ('razorpay', 'Razorpay'),
        ('stripe', 'Stripe'),
        ('paypal', 'PayPal'),
        ('bank_transfer', 'Bank Transfer'),
        ('cheque', 'Cheque'),
        ('cash', 'Cash'),
        ('upi', 'UPI'),
        ('card', 'Card'),
    ]
    
    PAYMENT_TYPE = [
        ('booking_token', 'Booking Token Amount'),
        ('installment', 'Installment Payment'),
        ('full_payment', 'Full Payment'),
        ('refund', 'Refund'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction_id = models.CharField(max_length=255, unique=True, blank=True)  # Auto-generated or gateway ID
    payment_id = models.CharField(max_length=255, unique=True, null=True, blank=True)  # Gateway payment ID (e.g., Razorpay payment ID)
    order_id = models.CharField(max_length=255, unique=True, null=True, blank=True)  # Gateway order ID
    
    # Relationships
    user = models.ForeignKey(User, on_delete=models.PROTECT, related_name='payments')
    booking = models.ForeignKey('projects.Booking', on_delete=models.PROTECT, related_name='payments', null=True, blank=True, db_constraint=True)
    
    # Payment Details
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    currency = models.CharField(max_length=3, default='INR')
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='pending')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD)
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPE, default='booking_token')
    
    # Gateway Information
    gateway = models.CharField(max_length=50, default='razorpay')  # razorpay, stripe, etc.
    gateway_transaction_id = models.CharField(max_length=255, null=True, blank=True)  # Gateway's transaction ID
    gateway_order_id = models.CharField(max_length=255, null=True, blank=True)  # Gateway's order ID
    gateway_payment_id = models.CharField(max_length=255, null=True, blank=True)  # Gateway's payment ID
    gateway_signature = models.CharField(max_length=500, null=True, blank=True)  # Gateway signature for verification
    
    # Payment Information
    description = models.TextField(blank=True, null=True)
    notes = models.JSONField(default=dict, blank=True)  # Additional metadata
    metadata = models.JSONField(default=dict, blank=True)  # Gateway-specific metadata
    
    # Timestamps
    initiated_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    failed_at = models.DateTimeField(null=True, blank=True)
    
    # Failure Information
    failure_reason = models.TextField(blank=True, null=True)
    failure_code = models.CharField(max_length=100, blank=True, null=True)
    
    # Refund Information
    refund_id = models.CharField(max_length=255, null=True, blank=True)
    refund_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, null=True, blank=True)
    refund_status = models.CharField(max_length=50, blank=True, null=True)
    refund_reason = models.TextField(blank=True, null=True)
    
    # Webhook Information
    webhook_received = models.BooleanField(default=False)
    webhook_payload = models.JSONField(default=dict, blank=True)  # Store webhook payload for debugging
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        # Auto-generate transaction_id if not set
        if not self.transaction_id:
            # Format: TXN-{DATE}-{RANDOM}
            date_part = timezone.now().strftime('%Y%m%d')
            random_part = uuid.uuid4().hex[:8].upper()
            self.transaction_id = f"TXN-{date_part}-{random_part}"
        
        # Set timestamps based on status
        if self.status == 'completed' and not self.completed_at:
            self.completed_at = timezone.now()
        elif self.status == 'failed' and not self.failed_at:
            self.failed_at = timezone.now()
        
        # Save the payment first
        super().save(*args, **kwargs)
        
        # Update booking payment status if linked to a booking
        # Only update if status changed to completed to avoid infinite loops
        if self.booking and self.status == 'completed':
            try:
                from projects.models import Booking
                booking = Booking.objects.get(id=self.booking.id)
                
                # Calculate total paid amount from all completed payments
                total_paid = Payment.objects.filter(
                    booking=booking,
                    status='completed'
                ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
                
                booking.amount_paid = total_paid
                booking.amount_due = booking.total_amount - total_paid
                
                # Update booking payment method if not set
                if not booking.payment_method:
                    booking.payment_method = self.payment_method
                if not booking.payment_reference:
                    booking.payment_reference = self.transaction_id
                
                # Update booking status based on payment progress
                if total_paid >= booking.token_amount and booking.status == 'pending':
                    booking.status = 'token_paid'
                    if not booking.token_payment_date:
                        booking.token_payment_date = timezone.now()
                elif total_paid >= booking.total_amount and booking.status != 'completed':
                    booking.status = 'completed'
                    if not booking.completion_date:
                        booking.completion_date = timezone.now()
                elif total_paid > 0 and booking.status == 'confirmed':
                    booking.status = 'payment_in_progress'
                
                # Save booking with updated fields
                booking.save(update_fields=[
                    'amount_paid', 'amount_due', 'payment_method', 'payment_reference',
                    'status', 'token_payment_date', 'completion_date'
                ])
            except Exception as e:
                # Log error but don't fail payment save
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error updating booking payment status: {str(e)}")
    
    class Meta:
        db_table = 'payments'
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'
        ordering = ['-initiated_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['booking', 'status']),
            models.Index(fields=['transaction_id']),
            models.Index(fields=['gateway_payment_id']),
            models.Index(fields=['status', 'created_at']),
        ]
    
    def __str__(self):
        return f"Payment {self.transaction_id} - {self.amount} {self.currency} - {self.status}"


class PaymentRefund(models.Model):
    """Track refunds for payments"""
    REFUND_STATUS = [
        ('pending', 'Pending'),
        ('processed', 'Processed'),
        ('failed', 'Failed'),
        ('reversed', 'Reversed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    refund_id = models.CharField(max_length=255, unique=True, blank=True)  # Auto-generated or gateway refund ID
    payment = models.ForeignKey(Payment, on_delete=models.PROTECT, related_name='refunds')
    
    # Refund Details
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    currency = models.CharField(max_length=3, default='INR')
    status = models.CharField(max_length=20, choices=REFUND_STATUS, default='pending')
    
    # Gateway Information
    gateway_refund_id = models.CharField(max_length=255, null=True, blank=True)
    
    # Reason
    reason = models.TextField(blank=True, null=True)
    
    # Metadata
    notes = models.JSONField(default=dict, blank=True)
    gateway_response = models.JSONField(default=dict, blank=True)
    
    initiated_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        # Auto-generate refund_id if not set
        if not self.refund_id:
            date_part = timezone.now().strftime('%Y%m%d')
            random_part = uuid.uuid4().hex[:8].upper()
            self.refund_id = f"REF-{date_part}-{random_part}"
        
        if self.status == 'processed' and not self.processed_at:
            self.processed_at = timezone.now()
        
        super().save(*args, **kwargs)
        
        # Update payment refund information
        if self.payment:
            total_refunded = PaymentRefund.objects.filter(
                payment=self.payment,
                status='processed'
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
            
            self.payment.refund_amount = total_refunded
            
            if total_refunded >= self.payment.amount:
                self.payment.status = 'refunded'
            elif total_refunded > 0:
                self.payment.status = 'partially_refunded'
            
            if not self.payment.refund_id:
                self.payment.refund_id = self.refund_id
            
            self.payment.save(update_fields=['refund_amount', 'status', 'refund_id'])
    
    class Meta:
        db_table = 'payment_refunds'
        verbose_name = 'Payment Refund'
        verbose_name_plural = 'Payment Refunds'
        ordering = ['-initiated_at']
        indexes = [
            models.Index(fields=['payment', 'status']),
            models.Index(fields=['refund_id']),
        ]
    
    def __str__(self):
        return f"Refund {self.refund_id} - {self.amount} {self.currency} - {self.status}"
