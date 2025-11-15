"""
Comprehensive Blockchain Service for ApnaGhar
Handles all blockchain operations for user data, properties, progress, and documents
"""

import uuid
import hashlib
import json
import logging
from typing import Dict, Optional, List
from datetime import datetime
from django.utils import timezone
import asyncio

# Lazy imports to avoid circular dependencies
# from .fabric_client import get_fabric_service
# from .ipfs_service import get_pinata_service
# from .models import BlockchainProgressUpdate, BlockchainDocument

logger = logging.getLogger(__name__)


class BlockchainService:
    """
    Service to handle all blockchain operations
    """
    
    def __init__(self):
        self.fabric_service = None
        self.pinata_service = None
        # Lazy initialization to avoid blocking
        self._initialized = False
    
    def _ensure_initialized(self):
        """Lazy initialization of services"""
        if self._initialized:
            return
        
        try:
            from .ipfs_service import get_pinata_service
            self.pinata_service = get_pinata_service()
        except Exception as e:
            logger.warning(f"Pinata service initialization failed: {str(e)}. Blockchain features may be limited.")
            self.pinata_service = None
        
        try:
            from .fabric_client import get_fabric_service
            self.fabric_service = get_fabric_service()
        except Exception as e:
            logger.warning(f"Fabric service not available: {str(e)}. Blockchain will work with IPFS only.")
        
        self._initialized = True
    
    def _run_async(self, coro):
        """Helper to run async functions in sync context"""
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        return loop.run_until_complete(coro)
    
    def store_progress_update_on_blockchain(
        self,
        project_id: str,
        property_id: Optional[str],
        milestone_id: Optional[str],
        description: str,
        cloudinary_urls: List[str],  # URLs from Cloudinary
        uploaded_by: str,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Store progress update on blockchain
        Images/videos are on Cloudinary, we store their URLs/hashes on blockchain
        """
        self._ensure_initialized()
        try:
            # Generate unique ID
            progress_id = f"progress_{uuid.uuid4().hex}"
            
            # Create hash of all data for immutability
            data_to_hash = {
                'project_id': project_id,
                'property_id': property_id or '',
                'milestone_id': milestone_id or '',
                'description': description,
                'cloudinary_urls': cloudinary_urls,
                'uploaded_by': uploaded_by,
                'timestamp': datetime.utcnow().isoformat()
            }
            data_hash = hashlib.sha256(json.dumps(data_to_hash, sort_keys=True).encode()).hexdigest()
            
            # Store on blockchain if available
            blockchain_result = {'tx_id': None, 'timestamp': datetime.utcnow().isoformat()}
            if self.fabric_service:
                try:
                    blockchain_result = self._run_async(
                        self.fabric_service.store_progress_update(
                            progress_id=progress_id,
                            project_id=project_id,
                            property_id=property_id or '',
                            milestone_id=milestone_id or '',
                            ipfs_hash=data_hash,  # Using data hash as IPFS hash equivalent
                            description=description,
                            uploaded_by=uploaded_by,
                            metadata={
                                **(metadata or {}),
                                'cloudinary_urls': cloudinary_urls,
                                'data_hash': data_hash
                            }
                        )
                    )
                except Exception as e:
                    logger.warning(f"Blockchain storage failed: {str(e)}")
            
            # Create local database record
            from .models import BlockchainProgressUpdate
            progress_update = BlockchainProgressUpdate.objects.create(
                id=uuid.uuid4(),
                progress_id=progress_id,
                project_id=project_id,
                property_id=property_id,
                milestone_id=milestone_id,
                ipfs_hash=data_hash,  # Store hash of the data
                blockchain_tx_id=blockchain_result.get('tx_id'),
                blockchain_timestamp=timezone.now(),
                description=description,
                uploaded_by_id=uploaded_by,
                metadata={
                    **(metadata or {}),
                    'cloudinary_urls': cloudinary_urls,
                    'data_hash': data_hash
                }
            )
            
            logger.info(f"Progress update stored on blockchain: {progress_id}")
            
            return {
                'success': True,
                'progress_id': progress_id,
                'data_hash': data_hash,
                'blockchain_tx_id': blockchain_result.get('tx_id'),
                'cloudinary_urls': cloudinary_urls
            }
            
        except Exception as e:
            logger.error(f"Failed to store progress update on blockchain: {str(e)}", exc_info=True)
            raise
    
    def store_document_on_blockchain(
        self,
        project_id: str,
        property_id: Optional[str],
        document_name: str,
        document_type: str,
        file_bytes: bytes,
        uploaded_by: str,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Store document on blockchain
        Document file goes to IPFS, hash goes to blockchain
        """
        self._ensure_initialized()
        try:
            if not self.pinata_service:
                raise ValueError("Pinata service not available. Please configure PINATA_API_KEY and PINATA_API_SECRET.")
            
            # Upload document to IPFS
            ipfs_result = self.pinata_service.upload_bytes(
                file_bytes=file_bytes,
                filename=document_name,
                content_type=metadata.get('content_type', 'application/pdf') if metadata else 'application/pdf',
                metadata={
                    'name': document_name,
                    'document_type': document_type,
                    'project_id': project_id,
                    **(metadata or {})
                }
            )
            
            ipfs_hash = ipfs_result['ipfs_hash']
            
            # Generate unique document ID
            document_id = f"doc_{uuid.uuid4().hex}"
            
            # Store on blockchain if available
            blockchain_result = {'tx_id': None, 'timestamp': datetime.utcnow().isoformat()}
            if self.fabric_service:
                try:
                    blockchain_result = self._run_async(
                        self.fabric_service.store_document(
                            document_id=document_id,
                            project_id=project_id,
                            property_id=property_id or '',
                            document_name=document_name,
                            document_type=document_type,
                            ipfs_hash=ipfs_hash,
                            uploaded_by=uploaded_by,
                            metadata=metadata
                        )
                    )
                except Exception as e:
                    logger.warning(f"Blockchain storage failed: {str(e)}")
            
            # Create local database record
            from .models import BlockchainDocument
            document = BlockchainDocument.objects.create(
                id=uuid.uuid4(),
                document_id=document_id,
                project_id=project_id,
                property_id=property_id,
                document_name=document_name,
                document_type=document_type,
                ipfs_hash=ipfs_hash,
                blockchain_tx_id=blockchain_result.get('tx_id'),
                blockchain_timestamp=timezone.now(),
                uploaded_by_id=uploaded_by,
                metadata=metadata or {}
            )
            
            logger.info(f"Document stored on blockchain: {document_id}")
            
            return {
                'success': True,
                'document_id': document_id,
                'ipfs_hash': ipfs_hash,
                'ipfs_url': ipfs_result['ipfs_url'],
                'blockchain_tx_id': blockchain_result.get('tx_id')
            }
            
        except Exception as e:
            logger.error(f"Failed to store document on blockchain: {str(e)}", exc_info=True)
            raise
    
    def store_user_registration_on_blockchain(
        self,
        user_id: str,
        username: str,
        email: str,
        role: str,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Store user registration on blockchain
        """
        self._ensure_initialized()
        try:
            # Create user data record
            user_data = {
                'user_id': user_id,
                'username': username,
                'email': email,
                'role': role,
                'registered_at': datetime.utcnow().isoformat(),
                **(metadata or {})
            }
            
            # Store on IPFS (for large metadata) or use hash
            data_json = json.dumps(user_data, sort_keys=True)
            data_hash = hashlib.sha256(data_json.encode()).hexdigest()
            
            # Store on blockchain if available
            blockchain_result = {'tx_id': None}
            if self.fabric_service:
                try:
                    # Store as a document type
                    blockchain_result = self._run_async(
                        self.fabric_service.store_document(
                            document_id=f"user_{user_id}",
                            project_id='',  # Not project-specific
                            property_id='',
                            document_name=f"User Registration - {username}",
                            document_type='user_registration',
                            ipfs_hash=data_hash,
                            uploaded_by=user_id,
                            metadata=user_data
                        )
                    )
                except Exception as e:
                    logger.warning(f"Blockchain storage failed: {str(e)}")
            
            logger.info(f"User registration stored on blockchain: {user_id}")
            
            return {
                'success': True,
                'user_id': user_id,
                'data_hash': data_hash,
                'blockchain_tx_id': blockchain_result.get('tx_id')
            }
            
        except Exception as e:
            logger.error(f"Failed to store user registration on blockchain: {str(e)}", exc_info=True)
            raise
    
    def store_property_creation_on_blockchain(
        self,
        property_id: str,
        project_id: str,
        unit_number: str,
        property_data: Dict,
        created_by: str
    ) -> Dict:
        """
        Store property creation on blockchain
        """
        self._ensure_initialized()
        try:
            # Create property record
            property_record = {
                'property_id': property_id,
                'project_id': project_id,
                'unit_number': unit_number,
                'property_data': property_data,
                'created_by': created_by,
                'created_at': datetime.utcnow().isoformat()
            }
            
            # Create hash
            data_json = json.dumps(property_record, sort_keys=True)
            data_hash = hashlib.sha256(data_json.encode()).hexdigest()
            
            # Store on blockchain if available
            blockchain_result = {'tx_id': None}
            if self.fabric_service:
                try:
                    blockchain_result = self._run_async(
                        self.fabric_service.store_document(
                            document_id=f"property_{property_id}",
                            project_id=project_id,
                            property_id=property_id,
                            document_name=f"Property Creation - Unit {unit_number}",
                            document_type='property_record',
                            ipfs_hash=data_hash,
                            uploaded_by=created_by,
                            metadata=property_record
                        )
                    )
                except Exception as e:
                    logger.warning(f"Blockchain storage failed: {str(e)}")
            
            logger.info(f"Property creation stored on blockchain: {property_id}")
            
            return {
                'success': True,
                'property_id': property_id,
                'data_hash': data_hash,
                'blockchain_tx_id': blockchain_result.get('tx_id')
            }
            
        except Exception as e:
            logger.error(f"Failed to store property creation on blockchain: {str(e)}", exc_info=True)
            raise


# Singleton instance
_blockchain_service = None

def get_blockchain_service() -> BlockchainService:
    """Get or create blockchain service instance"""
    global _blockchain_service
    if _blockchain_service is None:
        _blockchain_service = BlockchainService()
    return _blockchain_service

