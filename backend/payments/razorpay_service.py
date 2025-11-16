"""
Razorpay Payment Gateway Service
Handles all interactions with Razorpay API
"""
import razorpay
import hashlib
import hmac
import json
import logging
from django.conf import settings
from decimal import Decimal

logger = logging.getLogger(__name__)


class RazorpayService:
    """Service for interacting with Razorpay payment gateway"""
    
    def __init__(self):
        """Initialize Razorpay client with credentials from settings"""
        self.key_id = getattr(settings, 'RAZORPAY_KEY_ID', None)
        self.key_secret = getattr(settings, 'RAZORPAY_KEY_SECRET', None)
        
        if not self.key_id or not self.key_secret:
            logger.warning("Razorpay credentials not configured. Payment gateway will not work.")
            self.client = None
            self.available = False
        else:
            self.client = razorpay.Client(auth=(self.key_id, self.key_secret))
            self.available = True
    
    def create_order(self, amount, currency='INR', receipt=None, notes=None):
        """
        Create a Razorpay order
        
        Args:
            amount: Amount in rupees (Decimal or float)
            currency: Currency code (default: INR)
            receipt: Receipt identifier
            notes: Additional notes/metadata
            
        Returns:
            dict: Order details from Razorpay
        """
        if not self.available:
            raise Exception("Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.")
        
        try:
            # Convert Decimal to paise (Razorpay uses smallest currency unit)
            if isinstance(amount, Decimal):
                amount_paise = int(amount * 100)
            else:
                amount_paise = int(float(amount) * 100)
            
            order_data = {
                'amount': amount_paise,
                'currency': currency,
            }
            
            if receipt:
                order_data['receipt'] = receipt
            
            if notes:
                order_data['notes'] = notes
            
            response = self.client.order.create(data=order_data)
            logger.info(f"Razorpay order created: {response.get('id')}")
            return response
        
        except razorpay.errors.BadRequestError as e:
            logger.error(f"Razorpay BadRequestError: {str(e)}")
            raise Exception(f"Invalid request to Razorpay: {str(e)}")
        except razorpay.errors.ServerError as e:
            logger.error(f"Razorpay ServerError: {str(e)}")
            raise Exception(f"Razorpay server error: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error creating Razorpay order: {str(e)}")
            raise
    
    def verify_payment(self, razorpay_order_id, razorpay_payment_id, razorpay_signature):
        """
        Verify payment signature from Razorpay
        
        Args:
            razorpay_order_id: Order ID from Razorpay
            razorpay_payment_id: Payment ID from Razorpay
            razorpay_signature: Signature from Razorpay
            
        Returns:
            bool: True if signature is valid
        """
        if not self.available:
            raise Exception("Razorpay is not configured.")
        
        try:
            message = f"{razorpay_order_id}|{razorpay_payment_id}"
            generated_signature = hmac.new(
                self.key_secret.encode(),
                message.encode(),
                hashlib.sha256
            ).hexdigest()
            
            is_valid = hmac.compare_digest(generated_signature, razorpay_signature)
            
            if is_valid:
                logger.info(f"Payment signature verified for order: {razorpay_order_id}")
            else:
                logger.warning(f"Invalid payment signature for order: {razorpay_order_id}")
            
            return is_valid
        
        except Exception as e:
            logger.error(f"Error verifying payment signature: {str(e)}")
            return False
    
    def fetch_payment(self, payment_id):
        """
        Fetch payment details from Razorpay
        
        Args:
            payment_id: Razorpay payment ID
            
        Returns:
            dict: Payment details from Razorpay
        """
        if not self.available:
            raise Exception("Razorpay is not configured.")
        
        try:
            payment = self.client.payment.fetch(payment_id)
            logger.info(f"Fetched payment details: {payment_id}")
            return payment
        
        except razorpay.errors.BadRequestError as e:
            logger.error(f"Error fetching payment {payment_id}: {str(e)}")
            raise Exception(f"Invalid payment ID: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error fetching payment: {str(e)}")
            raise
    
    def fetch_order(self, order_id):
        """
        Fetch order details from Razorpay
        
        Args:
            order_id: Razorpay order ID
            
        Returns:
            dict: Order details from Razorpay
        """
        if not self.available:
            raise Exception("Razorpay is not configured.")
        
        try:
            order = self.client.order.fetch(order_id)
            logger.info(f"Fetched order details: {order_id}")
            return order
        
        except razorpay.errors.BadRequestError as e:
            logger.error(f"Error fetching order {order_id}: {str(e)}")
            raise Exception(f"Invalid order ID: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error fetching order: {str(e)}")
            raise
    
    def refund_payment(self, payment_id, amount=None, notes=None):
        """
        Process a refund through Razorpay
        
        Args:
            payment_id: Razorpay payment ID
            amount: Refund amount (in rupees). If None, full refund
            notes: Refund notes/reason
            
        Returns:
            dict: Refund details from Razorpay
        """
        if not self.available:
            raise Exception("Razorpay is not configured.")
        
        try:
            refund_data = {}
            
            if amount:
                # Convert to paise
                if isinstance(amount, Decimal):
                    refund_data['amount'] = int(amount * 100)
                else:
                    refund_data['amount'] = int(float(amount) * 100)
            
            if notes:
                refund_data['notes'] = notes
            
            refund = self.client.payment.refund(payment_id, refund_data)
            logger.info(f"Refund processed: {refund.get('id')} for payment {payment_id}")
            return refund
        
        except razorpay.errors.BadRequestError as e:
            logger.error(f"Error processing refund: {str(e)}")
            raise Exception(f"Refund failed: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error processing refund: {str(e)}")
            raise
    
    def verify_webhook_signature(self, payload, signature, secret=None):
        """
        Verify Razorpay webhook signature
        
        Args:
            payload: Webhook payload (bytes or string)
            signature: X-Razorpay-Signature header value
            secret: Webhook secret (defaults to key_secret if not provided)
            
        Returns:
            bool: True if signature is valid
        """
        if not self.available:
            raise Exception("Razorpay is not configured.")
        
        try:
            secret = secret or self.key_secret
            
            if isinstance(payload, str):
                payload = payload.encode('utf-8')
            
            expected_signature = hmac.new(
                secret.encode(),
                payload,
                hashlib.sha256
            ).hexdigest()
            
            is_valid = hmac.compare_digest(expected_signature, signature)
            
            if not is_valid:
                logger.warning("Invalid webhook signature received")
            
            return is_valid
        
        except Exception as e:
            logger.error(f"Error verifying webhook signature: {str(e)}")
            return False


# Global instance
_razorpay_service = None


def get_razorpay_service():
    """Get or create Razorpay service instance"""
    global _razorpay_service
    if _razorpay_service is None:
        _razorpay_service = RazorpayService()
    return _razorpay_service

