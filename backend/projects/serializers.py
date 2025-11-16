from rest_framework import serializers
from .models import Developer, Project, Property, ConstructionMilestone, Review, ConstructionUpdate, Booking
from django.contrib.auth import get_user_model
from decimal import Decimal
import cloudinary.utils

User = get_user_model()


class DeveloperSerializer(serializers.ModelSerializer):
    """Serializer for Developer model"""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Developer
        fields = [
            'id', 'user', 'user_email', 'user_name', 'company_name', 'rera_number', 
            'verified', 'trust_score', 'description', 'logo', 'website', 
            'established_year', 'total_projects', 'completed_projects',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'user_email', 'user_name', 'created_at', 'updated_at']
    
    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.email


class ProjectListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for project listings"""
    developer_name = serializers.CharField(source='developer.company_name', read_only=True)
    developer_verified = serializers.BooleanField(source='developer.verified', read_only=True)
    average_rating = serializers.SerializerMethodField()
    total_reviews = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'name', 'slug', 'developer_name', 'developer_verified',
            'city', 'state', 'status', 'project_type', 'starting_price',
            'total_units', 'available_units', 'cover_image', 'verified',
            'verification_score', 'launch_date', 'expected_completion',
            'average_rating', 'total_reviews', 'views_count', 'interested_count',
            'created_at'
        ]
    
    def get_average_rating(self, obj):
        # Use prefetched reviews if available, otherwise query
        if hasattr(obj, '_prefetched_objects_cache') and 'reviews' in obj._prefetched_objects_cache:
            reviews = obj.reviews.all()
            if reviews:
                return round(sum(r.rating for r in reviews) / len(reviews), 2)
        elif hasattr(obj, 'avg_rating') and obj.avg_rating is not None:
            # Use annotated average if available
            return round(obj.avg_rating, 2)
        return 0
    
    def get_total_reviews(self, obj):
        # Use prefetched reviews count if available
        if hasattr(obj, '_prefetched_objects_cache') and 'reviews' in obj._prefetched_objects_cache:
            return len(obj.reviews.all())
        elif hasattr(obj, 'review_count'):
            # Use annotated count if available
            return obj.review_count
        return obj.reviews.count()


class MilestoneSerializer(serializers.ModelSerializer):
    """Serializer for Construction Milestones"""
    verified_by_name = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    videos = serializers.SerializerMethodField()
    
    class Meta:
        model = ConstructionMilestone
        fields = [
            'id', 'project', 'title', 'description', 'phase_number',
            'target_date', 'start_date', 'completion_date', 'status',
            'progress_percentage', 'verified', 'verified_by', 'verified_by_name',
            'verified_at', 'ai_verification_score', 'images', 'videos',
            'blockchain_hash', 'ipfs_hash', 'notes', 'qr_code_data', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'verified_by_name', 'created_at', 'updated_at']
    
    def get_verified_by_name(self, obj):
        if obj.verified_by:
            return f"{obj.verified_by.first_name} {obj.verified_by.last_name}".strip() or obj.verified_by.email
        return None

    def _build_media_url(self, sha256: str, resource_type: str):
        if not sha256:
            return None
        try:
            # Use full path with folder as public_id
            public_id = f"estate_platform/milestones/{sha256}"
            url, opts = cloudinary.utils.cloudinary_url(public_id, resource_type=resource_type, secure=True)
            return url
        except Exception:
            # Fallback to None if URL build fails
            return None

    def get_images(self, obj):
        # obj.images is a list of dicts stored in DB; each dict should contain 'sha256', 'uploaded_at', 'description'
        out = []
        for entry in obj.images or []:
            # Handle both dict and string formats (backward compatibility)
            if isinstance(entry, dict):
                sha = entry.get('sha256')
                url = self._build_media_url(sha, 'image') if sha else None
                out.append({
                    'sha256': sha,
                    'url': url,
                    'uploaded_at': entry.get('uploaded_at'),
                    'description': entry.get('description', '')
                })
            elif isinstance(entry, str):
                # If it's just a string (URL), wrap it in the expected format
                out.append({
                    'sha256': None,
                    'url': entry,
                    'uploaded_at': None,
                    'description': ''
                })
        return out

    def get_videos(self, obj):
        out = []
        for entry in obj.videos or []:
            # Handle both dict and string formats (backward compatibility)
            if isinstance(entry, dict):
                sha = entry.get('sha256')
                url = self._build_media_url(sha, 'video') if sha else None
                out.append({
                    'sha256': sha,
                    'url': url,
                    'uploaded_at': entry.get('uploaded_at'),
                    'description': entry.get('description', '')
                })
            elif isinstance(entry, str):
                # If it's just a string (URL), wrap it in the expected format
                out.append({
                    'sha256': None,
                    'url': entry,
                    'uploaded_at': None,
                    'description': ''
                })
        return out


class PropertySerializer(serializers.ModelSerializer):
    """Serializer for Property units with nested project details"""
    project = serializers.SerializerMethodField()
    
    class Meta:
        model = Property
        fields = [
            'id', 'project', 'unit_number', 'property_type', 'floor_number',
            'tower', 'carpet_area', 'built_up_area', 'super_built_up_area',
            'bedrooms', 'bathrooms', 'balconies', 'price', 'price_per_sqft',
            'status', 'buyer', 'features', 'floor_plan_image', 'unit_photos',
            'unit_videos', 'unit_progress_percentage', 'qr_code_data',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_project(self, obj):
        """Return nested project details"""
        return {
            'id': str(obj.project.id),
            'name': obj.project.name,
            'city': obj.project.city,
            'state': obj.project.state,
            'address': obj.project.address,
            'cover_image': obj.project.cover_image,
            'amenities': obj.project.amenities,
            'expected_completion': obj.project.expected_completion.isoformat() if obj.project.expected_completion else None,
            'developer': {
                'company_name': obj.project.developer.company_name,
                'verified': obj.project.developer.verified,
            }
        }


class ReviewSerializer(serializers.ModelSerializer):
    """Serializer for Project Reviews"""
    user_name = serializers.SerializerMethodField()
    user_avatar = serializers.SerializerMethodField()
    
    class Meta:
        model = Review
        fields = [
            'id', 'project', 'user', 'user_name', 'user_avatar', 'rating',
            'title', 'comment', 'location_rating', 'amenities_rating',
            'value_rating', 'helpful_count', 'verified_buyer',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'user_name', 'user_avatar', 'created_at', 'updated_at']
    
    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.email
    
    def get_user_avatar(self, obj):
        return obj.user.avatar if hasattr(obj.user, 'avatar') else None


class ProjectDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for single project view"""
    developer = DeveloperSerializer(read_only=True)
    milestones = MilestoneSerializer(many=True, read_only=True)
    properties = PropertySerializer(many=True, read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    average_rating = serializers.SerializerMethodField()
    total_reviews = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'developer', 'name', 'slug', 'description', 'project_type',
            'status', 'address', 'city', 'state', 'pincode', 'latitude',
            'longitude', 'starting_price', 'total_units', 'available_units',
            'cover_image', 'gallery_images', 'video_url', 'launch_date',
            'expected_completion', 'actual_completion', 'total_floors',
            'total_area_sqft', 'amenities', 'blockchain_hash', 'verified',
            'verification_score', 'views_count', 'interested_count',
            'meta_title', 'meta_description', 'milestones', 'properties',
            'reviews', 'average_rating', 'total_reviews',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'developer', 'views_count', 'interested_count', 'created_at', 'updated_at']
    
    def get_average_rating(self, obj):
        reviews = obj.reviews.all()
        if reviews:
            return sum(r.rating for r in reviews) / len(reviews)
        return 0
    
    def get_total_reviews(self, obj):
        return obj.reviews.count()


class ProjectCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating projects"""
    class Meta:
        model = Project
        fields = [
            'name', 'slug', 'description', 'project_type', 'status',
            'address', 'city', 'state', 'pincode', 'latitude', 'longitude',
            'starting_price', 'total_units', 'available_units', 'cover_image',
            'gallery_images', 'video_url', 'launch_date', 'expected_completion',
            'total_floors', 'total_area_sqft', 'amenities', 'meta_title',
            'meta_description'
        ]
    
    def validate_slug(self, value):
        """Ensure slug is unique"""
        instance = self.instance
        if instance and Project.objects.exclude(pk=instance.pk).filter(slug=value).exists():
            raise serializers.ValidationError("Project with this slug already exists.")
        elif not instance and Project.objects.filter(slug=value).exists():
            raise serializers.ValidationError("Project with this slug already exists.")
        return value


class UnitProgressSerializer(serializers.ModelSerializer):
    """Serializer to expose unit-specific progress data (photos/videos/updates)"""
    unit_photos = serializers.SerializerMethodField()
    unit_videos = serializers.SerializerMethodField()

    def _build_media_url(self, sha256: str, resource_type: str):
        if not sha256:
            return None
        try:
            # Use full path with folder as public_id
            public_id = f"estate_platform/units/{sha256}"
            url, opts = cloudinary.utils.cloudinary_url(public_id, resource_type=resource_type, secure=True)
            return url
        except Exception:
            return None

    def get_unit_photos(self, obj):
        out = []
        for entry in obj.unit_photos or []:
            sha = entry.get('sha256') if isinstance(entry, dict) else None
            url = self._build_media_url(sha, 'image') if sha else None
            out.append({
                'sha256': sha,
                'url': url,
                'uploaded_at': entry.get('uploaded_at'),
                'description': entry.get('description', '')
            })
        return out

    def get_unit_videos(self, obj):
        out = []
        for entry in obj.unit_videos or []:
            sha = entry.get('sha256') if isinstance(entry, dict) else None
            url = self._build_media_url(sha, 'video') if sha else None
            out.append({
                'sha256': sha,
                'url': url,
                'uploaded_at': entry.get('uploaded_at'),
                'description': entry.get('description', '')
            })
        return out
    class Meta:
        model = Property
        fields = [
            'id', 'project', 'unit_number', 'unit_progress_percentage',
            'unit_progress_updates', 'unit_photos', 'unit_videos', 'qr_code_data'
        ]
        read_only_fields = ['id']


class ConstructionUpdateSerializer(serializers.ModelSerializer):
    """Serializer for Construction Updates"""
    created_by_name = serializers.SerializerMethodField()
    project_name = serializers.CharField(source='project.name', read_only=True)
    
    class Meta:
        model = ConstructionUpdate
        fields = [
            'id', 'project', 'project_name', 'created_by', 'created_by_name',
            'update_type', 'title', 'description', 'update_date',
            'images', 'videos', 'completion_percentage', 'milestone_achieved',
            'property_unit_number', 'visible_to_owner_only',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_by_name', 'project_name', 'created_at', 'updated_at']
    
    def get_created_by_name(self, obj):
        return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.email


class BookingSerializer(serializers.ModelSerializer):
    """Serializer for Booking model"""
    property_details = serializers.SerializerMethodField()
    buyer_name = serializers.SerializerMethodField()
    buyer_email = serializers.EmailField(source='buyer.email', read_only=True)
    project_name = serializers.CharField(source='property.project.name', read_only=True)
    project_id = serializers.UUIDField(source='property.project.id', read_only=True)
    property_unit_number = serializers.CharField(source='property.unit_number', read_only=True)
    property_type = serializers.CharField(source='property.property_type', read_only=True)
    property_price_current = serializers.DecimalField(source='property.price', read_only=True, max_digits=12, decimal_places=2)
    
    class Meta:
        model = Booking
        fields = [
            'id', 'booking_number', 'property', 'property_details', 'buyer', 'buyer_name', 'buyer_email',
            'status', 'property_price', 'token_amount', 'total_amount', 'amount_paid', 'amount_due',
            'payment_schedule', 'booking_date', 'token_payment_date', 'confirmation_date',
            'agreement_date', 'expected_possession_date', 'cancellation_date', 'completion_date',
            'payment_method', 'payment_reference', 'payment_gateway', 'agreement_document_url',
            'agreement_document_hash', 'additional_documents', 'cancellation_reason',
            'cancellation_initiated_by', 'refund_amount', 'refund_status', 'refund_reference',
            'terms_accepted', 'terms_accepted_at', 'cancellation_policy', 'special_conditions',
            'notes', 'metadata', 'project_name', 'project_id', 'property_unit_number',
            'property_type', 'property_price_current', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'booking_number', 'property_details', 'buyer_name', 'buyer_email',
            'project_name', 'project_id', 'property_unit_number', 'property_type',
            'property_price_current', 'amount_due', 'created_at', 'updated_at'
        ]
    
    def get_property_details(self, obj):
        """Return basic property information"""
        return {
            'id': str(obj.property.id),
            'unit_number': obj.property.unit_number,
            'property_type': obj.property.property_type,
            'floor_number': obj.property.floor_number,
            'tower': obj.property.tower,
            'carpet_area': str(obj.property.carpet_area),
            'current_price': str(obj.property.price),
            'current_status': obj.property.status,
        }
    
    def get_buyer_name(self, obj):
        """Return buyer's full name"""
        if obj.buyer:
            name = f"{obj.buyer.first_name} {obj.buyer.last_name}".strip()
            return name if name else obj.buyer.email
        return None
    
    def validate(self, data):
        """Validate booking data"""
        property_obj = data.get('property')
        buyer = data.get('buyer')
        
        if property_obj and buyer:
            # Check if property is available
            if property_obj.status != 'available':
                raise serializers.ValidationError({
                    'property': f'Property is not available. Current status: {property_obj.status}'
                })
            
            # Check if buyer already has an active booking for this property
            active_booking = Booking.objects.filter(
                property=property_obj,
                buyer=buyer,
                status__in=['pending', 'token_paid', 'confirmed', 'agreement_pending', 
                           'agreement_signed', 'payment_in_progress']
            ).exists()
            
            if active_booking:
                raise serializers.ValidationError({
                    'property': 'You already have an active booking for this property'
                })
            
            # Set property_price and total_amount from property price
            if 'total_amount' not in data or not data.get('total_amount'):
                data['total_amount'] = property_obj.price
                data['property_price'] = property_obj.price
            
            # Calculate amount_due
            amount_paid = data.get('amount_paid', Decimal('0'))
            total_amount = data.get('total_amount', property_obj.price)
            data['amount_due'] = total_amount - amount_paid
        
        return data


class BookingCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating bookings (simplified)"""
    property_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = Booking
        fields = [
            'property_id', 'token_amount', 'payment_method', 'terms_accepted',
            'expected_possession_date', 'special_conditions', 'notes'
        ]
        extra_kwargs = {
            'token_amount': {'required': False, 'allow_null': True},
            'expected_possession_date': {'required': False, 'allow_null': True},
            'special_conditions': {'required': False, 'allow_null': True, 'allow_blank': True},
            'notes': {'required': False, 'allow_null': True, 'allow_blank': True},
        }
    
    def create(self, validated_data):
        """Create a new booking"""
        property_id = validated_data.pop('property_id')
        property_obj = Property.objects.select_related('project').get(id=property_id)
        buyer = self.context['request'].user
        
        # Get token amount (default to 5% of property price if not provided)
        token_amount = validated_data.get('token_amount')
        if not token_amount:
            token_amount = property_obj.price * Decimal('0.05')  # 5% default
        
        booking = Booking.objects.create(
            property=property_obj,
            buyer=buyer,
            property_price=property_obj.price,
            total_amount=property_obj.price,
            token_amount=token_amount,
            amount_due=property_obj.price - token_amount,
            **validated_data
        )
        
        return booking
