from django.contrib import admin
from .models import InvestmentProperty, Investment, InvestmentTransaction, Dividend, DividendPayment


@admin.register(InvestmentProperty)
class InvestmentPropertyAdmin(admin.ModelAdmin):
    list_display = ['id', 'property', 'total_tokens', 'token_price', 'available_tokens', 'sold_tokens', 'status', 'created_at']
    list_filter = ['status', 'dividend_frequency', 'created_at']
    search_fields = ['property__unit_number', 'property__project__name']
    readonly_fields = ['id', 'available_tokens', 'sold_tokens', 'created_at', 'updated_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'property', 'status')
        }),
        ('Tokenization Details', {
            'fields': ('total_tokens', 'token_price', 'available_tokens', 'sold_tokens')
        }),
        ('Investment Terms', {
            'fields': ('minimum_investment', 'maximum_investment_per_user', 'revenue_share_percentage', 'dividend_frequency')
        }),
        ('Dates', {
            'fields': ('tokenization_date', 'subscription_start_date', 'subscription_end_date')
        }),
        ('Details', {
            'fields': ('description', 'terms_conditions', 'metadata'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(Investment)
class InvestmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'investment_property', 'tokens', 'total_amount', 'current_value', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['user__email', 'investment_property__property__unit_number']
    readonly_fields = ['id', 'total_amount', 'current_value', 'total_return', 'return_percentage', 'purchase_date', 'confirmation_date', 'sale_date', 'created_at', 'updated_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'investment_property', 'user', 'status')
        }),
        ('Investment Details', {
            'fields': ('tokens', 'token_price', 'total_amount', 'current_token_price', 'current_value')
        }),
        ('Returns', {
            'fields': ('total_dividends_received', 'total_return', 'return_percentage')
        }),
        ('Dates', {
            'fields': ('purchase_date', 'confirmation_date', 'sale_date')
        }),
        ('Metadata', {
            'fields': ('metadata',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(InvestmentTransaction)
class InvestmentTransactionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'investment_property', 'transaction_type', 'tokens', 'total_amount', 'status', 'created_at']
    list_filter = ['transaction_type', 'status', 'payment_status', 'created_at']
    search_fields = ['user__email', 'investment_property__property__unit_number']
    readonly_fields = ['id', 'total_amount', 'created_at', 'updated_at', 'completed_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'investment', 'investment_property', 'user', 'transaction_type', 'status')
        }),
        ('Transaction Details', {
            'fields': ('tokens', 'token_price', 'total_amount')
        }),
        ('Payment', {
            'fields': ('payment', 'payment_status')
        }),
        ('Transfer', {
            'fields': ('related_user',)
        }),
        ('Metadata', {
            'fields': ('metadata',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'completed_at')
        }),
    )


@admin.register(Dividend)
class DividendAdmin(admin.ModelAdmin):
    list_display = ['id', 'investment_property', 'amount_per_token', 'total_amount', 'payment_date', 'status', 'created_at']
    list_filter = ['status', 'payment_date', 'created_at']
    search_fields = ['investment_property__property__unit_number']
    readonly_fields = ['id', 'total_amount', 'approved_at', 'paid_at', 'created_at', 'updated_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'investment_property', 'status')
        }),
        ('Dividend Details', {
            'fields': ('amount_per_token', 'tokens_eligible', 'total_amount')
        }),
        ('Period', {
            'fields': ('period_start', 'period_end', 'payment_date')
        }),
        ('Approval', {
            'fields': ('approved_by', 'approved_at', 'description')
        }),
        ('Metadata', {
            'fields': ('metadata',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'paid_at')
        }),
    )


@admin.register(DividendPayment)
class DividendPaymentAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'dividend', 'tokens', 'amount', 'status', 'paid_at', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['user__email', 'dividend__investment_property__property__unit_number']
    readonly_fields = ['id', 'paid_at', 'created_at', 'updated_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'dividend', 'investment', 'user', 'status')
        }),
        ('Payment Details', {
            'fields': ('tokens', 'amount', 'payment', 'payment_reference')
        }),
        ('Dates', {
            'fields': ('paid_at',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
