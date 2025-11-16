from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal
import uuid

User = get_user_model()


class InvestmentProperty(models.Model):
    """Model for properties available for tokenization"""
    STATUS = [
        ('draft', 'Draft'),
        ('tokenizing', 'Tokenizing'),
        ('active', 'Active'),
        ('fully_subscribed', 'Fully Subscribed'),
        ('suspended', 'Suspended'),
        ('closed', 'Closed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.OneToOneField('projects.Property', on_delete=models.CASCADE, related_name='investment_property')
    
    # Tokenization Details
    total_tokens = models.IntegerField(validators=[MinValueValidator(1)], help_text='Total number of tokens')
    token_price = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))], help_text='Price per token')
    available_tokens = models.IntegerField(default=0, help_text='Available tokens for purchase')
    sold_tokens = models.IntegerField(default=0, help_text='Tokens already sold')
    
    # Investment Terms
    minimum_investment = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))], help_text='Minimum investment amount')
    maximum_investment_per_user = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, help_text='Maximum investment per user (optional)')
    
    # Revenue Sharing
    revenue_share_percentage = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('100'))], default=Decimal('0'), help_text='Percentage of revenue shared with investors')
    dividend_frequency = models.CharField(max_length=20, choices=[('monthly', 'Monthly'), ('quarterly', 'Quarterly'), ('annually', 'Annually')], default='quarterly')
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS, default='draft')
    
    # Dates
    tokenization_date = models.DateTimeField(null=True, blank=True)
    subscription_start_date = models.DateTimeField(null=True, blank=True)
    subscription_end_date = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    description = models.TextField(blank=True)
    terms_conditions = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'investment_properties'
        verbose_name = 'Investment Property'
        verbose_name_plural = 'Investment Properties'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['property']),
        ]
    
    def save(self, *args, **kwargs):
        # Auto-calculate available_tokens
        if self.total_tokens:
            self.available_tokens = self.total_tokens - self.sold_tokens
        
        # Update status based on token availability
        if self.available_tokens <= 0 and self.status == 'active':
            self.status = 'fully_subscribed'
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Investment Property - {self.property.unit_number} ({self.sold_tokens}/{self.total_tokens} tokens)"


class Investment(models.Model):
    """Model for user investments in tokenized properties"""
    STATUS = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('active', 'Active'),
        ('sold', 'Sold'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    investment_property = models.ForeignKey(InvestmentProperty, on_delete=models.CASCADE, related_name='investments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='investments')
    
    # Investment Details
    tokens = models.IntegerField(validators=[MinValueValidator(1)], help_text='Number of tokens purchased')
    token_price = models.DecimalField(max_digits=12, decimal_places=2, help_text='Price per token at purchase')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, help_text='Total investment amount')
    
    # Current Value
    current_token_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, help_text='Current token price')
    current_value = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, help_text='Current investment value')
    
    # Returns
    total_dividends_received = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0'), help_text='Total dividends received')
    total_return = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0'), help_text='Total return (dividends + capital gains)')
    return_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0'), help_text='Return percentage')
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS, default='pending')
    
    # Dates
    purchase_date = models.DateTimeField(null=True, blank=True)
    confirmation_date = models.DateTimeField(null=True, blank=True)
    sale_date = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'investments'
        verbose_name = 'Investment'
        verbose_name_plural = 'Investments'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['investment_property', 'status']),
            models.Index(fields=['status', 'created_at']),
        ]
        unique_together = [['investment_property', 'user']]  # One investment per user per property
    
    def save(self, *args, **kwargs):
        # Calculate total amount
        if self.tokens and self.token_price:
            self.total_amount = Decimal(str(self.tokens)) * self.token_price
        
        # Calculate current value
        if self.tokens and self.current_token_price:
            self.current_value = Decimal(str(self.tokens)) * self.current_token_price
        
        # Calculate total return
        if self.current_value and self.total_amount:
            capital_gain = self.current_value - self.total_amount
            self.total_return = self.total_dividends_received + capital_gain
            self.return_percentage = (self.total_return / self.total_amount) * Decimal('100') if self.total_amount > 0 else Decimal('0')
        
        # Set dates
        if self.status == 'confirmed' and not self.confirmation_date:
            self.confirmation_date = timezone.now()
            if not self.purchase_date:
                self.purchase_date = timezone.now()
        
        if self.status == 'sold' and not self.sale_date:
            self.sale_date = timezone.now()
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.user.email} - {self.tokens} tokens in {self.investment_property.property.unit_number}"


class InvestmentTransaction(models.Model):
    """Model for investment transactions (buy/sell)"""
    TRANSACTION_TYPE = [
        ('buy', 'Buy'),
        ('sell', 'Sell'),
        ('transfer', 'Transfer'),
    ]
    
    STATUS = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    investment = models.ForeignKey(Investment, on_delete=models.CASCADE, related_name='transactions', null=True, blank=True)
    investment_property = models.ForeignKey(InvestmentProperty, on_delete=models.CASCADE, related_name='transactions')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='investment_transactions')
    
    # Transaction Details
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPE)
    tokens = models.IntegerField(validators=[MinValueValidator(1)])
    token_price = models.DecimalField(max_digits=12, decimal_places=2)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Payment
    payment = models.ForeignKey('payments.Payment', on_delete=models.SET_NULL, null=True, blank=True, related_name='investment_transactions')
    payment_status = models.CharField(max_length=20, choices=[('pending', 'Pending'), ('completed', 'Completed'), ('failed', 'Failed')], default='pending')
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS, default='pending')
    
    # Related User (for transfers)
    related_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='received_transactions')
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'investment_transactions'
        verbose_name = 'Investment Transaction'
        verbose_name_plural = 'Investment Transactions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['investment_property', 'transaction_type']),
            models.Index(fields=['status', 'created_at']),
        ]
    
    def save(self, *args, **kwargs):
        # Calculate total amount
        if self.tokens and self.token_price:
            self.total_amount = Decimal(str(self.tokens)) * self.token_price
        
        # Set completion date
        if self.status == 'completed' and not self.completed_at:
            self.completed_at = timezone.now()
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.transaction_type.upper()} {self.tokens} tokens - {self.user.email}"


class Dividend(models.Model):
    """Model for dividend/distribution payments to investors"""
    STATUS = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('processing', 'Processing'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    investment_property = models.ForeignKey(InvestmentProperty, on_delete=models.CASCADE, related_name='dividends')
    
    # Dividend Details
    amount_per_token = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))], help_text='Dividend amount per token')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, help_text='Total dividend amount')
    tokens_eligible = models.IntegerField(help_text='Number of tokens eligible for dividend')
    
    # Period
    period_start = models.DateField()
    period_end = models.DateField()
    payment_date = models.DateField()
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS, default='pending')
    
    # Approved By
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_dividends')
    approved_at = models.DateTimeField(null=True, blank=True)
    
    # Description
    description = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'dividends'
        verbose_name = 'Dividend'
        verbose_name_plural = 'Dividends'
        ordering = ['-period_end', '-created_at']
        indexes = [
            models.Index(fields=['investment_property', 'status']),
            models.Index(fields=['status', 'payment_date']),
            models.Index(fields=['period_start', 'period_end']),
        ]
    
    def save(self, *args, **kwargs):
        # Calculate total amount
        if self.amount_per_token and self.tokens_eligible:
            self.total_amount = Decimal(str(self.amount_per_token)) * Decimal(str(self.tokens_eligible))
        
        # Set approval date
        if self.status == 'approved' and not self.approved_at:
            self.approved_at = timezone.now()
        
        # Set paid date
        if self.status == 'paid' and not self.paid_at:
            self.paid_at = timezone.now()
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Dividend - {self.investment_property.property.unit_number} - {self.period_end}"


class DividendPayment(models.Model):
    """Model for individual dividend payments to investors"""
    STATUS = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    dividend = models.ForeignKey(Dividend, on_delete=models.CASCADE, related_name='payments')
    investment = models.ForeignKey(Investment, on_delete=models.CASCADE, related_name='dividend_payments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='dividend_payments')
    
    # Payment Details
    tokens = models.IntegerField(help_text='Number of tokens eligible for this dividend')
    amount = models.DecimalField(max_digits=12, decimal_places=2, help_text='Dividend amount')
    
    # Payment
    payment = models.ForeignKey('payments.Payment', on_delete=models.SET_NULL, null=True, blank=True, related_name='dividend_payments')
    payment_reference = models.CharField(max_length=255, blank=True, null=True)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS, default='pending')
    
    # Dates
    paid_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'dividend_payments'
        verbose_name = 'Dividend Payment'
        verbose_name_plural = 'Dividend Payments'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['dividend', 'status']),
            models.Index(fields=['investment', 'status']),
        ]
        unique_together = [['dividend', 'investment']]  # One payment per investment per dividend
    
    def save(self, *args, **kwargs):
        # Set paid date
        if self.status == 'paid' and not self.paid_at:
            self.paid_at = timezone.now()
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Dividend Payment - {self.user.email} - {self.amount}"
