from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    InvestmentPropertyViewSet, InvestmentViewSet,
    InvestmentTransactionViewSet, DividendViewSet, DividendPaymentViewSet
)

router = DefaultRouter()
router.register(r'properties', InvestmentPropertyViewSet, basename='investment-property')
router.register(r'investments', InvestmentViewSet, basename='investment')
router.register(r'transactions', InvestmentTransactionViewSet, basename='investment-transaction')
router.register(r'dividends', DividendViewSet, basename='dividend')
router.register(r'dividend-payments', DividendPaymentViewSet, basename='dividend-payment')

urlpatterns = [
    path('', include(router.urls)),
]

