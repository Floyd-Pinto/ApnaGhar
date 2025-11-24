"""
Django REST API views for blockchain operations
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.core.files.uploadedfile import InMemoryUploadedFile
import uuid
import logging
import asyncio

from .models import BlockchainProgressUpdate, BlockchainDocument
from .serializers import BlockchainProgressUpdateSerializer, BlockchainDocumentSerializer
from .ipfs_service import get_pinata_service
# from .fabric_client import get_fabric_service
from projects.models import Project, Property
from users.models import CustomUser

logger = logging.getLogger(__name__)


class BlockchainProgressUpdateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for blockchain progress updates
    """
    queryset = BlockchainProgressUpdate.objects.all()
    serializer_class = BlockchainProgressUpdateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter progress updates by project_id or property_id if provided"""
        queryset = super().get_queryset().select_related('project', 'property', 'uploaded_by')
        project_id = self.request.query_params.get('project_id')
        property_id = self.request.query_params.get('property_id')
        
        if property_id:
            queryset = queryset.filter(property__id=property_id)
        elif project_id:
            queryset = queryset.filter(project__id=project_id)
        
        return queryset.order_by('-created_at')
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def upload_progress(self, request):
        """
        Upload a construction progress update to IPFS and blockchain
        
        Expected request data:
        - project_id: Project ID
        - property_id: Property ID (optional)
        - milestone_id: Milestone ID (optional)
        - description: Description of the progress
        - file: Image/video file to upload
        - metadata: Additional metadata (optional)
        """
        try:
            # Get request data
            project_id = request.data.get('project_id')
            property_id = request.data.get('property_id')
            milestone_id = request.data.get('milestone_id')
            description = request.data.get('description')
            file = request.FILES.get('file')
            metadata = request.data.get('metadata', {})
            
            # Validate required fields
            if not project_id or not description or not file:
                return Response(
                    {'detail': 'Missing required fields: project_id, description, and file are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Verify project exists
            try:
                project = Project.objects.get(id=project_id)
            except Project.DoesNotExist:
                return Response(
                    {'detail': 'Project not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Verify property exists if provided
            property_obj = None
            if property_id:
                try:
                    property_obj = Property.objects.get(id=property_id, project=project)
                except Property.DoesNotExist:
                    return Response(
                        {'detail': 'Property not found'},
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            # Generate unique progress ID
            progress_id = f"progress_{uuid.uuid4().hex}"
            
            # Upload to IPFS via Pinata
            pinata_service = get_pinata_service()
            
            pinata_metadata = {
                'name': f'Progress Update - {project.name}',
                'description': description,
                'project_id': str(project.id),
            }
            if property_obj:
                pinata_metadata['property_id'] = str(property_obj.id)
            if milestone_id:
                pinata_metadata['milestone_id'] = milestone_id
            
            ipfs_result = pinata_service.upload_file(
                file=file,
                metadata=pinata_metadata
            )
            
            ipfs_hash = ipfs_result['ipfs_hash']
            
            # Store on blockchain
            try:
                from .blockchain_service import get_blockchain_service
                blockchain_service = get_blockchain_service()
                blockchain_result = blockchain_service.store_progress_update_on_blockchain(
                    project_id=str(project.id),
                    property_id=str(property_obj.id) if property_obj else None,
                    milestone_id=milestone_id,
                    description=description,
                    cloudinary_urls=[], 
                    uploaded_by=str(request.user.id),
                    metadata=metadata
                )
            except Exception as e:
                logger.warning(f"Blockchain storage failed: {str(e)}")
                blockchain_result = {'success': False}
            
            # Create local record
            progress_update = BlockchainProgressUpdate.objects.create(
                id=uuid.uuid4(),
                progress_id=progress_id,
                project=project,
                property=property_obj,
                milestone_id=milestone_id,
                ipfs_hash=ipfs_hash,
                blockchain_tx_id=blockchain_result.get('tx_id'),
                blockchain_timestamp=timezone.now(),
                description=description,
                uploaded_by=request.user,
                metadata=metadata
            )
            
            logger.info(f"Progress update stored: {progress_id}")
            
            return Response({
                'success': True,
                'progress_id': progress_id,
                'ipfs_hash': ipfs_hash,
                'ipfs_url': ipfs_result['ipfs_url'],
                'blockchain_tx_id': blockchain_result.get('tx_id'),
                'message': 'Progress update stored successfully on blockchain'
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Failed to upload progress update: {str(e)}", exc_info=True)
            return Response(
                {'detail': f'Failed to upload progress update: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def get_blockchain_data(self, request, pk=None):
        """Get blockchain data for a progress update"""
        try:
            progress_update = self.get_object()
            
            # Query from blockchain
            # Fabric integration removed for fresh start
            blockchain_data = {}
            # fabric_service = get_fabric_service()
            # ...
            
            return Response({
                'local_data': {
                    'id': str(progress_update.id),
                    'progress_id': progress_update.progress_id,
                    'project': progress_update.project.name,
                    'description': progress_update.description,
                    'ipfs_hash': progress_update.ipfs_hash,
                    'ipfs_url': get_pinata_service().get_file_url(progress_update.ipfs_hash),
                    'created_at': progress_update.created_at.isoformat(),
                },
                'blockchain_data': blockchain_data
            })
            
        except Exception as e:
            logger.error(f"Failed to get blockchain data: {str(e)}")
            return Response(
                {'detail': f'Failed to get blockchain data: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BlockchainDocumentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for blockchain documents
    """
    queryset = BlockchainDocument.objects.all()
    serializer_class = BlockchainDocumentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter documents by project_id or property_id if provided"""
        queryset = super().get_queryset().select_related('project', 'property', 'uploaded_by')
        project_id = self.request.query_params.get('project_id')
        property_id = self.request.query_params.get('property_id')
        
        if property_id:
            queryset = queryset.filter(property__id=property_id)
        elif project_id:
            queryset = queryset.filter(project__id=project_id)
        
        return queryset.order_by('-created_at')
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def upload_document(self, request):
        """
        Upload a legal document to IPFS and blockchain
        
        Expected request data:
        - project_id: Project ID
        - property_id: Property ID (optional)
        - document_name: Name of the document
        - document_type: Type of document (contract, agreement, certificate, etc.)
        - file: Document file to upload (PDF, etc.)
        - metadata: Additional metadata (optional)
        """
        try:
            # Get request data
            project_id = request.data.get('project_id')
            property_id = request.data.get('property_id')
            document_name = request.data.get('document_name')
            document_type = request.data.get('document_type', 'other')
            file = request.FILES.get('file')
            metadata = request.data.get('metadata', {})
            
            # Validate required fields
            if not project_id or not document_name or not file:
                return Response(
                    {'detail': 'Missing required fields: project_id, document_name, and file are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Verify project exists
            try:
                project = Project.objects.get(id=project_id)
            except Project.DoesNotExist:
                return Response(
                    {'detail': 'Project not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Verify property exists if provided
            property_obj = None
            if property_id:
                try:
                    property_obj = Property.objects.get(id=property_id, project=project)
                except Property.DoesNotExist:
                    return Response(
                        {'detail': 'Property not found'},
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            # Generate unique document ID
            document_id = f"doc_{uuid.uuid4().hex}"
            
            # Upload to IPFS via Pinata
            pinata_service = get_pinata_service()
            
            pinata_metadata = {
                'name': document_name,
                'document_type': document_type,
                'project_id': str(project.id),
            }
            if property_obj:
                pinata_metadata['property_id'] = str(property_obj.id)
            
            ipfs_result = pinata_service.upload_file(
                file=file,
                metadata=pinata_metadata
            )
            
            ipfs_hash = ipfs_result['ipfs_hash']
            
            # Store on blockchain
            try:
                from .blockchain_service import get_blockchain_service
                blockchain_service = get_blockchain_service()
                blockchain_result = blockchain_service.store_document_on_blockchain(
                    project_id=str(project.id),
                    property_id=str(property_obj.id) if property_obj else None,
                    document_name=document_name,
                    document_type=document_type,
                    file_bytes=b'', # Skipped as we pass ipfs_hash
                    uploaded_by=str(request.user.id),
                    metadata=metadata,
                    ipfs_hash=ipfs_hash
                )
            except Exception as e:
                logger.warning(f"Blockchain storage failed: {str(e)}")
                blockchain_result = {'success': False}
            
            # Create local record
            document = BlockchainDocument.objects.create(
                id=uuid.uuid4(),
                document_id=document_id,
                project=project,
                property=property_obj,
                document_name=document_name,
                document_type=document_type,
                ipfs_hash=ipfs_hash,
                blockchain_tx_id=blockchain_result.get('tx_id'),
                blockchain_timestamp=timezone.now(),
                uploaded_by=request.user,
                metadata=metadata
            )
            
            logger.info(f"Document stored: {document_id}")
            
            return Response({
                'success': True,
                'document_id': document_id,
                'ipfs_hash': ipfs_hash,
                'ipfs_url': ipfs_result['ipfs_url'],
                'blockchain_tx_id': blockchain_result.get('tx_id'),
                'message': 'Document stored successfully on blockchain'
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Failed to upload document: {str(e)}", exc_info=True)
            return Response(
                {'detail': f'Failed to upload document: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def get_blockchain_data(self, request, pk=None):
        """Get blockchain data for a document"""
        try:
            document = self.get_object()
            
            # Query from blockchain
            # Fabric integration removed for fresh start
            blockchain_data = {}
            # fabric_service = get_fabric_service()
            # ...
            
            return Response({
                'local_data': {
                    'id': str(document.id),
                    'document_id': document.document_id,
                    'document_name': document.document_name,
                    'document_type': document.document_type,
                    'project': document.project.name,
                    'ipfs_hash': document.ipfs_hash,
                    'ipfs_url': get_pinata_service().get_file_url(document.ipfs_hash),
                    'created_at': document.created_at.isoformat(),
                },
                'blockchain_data': blockchain_data
            })
            
        except Exception as e:
            logger.error(f"Failed to get blockchain data: {str(e)}")
            return Response(
                {'detail': f'Failed to get blockchain data: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
