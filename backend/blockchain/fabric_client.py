"""
Hyperledger Fabric Client for ApnaGhar
This module provides functions to interact with the Fabric network
"""

import os
import json
import logging
from typing import Dict, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

# Fabric SDK imports (will be installed via requirements.txt)
try:
    from hfc.fabric import Client as FabricClient
    from hfc.fabric.user import create_user
    from hfc.util.crypto.crypto import ecies
    FABRIC_AVAILABLE = True
except ImportError:
    FABRIC_AVAILABLE = False
    logger.warning("Fabric SDK not available. Install with: pip install fabric-sdk-py")


class FabricService:
    """
    Service class to interact with Hyperledger Fabric network
    """
    
    def __init__(self):
        if not FABRIC_AVAILABLE:
            raise ImportError("Fabric SDK not installed. Please install fabric-sdk-py")
        
        self.client = None
        self.network = None
        self.channel = None
        self.chaincode = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize Fabric client with network configuration"""
        try:
            # Get configuration from environment
            network_config_path = os.getenv(
                'FABRIC_NETWORK_CONFIG',
                os.path.join(os.path.dirname(__file__), 'network-config.json')
            )
            
            self.client = FabricClient(network_profile=network_config_path)
            
            # Get channel and chaincode names from environment
            self.channel_name = os.getenv('FABRIC_CHANNEL_NAME', 'mychannel')
            self.chaincode_name = os.getenv('FABRIC_CHAINCODE_NAME', 'apnaghar-contract')
            
            logger.info(f"Fabric client initialized - Channel: {self.channel_name}, Chaincode: {self.chaincode_name}")
            
        except Exception as e:
            logger.error(f"Failed to initialize Fabric client: {str(e)}")
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
        try:
            # Prepare metadata
            metadata_str = json.dumps(metadata or {})
            timestamp = datetime.utcnow().isoformat()
            
            # Prepare chaincode arguments
            args = [
                progress_id,
                project_id,
                property_id,
                milestone_id or '',
                ipfs_hash,
                description,
                uploaded_by,
                timestamp,
                metadata_str
            ]
            
            # Invoke chaincode
            response = await self.client.chaincode_invoke(
                requestor=self._get_user(),
                channel_name=self.channel_name,
                peers=['peer0.org1.example.com', 'peer0.org2.example.com'],
                args=args,
                cc_name=self.chaincode_name,
                fcn='StoreProgressUpdate',
                wait_for_event=True
            )
            
            logger.info(f"Progress update stored on blockchain: {progress_id}")
            
            return {
                'success': True,
                'progress_id': progress_id,
                'tx_id': response.get('tx_id'),
                'timestamp': timestamp
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
        try:
            # Prepare metadata
            metadata_str = json.dumps(metadata or {})
            timestamp = datetime.utcnow().isoformat()
            
            # Prepare chaincode arguments
            args = [
                document_id,
                project_id,
                property_id or '',
                document_name,
                document_type,
                ipfs_hash,
                uploaded_by,
                timestamp,
                metadata_str
            ]
            
            # Invoke chaincode
            response = await self.client.chaincode_invoke(
                requestor=self._get_user(),
                channel_name=self.channel_name,
                peers=['peer0.org1.example.com', 'peer0.org2.example.com'],
                args=args,
                cc_name=self.chaincode_name,
                fcn='StoreDocument',
                wait_for_event=True
            )
            
            logger.info(f"Document stored on blockchain: {document_id}")
            
            return {
                'success': True,
                'document_id': document_id,
                'tx_id': response.get('tx_id'),
                'timestamp': timestamp
            }
            
        except Exception as e:
            logger.error(f"Failed to store document on blockchain: {str(e)}")
            raise
    
    async def get_progress_update(self, progress_id: str) -> Dict:
        """Query a progress update from the blockchain"""
        try:
            response = await self.client.chaincode_query(
                requestor=self._get_user(),
                channel_name=self.channel_name,
                peers=['peer0.org1.example.com'],
                args=[progress_id],
                cc_name=self.chaincode_name,
                fcn='GetProgressUpdate'
            )
            
            return json.loads(response)
            
        except Exception as e:
            logger.error(f"Failed to query progress update: {str(e)}")
            raise
    
    async def get_document(self, document_id: str) -> Dict:
        """Query a document from the blockchain"""
        try:
            response = await self.client.chaincode_query(
                requestor=self._get_user(),
                channel_name=self.channel_name,
                peers=['peer0.org1.example.com'],
                args=[document_id],
                cc_name=self.chaincode_name,
                fcn='GetDocument'
            )
            
            return json.loads(response)
            
        except Exception as e:
            logger.error(f"Failed to query document: {str(e)}")
            raise
    
    async def query_progress_updates_by_property(self, property_id: str) -> List[Dict]:
        """Query all progress updates for a property"""
        try:
            response = await self.client.chaincode_query(
                requestor=self._get_user(),
                channel_name=self.channel_name,
                peers=['peer0.org1.example.com'],
                args=[property_id],
                cc_name=self.chaincode_name,
                fcn='QueryProgressUpdatesByProperty'
            )
            
            return json.loads(response)
            
        except Exception as e:
            logger.error(f"Failed to query progress updates: {str(e)}")
            raise
    
    async def query_documents_by_project(self, project_id: str) -> List[Dict]:
        """Query all documents for a project"""
        try:
            response = await self.client.chaincode_query(
                requestor=self._get_user(),
                channel_name=self.channel_name,
                peers=['peer0.org1.example.com'],
                args=[project_id],
                cc_name=self.chaincode_name,
                fcn='QueryDocumentsByProject'
            )
            
            return json.loads(response)
            
        except Exception as e:
            logger.error(f"Failed to query documents: {str(e)}")
            raise
    
    def _get_user(self):
        """Get Fabric user context (simplified - should be configured properly)"""
        # This is a placeholder - in production, you'd load user credentials properly
        # For test-network, you might use Admin@org1.example.com
        try:
            user = self.client.get_user('org1', 'Admin')
            return user
        except:
            # Fallback - create a basic user context
            # In production, implement proper user management
            logger.warning("Using fallback user context")
            return None


# Singleton instance
_fabric_service = None

def get_fabric_service() -> FabricService:
    """Get or create Fabric service instance"""
    global _fabric_service
    if _fabric_service is None:
        _fabric_service = FabricService()
    return _fabric_service

