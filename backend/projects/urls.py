from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DeveloperViewSet, ProjectViewSet, PropertyViewSet,
    MilestoneViewSet, ReviewViewSet
)

router = DefaultRouter()
router.register(r'developers', DeveloperViewSet, basename='developer')
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'properties', PropertyViewSet, basename='property')
router.register(r'milestones', MilestoneViewSet, basename='milestone')
router.register(r'reviews', ReviewViewSet, basename='review')

urlpatterns = [
    path('', include(router.urls)),
]
