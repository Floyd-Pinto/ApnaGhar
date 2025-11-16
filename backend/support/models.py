from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import uuid

User = get_user_model()


class SupportTicket(models.Model):
    """Support ticket model for customer support"""
    TICKET_CATEGORY = [
        ('booking', 'Booking'),
        ('payment', 'Payment'),
        ('property', 'Property'),
        ('account', 'Account'),
        ('technical', 'Technical'),
        ('general', 'General'),
        ('other', 'Other'),
    ]
    
    PRIORITY = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    STATUS = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('waiting_for_user', 'Waiting for User'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket_number = models.CharField(max_length=50, unique=True, blank=True)  # Auto-generated
    
    # User Information
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='support_tickets')
    
    # Ticket Details
    category = models.CharField(max_length=20, choices=TICKET_CATEGORY, default='general')
    priority = models.CharField(max_length=20, choices=PRIORITY, default='medium')
    status = models.CharField(max_length=20, choices=STATUS, default='open')
    
    # Subject and Description
    subject = models.CharField(max_length=255)
    description = models.TextField()
    
    # Assignment
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tickets',
        help_text='Staff member assigned to this ticket'
    )
    
    # Related Objects (for linking to specific items)
    related_object_type = models.CharField(max_length=50, blank=True, null=True)  # e.g., 'booking', 'payment'
    related_object_id = models.UUIDField(blank=True, null=True)  # ID of related object
    
    # Attachments
    attachments = models.JSONField(default=list, blank=True)  # [{"url": "...", "name": "...", "type": "..."}]
    
    # Resolution
    resolution = models.TextField(blank=True, null=True)
    resolved_at = models.DateTimeField(blank=True, null=True)
    resolved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_tickets'
    )
    
    # Closure
    closed_at = models.DateTimeField(blank=True, null=True)
    closed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='closed_tickets'
    )
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)  # Additional context data
    internal_notes = models.TextField(blank=True)  # Internal notes (not visible to user)
    
    # Tracking
    last_activity_at = models.DateTimeField(auto_now=True)
    last_message_at = models.DateTimeField(null=True, blank=True)
    first_response_at = models.DateTimeField(null=True, blank=True)  # Time to first response
    resolution_time = models.IntegerField(null=True, blank=True, help_text='Resolution time in minutes')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'support_tickets'
        verbose_name = 'Support Ticket'
        verbose_name_plural = 'Support Tickets'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['status', 'priority']),
            models.Index(fields=['assigned_to', 'status']),
            models.Index(fields=['ticket_number']),
            models.Index(fields=['category', 'status']),
            models.Index(fields=['created_at']),
        ]
    
    def save(self, *args, **kwargs):
        # Auto-generate ticket number if not set
        if not self.ticket_number:
            date_part = timezone.now().strftime('%Y%m%d')
            random_part = uuid.uuid4().hex[:6].upper()
            self.ticket_number = f"TICK-{date_part}-{random_part}"
        
        # Update timestamps based on status
        if self.status == 'resolved' and not self.resolved_at:
            self.resolved_at = timezone.now()
            if not self.resolved_by and self.assigned_to:
                self.resolved_by = self.assigned_to
            
            # Calculate resolution time
            if self.first_response_at:
                delta = self.resolved_at - self.first_response_at
                self.resolution_time = int(delta.total_seconds() / 60)
        
        elif self.status == 'closed' and not self.closed_at:
            self.closed_at = timezone.now()
            if not self.closed_by and self.assigned_to:
                self.closed_by = self.assigned_to
        
        # Update last activity
        self.last_activity_at = timezone.now()
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Ticket #{self.ticket_number} - {self.subject}"


class SupportMessage(models.Model):
    """Support message model for ticket conversations"""
    MESSAGE_TYPE = [
        ('user', 'User Message'),
        ('staff', 'Staff Message'),
        ('system', 'System Message'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name='messages')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='support_messages')
    
    # Message Content
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPE, default='user')
    message = models.TextField()
    
    # Attachments
    attachments = models.JSONField(default=list, blank=True)  # [{"url": "...", "name": "...", "type": "..."}]
    
    # Metadata
    is_internal = models.BooleanField(default=False, help_text='Internal note (not visible to user)')
    metadata = models.JSONField(default=dict, blank=True)
    
    # Read Tracking
    read_by_user = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'support_messages'
        verbose_name = 'Support Message'
        verbose_name_plural = 'Support Messages'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['ticket', 'created_at']),
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['is_internal']),
        ]
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        
        # Update ticket's last_message_at and last_activity_at
        self.ticket.last_message_at = timezone.now()
        self.ticket.last_activity_at = timezone.now()
        
        # Set first_response_at if this is the first staff response
        if (self.message_type == 'staff' and 
            not self.is_internal and 
            not self.ticket.first_response_at):
            self.ticket.first_response_at = timezone.now()
        
        self.ticket.save(update_fields=['last_message_at', 'last_activity_at', 'first_response_at'])
    
    def __str__(self):
        return f"Message #{self.id} - Ticket #{self.ticket.ticket_number}"


class SupportCategory(models.Model):
    """Support category model for organizing tickets"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    
    # Assignment
    default_assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='default_category_assignments',
        help_text='Default staff member for this category'
    )
    
    # Priority
    default_priority = models.CharField(max_length=20, choices=SupportTicket.PRIORITY, default='medium')
    
    # Status
    is_active = models.BooleanField(default=True)
    display_order = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'support_categories'
        verbose_name = 'Support Category'
        verbose_name_plural = 'Support Categories'
        ordering = ['display_order', 'name']
    
    def __str__(self):
        return self.name
