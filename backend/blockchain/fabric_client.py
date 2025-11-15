"""
Hyperledger Fabric Client for ApnaGhar
This module communicates with the Node.js Fabric Gateway microservice
Uses the official Fabric Gateway SDK via HTTP REST API
"""

import os
import json
import logging
import requests
from typing import Dict, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

# Fabric Gateway Service configuration
FABRIC_GATEWAY_URL = os.getenv('FABRIC_GATEWAY_URL', 'http://localhost:3001')
FABRIC_API_KEY = os.getenv('FABRIC_API_KEY', '')

def check_fabric_availability():
    """Check if Fabric Gateway service is available"""
    try:
        response = requests.get(f"{FABRIC_GATEWAY_URL}/health", timeout=2)
        return response.status_code == 200
    except:
        return False

FABRIC_AVAILABLE = check_fabric_availability()
if FABRIC_AVAILABLE:
    logger.info(f"✅ Fabric Gateway service available at {FABRIC_GATEWAY_URL}")
else:
    logger.warning(f"⚠️  Fabric Gateway service not available at {FABRIC_GATEWAY_URL}")


class FabricService:
    """
    Service class to interact with Hyperledger Fabric network via Node.js Gateway
    """
    
    def __init__(self):
        self.gateway_url = FABRIC_GATEWAY_URL
        self.api_key = FABRIC_API_KEY
        self.headers = {
            'Content-Type': 'application/json'
        }
        if self.api_key:
            self.headers['X-API-Key'] = self.api_key
    
    def _make_request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Dict:
        """Make HTTP request to Fabric Gateway service"""
        try:
            url = f"{self.gateway_url}{endpoint}"
            
            if method == 'GET':
                response = requests.get(url, headers=self.headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=self.headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Fabric Gateway request failed: {str(e)}")
            raise
    
    async def store_progress_update(
        self,
        progress_id: str,
        project_id: str,
        property_id: str,
        milestone_id: Optional[str],
        ipfs_hash: str,
        description: str,
        uploaded_by: str,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Store a progress update on the blockchain
        
        Args:
            progress_id: Unique identifier for the progress update
            project_id: Project ID
            property_id: Property/Unit ID
            milestone_id: Milestone ID (optional)
            ipfs_hash: IPFS hash of the uploaded file
            description: Milestone description
            uploaded_by: User ID who uploaded
            metadata: Additional metadata dictionary
            
        Returns:
            Dictionary with transaction details
        """
        if not FABRIC_AVAILABLE:
            logger.warning("Fabric Gateway not available - skipping blockchain storage")
            return {
                'success': False,
                'progress_id': progress_id,
                'message': 'Blockchain storage unavailable - using IPFS only'
            }
        
        try:
            # Prepare request data
            data = {
                'progressId': progress_id,
                'projectId': project_id,
                'propertyId': property_id,
                'milestoneId': milestone_id or '',
                'ipfsHash': ipfs_hash,
                'description': description,
                'uploadedBy': uploaded_by,
                'metadata': metadata or {}
            }
            
            # Call Fabric Gateway service
            response = self._make_request('POST', '/api/progress-update', data)
            
            logger.info(f"Progress update stored on blockchain: {progress_id}")
            
            return {
                'success': True,
                'progress_id': progress_id,
                'data': response.get('data', {}),
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to store progress update on blockchain: {str(e)}")
            raise
    
    async def store_document(
        self,
        document_id: str,
        project_id: str,
        property_id: Optional[str],
        document_name: str,
        document_type: str,
        ipfs_hash: str,
        uploaded_by: str,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Store a document on the blockchain
        
        Args:
            document_id: Unique identifier for the document
            project_id: Project ID
            property_id: Property/Unit ID (optional)
            document_name: Name of the document
            document_type: Type of document
            ipfs_hash: IPFS hash of the uploaded document
            uploaded_by: User ID who uploaded
            metadata: Additional metadata dictionary
            
        Returns:
            Dictionary with transaction details
        """
        if not FABRIC_AVAILABLE:
            logger.warning("Fabric Gateway not available - skipping blockchain storage")
            return {
                'success': False,
                'document_id': document_id,
                'message': 'Blockchain storage unavailable - using IPFS only'
            }
        
        try:
            # Prepare request data
            data = {
                'documentId': document_id,
                'projectId': project_id,
                'propertyId': property_id or '',
                'documentName': document_name,
                'documentType': document_type,
                'ipfsHash': ipfs_hash,
                'uploadedBy': uploaded_by,
                'metadata': metadata or {}
            }
            
            # Call Fabric Gateway service
            response = self._make_request('POST', '/api/document', data)
            
            logger.info(f"Document stored on blockchain: {document_id}")
            
            return {
                'success': True,
                'document_id': document_id,
                'data': response.get('data', {}),
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to store document on blockchain: {str(e)}")
            raise
    
    async def get_progress_update(self, progress_id: str) -> Dict:
        """Query a progress update from the blockchain"""
        if not FABRIC_AVAILABLE:
            return {'error': 'Blockchain not available'}
        
        try:
            response = self._make_request('GET', f'/api/progress-update/{progress_id}')
            return response.get('data', {})
            
        except Exception as e:
            logger.error(f"Failed to query progress update: {str(e)}")
            raise
    
    async def get_document(self, document_id: str) -> Dict:
        """Query a document from the blockchain"""
        if not FABRIC_AVAILABLE:
            return {'error': 'Blockchain not available'}
        
        try:
            response = self._make_request('GET', f'/api/document/{document_id}')
            return response.get('data', {})
            
        except Exception as e:
            logger.error(f"Failed to query document: {str(e)}")
            raise
    
    async def query_progress_updates_by_property(self, property_id: str) -> List[Dict]:
        """Query all progress updates for a property"""
        if not FABRIC_AVAILABLE:
            return []
        
        try:
            response = self._make_request('GET', f'/api/progress-updates/property/{property_id}')
            return response.get('data', [])
            
        except Exception as e:
            logger.error(f"Failed to query progress updates: {str(e)}")
            raise
    
    async def query_documents_by_project(self, project_id: str) -> List[Dict]:
        """Query all documents for a project"""
        if not FABRIC_AVAILABLE:
            return []
        
        try:
            response = self._make_request('GET', f'/api/documents/project/{project_id}')
            return response.get('data', [])
            
        except Exception as e:
            logger.error(f"Failed to query documents: {str(e)}")
            raise


# Singleton instance
_fabric_service = None

def get_fabric_service() -> FabricService:
    """Get or create Fabric service instance"""
    global _fabric_service
    if _fabric_service is None:
        _fabric_service = FabricService()
    return _fabric_service
