from django.db import models
from django.contrib.auth import get_user_model
import uuid
from projects.models import Project, Property

User = get_user_model()


class BlockchainProgressUpdate(models.Model):
    """
    Django model to track progress updates stored on blockchain
    This is a local cache/reference to blockchain data
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    progress_id = models.CharField(max_length=255, unique=True)  # Same as blockchain key
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='blockchain_progress')
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='blockchain_progress', null=True, blank=True)
    milestone_id = models.CharField(max_length=255, blank=True, null=True)
    
    # IPFS and Blockchain data
    ipfs_hash = models.CharField(max_length=255)
    blockchain_tx_id = models.CharField(max_length=255, blank=True, null=True)  # Transaction ID
    blockchain_timestamp = models.DateTimeField(blank=True, null=True)
    
    # Content
    description = models.TextField()
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='blockchain_uploads')
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'blockchain_progress_updates'
        verbose_name = 'Blockchain Progress Update'
        verbose_name_plural = 'Blockchain Progress Updates'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Progress Update {self.progress_id} - {self.project.name}"


class BlockchainDocument(models.Model):
    """
    Django model to track documents stored on blockchain
    This is a local cache/reference to blockchain data
    """
    DOCUMENT_TYPES = [
        ('contract', 'Contract'),
        ('agreement', 'Agreement'),
        ('certificate', 'Certificate'),
        ('permit', 'Permit'),
        ('license', 'License'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document_id = models.CharField(max_length=255, unique=True)  # Same as blockchain key
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='blockchain_documents')
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='blockchain_documents', null=True, blank=True)
    
    # Document details
    document_name = models.CharField(max_length=255)
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPES)
    
    # IPFS and Blockchain data
    ipfs_hash = models.CharField(max_length=255)
    blockchain_tx_id = models.CharField(max_length=255, blank=True, null=True)  # Transaction ID
    blockchain_timestamp = models.DateTimeField(blank=True, null=True)
    
    # Metadata
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='blockchain_documents_uploaded')
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'blockchain_documents'
        verbose_name = 'Blockchain Document'
        verbose_name_plural = 'Blockchain Documents'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.document_name} - {self.project.name}"
