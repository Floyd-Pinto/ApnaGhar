"""
Serializers for blockchain models
"""

from rest_framework import serializers
from .models import BlockchainProgressUpdate, BlockchainDocument
from projects.serializers import ProjectListSerializer, PropertySerializer


class BlockchainProgressUpdateSerializer(serializers.ModelSerializer):
    """Serializer for blockchain progress updates"""
    project = ProjectListSerializer(read_only=True)
    property = PropertySerializer(read_only=True)
    uploaded_by_username = serializers.CharField(source='uploaded_by.username', read_only=True)
    ipfs_url = serializers.SerializerMethodField()
    
    class Meta:
        model = BlockchainProgressUpdate
        fields = [
            'id', 'progress_id', 'project', 'property', 'milestone_id',
            'ipfs_hash', 'ipfs_url', 'blockchain_tx_id', 'blockchain_timestamp',
            'description', 'uploaded_by', 'uploaded_by_username',
            'metadata', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_ipfs_url(self, obj):
        """Get IPFS gateway URL"""
        from .ipfs_service import get_pinata_service
        return get_pinata_service().get_file_url(obj.ipfs_hash)


class BlockchainDocumentSerializer(serializers.ModelSerializer):
    """Serializer for blockchain documents"""
    project = ProjectListSerializer(read_only=True)
    property = PropertySerializer(read_only=True)
    uploaded_by_username = serializers.CharField(source='uploaded_by.username', read_only=True)
    ipfs_url = serializers.SerializerMethodField()
    
    class Meta:
        model = BlockchainDocument
        fields = [
            'id', 'document_id', 'project', 'property',
            'document_name', 'document_type',
            'ipfs_hash', 'ipfs_url', 'blockchain_tx_id', 'blockchain_timestamp',
            'uploaded_by', 'uploaded_by_username',
            'metadata', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_ipfs_url(self, obj):
        """Get IPFS gateway URL"""
        from .ipfs_service import get_pinata_service
        return get_pinata_service().get_file_url(obj.ipfs_hash)

