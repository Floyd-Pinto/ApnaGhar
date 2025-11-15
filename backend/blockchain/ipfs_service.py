"""
IPFS Service using Pinata for ApnaGhar
This module handles file uploads to IPFS via Pinata
"""

import os
import json
import requests
import logging
from typing import Optional, Dict, BinaryIO
from django.core.files.uploadedfile import UploadedFile

logger = logging.getLogger(__name__)


class PinataService:
    """
    Service class to interact with Pinata IPFS service
    """
    
    def __init__(self):
        # Get from environment or use defaults from settings
        from django.conf import settings
        self.api_key = os.getenv('PINATA_API_KEY', getattr(settings, 'PINATA_API_KEY', None))
        self.api_secret = os.getenv('PINATA_API_SECRET', getattr(settings, 'PINATA_API_SECRET', None))
        self.gateway_url = os.getenv('PINATA_GATEWAY_URL', getattr(settings, 'PINATA_GATEWAY_URL', 'https://gateway.pinata.cloud/ipfs/'))
        
        if not self.api_key or not self.api_secret:
            logger.warning("Pinata credentials not configured. Set PINATA_API_KEY and PINATA_API_SECRET environment variables.")
    
    def upload_file(
        self,
        file: UploadedFile,
        metadata: Optional[Dict] = None,
        pinata_metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Upload a file to IPFS via Pinata
        
        Args:
            file: Django UploadedFile object
            metadata: Optional metadata to attach to the file
            pinata_metadata: Optional Pinata-specific metadata
            
        Returns:
            Dictionary with IPFS hash and other details
        """
        if not self.api_key or not self.api_secret:
            raise ValueError("Pinata credentials not configured")
        
        try:
            # Prepare headers
            headers = {
                'pinata_api_key': self.api_key,
                'pinata_secret_api_key': self.api_secret,
            }
            
            # Prepare form data
            files = {
                'file': (file.name, file.read(), file.content_type)
            }
            
            # Add metadata if provided
            data = {}
            if metadata:
                data['pinataMetadata'] = json.dumps(metadata)
            if pinata_metadata:
                data['pinataOptions'] = json.dumps(pinata_metadata)
            
            # Upload to Pinata
            response = requests.post(
                'https://api.pinata.cloud/pinning/pinFileToIPFS',
                headers=headers,
                files=files,
                data=data,
                timeout=60
            )
            
            response.raise_for_status()
            result = response.json()
            
            ipfs_hash = result.get('IpfsHash')
            
            if not ipfs_hash:
                raise ValueError("Pinata did not return IPFS hash")
            
            logger.info(f"File uploaded to IPFS: {ipfs_hash}")
            
            return {
                'success': True,
                'ipfs_hash': ipfs_hash,
                'ipfs_url': f"{self.gateway_url}{ipfs_hash}",
                'pinata_id': result.get('id'),
                'size': result.get('pinSize', 0),
                'timestamp': result.get('timestamp')
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to upload file to Pinata: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error uploading to Pinata: {str(e)}")
            raise
    
    def upload_bytes(
        self,
        file_bytes: bytes,
        filename: str,
        content_type: str = 'application/octet-stream',
        metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Upload file bytes to IPFS via Pinata
        
        Args:
            file_bytes: File content as bytes
            filename: Name of the file
            content_type: MIME type of the file
            metadata: Optional metadata
            
        Returns:
            Dictionary with IPFS hash and other details
        """
        if not self.api_key or not self.api_secret:
            raise ValueError("Pinata credentials not configured")
        
        try:
            # Prepare headers
            headers = {
                'pinata_api_key': self.api_key,
                'pinata_secret_api_key': self.api_secret,
            }
            
            # Prepare form data
            files = {
                'file': (filename, file_bytes, content_type)
            }
            
            # Add metadata if provided
            data = {}
            if metadata:
                data['pinataMetadata'] = json.dumps(metadata)
            
            # Upload to Pinata
            response = requests.post(
                'https://api.pinata.cloud/pinning/pinFileToIPFS',
                headers=headers,
                files=files,
                data=data,
                timeout=60
            )
            
            response.raise_for_status()
            result = response.json()
            
            ipfs_hash = result.get('IpfsHash')
            
            if not ipfs_hash:
                raise ValueError("Pinata did not return IPFS hash")
            
            logger.info(f"File uploaded to IPFS: {ipfs_hash}")
            
            return {
                'success': True,
                'ipfs_hash': ipfs_hash,
                'ipfs_url': f"{self.gateway_url}{ipfs_hash}",
                'pinata_id': result.get('id'),
                'size': result.get('pinSize', 0),
                'timestamp': result.get('timestamp')
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to upload file to Pinata: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error uploading to Pinata: {str(e)}")
            raise
    
    def get_file_url(self, ipfs_hash: str) -> str:
        """
        Get the IPFS gateway URL for a hash
        
        Args:
            ipfs_hash: IPFS hash
            
        Returns:
            Full URL to access the file
        """
        return f"{self.gateway_url}{ipfs_hash}"
    
    def verify_pin(self, ipfs_hash: str) -> bool:
        """
        Verify that a file is pinned on Pinata
        
        Args:
            ipfs_hash: IPFS hash to verify
            
        Returns:
            True if pinned, False otherwise
        """
        if not self.api_key or not self.api_secret:
            return False
        
        try:
            headers = {
                'pinata_api_key': self.api_key,
                'pinata_secret_api_key': self.api_secret,
            }
            
            response = requests.get(
                f'https://api.pinata.cloud/data/pinList?hashContains={ipfs_hash}',
                headers=headers,
                timeout=30
            )
            
            response.raise_for_status()
            result = response.json()
            
            # Check if hash exists in results
            if result.get('count', 0) > 0:
                for item in result.get('rows', []):
                    if item.get('ipfs_pin_hash') == ipfs_hash:
                        return True
            
            return False
            
        except Exception as e:
            logger.error(f"Failed to verify pin: {str(e)}")
            return False


# Singleton instance
_pinata_service = None

def get_pinata_service() -> PinataService:
    """Get or create Pinata service instance"""
    global _pinata_service
    if _pinata_service is None:
        _pinata_service = PinataService()
    return _pinata_service

