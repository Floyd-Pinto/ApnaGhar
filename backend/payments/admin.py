from django.contrib import admin
from .models import Payment, PaymentRefund


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['transaction_id', 'user', 'amount', 'currency', 'status', 'payment_method', 'gateway', 'initiated_at']
    list_filter = ['status', 'payment_method', 'gateway', 'currency', 'created_at']
    search_fields = ['transaction_id', 'gateway_payment_id', 'gateway_order_id', 'user__email']
    readonly_fields = ['id', 'transaction_id', 'initiated_at', 'completed_at', 'failed_at', 'created_at', 'updated_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'transaction_id', 'user', 'booking')
        }),
        ('Payment Details', {
            'fields': ('amount', 'currency', 'status', 'payment_method', 'payment_type', 'description')
        }),
        ('Gateway Information', {
            'fields': ('gateway', 'gateway_order_id', 'gateway_payment_id', 'gateway_transaction_id', 'gateway_signature')
        }),
        ('Timestamps', {
            'fields': ('initiated_at', 'completed_at', 'failed_at')
        }),
        ('Failure Information', {
            'fields': ('failure_reason', 'failure_code'),
            'classes': ('collapse',)
        }),
        ('Refund Information', {
            'fields': ('refund_id', 'refund_amount', 'refund_status', 'refund_reason'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('notes', 'metadata', 'webhook_received', 'webhook_payload'),
            'classes': ('collapse',)
        }),
    )


@admin.register(PaymentRefund)
class PaymentRefundAdmin(admin.ModelAdmin):
    list_display = ['refund_id', 'payment', 'amount', 'currency', 'status', 'initiated_at']
    list_filter = ['status', 'currency', 'created_at']
    search_fields = ['refund_id', 'gateway_refund_id', 'payment__transaction_id']
    readonly_fields = ['id', 'refund_id', 'initiated_at', 'processed_at', 'created_at', 'updated_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'refund_id', 'payment')
        }),
        ('Refund Details', {
            'fields': ('amount', 'currency', 'status', 'reason')
        }),
        ('Gateway Information', {
            'fields': ('gateway_refund_id', 'gateway_response')
        }),
        ('Timestamps', {
            'fields': ('initiated_at', 'processed_at')
        }),
        ('Metadata', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
    )
