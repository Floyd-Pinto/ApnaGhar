from django.contrib.auth.models import AbstractUser
from django.db import models
from django.contrib.auth.hashers import make_password
import uuid

class CustomUser(AbstractUser):
    USER_ROLES = [
        ('buyer', 'Buyer'),
        ('builder', 'Builder'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    role = models.CharField(max_length=10, choices=USER_ROLES, default='buyer')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Profile fields
    phone = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    bio = models.TextField(max_length=500, blank=True, null=True)
    avatar = models.URLField(max_length=255, blank=True, null=True)
    
    # Preferences
    theme_preference = models.CharField(
        max_length=10, 
        choices=[('light', 'Light'), ('dark', 'Dark')], 
        default='light'
    )
    language = models.CharField(max_length=10, default='en')
    timezone = models.CharField(max_length=50, default='UTC')
    
    # Notification preferences
    email_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=False)
    marketing_emails = models.BooleanField(default=False)
    
    # Privacy settings
    profile_visibility = models.BooleanField(default=True)
    show_activity_status = models.BooleanField(default=True)
    
    # User activity tracking
    saved_projects = models.JSONField(default=list, blank=True)  # List of project IDs
    recently_viewed = models.JSONField(default=list, blank=True)  # List of project IDs (ordered by recency)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    def save(self, *args, **kwargs):
        if self._state.adding and self.password:
            self.password = make_password(self.password)
        super().save(*args, **kwargs)

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return self.email
