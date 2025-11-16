from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SupportTicketViewSet, SupportMessageViewSet, SupportCategoryViewSet

router = DefaultRouter()
router.register(r'tickets', SupportTicketViewSet, basename='support-ticket')
router.register(r'messages', SupportMessageViewSet, basename='support-message')
router.register(r'categories', SupportCategoryViewSet, basename='support-category')

urlpatterns = [
    path('', include(router.urls)),
]

