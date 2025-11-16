from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentViewSet, PaymentRefundViewSet, razorpay_webhook

router = DefaultRouter()
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'refunds', PaymentRefundViewSet, basename='payment-refund')

urlpatterns = [
    path('', include(router.urls)),
    path('webhooks/razorpay/', razorpay_webhook, name='razorpay-webhook'),
]

