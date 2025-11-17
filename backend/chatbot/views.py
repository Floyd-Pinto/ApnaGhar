"""
Chatbot API Views - Proxies requests to local RAG service via ngrok
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
import requests
import os
import logging

logger = logging.getLogger(__name__)

# Local RAG service URL (set via environment variable)
RAG_SERVICE_URL = os.getenv('RAG_SERVICE_URL', 'http://localhost:8000')


@api_view(['POST'])
@permission_classes([AllowAny])  # Allow unauthenticated users to ask questions
def chatbot_query(request):
    """
    Proxy chatbot queries to local RAG service via ngrok
    
    POST /api/chatbot/query/
    Body: {
        "query": "Show me 3BHK properties in Mumbai",
        "format": "detailed"  // optional: "detailed" or "brief"
    }
    """
    query_text = request.data.get('query', '').strip()
    format_type = request.data.get('format', 'detailed')
    
    if not query_text:
        return Response(
            {'error': 'Query text is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Log query
    logger.info(f"Chatbot query forwarded to RAG service: {query_text}")
    
    try:
        # Forward to local RAG service
        response = requests.post(
            f"{RAG_SERVICE_URL}/query",
            json={"query": query_text, "format": format_type},
            timeout=30
        )
        response.raise_for_status()
        return Response(response.json(), status=status.HTTP_200_OK)
    except requests.exceptions.RequestException as e:
        logger.error(f"RAG service error: {e}")
        return Response({
            'error': 'RAG service unavailable',
            'answer': _get_fallback_response(query_text),
            'rag_available': False
        }, status=status.HTTP_200_OK)


def _get_fallback_response(query: str) -> str:
    """Fallback responses when RAG is unavailable"""
    query_lower = query.lower()
    
    if any(word in query_lower for word in ['property', 'apartment', 'flat', 'bhk']):
        return (
            "I can help you find properties! However, my AI search is currently unavailable. "
            "Please browse our verified properties on the Explore page."
        )
    
    return (
        "I'm your ApnaGhar AI assistant! The advanced AI is currently unavailable. "
        "Please browse properties on the Explore page or contact support."
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def search_properties(request):
    """
    Proxy structured property search to RAG service
    
    POST /api/chatbot/search-properties/
    Body: {
        "bedrooms": 3,
        "city": "Mumbai",
        "max_price": 10000000,
        "min_price": 5000000,
        "status": "available"
    }
    """
    try:
        response = requests.post(
            f"{RAG_SERVICE_URL}/search",
            json=request.data,
            timeout=30
        )
        response.raise_for_status()
        return Response(response.json(), status=status.HTTP_200_OK)
    except requests.exceptions.RequestException as e:
        logger.error(f"RAG service error: {e}")
        return Response({
            'error': 'RAG service unavailable',
            'rag_available': False
        }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def chatbot_health(request):
    """
    Check if local RAG service (via ngrok) is available
    
    GET /api/chatbot/health/
    """
    try:
        response = requests.get(f"{RAG_SERVICE_URL}/health", timeout=5)
        response.raise_for_status()
        data = response.json()
        return Response({
            'rag_available': data.get('status') == 'healthy',
            'status': data.get('status', 'unknown'),
            'message': data.get('message', 'RAG service is operational'),
            'service_url': RAG_SERVICE_URL
        }, status=status.HTTP_200_OK)
    except requests.exceptions.RequestException as e:
        logger.warning(f"RAG service unavailable: {e}")
        return Response({
            'rag_available': False,
            'status': 'unavailable',
            'message': 'RAG service is not reachable. Make sure local service is running and ngrok is active.',
            'service_url': RAG_SERVICE_URL
        }, status=status.HTTP_200_OK)
