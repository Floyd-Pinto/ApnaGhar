from rest_framework import serializers
from .models import Payment, PaymentRefund
from django.contrib.auth import get_user_model

User = get_user_model()


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for Payment model"""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    booking_number = serializers.CharField(source='booking.booking_number', read_only=True)
    property_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Payment
        fields = [
            'id', 'transaction_id', 'payment_id', 'order_id',
            'user', 'user_email', 'user_name', 'booking', 'booking_number',
            'amount', 'currency', 'status', 'payment_method', 'payment_type',
            'gateway', 'gateway_transaction_id', 'gateway_order_id', 'gateway_payment_id',
            'gateway_signature', 'description', 'notes', 'metadata',
            'initiated_at', 'completed_at', 'failed_at',
            'failure_reason', 'failure_code',
            'refund_id', 'refund_amount', 'refund_status', 'refund_reason',
            'webhook_received', 'property_details', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'transaction_id', 'user_email', 'user_name', 'booking_number',
            'property_details', 'gateway_transaction_id', 'gateway_order_id',
            'gateway_payment_id', 'gateway_signature', 'initiated_at',
            'completed_at', 'failed_at', 'webhook_received', 'created_at', 'updated_at'
        ]
    
    def get_user_name(self, obj):
        """Return user's full name"""
        if obj.user:
            name = f"{obj.user.first_name} {obj.user.last_name}".strip()
            return name if name else obj.user.email
        return None
    
    def get_property_details(self, obj):
        """Return property information if booking exists"""
        if obj.booking and obj.booking.property:
            prop = obj.booking.property
            return {
                'id': str(prop.id),
                'unit_number': prop.unit_number,
                'property_type': prop.property_type,
                'project_name': prop.project.name,
                'project_id': str(prop.project.id),
            }
        return None


class PaymentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating payments"""
    booking_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = Payment
        fields = [
            'booking_id', 'amount', 'currency', 'payment_method',
            'payment_type', 'description', 'notes'
        ]
        extra_kwargs = {
            'currency': {'required': False, 'default': 'INR'},
            'payment_method': {'required': True},
            'payment_type': {'required': False, 'default': 'booking_token'},
            'description': {'required': False, 'allow_blank': True},
            'notes': {'required': False},
        }
    
    def validate(self, data):
        """Validate payment data"""
        amount = data.get('amount')
        if amount and amount <= 0:
            raise serializers.ValidationError({'amount': 'Amount must be greater than 0'})
        return data
    
    def create(self, validated_data):
        """Create payment and initiate gateway order"""
        from .razorpay_service import get_razorpay_service
        from projects.models import Booking
        
        booking_id = validated_data.pop('booking_id', None)
        user = self.context['request'].user
        
        # Get booking if provided
        booking = None
        if booking_id:
            try:
                booking = Booking.objects.get(id=booking_id, buyer=user)
            except Booking.DoesNotExist:
                raise serializers.ValidationError({'booking_id': 'Booking not found or access denied'})
        
        # Create payment record
        payment = Payment.objects.create(
            user=user,
            booking=booking,
            **validated_data
        )
        
        # If payment method is Razorpay, create order
        if validated_data.get('payment_method') == 'razorpay':
            try:
                razorpay_service = get_razorpay_service()
                if razorpay_service.available:
                    notes = {
                        'transaction_id': payment.transaction_id,
                        'user_id': str(user.id),
                    }
                    if booking:
                        notes['booking_id'] = str(booking.id)
                        notes['booking_number'] = booking.booking_number
                    
                    if validated_data.get('notes'):
                        notes.update(validated_data['notes'])
                    
                    order = razorpay_service.create_order(
                        amount=payment.amount,
                        currency=payment.currency,
                        receipt=payment.transaction_id,
                        notes=notes
                    )
                    
                    payment.gateway_order_id = order.get('id')
                    payment.gateway = 'razorpay'
                    payment.save()
            except Exception as e:
                # Payment record created but gateway order failed
                payment.failure_reason = str(e)
                payment.status = 'failed'
                payment.save()
                raise serializers.ValidationError({'gateway': f'Failed to create payment order: {str(e)}'})
        
        return payment


class PaymentVerifySerializer(serializers.Serializer):
    """Serializer for verifying payment"""
    razorpay_order_id = serializers.CharField(required=True)
    razorpay_payment_id = serializers.CharField(required=True)
    razorpay_signature = serializers.CharField(required=True)
    
    def validate(self, data):
        """Verify payment signature"""
        from .razorpay_service import get_razorpay_service
        
        razorpay_service = get_razorpay_service()
        if not razorpay_service.available:
            raise serializers.ValidationError({'gateway': 'Payment gateway is not configured'})
        
        is_valid = razorpay_service.verify_payment(
            data['razorpay_order_id'],
            data['razorpay_payment_id'],
            data['razorpay_signature']
        )
        
        if not is_valid:
            raise serializers.ValidationError({'signature': 'Invalid payment signature'})
        
        return data


class PaymentRefundSerializer(serializers.ModelSerializer):
    """Serializer for PaymentRefund model"""
    payment_transaction_id = serializers.CharField(source='payment.transaction_id', read_only=True)
    
    class Meta:
        model = PaymentRefund
        fields = [
            'id', 'refund_id', 'payment', 'payment_transaction_id',
            'amount', 'currency', 'status', 'gateway_refund_id',
            'reason', 'notes', 'gateway_response',
            'initiated_at', 'processed_at', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'refund_id', 'payment_transaction_id', 'gateway_refund_id',
            'status', 'gateway_response', 'initiated_at', 'processed_at',
            'created_at', 'updated_at'
        ]


class PaymentRefundCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating refunds"""
    
    class Meta:
        model = PaymentRefund
        fields = ['payment', 'amount', 'reason', 'notes']
        extra_kwargs = {
            'amount': {'required': False},
            'reason': {'required': False, 'allow_blank': True},
            'notes': {'required': False},
        }
    
    def validate(self, data):
        """Validate refund data"""
        payment = data.get('payment')
        amount = data.get('amount')
        
        if not payment:
            raise serializers.ValidationError({'payment': 'Payment is required'})
        
        # Check if payment is completed
        if payment.status != 'completed':
            raise serializers.ValidationError({'payment': 'Can only refund completed payments'})
        
        # Check refund amount
        if amount:
            if amount <= 0:
                raise serializers.ValidationError({'amount': 'Refund amount must be greater than 0'})
            if amount > payment.amount - payment.refund_amount:
                raise serializers.ValidationError({'amount': 'Refund amount exceeds available refund amount'})
        else:
            # Full refund
            available_amount = payment.amount - payment.refund_amount
            data['amount'] = available_amount
        
        return data
    
    def create(self, validated_data):
        """Create refund and process through gateway"""
        from .razorpay_service import get_razorpay_service
        
        payment = validated_data['payment']
        amount = validated_data['amount']
        reason = validated_data.get('reason', '')
        notes = validated_data.get('notes', {})
        
        # Create refund record
        refund = PaymentRefund.objects.create(
            payment=payment,
            amount=amount,
            currency=payment.currency,
            reason=reason,
            notes=notes
        )
        
        # Process refund through gateway if payment was via gateway
        if payment.gateway == 'razorpay' and payment.gateway_payment_id:
            try:
                razorpay_service = get_razorpay_service()
                if razorpay_service.available:
                    refund_notes = {
                        'refund_id': refund.refund_id,
                        'transaction_id': payment.transaction_id,
                    }
                    if reason:
                        refund_notes['reason'] = reason
                    if notes:
                        refund_notes.update(notes)
                    
                    gateway_refund = razorpay_service.refund_payment(
                        payment_id=payment.gateway_payment_id,
                        amount=amount,
                        notes=refund_notes
                    )
                    
                    refund.gateway_refund_id = gateway_refund.get('id')
                    refund.status = 'processed'
                    refund.gateway_response = gateway_refund
                    refund.save()
            except Exception as e:
                # Refund record created but gateway refund failed
                refund.status = 'failed'
                refund.gateway_response = {'error': str(e)}
                refund.save()
                raise serializers.ValidationError({'gateway': f'Failed to process refund: {str(e)}'})
        else:
            # Manual refund (not through gateway)
            refund.status = 'processed'
            refund.save()
        
        return refund

