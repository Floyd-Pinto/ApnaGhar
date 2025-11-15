"""
URL configuration for blockchain app
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BlockchainProgressUpdateViewSet, BlockchainDocumentViewSet

router = DefaultRouter()
router.register(r'progress', BlockchainProgressUpdateViewSet, basename='blockchain-progress')
router.register(r'documents', BlockchainDocumentViewSet, basename='blockchain-documents')

urlpatterns = [
    path('', include(router.urls)),
]

