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
from .permissions import IsOwnerOrBuilderOrReadOnly, IsBuilderOrReadOnly
import cloudinary
import cloudinary.uploader
import cloudinary.api
import hashlib
import io
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


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
    ordering_fields = ['starting_price', 'created_at', 'expected_completion', 'verification_score', 'views_count']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ProjectListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ProjectCreateUpdateSerializer
        return ProjectDetailSerializer
    
    def get_queryset(self):
        from django.db.models import Avg, Count
        queryset = super().get_queryset()
        
        # Annotate with average rating and review count for ordering
        queryset = queryset.annotate(
            avg_rating=Avg('reviews__rating'),
            review_count=Count('reviews')
        )
        
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
        
        # Handle custom ordering by average rating (for "popular" filter)
        ordering = self.request.query_params.get('ordering', '')
        if ordering == 'popular' or ordering == '-popular':
            # Order by highest average rating first, then by review count
            queryset = queryset.order_by('-avg_rating', '-review_count', '-views_count')
        
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
        # Visibility: developer OR any authenticated buyer OR buyers of units in the project
        user = request.user
        allowed = False
        if user and user.is_authenticated:
            # Developer
            try:
                developer = Developer.objects.get(user=user)
                if project.developer == developer:
                    allowed = True
            except Developer.DoesNotExist:
                pass

            # Any authenticated buyer (role='buyer') can view project milestones
            if not allowed and hasattr(user, 'role') and user.role == 'buyer':
                allowed = True

            # Buyer of any unit in project (fallback)
            if not allowed:
                if project.properties.filter(buyer=user).exists():
                    allowed = True

        if not allowed:
            return Response({'detail': 'You do not have permission to view milestones for this project.'}, status=status.HTTP_403_FORBIDDEN)

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
    """ViewSet for Property units with privacy controls"""
    queryset = Property.objects.select_related('project', 'project__developer', 'buyer')
    serializer_class = PropertySerializer
    permission_classes = [IsOwnerOrBuilderOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['project', 'property_type', 'status', 'floor_number']
    ordering_fields = ['price', 'carpet_area', 'floor_number']
    ordering = ['floor_number', 'unit_number']
    
    def retrieve(self, request, *args, **kwargs):
        """Override retrieve to check permissions for sold properties"""
        instance = self.get_object()
        
        # Check permission
        self.check_object_permissions(request, instance)
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsBuilderOrReadOnly])
    def upload_media(self, request, pk=None):
        """Upload photos/videos for a specific unit/property. Only builder (developer) may upload.

        Expected multipart/form-data with files under 'images' and/or 'videos'. Optional fields: 'description', 'progress_percentage'.
        """
        prop = self.get_object()

        # Ensure requester is the developer of the project
        try:
            developer = Developer.objects.get(user=request.user)
        except Developer.DoesNotExist:
            return Response({'detail': 'Only builders can upload media.'}, status=status.HTTP_403_FORBIDDEN)

        if prop.project.developer != developer:
            return Response({'detail': 'You are not the developer for this project.'}, status=status.HTTP_403_FORBIDDEN)

        images = request.FILES.getlist('images')
        videos = request.FILES.getlist('videos')
        description = request.data.get('description')
        progress_percentage = request.data.get('progress_percentage')

        uploaded_images = []
        uploaded_videos = []

        # Upload images
        for img in images:
            try:
                # Read bytes to compute SHA256 and upload
                img_bytes = img.read()
                sha256 = hashlib.sha256(img_bytes).hexdigest()
                
                # Check if resource already exists in Cloudinary (dedupe)
                # Use full path with folder for the public_id
                public_id = f"estate_platform/units/{sha256}"
                exists = False
                try:
                    cloudinary.api.resource(public_id, resource_type='image')
                    exists = True
                except cloudinary.exceptions.NotFound:
                    exists = False
                except Exception:
                    # If check fails, proceed with upload
                    exists = False
                
                # Upload only if doesn't exist
                if not exists:
                    res = cloudinary.uploader.upload(
                        io.BytesIO(img_bytes), 
                        resource_type='image',
                        public_id=public_id,
                        overwrite=False
                    )
                
                entry = {
                    'sha256': sha256,
                    'uploaded_at': timezone.now().isoformat(),
                    'description': description or ''
                }
                prop.unit_photos.append(entry)
                uploaded_images.append(entry)
            except Exception as e:
                return Response({'detail': f'Image upload failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        # Upload videos
        for vid in videos:
            try:
                vid_bytes = vid.read()
                sha256 = hashlib.sha256(vid_bytes).hexdigest()
                
                # Check if resource already exists in Cloudinary (dedupe)
                # Use full path with folder for the public_id
                public_id = f"estate_platform/units/{sha256}"
                exists = False
                try:
                    cloudinary.api.resource(public_id, resource_type='video')
                    exists = True
                except cloudinary.exceptions.NotFound:
                    exists = False
                except Exception:
                    exists = False
                
                # Upload only if doesn't exist
                if not exists:
                    res = cloudinary.uploader.upload(
                        io.BytesIO(vid_bytes), 
                        resource_type='video',
                        public_id=public_id,
                        overwrite=False
                    )
                
                entry = {
                    'sha256': sha256,
                    'uploaded_at': timezone.now().isoformat(),
                    'description': description or ''
                }
                prop.unit_videos.append(entry)
                uploaded_videos.append(entry)
            except Exception as e:
                return Response({'detail': f'Video upload failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        # Optionally update progress percentage
        if progress_percentage is not None:
            try:
                p = int(progress_percentage)
                prop.unit_progress_percentage = max(0, min(100, p))
            except ValueError:
                pass

        # Optionally add a progress update entry
        if description:
            update_entry = {
                'phase': request.data.get('phase', ''),
                'description': description,
                'date': timezone.now().isoformat(),
                'progress': prop.unit_progress_percentage
            }
            prop.unit_progress_updates.append(update_entry)

        prop.save()

        return Response({
            'images': uploaded_images,
            'videos': uploaded_videos,
            'unit_progress_percentage': prop.unit_progress_percentage,
            'unit_progress_updates': prop.unit_progress_updates
        })

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def progress(self, request, pk=None):
        """Return unit progress (photos/videos/updates). Only visible to buyer of unit or developer."""
        prop = self.get_object()
        user = request.user

        allowed = False
        if user and user.is_authenticated:
            # Buyer
            if prop.buyer == user:
                allowed = True

            # Developer
            try:
                developer = Developer.objects.get(user=user)
                if prop.project.developer == developer:
                    allowed = True
            except Developer.DoesNotExist:
                pass

        if not allowed:
            return Response({'detail': 'You do not have permission to view this unit progress.'}, status=status.HTTP_403_FORBIDDEN)

        from .serializers import UnitProgressSerializer
        serializer = UnitProgressSerializer(prop, context={'request': request})
        return Response(serializer.data)


class MilestoneViewSet(viewsets.ModelViewSet):
    """ViewSet for Construction Milestones"""
    queryset = ConstructionMilestone.objects.select_related('project__developer', 'verified_by')
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

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsBuilderOrReadOnly])
    def upload_media(self, request, pk=None):
        """Upload images/videos against a specific milestone. Only builder (developer) may upload."""
        try:
            milestone = self.get_object()

            # Ensure requester is the developer of the project
            try:
                developer = Developer.objects.get(user=request.user)
            except Developer.DoesNotExist:
                return Response({'detail': 'Only builders can upload media.'}, status=status.HTTP_403_FORBIDDEN)

            # Check if project has a developer assigned
            if not hasattr(milestone.project, 'developer') or milestone.project.developer is None:
                return Response({'detail': 'This project has no developer assigned.'}, status=status.HTTP_400_BAD_REQUEST)

            if milestone.project.developer != developer:
                return Response({'detail': 'You are not the developer for this project.'}, status=status.HTTP_403_FORBIDDEN)

            images = request.FILES.getlist('images')
            videos = request.FILES.getlist('videos')
            description = request.data.get('description', '')

            logger.info(f"Upload request from {request.user.email}: {len(images)} images, {len(videos)} videos")

            uploaded_images = []
            uploaded_videos = []

            # Upload images
            for img in images:
                try:
                    # Read bytes to compute SHA256 and upload
                    img_bytes = img.read()
                    sha256 = hashlib.sha256(img_bytes).hexdigest()
                    
                    logger.info(f"Processing image: {img.name}, SHA256: {sha256}")
                    
                    # Check if resource already exists in Cloudinary (dedupe)
                    # Use full path with folder for the public_id
                    public_id = f"estate_platform/milestones/{sha256}"
                    exists = False
                    try:
                        cloudinary.api.resource(public_id, resource_type='image')
                        exists = True
                        logger.info(f"Image already exists in Cloudinary: {public_id}")
                    except cloudinary.exceptions.NotFound:
                        exists = False
                    except Exception as e:
                        logger.warning(f"Error checking Cloudinary resource: {e}")
                        exists = False
                    
                    # Upload only if doesn't exist
                    if not exists:
                        logger.info(f"Uploading new image to Cloudinary: {public_id}")
                        res = cloudinary.uploader.upload(
                            io.BytesIO(img_bytes), 
                            resource_type='image',
                            public_id=public_id,
                            overwrite=False
                        )
                        logger.info(f"Upload successful: {res.get('public_id')}")
                    
                    entry = {
                        'sha256': sha256,
                        'uploaded_at': timezone.now().isoformat(),
                        'description': description
                    }
                    uploaded_images.append(entry)
                except Exception as e:
                    logger.error(f"Image upload failed: {str(e)}", exc_info=True)
                    return Response({'detail': f'Image upload failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

            # Upload videos
            for vid in videos:
                try:
                    vid_bytes = vid.read()
                    sha256 = hashlib.sha256(vid_bytes).hexdigest()
                    
                    logger.info(f"Processing video: {vid.name}, SHA256: {sha256}")
                    
                    # Check if resource already exists in Cloudinary (dedupe)
                    # Use full path with folder for the public_id
                    public_id = f"estate_platform/milestones/{sha256}"
                    exists = False
                    try:
                        cloudinary.api.resource(public_id, resource_type='video')
                        exists = True
                        logger.info(f"Video already exists in Cloudinary: {public_id}")
                    except cloudinary.exceptions.NotFound:
                        exists = False
                    except Exception as e:
                        logger.warning(f"Error checking Cloudinary resource: {e}")
                        exists = False
                    
                    # Upload only if doesn't exist
                    if not exists:
                        logger.info(f"Uploading new video to Cloudinary: {public_id}")
                        res = cloudinary.uploader.upload(
                            io.BytesIO(vid_bytes), 
                            resource_type='video',
                            public_id=public_id,
                            overwrite=False
                        )
                        logger.info(f"Upload successful: {res.get('public_id')}")
                    
                    entry = {
                        'sha256': sha256,
                        'uploaded_at': timezone.now().isoformat(),
                        'description': description
                    }
                    uploaded_videos.append(entry)
                except Exception as e:
                    logger.error(f"Video upload failed: {str(e)}", exc_info=True)
                    return Response({'detail': f'Video upload failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

            # Update milestone with new media (create new list to trigger JSONField update)
            milestone.images = list(milestone.images or []) + uploaded_images
            milestone.videos = list(milestone.videos or []) + uploaded_videos
            milestone.save()

            logger.info(f"Milestone updated successfully: {milestone.id}")

            serializer = self.get_serializer(milestone)
            return Response({
                'milestone': serializer.data, 
                'uploaded_images': uploaded_images, 
                'uploaded_videos': uploaded_videos
            })
        
        except Exception as e:
            logger.error(f"Upload media error: {str(e)}", exc_info=True)
            return Response({'detail': f'Internal server error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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

