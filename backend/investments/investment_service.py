"""
Investment service for token management and revenue sharing
"""
from django.db.models import Sum, Count, Q
from django.utils import timezone
from decimal import Decimal
from .models import InvestmentProperty, Investment, InvestmentTransaction, Dividend, DividendPayment
from payments.models import Payment
import logging

logger = logging.getLogger(__name__)


class InvestmentService:
    """Service for investment operations"""
    
    @staticmethod
    def create_investment_transaction(investment_property, user, tokens, transaction_type='buy'):
        """Create an investment transaction"""
        try:
            token_price = investment_property.token_price
            total_amount = Decimal(str(tokens)) * token_price
            
            transaction = InvestmentTransaction.objects.create(
                investment_property=investment_property,
                user=user,
                transaction_type=transaction_type,
                tokens=tokens,
                token_price=token_price,
                total_amount=total_amount,
                status='pending',
            )
            
            return transaction
        except Exception as e:
            logger.error(f"Error creating investment transaction: {str(e)}")
            raise
    
    @staticmethod
    def process_investment_transaction(transaction, payment=None):
        """Process an investment transaction"""
        try:
            if transaction.transaction_type == 'buy':
                # Get or create investment
                investment, created = Investment.objects.get_or_create(
                    investment_property=transaction.investment_property,
                    user=transaction.user,
                    defaults={
                        'tokens': 0,
                        'token_price': transaction.token_price,
                        'status': 'pending',
                    }
                )
                
                # Update investment
                investment.tokens += transaction.tokens
                investment.token_price = transaction.token_price
                
                if payment and payment.status == 'completed':
                    investment.status = 'confirmed'
                
                investment.save()
                transaction.investment = investment
                
                # Update investment property
                investment_property = transaction.investment_property
                investment_property.sold_tokens += transaction.tokens
                investment_property.available_tokens -= transaction.tokens
                investment_property.save()
            
            elif transaction.transaction_type == 'sell':
                # Find investment
                investment = Investment.objects.filter(
                    investment_property=transaction.investment_property,
                    user=transaction.user,
                    status__in=['confirmed', 'active']
                ).first()
                
                if not investment:
                    raise ValueError("Investment not found")
                
                if investment.tokens < transaction.tokens:
                    raise ValueError("Insufficient tokens")
                
                # Update investment
                investment.tokens -= transaction.tokens
                if investment.tokens <= 0:
                    investment.status = 'sold'
                investment.save()
                transaction.investment = investment
                
                # Update investment property
                investment_property = transaction.investment_property
                investment_property.sold_tokens -= transaction.tokens
                investment_property.available_tokens += transaction.tokens
                investment_property.save()
            
            # Update transaction
            if payment:
                transaction.payment = payment
                transaction.payment_status = payment.status
            
            if transaction.status == 'pending':
                transaction.status = 'processing'
            
            transaction.save()
            
            return transaction
        except Exception as e:
            logger.error(f"Error processing investment transaction: {str(e)}")
            transaction.status = 'failed'
            transaction.save()
            raise
    
    @staticmethod
    def complete_investment_transaction(transaction):
        """Complete an investment transaction"""
        try:
            transaction.status = 'completed'
            transaction.save()
            
            # Update investment status
            if transaction.investment:
                if transaction.transaction_type == 'buy':
                    transaction.investment.status = 'active'
                elif transaction.transaction_type == 'sell':
                    if transaction.investment.tokens <= 0:
                        transaction.investment.status = 'sold'
                transaction.investment.save()
            
            return transaction
        except Exception as e:
            logger.error(f"Error completing investment transaction: {str(e)}")
            raise
    
    @staticmethod
    def create_dividend(investment_property, amount_per_token, period_start, period_end, payment_date, description=''):
        """Create a dividend for an investment property"""
        try:
            # Get all active investments
            investments = Investment.objects.filter(
                investment_property=investment_property,
                status__in=['confirmed', 'active']
            )
            
            # Calculate total tokens eligible
            total_tokens = investments.aggregate(total=Sum('tokens'))['total'] or 0
            
            if total_tokens == 0:
                raise ValueError("No eligible tokens for dividend")
            
            # Create dividend
            dividend = Dividend.objects.create(
                investment_property=investment_property,
                amount_per_token=amount_per_token,
                tokens_eligible=total_tokens,
                period_start=period_start,
                period_end=period_end,
                payment_date=payment_date,
                description=description,
                status='pending',
            )
            
            # Create dividend payments for each investment
            for investment in investments:
                dividend_amount = Decimal(str(amount_per_token)) * Decimal(str(investment.tokens))
                
                DividendPayment.objects.create(
                    dividend=dividend,
                    investment=investment,
                    user=investment.user,
                    tokens=investment.tokens,
                    amount=dividend_amount,
                    status='pending',
                )
            
            return dividend
        except Exception as e:
            logger.error(f"Error creating dividend: {str(e)}")
            raise
    
    @staticmethod
    def process_dividend_payment(dividend_payment, payment=None):
        """Process a dividend payment"""
        try:
            if payment:
                dividend_payment.payment = payment
                dividend_payment.payment_reference = payment.transaction_id
            
            if payment and payment.status == 'completed':
                dividend_payment.status = 'paid'
                
                # Update investment
                investment = dividend_payment.investment
                investment.total_dividends_received += dividend_payment.amount
                investment.save()
            
            dividend_payment.save()
            
            return dividend_payment
        except Exception as e:
            logger.error(f"Error processing dividend payment: {str(e)}")
            raise
    
    @staticmethod
    def get_user_portfolio(user):
        """Get user's investment portfolio"""
        investments = Investment.objects.filter(
            user=user,
            status__in=['confirmed', 'active']
        ).select_related('investment_property__property__project')
        
        portfolio = {
            'total_investments': investments.count(),
            'total_tokens': investments.aggregate(total=Sum('tokens'))['total'] or 0,
            'total_invested': investments.aggregate(total=Sum('total_amount'))['total'] or Decimal('0'),
            'total_current_value': sum(float(inv.current_value or inv.total_amount) for inv in investments),
            'total_dividends': investments.aggregate(total=Sum('total_dividends_received'))['total'] or Decimal('0'),
            'total_return': sum(float(inv.total_return or Decimal('0')) for inv in investments),
            'investments': investments,
        }
        
        return portfolio
    
    @staticmethod
    def calculate_investment_value(investment):
        """Calculate current value of an investment"""
        try:
            # Get current token price (could be from market or property valuation)
            current_price = investment.investment_property.token_price
            investment.current_token_price = current_price
            investment.current_value = Decimal(str(investment.tokens)) * current_price
            investment.save()
            
            return investment.current_value
        except Exception as e:
            logger.error(f"Error calculating investment value: {str(e)}")
            return investment.total_amount

