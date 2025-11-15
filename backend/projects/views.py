from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Avg
from .models import Developer, Project, Property, ConstructionMilestone, Review, ConstructionUpdate
from .serializers import (
    DeveloperSerializer, ProjectListSerializer, ProjectDetailSerializer,
    ProjectCreateUpdateSerializer, PropertySerializer, MilestoneSerializer,
    ReviewSerializer, ConstructionUpdateSerializer
)
from .permissions import IsOwnerOrBuilderOrReadOnly, IsBuilderOrReadOnly
import cloudinary
import cloudinary.uploader
import cloudinary.api
import hashlib
import io
import json
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
        
        try:
            # Annotate with average rating and review count for ordering
            queryset = queryset.annotate(
                avg_rating=Avg('reviews__rating'),
                review_count=Count('reviews')
            )
        except Exception as e:
            # If annotation fails, just use base queryset
            import logging
            logging.warning(f"Failed to annotate project queryset: {e}")
        
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
            try:
                queryset = queryset.order_by('-avg_rating', '-review_count', '-views_count')
            except Exception:
                # Fallback to views_count if annotation failed
                queryset = queryset.order_by('-views_count')
        
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
        # Visibility: developer OR any authenticated buyer OR builders
        user = request.user
        allowed = False
        if user and user.is_authenticated:
            # Check if user is a builder (by role)
            if hasattr(user, 'role') and user.role == 'builder':
                allowed = True
            
            # Check if user is the developer of this project
            if not allowed:
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
    
    @action(detail=True, methods=['get'])
    def properties(self, request, pk=None):
        """Get properties for a project"""
        project = self.get_object()
        # Similar permission logic as milestones
        user = request.user
        allowed = False
        if user and user.is_authenticated:
            # Check if user is a builder (by role)
            if hasattr(user, 'role') and user.role == 'builder':
                allowed = True
            
            # Check if user is the developer of this project
            if not allowed:
                try:
                    developer = Developer.objects.get(user=user)
                    if project.developer == developer:
                        allowed = True
                except Developer.DoesNotExist:
                    pass

            # Any authenticated buyer (role='buyer') can view project properties
            if not allowed and hasattr(user, 'role') and user.role == 'buyer':
                allowed = True

            # Buyer of any unit in project (fallback)
            if not allowed:
                if project.properties.filter(buyer=user).exists():
                    allowed = True

        if not allowed:
            return Response({'detail': 'You do not have permission to view properties for this project.'}, status=status.HTTP_403_FORBIDDEN)

        properties = project.properties.all()
        serializer = PropertySerializer(properties, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_interested(self, request, pk=None):
        """Mark user as interested in project"""
        project = self.get_object()
        project.interested_count += 1
        project.save(update_fields=['interested_count'])
        return Response({'status': 'interest recorded', 'count': project.interested_count})
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_projects(self, request):
        """Get projects belonging to the logged-in builder/developer"""
        try:
            developer = Developer.objects.get(user=request.user)
        except Developer.DoesNotExist:
            return Response({'detail': 'Only builders can access this endpoint.'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get projects for this developer with optimized query
        # Use select_related and prefetch_related to avoid N+1 queries
        queryset = Project.objects.select_related(
            'developer'
        ).prefetch_related(
            'milestones', 
            'properties',
            'reviews'
        ).filter(developer=developer)
        
        # Apply pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = ProjectListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = ProjectListSerializer(queryset, many=True)
        return Response(serializer.data)


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
                    cloudinary_url = res.get('secure_url')
                else:
                    # Get URL for existing resource
                    cloudinary_url = cloudinary.CloudinaryImage(public_id).build_url(secure=True)
                
                entry = {
                    'url': cloudinary_url,
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
                    cloudinary_url = res.get('secure_url')
                else:
                    # Get URL for existing resource
                    cloudinary_url = cloudinary.CloudinaryVideo(public_id).build_url(secure=True)
                
                entry = {
                    'url': cloudinary_url,
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
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def secure_upload(self, request, pk=None):
        """Secure upload endpoint for property units - requires QR verification token and camera capture"""
        try:
            prop = self.get_object()
            
            # Verify upload token
            upload_token = request.data.get('upload_token')
            if not upload_token or upload_token != prop.qr_code_secret[:32]:
                return Response({'detail': 'Invalid upload token'}, status=status.HTTP_403_FORBIDDEN)
            
            # Check if request is from mobile device
            user_agent = request.META.get('HTTP_USER_AGENT', '').lower()
            is_mobile = any(device in user_agent for device in ['mobile', 'android', 'iphone', 'ipad', 'tablet'])
            
            # Parse device_info - handle both JSON string and dict
            device_info_raw = request.data.get('device_info', {})
            if isinstance(device_info_raw, str):
                try:
                    device_info = json.loads(device_info_raw)
                except (json.JSONDecodeError, TypeError):
                    device_info = {}
            else:
                device_info = device_info_raw or {}
            
            if not is_mobile and not device_info.get('is_mobile', False):
                return Response({
                    'detail': 'Upload is only allowed from mobile devices.',
                    'error_code': 'DESKTOP_UPLOAD_BLOCKED'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Verify camera capture metadata - handle both JSON string and dict
            capture_metadata_raw = request.data.get('capture_metadata', {})
            if isinstance(capture_metadata_raw, str):
                try:
                    capture_metadata = json.loads(capture_metadata_raw)
                except (json.JSONDecodeError, TypeError):
                    capture_metadata = {}
            else:
                capture_metadata = capture_metadata_raw or {}
            
            if not capture_metadata.get('camera_captured', False):
                return Response({
                    'detail': 'Only camera-captured media is allowed. Gallery uploads are blocked.',
                    'error_code': 'GALLERY_UPLOAD_BLOCKED'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Verify developer
            developer = Developer.objects.get(user=request.user)
            if prop.project.developer != developer:
                return Response({
                    'detail': 'You are not the developer for this project.'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Process images and videos
            images = request.FILES.getlist('images')
            videos = request.FILES.getlist('videos')
            description = request.data.get('description', '')
            progress_percentage = request.data.get('progress_percentage')
            
            # Check limits
            if len(images) > 15:
                return Response({'detail': 'Maximum 15 images allowed per upload'}, status=status.HTTP_400_BAD_REQUEST)
            if len(videos) > 5:
                return Response({'detail': 'Maximum 5 videos allowed per upload'}, status=status.HTTP_400_BAD_REQUEST)
            
            logger.info(f"Secure property upload - Unit: {prop.unit_number}, Images: {len(images)}, Videos: {len(videos)}")
            
            uploaded_images = []
            uploaded_videos = []
            
            # Upload images with metadata
            for img in images:
                try:
                    if img.size > 10 * 1024 * 1024:  # 10MB
                        return Response({'detail': f'Image {img.name} exceeds 10MB limit'}, status=status.HTTP_400_BAD_REQUEST)
                    
                    img_bytes = img.read()
                    sha256 = hashlib.sha256(img_bytes).hexdigest()
                    
                    public_id = f"estate_platform/units/{sha256}"
                    
                    try:
                        cloudinary.api.resource(public_id, resource_type='image')
                        exists = True
                    except cloudinary.exceptions.NotFound:
                        exists = False
                    
                    if not exists:
                        logger.info(f"Uploading image to Cloudinary: {public_id}")
                        try:
                            res = cloudinary.uploader.upload(
                                io.BytesIO(img_bytes), 
                                resource_type='image',
                                public_id=public_id,
                                overwrite=False
                            )
                            cloudinary_url = res.get('secure_url')
                            logger.info(f"Image uploaded successfully: {cloudinary_url}")
                        except Exception as upload_error:
                            logger.error(f"Cloudinary upload error: {str(upload_error)}", exc_info=True)
                            raise upload_error
                    else:
                        # Get URL for existing resource
                        cloudinary_url = cloudinary.CloudinaryImage(public_id).build_url(secure=True)
                    
                    entry = {
                        'url': cloudinary_url,
                        'sha256': sha256,
                        'uploaded_at': timezone.now().isoformat(),
                        'description': description,
                        'capture_metadata': capture_metadata,
                        'device_info': device_info,
                        'verified_upload': True,
                        'qr_verified': True
                    }
                    prop.unit_photos.append(entry)
                    uploaded_images.append(entry)
                    
                except Exception as e:
                    logger.error(f"Secure property image upload failed: {str(e)}", exc_info=True)
                    return Response({'detail': f'Image upload failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Upload videos with metadata
            for vid in videos:
                try:
                    if vid.size > 50 * 1024 * 1024:  # 50MB
                        return Response({'detail': f'Video {vid.name} exceeds 50MB limit'}, status=status.HTTP_400_BAD_REQUEST)
                    
                    vid_bytes = vid.read()
                    sha256 = hashlib.sha256(vid_bytes).hexdigest()
                    
                    public_id = f"estate_platform/units/{sha256}"
                    
                    try:
                        cloudinary.api.resource(public_id, resource_type='video')
                        exists = True
                    except cloudinary.exceptions.NotFound:
                        exists = False
                    
                    if not exists:
                        logger.info(f"Uploading video to Cloudinary: {public_id}")
                        try:
                            res = cloudinary.uploader.upload(
                                io.BytesIO(vid_bytes), 
                                resource_type='video',
                                public_id=public_id,
                                overwrite=False
                            )
                            cloudinary_url = res.get('secure_url')
                            logger.info(f"Video uploaded successfully: {cloudinary_url}")
                        except Exception as upload_error:
                            logger.error(f"Cloudinary upload error: {str(upload_error)}", exc_info=True)
                            raise upload_error
                    else:
                        # Get URL for existing resource
                        cloudinary_url = cloudinary.CloudinaryVideo(public_id).build_url(secure=True)
                    
                    entry = {
                        'url': cloudinary_url,
                        'sha256': sha256,
                        'uploaded_at': timezone.now().isoformat(),
                        'description': description,
                        'capture_metadata': capture_metadata,
                        'device_info': device_info,
                        'verified_upload': True,
                        'qr_verified': True
                    }
                    prop.unit_videos.append(entry)
                    uploaded_videos.append(entry)
                    
                except Exception as e:
                    logger.error(f"Secure property video upload failed: {str(e)}", exc_info=True)
                    return Response({'detail': f'Video upload failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Update progress if provided
            if progress_percentage is not None:
                try:
                    p = int(progress_percentage)
                    prop.unit_progress_percentage = max(0, min(100, p))
                except ValueError:
                    pass
            
            # Add progress update entry
            if description:
                update_entry = {
                    'phase': request.data.get('phase', ''),
                    'description': description,
                    'date': timezone.now().isoformat(),
                    'progress': prop.unit_progress_percentage,
                    'verified_upload': True,
                    'qr_verified': True
                }
                prop.unit_progress_updates.append(update_entry)
            
            # Save property with updated media
            prop.save()
            
            # Create ConstructionUpdate record for property-specific update
            try:
                from datetime import date
                ConstructionUpdate.objects.create(
                    project=prop.project,
                    created_by=request.user,
                    update_type='property_specific',
                    title=f"Progress Update - Unit {prop.unit_number}",
                    description=description or f"Construction progress update for Unit {prop.unit_number}",
                    update_date=date.today(),
                    images=[{'url': img['url'], 'caption': img.get('description', '')} for img in uploaded_images],
                    videos=[{'url': vid['url'], 'caption': vid.get('description', '')} for vid in uploaded_videos],
                    property_unit_number=prop.unit_number,
                    visible_to_owner_only=True,
                    completion_percentage=prop.unit_progress_percentage
                )
                logger.info(f"ConstructionUpdate created for property: {prop.id}")
            except Exception as e:
                logger.error(f"Failed to create ConstructionUpdate: {str(e)}", exc_info=True)
                # Don't fail the upload if ConstructionUpdate creation fails
            
            logger.info(f"Secure property upload completed - Unit: {prop.unit_number}")
            
            return Response({
                'success': True,
                'unit_number': prop.unit_number,
                'uploaded_images': len(uploaded_images),
                'uploaded_videos': len(uploaded_videos),
                'unit_progress_percentage': prop.unit_progress_percentage,
                'message': 'Media uploaded successfully with QR verification'
            })
            
        except Developer.DoesNotExist:
            return Response({'detail': 'Only builders can upload media'}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            logger.error(f"Secure property upload error: {str(e)}", exc_info=True)
            return Response({'detail': f'Internal server error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def upload_media(self, request, pk=None):
        """Upload images/videos against a specific milestone. Only builder (developer) may upload."""
        try:
            milestone = self.get_object()
            
            logger.info(f"Upload media request - User: {request.user.username}, Milestone ID: {milestone.id}")
            logger.info(f"Milestone Project: {milestone.project.name}, Project Developer: {milestone.project.developer.company_name if milestone.project.developer else 'None'}")

            # Ensure requester is the developer of the project
            try:
                developer = Developer.objects.get(user=request.user)
                logger.info(f"Found developer: {developer.company_name}")
            except Developer.DoesNotExist:
                logger.error(f"User {request.user.username} does not have a Developer profile")
                return Response({'detail': 'Only builders can upload media. Please ensure you are logged in as a builder.'}, status=status.HTTP_403_FORBIDDEN)

            # Check if project has a developer assigned
            if not hasattr(milestone.project, 'developer') or milestone.project.developer is None:
                logger.error(f"Project {milestone.project.name} has no developer assigned")
                return Response({'detail': 'This project has no developer assigned.'}, status=status.HTTP_400_BAD_REQUEST)

            if milestone.project.developer != developer:
                logger.error(f"Developer mismatch - Request from: {developer.company_name}, Project owner: {milestone.project.developer.company_name}")
                return Response({
                    'detail': f'You are not the developer for this project. This project belongs to {milestone.project.developer.company_name}.'
                }, status=status.HTTP_403_FORBIDDEN)

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
                        cloudinary_url = res.get('secure_url')
                    else:
                        # Get URL for existing resource
                        cloudinary_url = cloudinary.CloudinaryImage(public_id).build_url(secure=True)
                    
                    entry = {
                        'url': cloudinary_url,
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
                        cloudinary_url = res.get('secure_url')
                    else:
                        # Get URL for existing resource
                        cloudinary_url = cloudinary.CloudinaryVideo(public_id).build_url(secure=True)
                    
                    entry = {
                        'url': cloudinary_url,
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
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def verify_qr(self, request):
        """Verify QR code and return milestone/property details for secure upload"""
        try:
            qr_data = request.data.get('qr_data')
            device_info = request.data.get('device_info', {})
            
            logger.info(f"QR verification request - QR Data: {qr_data}, User: {request.user.username}")
            
            # Check if request is from mobile device
            user_agent = request.META.get('HTTP_USER_AGENT', '').lower()
            is_mobile = any(device in user_agent for device in ['mobile', 'android', 'iphone', 'ipad', 'tablet'])
            
            if not is_mobile and not device_info.get('is_mobile', False):
                return Response({
                    'detail': 'Upload is only allowed from mobile devices.',
                    'error_code': 'DESKTOP_UPLOAD_BLOCKED'
                }, status=status.HTTP_403_FORBIDDEN)
            
            if not qr_data:
                return Response({'detail': 'QR code data is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Parse QR data (format: "milestone:<project_id>:<milestone_id>:<token>")
            try:
                parts = qr_data.split(':')
                if len(parts) < 4:
                    return Response({'detail': 'Invalid QR code format'}, status=status.HTTP_400_BAD_REQUEST)
                
                entity_type = parts[0]  # 'milestone' or 'property'
                project_id = parts[1]
                entity_id = parts[2]
                
                if entity_type == 'milestone':
                    milestone = ConstructionMilestone.objects.get(
                        id=entity_id,
                        project_id=project_id,
                        qr_code_data=qr_data
                    )
                    
                    # Verify developer
                    developer = Developer.objects.get(user=request.user)
                    if milestone.project.developer != developer:
                        return Response({
                            'detail': 'You are not authorized to upload to this milestone.'
                        }, status=status.HTTP_403_FORBIDDEN)
                    
                    return Response({
                        'verified': True,
                        'entity_type': 'milestone',
                        'entity_id': str(milestone.id),
                        'project_name': milestone.project.name,
                        'title': milestone.title,
                        'description': milestone.description,
                        'phase_number': milestone.phase_number,
                        'upload_token': milestone.qr_code_secret[:32],  # First 32 chars as upload token
                        'upload_endpoint': f'/api/projects/milestones/{milestone.id}/secure_upload/',
                        'restrictions': {
                            'camera_only': True,
                            'max_images': 10,
                            'max_videos': 5,
                            'max_image_size_mb': 10,
                            'max_video_size_mb': 50
                        }
                    })
                
                elif entity_type == 'property':
                    property_obj = Property.objects.get(
                        id=entity_id,
                        project_id=project_id,
                        qr_code_data=qr_data
                    )
                    
                    # Verify developer
                    developer = Developer.objects.get(user=request.user)
                    if property_obj.project.developer != developer:
                        return Response({
                            'detail': 'You are not authorized to upload to this property.'
                        }, status=status.HTTP_403_FORBIDDEN)
                    
                    return Response({
                        'verified': True,
                        'entity_type': 'property',
                        'entity_id': str(property_obj.id),
                        'project_name': property_obj.project.name,
                        'unit_number': property_obj.unit_number,
                        'property_type': property_obj.property_type,
                        'upload_token': property_obj.qr_code_secret[:32],
                        'upload_endpoint': f'/api/projects/properties/{property_obj.id}/secure_upload/',
                        'restrictions': {
                            'camera_only': True,
                            'max_images': 15,
                            'max_videos': 5,
                            'max_image_size_mb': 10,
                            'max_video_size_mb': 50
                        }
                    })
                
                else:
                    return Response({'detail': 'Invalid entity type in QR code'}, status=status.HTTP_400_BAD_REQUEST)
                    
            except (ConstructionMilestone.DoesNotExist, Property.DoesNotExist):
                return Response({'detail': 'Invalid QR code or entity not found'}, status=status.HTTP_404_NOT_FOUND)
            except Developer.DoesNotExist:
                return Response({'detail': 'Only builders can upload construction updates'}, status=status.HTTP_403_FORBIDDEN)
            except Exception as e:
                logger.error(f"QR verification error: {str(e)}", exc_info=True)
                return Response({'detail': 'Invalid QR code data'}, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"QR verify error: {str(e)}", exc_info=True)
            return Response({'detail': f'Internal server error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def secure_upload(self, request, pk=None):
        """Secure upload endpoint - requires QR verification token and camera capture metadata"""
        try:
            milestone = self.get_object()
            
            # Verify upload token
            upload_token = request.data.get('upload_token')
            if not upload_token or upload_token != milestone.qr_code_secret[:32]:
                return Response({'detail': 'Invalid upload token'}, status=status.HTTP_403_FORBIDDEN)
            
            # Check if request is from mobile device
            user_agent = request.META.get('HTTP_USER_AGENT', '').lower()
            is_mobile = any(device in user_agent for device in ['mobile', 'android', 'iphone', 'ipad', 'tablet'])
            
            # Parse device_info - handle both JSON string and dict
            device_info_raw = request.data.get('device_info', {})
            if isinstance(device_info_raw, str):
                try:
                    device_info = json.loads(device_info_raw)
                except (json.JSONDecodeError, TypeError):
                    device_info = {}
            else:
                device_info = device_info_raw or {}
            
            if not is_mobile and not device_info.get('is_mobile', False):
                return Response({
                    'detail': 'Upload is only allowed from mobile devices.',
                    'error_code': 'DESKTOP_UPLOAD_BLOCKED'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Verify camera capture metadata - handle both JSON string and dict
            capture_metadata_raw = request.data.get('capture_metadata', {})
            if isinstance(capture_metadata_raw, str):
                try:
                    capture_metadata = json.loads(capture_metadata_raw)
                except (json.JSONDecodeError, TypeError):
                    capture_metadata = {}
            else:
                capture_metadata = capture_metadata_raw or {}
            
            if not capture_metadata.get('camera_captured', False):
                return Response({
                    'detail': 'Only camera-captured media is allowed. Gallery uploads are blocked.',
                    'error_code': 'GALLERY_UPLOAD_BLOCKED'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Verify developer
            developer = Developer.objects.get(user=request.user)
            if milestone.project.developer != developer:
                return Response({
                    'detail': 'You are not the developer for this project.'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Process images and videos with metadata
            images = request.FILES.getlist('images')
            videos = request.FILES.getlist('videos')
            description = request.data.get('description', '')
            
            # Check limits
            if len(images) > 10:
                return Response({'detail': 'Maximum 10 images allowed per upload'}, status=status.HTTP_400_BAD_REQUEST)
            if len(videos) > 5:
                return Response({'detail': 'Maximum 5 videos allowed per upload'}, status=status.HTTP_400_BAD_REQUEST)
            
            logger.info(f"Secure upload - Milestone: {milestone.id}, Images: {len(images)}, Videos: {len(videos)}")
            
            uploaded_images = []
            uploaded_videos = []
            
            # Upload images with enhanced metadata
            for img in images:
                try:
                    # Check size
                    if img.size > 10 * 1024 * 1024:  # 10MB
                        return Response({'detail': f'Image {img.name} exceeds 10MB limit'}, status=status.HTTP_400_BAD_REQUEST)
                    
                    img_bytes = img.read()
                    sha256 = hashlib.sha256(img_bytes).hexdigest()
                    
                    public_id = f"estate_platform/milestones/{sha256}"
                    
                    # Upload to Cloudinary
                    try:
                        cloudinary.api.resource(public_id, resource_type='image')
                        exists = True
                    except cloudinary.exceptions.NotFound:
                        exists = False
                    
                    if not exists:
                        logger.info(f"Uploading image to Cloudinary: {public_id}")
                        try:
                            res = cloudinary.uploader.upload(
                                io.BytesIO(img_bytes), 
                                resource_type='image',
                                public_id=public_id,
                                overwrite=False
                            )
                            cloudinary_url = res.get('secure_url')
                            logger.info(f"Image uploaded successfully: {cloudinary_url}")
                        except Exception as upload_error:
                            logger.error(f"Cloudinary upload error: {str(upload_error)}", exc_info=True)
                            raise upload_error
                    else:
                        # Get URL for existing resource
                        cloudinary_url = cloudinary.CloudinaryImage(public_id).build_url(secure=True)
                    
                    entry = {
                        'url': cloudinary_url,
                        'sha256': sha256,
                        'uploaded_at': timezone.now().isoformat(),
                        'description': description,
                        'capture_metadata': capture_metadata,
                        'device_info': device_info,
                        'verified_upload': True,
                        'qr_verified': True
                    }
                    uploaded_images.append(entry)
                    
                except Exception as e:
                    logger.error(f"Secure image upload failed: {str(e)}", exc_info=True)
                    return Response({'detail': f'Image upload failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Upload videos with enhanced metadata
            for vid in videos:
                try:
                    # Check size
                    if vid.size > 50 * 1024 * 1024:  # 50MB
                        return Response({'detail': f'Video {vid.name} exceeds 50MB limit'}, status=status.HTTP_400_BAD_REQUEST)
                    
                    vid_bytes = vid.read()
                    sha256 = hashlib.sha256(vid_bytes).hexdigest()
                    
                    public_id = f"estate_platform/milestones/{sha256}"
                    
                    try:
                        cloudinary.api.resource(public_id, resource_type='video')
                        exists = True
                    except cloudinary.exceptions.NotFound:
                        exists = False
                    
                    if not exists:
                        logger.info(f"Uploading video to Cloudinary: {public_id}")
                        try:
                            res = cloudinary.uploader.upload(
                                io.BytesIO(vid_bytes), 
                                resource_type='video',
                                public_id=public_id,
                                overwrite=False
                            )
                            cloudinary_url = res.get('secure_url')
                            logger.info(f"Video uploaded successfully: {cloudinary_url}")
                        except Exception as upload_error:
                            logger.error(f"Cloudinary upload error: {str(upload_error)}", exc_info=True)
                            raise upload_error
                    else:
                        # Get URL for existing resource
                        cloudinary_url = cloudinary.CloudinaryVideo(public_id).build_url(secure=True)
                    
                    entry = {
                        'url': cloudinary_url,
                        'sha256': sha256,
                        'uploaded_at': timezone.now().isoformat(),
                        'description': description,
                        'capture_metadata': capture_metadata,
                        'device_info': device_info,
                        'verified_upload': True,
                        'qr_verified': True
                    }
                    uploaded_videos.append(entry)
                    
                except Exception as e:
                    logger.error(f"Secure video upload failed: {str(e)}", exc_info=True)
                    return Response({'detail': f'Video upload failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Update milestone
            milestone.images = list(milestone.images or []) + uploaded_images
            milestone.videos = list(milestone.videos or []) + uploaded_videos
            milestone.save()
            
            # Create ConstructionUpdate record with uploaded media
            try:
                from datetime import date
                ConstructionUpdate.objects.create(
                    project=milestone.project,
                    created_by=request.user,
                    update_type='project_level',
                    title=f"Progress Update - {milestone.title}",
                    description=description or f"Construction progress update for {milestone.title}",
                    update_date=date.today(),
                    images=[{'url': img['url'], 'caption': img.get('description', '')} for img in uploaded_images],
                    videos=[{'url': vid['url'], 'caption': vid.get('description', '')} for vid in uploaded_videos],
                    completion_percentage=milestone.progress_percentage,
                    milestone_achieved=milestone.title
                )
                logger.info(f"ConstructionUpdate created for milestone: {milestone.id}")
            except Exception as e:
                logger.error(f"Failed to create ConstructionUpdate: {str(e)}", exc_info=True)
                # Don't fail the upload if ConstructionUpdate creation fails
            
            logger.info(f"Secure upload completed - Milestone: {milestone.id}")
            
            serializer = self.get_serializer(milestone)
            return Response({
                'success': True,
                'milestone': serializer.data,
                'uploaded_images': len(uploaded_images),
                'uploaded_videos': len(uploaded_videos),
                'message': 'Media uploaded successfully with QR verification'
            })
            
        except Developer.DoesNotExist:
            return Response({'detail': 'Only builders can upload media'}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            logger.error(f"Secure upload error: {str(e)}", exc_info=True)
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


class ConstructionUpdateViewSet(viewsets.ModelViewSet):
    """ViewSet for Construction Updates
    
    Builders can create project-level updates (visible to everyone)
    or property-specific updates (visible only to property owners)
    """
    serializer_class = ConstructionUpdateSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ['project', 'update_type', 'property_unit_number']
    ordering_fields = ['update_date', 'created_at']
    ordering = ['-update_date', '-created_at']
    search_fields = ['title', 'description']
    
    def get_queryset(self):
        """
        Filter updates based on user permissions:
        - Builders see all updates for their projects
        - Property owners see project-level updates + their property-specific updates
        - Others see only public project-level updates
        """
        user = self.request.user
        
        if user.is_authenticated and user.role == 'builder':
            # Builders see all updates for their projects
            return ConstructionUpdate.objects.filter(
                project__developer__user=user
            ).select_related('project', 'created_by')
        
        # Base queryset - public project-level updates
        queryset = ConstructionUpdate.objects.filter(
            update_type='project_level',
            visible_to_owner_only=False
        ).select_related('project', 'created_by')
        
        # If user is authenticated buyer, include their property-specific updates
        if user.is_authenticated and user.role == 'buyer':
            # Get user's owned properties
            user_properties = user.saved_projects  # List of project IDs
            
            # Include property-specific updates for user's properties
            property_updates = ConstructionUpdate.objects.filter(
                project__id__in=user_properties,
                visible_to_owner_only=True
            ).select_related('project', 'created_by')
            
            # Combine both querysets
            queryset = queryset | property_updates
        
        return queryset.distinct()
    
    def perform_create(self, serializer):
        """Only builders can create updates"""
        if self.request.user.role != 'builder':
            raise PermissionDenied("Only builders can create construction updates")
        
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_properties_updates(self, request):
        """Get construction updates for buyer's owned properties"""
        if not request.user.is_authenticated or request.user.role != 'buyer':
            return Response({'error': 'Only buyers can access this endpoint'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        # Get user's owned properties
        user_properties = request.user.saved_projects
        
        # Get all updates (project-level and property-specific) for owned properties
        updates = ConstructionUpdate.objects.filter(
            project__id__in=user_properties
        ).select_related('project', 'created_by').order_by('-update_date', '-created_at')
        
        # Apply pagination
        page = self.paginate_queryset(updates)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(updates, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='project/(?P<project_id>[^/.]+)')
    def by_project(self, request, project_id=None):
        """Get all updates for a specific project (respecting permissions)"""
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get base queryset with permissions applied
        queryset = self.get_queryset().filter(project=project)
        
        # Apply ordering
        queryset = queryset.order_by('-update_date', '-created_at')
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

