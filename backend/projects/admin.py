from django.contrib import admin
from .models import Developer, Project, Property, ConstructionMilestone, Review


@admin.register(Developer)
class DeveloperAdmin(admin.ModelAdmin):
    list_display = ['company_name', 'user', 'rera_number', 'verified', 'trust_score', 'total_projects']
    list_filter = ['verified', 'created_at']
    search_fields = ['company_name', 'rera_number', 'user__email']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'developer', 'city', 'status', 'starting_price', 'total_units', 'verified', 'created_at']
    list_filter = ['status', 'project_type', 'verified', 'city']
    search_fields = ['name', 'city', 'developer__company_name']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['id', 'views_count', 'interested_count', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('developer', 'name', 'slug', 'description', 'project_type', 'status')
        }),
        ('Location', {
            'fields': ('address', 'city', 'state', 'pincode', 'latitude', 'longitude')
        }),
        ('Financial Details', {
            'fields': ('starting_price', 'total_units', 'available_units')
        }),
        ('Media', {
            'fields': ('cover_image', 'gallery_images', 'video_url')
        }),
        ('Timeline', {
            'fields': ('launch_date', 'expected_completion', 'actual_completion')
        }),
        ('Features', {
            'fields': ('total_floors', 'total_area_sqft', 'amenities')
        }),
        ('Verification', {
            'fields': ('blockchain_hash', 'verified', 'verification_score')
        }),
        ('Statistics', {
            'fields': ('views_count', 'interested_count')
        }),
        ('SEO', {
            'fields': ('meta_title', 'meta_description')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at')
        }),
    )


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ['unit_number', 'project', 'property_type', 'price', 'status', 'buyer']
    list_filter = ['status', 'property_type', 'project']
    search_fields = ['unit_number', 'project__name']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(ConstructionMilestone)
class ConstructionMilestoneAdmin(admin.ModelAdmin):
    list_display = ['project', 'phase_number', 'title', 'status', 'target_date', 'progress_percentage', 'verified']
    list_filter = ['status', 'verified', 'target_date']
    search_fields = ['project__name', 'title']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Milestone Details', {
            'fields': ('project', 'phase_number', 'title', 'description', 'status', 'progress_percentage')
        }),
        ('Timeline', {
            'fields': ('target_date', 'start_date', 'completion_date')
        }),
        ('Verification', {
            'fields': ('verified', 'verified_by', 'verified_at', 'ai_verification_score')
        }),
        ('Media', {
            'fields': ('images', 'videos')
        }),
        ('Blockchain', {
            'fields': ('blockchain_hash', 'ipfs_hash')
        }),
        ('Additional Info', {
            'fields': ('notes',)
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at')
        }),
    )


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['user', 'project', 'rating', 'verified_buyer', 'created_at']
    list_filter = ['rating', 'verified_buyer', 'created_at']
    search_fields = ['user__email', 'project__name', 'title']
    readonly_fields = ['id', 'created_at', 'updated_at']

