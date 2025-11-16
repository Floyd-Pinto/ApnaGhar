from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.db import transaction
from .models import Payment, PaymentRefund
from .serializers import (
    PaymentSerializer, PaymentCreateSerializer, PaymentVerifySerializer,
    PaymentRefundSerializer, PaymentRefundCreateSerializer
)
from .razorpay_service import get_razorpay_service
from django.utils import timezone
import json
import logging

logger = logging.getLogger(__name__)


class PaymentViewSet(viewsets.ModelViewSet):
    """ViewSet for Payment management"""
    queryset = Payment.objects.select_related('user', 'booking', 'booking__property', 'booking__property__project')
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'payment_method', 'payment_type', 'gateway', 'booking']
    
    def get_serializer_class(self):
        """Use different serializers for create vs other actions"""
        if self.action == 'create':
            return PaymentCreateSerializer
        return PaymentSerializer
    
    def get_queryset(self):
        """Filter payments based on user role"""
        user = self.request.user
        queryset = super().get_queryset()
        
        # Regular users can only see their own payments
        # Staff/admins can see all payments
        if not user.is_staff:
            queryset = queryset.filter(user=user)
        
        return queryset.order_by('-initiated_at')
    
    def perform_create(self, serializer):
        """Set user to current user when creating payment"""
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Verify payment signature and update payment status"""
        payment = self.get_object()
        
        # Check permission
        if payment.user != request.user and not request.user.is_staff:
            raise PermissionDenied("You can only verify your own payments")
        
        # Validate verification data
        verify_serializer = PaymentVerifySerializer(data=request.data)
        verify_serializer.is_valid(raise_exception=True)
        
        data = verify_serializer.validated_data
        razorpay_order_id = data['razorpay_order_id']
        razorpay_payment_id = data['razorpay_payment_id']
        razorpay_signature = data['razorpay_signature']
        
        # Update payment with gateway information
        payment.gateway_order_id = razorpay_order_id
        payment.gateway_payment_id = razorpay_payment_id
        payment.gateway_signature = razorpay_signature
        
        # Fetch payment details from Razorpay
        try:
            razorpay_service = get_razorpay_service()
            if razorpay_service.available:
                payment_details = razorpay_service.fetch_payment(razorpay_payment_id)
                
                # Update payment status based on Razorpay response
                if payment_details.get('status') == 'captured':
                    payment.status = 'completed'
                    payment.completed_at = timezone.now()
                    payment.metadata = payment_details
                elif payment_details.get('status') == 'failed':
                    payment.status = 'failed'
                    payment.failed_at = timezone.now()
                    payment.failure_reason = payment_details.get('error_description', 'Payment failed')
                    payment.failure_code = payment_details.get('error_code', '')
                elif payment_details.get('status') == 'authorized':
                    payment.status = 'processing'
                
                payment.save()
                
                serializer = self.get_serializer(payment)
                return Response({
                    'message': 'Payment verified successfully',
                    'payment': serializer.data
                })
        except Exception as e:
            logger.error(f"Error verifying payment: {str(e)}")
            payment.status = 'failed'
            payment.failure_reason = str(e)
            payment.failed_at = timezone.now()
            payment.save()
            return Response(
                {'error': f'Failed to verify payment: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def my_payments(self, request):
        """Get current user's payments"""
        payments = self.get_queryset().filter(user=request.user)
        serializer = self.get_serializer(payments, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def booking_payments(self, request):
        """Get payments for a specific booking"""
        booking_id = request.query_params.get('booking_id')
        if not booking_id:
            return Response(
                {'error': 'booking_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        payments = self.get_queryset().filter(
            booking_id=booking_id,
            user=request.user
        )
        serializer = self.get_serializer(payments, many=True)
        return Response(serializer.data)


class PaymentRefundViewSet(viewsets.ModelViewSet):
    """ViewSet for Payment Refund management"""
    queryset = PaymentRefund.objects.select_related('payment', 'payment__user', 'payment__booking')
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'payment']
    
    def get_serializer_class(self):
        """Use different serializers for create vs other actions"""
        if self.action == 'create':
            return PaymentRefundCreateSerializer
        return PaymentRefundSerializer
    
    def get_queryset(self):
        """Filter refunds based on user role"""
        user = self.request.user
        queryset = super().get_queryset()
        
        # Regular users can only see refunds for their payments
        # Staff/admins can see all refunds
        if not user.is_staff:
            queryset = queryset.filter(payment__user=user)
        
        return queryset.order_by('-initiated_at')
    
    def perform_create(self, serializer):
        """Check permissions before creating refund"""
        payment = serializer.validated_data['payment']
        
        # Only payment owner or staff can create refunds
        if payment.user != self.request.user and not self.request.user.is_staff:
            raise PermissionDenied("You can only create refunds for your own payments")
        
        serializer.save()


@csrf_exempt
@api_view(['POST'])
@permission_classes([])  # No authentication required for webhooks
def razorpay_webhook(request):
    """
    Handle Razorpay webhook events
    This endpoint should be called by Razorpay when payment events occur
    """
    from django.conf import settings
    
    # Get webhook signature from headers
    webhook_signature = request.headers.get('X-Razorpay-Signature')
    if not webhook_signature:
        logger.warning("Razorpay webhook received without signature")
        return JsonResponse({'error': 'Missing signature'}, status=400)
    
    # Get payload
    payload = request.body
    
    # Verify webhook signature
    razorpay_service = get_razorpay_service()
    if not razorpay_service.available:
        logger.error("Razorpay service not available for webhook")
        return JsonResponse({'error': 'Payment gateway not configured'}, status=500)
    
    # Use webhook secret if available, otherwise use key secret
    webhook_secret = getattr(settings, 'RAZORPAY_WEBHOOK_SECRET', None) or razorpay_service.key_secret
    
    is_valid = razorpay_service.verify_webhook_signature(payload, webhook_signature, webhook_secret)
    
    if not is_valid:
        logger.warning("Invalid webhook signature received")
        return JsonResponse({'error': 'Invalid signature'}, status=400)
    
    # Parse payload
    try:
        event = json.loads(payload)
        event_type = event.get('event')
        payload_data = event.get('payload', {}).get('payment', {}) or event.get('payload', {}).get('order', {})
        
        logger.info(f"Razorpay webhook received: {event_type}")
        
        # Handle different event types
        if event_type in ['payment.captured', 'payment.authorized']:
            # Payment successful
            payment_id = payload_data.get('id')
            order_id = payload_data.get('order_id')
            
            try:
                payment = Payment.objects.get(gateway_payment_id=payment_id)
                
                with transaction.atomic():
                    payment.status = 'completed'
                    payment.completed_at = timezone.now()
                    payment.webhook_received = True
                    payment.webhook_payload = event
                    payment.metadata = payload_data
                    payment.save()
                
                logger.info(f"Payment {payment.transaction_id} marked as completed via webhook")
                return JsonResponse({'status': 'success'})
            
            except Payment.DoesNotExist:
                logger.warning(f"Payment not found for Razorpay payment ID: {payment_id}")
                return JsonResponse({'error': 'Payment not found'}, status=404)
        
        elif event_type == 'payment.failed':
            # Payment failed
            payment_id = payload_data.get('id')
            
            try:
                payment = Payment.objects.get(gateway_payment_id=payment_id)
                
                with transaction.atomic():
                    payment.status = 'failed'
                    payment.failed_at = timezone.now()
                    payment.failure_reason = payload_data.get('error_description', 'Payment failed')
                    payment.failure_code = payload_data.get('error_code', '')
                    payment.webhook_received = True
                    payment.webhook_payload = event
                    payment.metadata = payload_data
                    payment.save()
                
                logger.info(f"Payment {payment.transaction_id} marked as failed via webhook")
                return JsonResponse({'status': 'success'})
            
            except Payment.DoesNotExist:
                logger.warning(f"Payment not found for Razorpay payment ID: {payment_id}")
                return JsonResponse({'error': 'Payment not found'}, status=404)
        
        elif event_type == 'refund.created' or event_type == 'refund.processed':
            # Refund processed
            refund_data = event.get('payload', {}).get('refund', {})
            refund_id = refund_data.get('id')
            payment_id = refund_data.get('payment_id')
            
            try:
                payment = Payment.objects.get(gateway_payment_id=payment_id)
                refund = PaymentRefund.objects.get(gateway_refund_id=refund_id)
                
                with transaction.atomic():
                    refund.status = 'processed'
                    refund.processed_at = timezone.now()
                    refund.gateway_response = refund_data
                    refund.save()
                
                logger.info(f"Refund {refund.refund_id} marked as processed via webhook")
                return JsonResponse({'status': 'success'})
            
            except Payment.DoesNotExist:
                logger.warning(f"Payment not found for Razorpay payment ID: {payment_id}")
            except PaymentRefund.DoesNotExist:
                logger.warning(f"Refund not found for Razorpay refund ID: {refund_id}")
            
            return JsonResponse({'status': 'success'})  # Return success even if not found (idempotent)
        
        else:
            logger.info(f"Unhandled webhook event type: {event_type}")
            return JsonResponse({'status': 'success'})  # Return success for unhandled events
    
    except json.JSONDecodeError:
        logger.error("Invalid JSON in webhook payload")
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}")
        return JsonResponse({'error': 'Internal server error'}, status=500)
