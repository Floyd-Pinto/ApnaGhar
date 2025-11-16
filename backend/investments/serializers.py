from rest_framework import serializers
from .models import InvestmentProperty, Investment, InvestmentTransaction, Dividend, DividendPayment
from django.contrib.auth import get_user_model

User = get_user_model()


class InvestmentPropertySerializer(serializers.ModelSerializer):
    """Serializer for InvestmentProperty model"""
    property_unit_number = serializers.CharField(source='property.unit_number', read_only=True)
    property_type = serializers.CharField(source='property.property_type', read_only=True)
    property_price = serializers.DecimalField(source='property.price', max_digits=12, decimal_places=2, read_only=True)
    project_name = serializers.CharField(source='property.project.name', read_only=True)
    project_id = serializers.UUIDField(source='property.project.id', read_only=True)
    
    class Meta:
        model = InvestmentProperty
        fields = [
            'id', 'property', 'property_unit_number', 'property_type', 'property_price',
            'project_name', 'project_id', 'total_tokens', 'token_price', 'available_tokens',
            'sold_tokens', 'minimum_investment', 'maximum_investment_per_user',
            'revenue_share_percentage', 'dividend_frequency', 'status',
            'tokenization_date', 'subscription_start_date', 'subscription_end_date',
            'description', 'terms_conditions', 'metadata',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'available_tokens', 'sold_tokens', 'created_at', 'updated_at']


class InvestmentSerializer(serializers.ModelSerializer):
    """Serializer for Investment model"""
    investment_property_details = InvestmentPropertySerializer(source='investment_property', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Investment
        fields = [
            'id', 'investment_property', 'investment_property_details', 'user', 'user_email', 'user_name',
            'tokens', 'token_price', 'total_amount', 'current_token_price', 'current_value',
            'total_dividends_received', 'total_return', 'return_percentage',
            'status', 'purchase_date', 'confirmation_date', 'sale_date',
            'metadata', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'investment_property_details', 'user_email', 'user_name',
            'total_amount', 'current_value', 'total_dividends_received', 'total_return',
            'return_percentage', 'purchase_date', 'confirmation_date', 'sale_date',
            'created_at', 'updated_at'
        ]
    
    def get_user_name(self, obj):
        """Return user's full name"""
        if obj.user:
            name = f"{obj.user.first_name} {obj.user.last_name}".strip()
            return name if name else obj.user.email
        return None


class InvestmentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating investments"""
    
    class Meta:
        model = Investment
        fields = ['investment_property', 'tokens']
    
    def validate(self, data):
        """Validate investment"""
        investment_property = data.get('investment_property')
        tokens = data.get('tokens')
        
        if not investment_property:
            raise serializers.ValidationError("Investment property is required")
        
        if tokens is None or tokens <= 0:
            raise serializers.ValidationError("Number of tokens must be greater than 0")
        
        # Check if property is available for investment
        if investment_property.status != 'active':
            raise serializers.ValidationError("Property is not available for investment")
        
        # Check available tokens
        if tokens > investment_property.available_tokens:
            raise serializers.ValidationError(f"Only {investment_property.available_tokens} tokens available")
        
        # Check minimum investment
        total_amount = tokens * investment_property.token_price
        if total_amount < investment_property.minimum_investment:
            raise serializers.ValidationError(f"Minimum investment is {investment_property.minimum_investment}")
        
        # Check maximum investment per user
        if investment_property.maximum_investment_per_user:
            user = self.context['request'].user
            existing_investment = Investment.objects.filter(
                investment_property=investment_property,
                user=user,
                status__in=['confirmed', 'active']
            ).first()
            
            existing_amount = existing_investment.total_amount if existing_investment else Decimal('0')
            new_total = existing_amount + total_amount
            
            if new_total > investment_property.maximum_investment_per_user:
                raise serializers.ValidationError(
                    f"Maximum investment per user is {investment_property.maximum_investment_per_user}"
                )
        
        return data
    
    def create(self, validated_data):
        """Create investment"""
        user = self.context['request'].user
        investment_property = validated_data['investment_property']
        tokens = validated_data['tokens']
        
        # Get or create investment
        investment, created = Investment.objects.get_or_create(
            investment_property=investment_property,
            user=user,
            defaults={
                'tokens': tokens,
                'token_price': investment_property.token_price,
                'status': 'pending',
            }
        )
        
        if not created:
            # Update existing investment
            investment.tokens += tokens
            investment.token_price = investment_property.token_price
            investment.save()
        
        return investment


class InvestmentTransactionSerializer(serializers.ModelSerializer):
    """Serializer for InvestmentTransaction model"""
    investment_property_details = InvestmentPropertySerializer(source='investment_property', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    related_user_email = serializers.EmailField(source='related_user.email', read_only=True)
    
    class Meta:
        model = InvestmentTransaction
        fields = [
            'id', 'investment', 'investment_property', 'investment_property_details',
            'user', 'user_email', 'transaction_type', 'tokens', 'token_price', 'total_amount',
            'payment', 'payment_status', 'status', 'related_user', 'related_user_email',
            'metadata', 'created_at', 'updated_at', 'completed_at'
        ]
        read_only_fields = [
            'id', 'investment_property_details', 'user_email', 'related_user_email',
            'total_amount', 'created_at', 'updated_at', 'completed_at'
        ]


class DividendSerializer(serializers.ModelSerializer):
    """Serializer for Dividend model"""
    investment_property_details = InvestmentPropertySerializer(source='investment_property', read_only=True)
    approved_by_email = serializers.EmailField(source='approved_by.email', read_only=True)
    
    class Meta:
        model = Dividend
        fields = [
            'id', 'investment_property', 'investment_property_details',
            'amount_per_token', 'total_amount', 'tokens_eligible',
            'period_start', 'period_end', 'payment_date',
            'status', 'approved_by', 'approved_by_email', 'approved_at',
            'description', 'metadata',
            'created_at', 'updated_at', 'paid_at'
        ]
        read_only_fields = [
            'id', 'investment_property_details', 'approved_by_email',
            'total_amount', 'approved_at', 'paid_at', 'created_at', 'updated_at'
        ]


class DividendPaymentSerializer(serializers.ModelSerializer):
    """Serializer for DividendPayment model"""
    dividend_details = DividendSerializer(source='dividend', read_only=True)
    investment_details = InvestmentSerializer(source='investment', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = DividendPayment
        fields = [
            'id', 'dividend', 'dividend_details', 'investment', 'investment_details',
            'user', 'user_email', 'tokens', 'amount', 'payment', 'payment_reference',
            'status', 'paid_at', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'dividend_details', 'investment_details', 'user_email',
            'paid_at', 'created_at', 'updated_at'
        ]

