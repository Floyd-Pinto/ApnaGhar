"""
RAG Pipeline Wrapper for Django
Provides interface to query the RAG system from Django views
"""
import sys
import os
from pathlib import Path
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

# Add rag-pipeline to Python path
RAG_PIPELINE_DIR = Path(__file__).parent.parent.parent / 'rag-pipeline'
sys.path.insert(0, str(RAG_PIPELINE_DIR))


class RAGService:
    """Singleton service to interact with RAG pipeline"""
    
    _instance = None
    _rag_engine = None
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(RAGService, cls).__new__(cls)
        return cls._instance
    
    def initialize(self):
        """Initialize RAG engine (lazy loading)"""
        if self._initialized:
            return
        
        try:
            # Import RAG modules
            from src.query_engine import RealEstateRAG
            
            # Check if FAISS store exists
            faiss_store_path = RAG_PIPELINE_DIR / 'faiss_store'
            if not faiss_store_path.exists() or not list(faiss_store_path.glob('*')):
                logger.warning(
                    "FAISS store not found. Please run: cd rag-pipeline && python app.py build"
                )
                self._initialized = False
                return False
            
            # Initialize RAG engine
            logger.info("Initializing RAG engine...")
            self._rag_engine = RealEstateRAG()
            self._initialized = True
            logger.info("✅ RAG engine initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize RAG engine: {str(e)}")
            self._initialized = False
            return False
    
    def is_available(self) -> bool:
        """Check if RAG service is available (non-blocking check)"""
        # Don't try to initialize in request thread - too slow
        # Just return current status
        return self._initialized
    
    def query(
        self, 
        query_text: str, 
        top_k: int = 5,
        format_type: str = 'detailed'
    ) -> Dict[str, Any]:
        """
        Query the RAG system
        
        Args:
            query_text: User's question
            top_k: Number of results to retrieve
            format_type: 'detailed' or 'brief'
        
        Returns:
            Dict with answer and relevant results
        """
        if not self.is_available():
            return {
                'error': 'RAG service not available',
                'answer': self._get_fallback_response(query_text),
                'rag_available': False
            }
        
        try:
            # Use the RAG engine
            result = self._rag_engine.search_and_format(
                query=query_text,
                format_type=format_type
            )
            
            result['rag_available'] = True
            return result
            
        except Exception as e:
            logger.error(f"RAG query failed: {str(e)}")
            return {
                'error': str(e),
                'answer': self._get_fallback_response(query_text),
                'rag_available': False
            }
    
    def search_properties(
        self,
        bedrooms: Optional[int] = None,
        city: Optional[str] = None,
        max_price: Optional[float] = None,
        min_price: Optional[float] = None,
        status: str = 'available'
    ) -> Dict[str, Any]:
        """Structured property search"""
        if not self.is_available():
            return {
                'error': 'RAG service not available',
                'rag_available': False
            }
        
        try:
            result = self._rag_engine.search_properties(
                bedrooms=bedrooms,
                city=city,
                max_price=max_price,
                min_price=min_price,
                status=status
            )
            result['rag_available'] = True
            return result
        except Exception as e:
            logger.error(f"Property search failed: {str(e)}")
            return {
                'error': str(e),
                'rag_available': False
            }
    
    def _get_fallback_response(self, query: str) -> str:
        """Fallback responses when RAG is unavailable"""
        query_lower = query.lower()
        
        if any(word in query_lower for word in ['property', 'apartment', 'flat', 'bhk']):
            return (
                "I can help you find properties! However, my AI search is currently initializing. "
                "Please browse our verified properties on the Explore page, or try asking me again in a moment."
            )
        
        if any(word in query_lower for word in ['book', 'buy', 'purchase']):
            return (
                "Our booking process is simple:\n"
                "1. Browse properties on the Explore page\n"
                "2. View detailed property information\n"
                "3. Click 'Book Now' to reserve with token amount\n"
                "4. Complete documentation\n"
                "5. Track construction progress in real-time\n\n"
                "All bookings are blockchain-verified for security!"
            )
        
        if any(word in query_lower for word in ['track', 'progress', 'construction']):
            return (
                "Track construction progress in real-time:\n"
                "• Weekly photo/video updates\n"
                "• Geotagged & timestamped media\n"
                "• Milestone notifications\n"
                "• Progress dashboard\n"
                "• Direct builder communication\n\n"
                "Access your dashboard to see live updates!"
            )
        
        return (
            "I'm your ApnaGhar AI assistant! I can help with:\n"
            "• Finding properties\n"
            "• Booking process\n"
            "• Construction tracking\n"
            "• Payment options\n"
            "• General inquiries\n\n"
            "What would you like to know?"
        )


# Singleton instance
rag_service = RAGService()
