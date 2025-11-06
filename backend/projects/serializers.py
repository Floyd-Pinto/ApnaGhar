from rest_framework import serializers
from .models import Developer, Project, Property, ConstructionMilestone, Review
from django.contrib.auth import get_user_model

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
        reviews = obj.reviews.all()
        if reviews:
            return round(sum(r.rating for r in reviews) / len(reviews), 2)
        return 0
    
    def get_total_reviews(self, obj):
        return obj.reviews.count()


class MilestoneSerializer(serializers.ModelSerializer):
    """Serializer for Construction Milestones"""
    verified_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ConstructionMilestone
        fields = [
            'id', 'project', 'title', 'description', 'phase_number',
            'target_date', 'start_date', 'completion_date', 'status',
            'progress_percentage', 'verified', 'verified_by', 'verified_by_name',
            'verified_at', 'ai_verification_score', 'images', 'videos',
            'blockchain_hash', 'ipfs_hash', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'verified_by_name', 'created_at', 'updated_at']
    
    def get_verified_by_name(self, obj):
        if obj.verified_by:
            return f"{obj.verified_by.first_name} {obj.verified_by.last_name}".strip() or obj.verified_by.email
        return None


class PropertySerializer(serializers.ModelSerializer):
    """Serializer for Property units"""
    class Meta:
        model = Property
        fields = [
            'id', 'project', 'unit_number', 'property_type', 'floor_number',
            'tower', 'carpet_area', 'built_up_area', 'super_built_up_area',
            'bedrooms', 'bathrooms', 'balconies', 'price', 'price_per_sqft',
            'status', 'buyer', 'features', 'floor_plan_image',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


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
