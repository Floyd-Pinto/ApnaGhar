from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Avg
from .models import Developer, Project, Property, ConstructionMilestone, Review
from .serializers import (
    DeveloperSerializer, ProjectListSerializer, ProjectDetailSerializer,
    ProjectCreateUpdateSerializer, PropertySerializer, MilestoneSerializer,
    ReviewSerializer
)


class DeveloperViewSet(viewsets.ModelViewSet):
    """ViewSet for Developer management"""
    queryset = Developer.objects.all()
    serializer_class = DeveloperSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['company_name', 'rera_number']
    ordering_fields = ['trust_score', 'total_projects', 'created_at']
    ordering = ['-trust_score']
    
    @action(detail=True, methods=['get'])
    def projects(self, request, pk=None):
        """Get all projects by a developer"""
        developer = self.get_object()
        projects = developer.projects.all()
        serializer = ProjectListSerializer(projects, many=True)
        return Response(serializer.data)


class ProjectViewSet(viewsets.ModelViewSet):
    """ViewSet for Project management"""
    queryset = Project.objects.select_related('developer').prefetch_related('milestones', 'properties', 'reviews')
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'project_type', 'city', 'developer', 'verified']
    search_fields = ['name', 'description', 'city', 'address']
    ordering_fields = ['starting_price', 'created_at', 'expected_completion', 'verification_score']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ProjectListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ProjectCreateUpdateSerializer
        return ProjectDetailSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by price range
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            queryset = queryset.filter(starting_price__gte=min_price)
        if max_price:
            queryset = queryset.filter(starting_price__lte=max_price)
        
        # Filter by property types (comma-separated)
        property_types = self.request.query_params.get('property_types')
        if property_types:
            types_list = property_types.split(',')
            queryset = queryset.filter(properties__property_type__in=types_list).distinct()
        
        return queryset
    
    def retrieve(self, request, *args, **kwargs):
        """Override retrieve to increment views count"""
        instance = self.get_object()
        instance.views_count += 1
        instance.save(update_fields=['views_count'])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def perform_create(self, serializer):
        """Set developer to current user's developer profile"""
        developer = Developer.objects.get(user=self.request.user)
        serializer.save(developer=developer)
    
    @action(detail=True, methods=['get'])
    def milestones(self, request, pk=None):
        """Get construction milestones for a project"""
        project = self.get_object()
        milestones = project.milestones.all()
        serializer = MilestoneSerializer(milestones, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_interested(self, request, pk=None):
        """Mark user as interested in project"""
        project = self.get_object()
        project.interested_count += 1
        project.save(update_fields=['interested_count'])
        return Response({'status': 'interest recorded', 'count': project.interested_count})


class PropertyViewSet(viewsets.ModelViewSet):
    """ViewSet for Property units"""
    queryset = Property.objects.select_related('project', 'buyer')
    serializer_class = PropertySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['project', 'property_type', 'status', 'floor_number']
    ordering_fields = ['price', 'carpet_area', 'floor_number']
    ordering = ['floor_number', 'unit_number']


class MilestoneViewSet(viewsets.ModelViewSet):
    """ViewSet for Construction Milestones"""
    queryset = ConstructionMilestone.objects.select_related('project', 'verified_by')
    serializer_class = MilestoneSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['project', 'status', 'verified']
    ordering_fields = ['phase_number', 'target_date', 'progress_percentage']
    ordering = ['phase_number']
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def verify(self, request, pk=None):
        """Verify a milestone (admin/developer only)"""
        milestone = self.get_object()
        milestone.verified = True
        milestone.verified_by = request.user
        from django.utils import timezone
        milestone.verified_at = timezone.now()
        milestone.save(update_fields=['verified', 'verified_by', 'verified_at'])
        serializer = self.get_serializer(milestone)
        return Response(serializer.data)


class ReviewViewSet(viewsets.ModelViewSet):
    """ViewSet for Project Reviews"""
    queryset = Review.objects.select_related('project', 'user')
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['project', 'rating', 'verified_buyer']
    ordering_fields = ['rating', 'helpful_count', 'created_at']
    ordering = ['-created_at']
    
    def perform_create(self, serializer):
        """Set user to current logged-in user"""
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def mark_helpful(self, request, pk=None):
        """Mark a review as helpful"""
        review = self.get_object()
        review.helpful_count += 1
        review.save(update_fields=['helpful_count'])
        return Response({'status': 'marked as helpful', 'count': review.helpful_count})

