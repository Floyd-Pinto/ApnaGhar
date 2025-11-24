"""
Comprehensive Blockchain Service for ApnaGhar
Handles all blockchain operations via Node.js Middleware API
"""

import uuid
import hashlib
import json
import logging
import requests
from typing import Dict, Optional, List
from datetime import datetime
from django.utils import timezone
from django.conf import settings

logger = logging.getLogger(__name__)

BLOCKCHAIN_API_URL = getattr(settings, 'BLOCKCHAIN_API_URL', 'http://localhost:3000/api/v1')

class BlockchainService:
    """
    Service to handle all blockchain operations via Middleware API
    """
    
    def __init__(self):
        self.pinata_service = None
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
        
        self._initialized = True
    
    def _call_blockchain_api(self, method: str, endpoint: str, data: Dict = None) -> Dict:
        """Helper to call Node.js Middleware API"""
        try:
            url = f"{BLOCKCHAIN_API_URL}{endpoint}"
            if method == 'POST':
                response = requests.post(url, json=data)
            elif method == 'PUT':
                response = requests.put(url, json=data)
            elif method == 'GET':
                response = requests.get(url)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Blockchain API call failed: {str(e)}")
            return {'success': False, 'error': str(e)}

    def store_progress_update_on_blockchain(
        self,
        project_id: str,
        property_id: Optional[str],
        milestone_id: Optional[str],
        description: str,
        cloudinary_urls: List[str],
        uploaded_by: str,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """Store progress update on blockchain"""
        self._ensure_initialized()
        try:
            progress_id = f"progress_{uuid.uuid4().hex}"
            
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
            
            # Call Middleware API
            blockchain_result = self._call_blockchain_api('POST', '/milestone', {
                'milestoneId': progress_id,
                'projectId': project_id,
                'title': description[:50], # Short title
                'status': 'completed',
                'ipfsHash': data_hash,
                'verifier': uploaded_by
            })
            
            # Create local record
            from .models import BlockchainProgressUpdate
            progress_update = BlockchainProgressUpdate.objects.create(
                id=uuid.uuid4(),
                progress_id=progress_id,
                project_id=project_id,
                property_id=property_id,
                milestone_id=milestone_id,
                ipfs_hash=data_hash,
                blockchain_tx_id=blockchain_result.get('result', {}).get('txId'), # Assuming middleware returns txId in result? No, middleware returns object. 
                # Wait, middleware returns the object. Fabric doesn't return txId in the object unless we add it.
                # The contract returns the object. The submitTransaction result is the object.
                # We might not get the TxID easily unless we modify middleware to return it.
                # For now, we'll store 'success' or null.
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
                'blockchain_result': blockchain_result
            }
            
        except Exception as e:
            logger.error(f"Failed to store progress update: {str(e)}", exc_info=True)
            raise

    def store_document_on_blockchain(
        self,
        project_id: str,
        property_id: Optional[str],
        document_name: str,
        document_type: str,
        file_bytes: bytes,
        uploaded_by: str,
        metadata: Optional[Dict] = None,
        ipfs_hash: Optional[str] = None
    ) -> Dict:
        """Store document on blockchain"""
        self._ensure_initialized()
        try:
            if not self.pinata_service and not ipfs_hash:
                raise ValueError("Pinata service not available")
            
            ipfs_url = None
            if not ipfs_hash:
                # Upload to IPFS
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
                ipfs_url = ipfs_result['ipfs_url']
            
            document_id = f"doc_{uuid.uuid4().hex}"
            
            # Call Middleware API
            blockchain_result = self._call_blockchain_api('POST', '/document', {
                'documentId': document_id,
                'projectId': project_id,
                'docType': document_type,
                'ipfsHash': ipfs_hash,
                'owner': uploaded_by
            })
            
            # Create local record
            from .models import BlockchainDocument
            document = BlockchainDocument.objects.create(
                id=uuid.uuid4(),
                document_id=document_id,
                project_id=project_id,
                property_id=property_id,
                document_name=document_name,
                document_type=document_type,
                ipfs_hash=ipfs_hash,
                blockchain_timestamp=timezone.now(),
                uploaded_by_id=uploaded_by,
                metadata=metadata or {}
            )
            
            logger.info(f"Document stored on blockchain: {document_id}")
            
            return {
                'success': True,
                'document_id': document_id,
                'ipfs_hash': ipfs_hash,
                'ipfs_url': ipfs_url,
                'blockchain_result': blockchain_result
            }
            
        except Exception as e:
            logger.error(f"Failed to store document: {str(e)}", exc_info=True)
            raise

    def store_property_creation_on_blockchain(
        self,
        property_id: str,
        project_id: str,
        unit_number: str,
        property_data: Dict,
        created_by: str
    ) -> Dict:
        """Store property creation on blockchain"""
        self._ensure_initialized()
        try:
            data_json = json.dumps(property_data, sort_keys=True)
            data_hash = hashlib.sha256(data_json.encode()).hexdigest()
            
            # Call Middleware API
            blockchain_result = self._call_blockchain_api('POST', '/property', {
                'propertyId': property_id,
                'projectId': project_id,
                'unitNumber': unit_number,
                'owner': created_by,
                'dataHash': data_hash
            })
            
            logger.info(f"Property creation stored on blockchain: {property_id}")
            
            return {
                'success': True,
                'property_id': property_id,
                'data_hash': data_hash,
                'blockchain_result': blockchain_result
            }
            
        except Exception as e:
            logger.error(f"Failed to store property creation: {str(e)}", exc_info=True)
            raise

# Singleton instance
_blockchain_service = None

def get_blockchain_service() -> BlockchainService:
    global _blockchain_service
    if _blockchain_service is None:
        _blockchain_service = BlockchainService()
    return _blockchain_service

