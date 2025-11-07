from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q
from .models import Property, Project
from .serializers import PropertySerializer, ProjectListSerializer


class UserPropertyViewSet(viewsets.ViewSet):
    """ViewSet for user-specific property actions"""
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'], url_path='book/(?P<property_id>[^/.]+)')
    def book_property(self, request, property_id=None):
        """Book a property for the current user"""
        try:
            property_obj = Property.objects.select_related('project').get(id=property_id)
            
            # Check if property is available
            if property_obj.status != 'available':
                return Response(
                    {'error': f'Property is not available. Current status: {property_obj.status}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Book the property
            property_obj.status = 'booked'
            property_obj.buyer = request.user
            property_obj.save(update_fields=['status', 'buyer', 'updated_at'])
            
            # Update project available units count
            project = property_obj.project
            project.available_units = project.properties.filter(status='available').count()
            project.save(update_fields=['available_units'])
            
            serializer = PropertySerializer(property_obj)
            return Response({
                'message': 'Property booked successfully',
                'property': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Property.DoesNotExist:
            return Response(
                {'error': 'Property not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def my_properties(self, request):
        """Get all properties booked/owned by current user"""
        properties = Property.objects.filter(
            buyer=request.user
        ).select_related('project', 'project__developer').order_by('-updated_at')
        
        serializer = PropertySerializer(properties, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_booked_properties(self, request):
        """Get only booked properties (not yet sold)"""
        properties = Property.objects.filter(
            buyer=request.user,
            status='booked'
        ).select_related('project', 'project__developer').order_by('-updated_at')
        
        serializer = PropertySerializer(properties, many=True)
        return Response(serializer.data)


class UserProjectViewSet(viewsets.ViewSet):
    """ViewSet for user-specific project actions"""
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'], url_path='save/(?P<project_id>[^/.]+)')
    def save_project(self, request, project_id=None):
        """Save/favorite a project"""
        try:
            project = Project.objects.get(id=project_id)
            user = request.user
            
            # Get or create saved projects list from user profile
            # We'll store this in a JSONField or create a separate SavedProject model
            # For now, using a simple approach with user's metadata
            if not hasattr(user, 'saved_projects'):
                saved_projects = []
            else:
                saved_projects = user.saved_projects or []
            
            project_id_str = str(project_id)
            if project_id_str in saved_projects:
                return Response(
                    {'message': 'Project already saved', 'saved': True},
                    status=status.HTTP_200_OK
                )
            
            saved_projects.append(project_id_str)
            user.saved_projects = saved_projects
            user.save(update_fields=['saved_projects'])
            
            return Response(
                {'message': 'Project saved successfully', 'saved': True},
                status=status.HTTP_200_OK
            )
            
        except Project.DoesNotExist:
            return Response(
                {'error': 'Project not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'], url_path='unsave/(?P<project_id>[^/.]+)')
    def unsave_project(self, request, project_id=None):
        """Remove a project from saved/favorites"""
        try:
            user = request.user
            saved_projects = getattr(user, 'saved_projects', []) or []
            project_id_str = str(project_id)
            
            if project_id_str in saved_projects:
                saved_projects.remove(project_id_str)
                user.saved_projects = saved_projects
                user.save(update_fields=['saved_projects'])
                return Response(
                    {'message': 'Project removed from saved', 'saved': False},
                    status=status.HTTP_200_OK
                )
            
            return Response(
                {'message': 'Project was not in saved list', 'saved': False},
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def saved_projects(self, request):
        """Get all saved projects for current user"""
        user = request.user
        saved_project_ids = getattr(user, 'saved_projects', []) or []
        
        if not saved_project_ids:
            return Response([])
        
        projects = Project.objects.filter(
            id__in=saved_project_ids
        ).select_related('developer').prefetch_related('properties', 'reviews')
        
        serializer = ProjectListSerializer(projects, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], url_path='track-view/(?P<project_id>[^/.]+)')
    def track_view(self, request, project_id=None):
        """Track that user viewed a project (for recently viewed)"""
        try:
            project = Project.objects.get(id=project_id)
            user = request.user
            
            # Get recently viewed projects
            recently_viewed = getattr(user, 'recently_viewed', []) or []
            project_id_str = str(project_id)
            
            # Remove if already exists (to move to front)
            if project_id_str in recently_viewed:
                recently_viewed.remove(project_id_str)
            
            # Add to front of list
            recently_viewed.insert(0, project_id_str)
            
            # Keep only last 20 viewed projects
            recently_viewed = recently_viewed[:20]
            
            user.recently_viewed = recently_viewed
            user.save(update_fields=['recently_viewed'])
            
            return Response(
                {'message': 'View tracked successfully'},
                status=status.HTTP_200_OK
            )
            
        except Project.DoesNotExist:
            return Response(
                {'error': 'Project not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def recently_viewed(self, request):
        """Get recently viewed projects"""
        user = request.user
        viewed_project_ids = getattr(user, 'recently_viewed', []) or []
        
        if not viewed_project_ids:
            return Response([])
        
        # Get projects in the order they were viewed
        projects_dict = {
            str(p.id): p for p in Project.objects.filter(
                id__in=viewed_project_ids
            ).select_related('developer').prefetch_related('properties', 'reviews')
        }
        
        # Maintain the viewing order
        ordered_projects = [projects_dict[pid] for pid in viewed_project_ids if pid in projects_dict]
        
        serializer = ProjectListSerializer(ordered_projects, many=True, context={'request': request})
        return Response(serializer.data)
