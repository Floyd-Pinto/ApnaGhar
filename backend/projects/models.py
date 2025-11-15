from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal
import uuid
import hashlib
import json

User = get_user_model()


class Developer(models.Model):
    """Developer/Builder profile extending User"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='developer_profile')
    company_name = models.CharField(max_length=255)
    rera_number = models.CharField(max_length=100, unique=True, null=True, blank=True)
    verified = models.BooleanField(default=False)
    trust_score = models.DecimalField(max_digits=3, decimal_places=2, default=0.0, 
                                     validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('5'))])
    description = models.TextField(blank=True)
    logo = models.URLField(max_length=500, blank=True, null=True)
    website = models.URLField(max_length=500, blank=True, null=True)
    established_year = models.IntegerField(null=True, blank=True)
    total_projects = models.IntegerField(default=0)
    completed_projects = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'developers'
        verbose_name = 'Developer'
        verbose_name_plural = 'Developers'

    def __str__(self):
        return self.company_name


class Project(models.Model):
    """Real estate project/development"""
    PROJECT_STATUS = [
        ('upcoming', 'Upcoming'),
        ('ongoing', 'Ongoing'),
        ('completed', 'Completed'),
        ('delayed', 'Delayed'),
        ('paused', 'Paused'),
    ]
    
    PROJECT_TYPE = [
        ('residential', 'Residential'),
        ('commercial', 'Commercial'),
        ('mixed', 'Mixed Use'),
        ('plotted', 'Plotted Development'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    developer = models.ForeignKey(Developer, on_delete=models.CASCADE, related_name='projects')
    
    # Basic Info
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=300, unique=True)
    description = models.TextField()
    project_type = models.CharField(max_length=20, choices=PROJECT_TYPE, default='residential')
    status = models.CharField(max_length=20, choices=PROJECT_STATUS, default='upcoming')
    
    # Location
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=10)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    # Financial
    starting_price = models.DecimalField(max_digits=12, decimal_places=2)
    total_units = models.IntegerField(default=0)
    available_units = models.IntegerField(default=0)
    
    # Media
    cover_image = models.URLField(max_length=500, blank=True, null=True)
    gallery_images = models.JSONField(default=list, blank=True)  # Array of image URLs
    video_url = models.URLField(max_length=500, blank=True, null=True)
    project_videos = models.JSONField(default=list, blank=True)  # [{"url": "...", "uploaded_at": "...", "description": "..."}]
    qr_code_data = models.CharField(max_length=255, blank=True, null=True)  # QR code for project-level videos
    
    # Timeline
    launch_date = models.DateField(null=True, blank=True)
    expected_completion = models.DateField(null=True, blank=True)
    actual_completion = models.DateField(null=True, blank=True)
    
    # Features
    total_floors = models.IntegerField(null=True, blank=True)
    total_area_sqft = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    amenities = models.JSONField(default=list, blank=True)  # ["Swimming Pool", "Gym", etc.]
    
    # Blockchain & Verification
    blockchain_hash = models.CharField(max_length=255, blank=True, null=True)
    verified = models.BooleanField(default=False)
    verification_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.0,
                                            validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('100'))])
    
    # Stats
    views_count = models.IntegerField(default=0)
    interested_count = models.IntegerField(default=0)
    
    # SEO
    meta_title = models.CharField(max_length=255, blank=True)
    meta_description = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'projects'
        verbose_name = 'Project'
        verbose_name_plural = 'Projects'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['city', 'status']),
            models.Index(fields=['developer', 'status']),
            models.Index(fields=['starting_price']),
        ]

    def __str__(self):
        return f"{self.name} - {self.city}"


class Property(models.Model):
    """Individual property unit within a project"""
    PROPERTY_TYPE = [
        ('1bhk', '1 BHK'),
        ('2bhk', '2 BHK'),
        ('3bhk', '3 BHK'),
        ('4bhk', '4 BHK'),
        ('5bhk+', '5 BHK+'),
        ('studio', 'Studio Apartment'),
        ('penthouse', 'Penthouse'),
        ('villa', 'Villa'),
        ('plot', 'Plot'),
        ('shop', 'Shop'),
        ('office', 'Office Space'),
    ]
    
    STATUS = [
        ('available', 'Available'),
        ('booked', 'Booked'),
        ('sold', 'Sold'),
        ('blocked', 'Blocked'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='properties')
    
    # Unit Details
    unit_number = models.CharField(max_length=50)
    property_type = models.CharField(max_length=20, choices=PROPERTY_TYPE)
    floor_number = models.IntegerField(null=True, blank=True)
    tower = models.CharField(max_length=50, blank=True, null=True)
    
    # Specifications
    carpet_area = models.DecimalField(max_digits=10, decimal_places=2)
    built_up_area = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    super_built_up_area = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    bedrooms = models.IntegerField(default=0)
    bathrooms = models.IntegerField(default=0)
    balconies = models.IntegerField(default=0)
    
    # Pricing
    price = models.DecimalField(max_digits=12, decimal_places=2)
    price_per_sqft = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS, default='available')
    buyer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='properties')
    
    # Features
    features = models.JSONField(default=list, blank=True)  # ["Corner Unit", "Park Facing", etc.]
    floor_plan_image = models.URLField(max_length=500, blank=True, null=True)
    
    # Unit-specific Progress Tracking
    unit_progress_percentage = models.IntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(100)])
    unit_progress_updates = models.JSONField(default=list, blank=True)  # [{"phase": "Tiling", "description": "...", "date": "...", "progress": 40}]
    unit_videos = models.JSONField(default=list, blank=True)  # [{"url": "...", "uploaded_at": "...", "description": "..."}]
    unit_photos = models.JSONField(default=list, blank=True)  # [{"url": "...", "uploaded_at": "...", "description": "..."}]
    qr_code_data = models.CharField(max_length=500, blank=True, null=True, unique=True)  # Unique QR code for this unit
    qr_code_secret = models.CharField(max_length=128, blank=True, null=True)  # Hash for verification
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        # Generate QR code data if not exists
        is_new = self.pk is None
        if not self.qr_code_data and is_new:
            # For new objects, save first to get ID, then update QR code
            super().save(*args, **kwargs)
            self.qr_code_data = f"property:{self.project.id}:{self.id}:{uuid.uuid4().hex[:8]}"
            # Generate secret hash for verification
            secret_string = f"{self.id}:{self.project.id}:{self.unit_number}:{uuid.uuid4().hex}"
            self.qr_code_secret = hashlib.sha256(secret_string.encode()).hexdigest()
            # Save again with QR code data (use update_fields to avoid recursion)
            super().save(update_fields=['qr_code_data', 'qr_code_secret'])
            
            # Store property creation on blockchain (after save to get ID)
            try:
                from blockchain.blockchain_service import get_blockchain_service
                blockchain_service = get_blockchain_service()
                blockchain_service.store_property_creation_on_blockchain(
                    property_id=str(self.id),
                    project_id=str(self.project.id),
                    unit_number=self.unit_number,
                    property_data={
                        'unit_number': self.unit_number,
                        'property_type': self.property_type,
                        'carpet_area': str(self.carpet_area),
                        'price': str(self.price),
                        'status': self.status,
                        'floor_number': self.floor_number,
                        'tower': self.tower or '',
                    },
                    created_by=str(self.project.developer.user.id) if hasattr(self.project.developer, 'user') else ''
                )
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Blockchain storage failed (non-critical): {str(e)}")
        else:
            super().save(*args, **kwargs)

    class Meta:
        db_table = 'properties'
        verbose_name = 'Property'
        verbose_name_plural = 'Properties'
        unique_together = ['project', 'unit_number']
        ordering = ['project', 'floor_number', 'unit_number']

    def __str__(self):
        return f"{self.project.name} - Unit {self.unit_number}"


class ConstructionMilestone(models.Model):
    """Construction progress tracking"""
    MILESTONE_STATUS = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('delayed', 'Delayed'),
        ('verified', 'Verified'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='milestones')
    
    # Milestone Details
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    phase_number = models.IntegerField()
    
    # Timeline
    target_date = models.DateField()
    start_date = models.DateField(null=True, blank=True)
    completion_date = models.DateField(null=True, blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=MILESTONE_STATUS, default='pending')
    progress_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.0,
                                             validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('100'))])
    
    # Verification
    verified = models.BooleanField(default=False)
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, 
                                   related_name='verified_milestones')
    verified_at = models.DateTimeField(null=True, blank=True)
    ai_verification_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True,
                                                validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('100'))])
    
    # Media
    images = models.JSONField(default=list, blank=True)  # Array of image URLs
    videos = models.JSONField(default=list, blank=True)  # Array of video URLs
    
    # Blockchain
    blockchain_hash = models.CharField(max_length=255, blank=True, null=True)
    ipfs_hash = models.CharField(max_length=255, blank=True, null=True)
    
    # QR Code for secure uploads
    qr_code_data = models.CharField(max_length=500, blank=True, null=True, unique=True)
    qr_code_secret = models.CharField(max_length=128, blank=True, null=True)  # Hash for verification
    
    # Notes
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        # Generate QR code data if not exists
        is_new = self.pk is None
        if not self.qr_code_data and is_new:
            # For new objects, save first to get ID, then update QR code
            super().save(*args, **kwargs)
            self.qr_code_data = f"milestone:{self.project.id}:{self.id}:{uuid.uuid4().hex[:8]}"
            # Generate secret hash for verification
            secret_string = f"{self.id}:{self.project.id}:{self.title}:{uuid.uuid4().hex}"
            self.qr_code_secret = hashlib.sha256(secret_string.encode()).hexdigest()
            # Save again with QR code data (use update_fields to avoid recursion)
            super().save(update_fields=['qr_code_data', 'qr_code_secret'])
        else:
            super().save(*args, **kwargs)

    class Meta:
        db_table = 'construction_milestones'
        verbose_name = 'Construction Milestone'
        verbose_name_plural = 'Construction Milestones'
        ordering = ['project', 'phase_number']
        indexes = [
            models.Index(fields=['project', 'status']),
            models.Index(fields=['target_date']),
        ]

    def __str__(self):
        return f"{self.project.name} - Phase {self.phase_number}: {self.title}"


class Review(models.Model):
    """Project reviews and ratings"""
    RATING_CHOICES = [(i, str(i)) for i in range(1, 6)]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    
    # Review Content
    rating = models.IntegerField(choices=RATING_CHOICES)
    title = models.CharField(max_length=255)
    comment = models.TextField()
    
    # Categories
    location_rating = models.IntegerField(choices=RATING_CHOICES, null=True, blank=True)
    amenities_rating = models.IntegerField(choices=RATING_CHOICES, null=True, blank=True)
    value_rating = models.IntegerField(choices=RATING_CHOICES, null=True, blank=True)
    
    # Meta
    helpful_count = models.IntegerField(default=0)
    verified_buyer = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'project_reviews'
        verbose_name = 'Review'
        verbose_name_plural = 'Reviews'
        ordering = ['-created_at']
        unique_together = ['project', 'user']  # One review per user per project

    def __str__(self):
        return f"{self.user.email} - {self.project.name} ({self.rating}★)"


class ConstructionUpdate(models.Model):
    """Construction updates for projects - can be project-level or property-specific"""
    UPDATE_TYPES = [
        ('project_level', 'Project Level Update'),
        ('property_specific', 'Property Specific Update'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='construction_updates')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='construction_updates')
    
    # Update details
    update_type = models.CharField(max_length=20, choices=UPDATE_TYPES, default='project_level')
    title = models.CharField(max_length=255)
    description = models.TextField()
    update_date = models.DateField()
    
    # Media
    images = models.JSONField(default=list, blank=True)  # [{"url": "...", "caption": "..."}]
    videos = models.JSONField(default=list, blank=True)  # [{"url": "...", "caption": "..."}]
    
    # Progress tracking
    completion_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    milestone_achieved = models.CharField(max_length=255, null=True, blank=True)
    
    # Property-specific fields
    property_unit_number = models.CharField(max_length=50, null=True, blank=True, 
                                           help_text='Specific flat/unit number for property-specific updates')
    visible_to_owner_only = models.BooleanField(default=False, 
                                                help_text='If True, only property owner can see this update')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'construction_updates'
        verbose_name = 'Construction Update'
        verbose_name_plural = 'Construction Updates'
        ordering = ['-update_date', '-created_at']
        indexes = [
            models.Index(fields=['project', 'update_type']),
            models.Index(fields=['project', 'property_unit_number']),
        ]

    def __str__(self):
        if self.update_type == 'property_specific':
            return f"{self.project.name} - Unit {self.property_unit_number} - {self.title}"
        return f"{self.project.name} - {self.title}"

