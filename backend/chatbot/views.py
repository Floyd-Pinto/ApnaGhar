"""
Chatbot API Views
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .rag_wrapper import rag_service
import logging

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([AllowAny])  # Allow unauthenticated users to ask questions
def chatbot_query(request):
    """
    Handle chatbot queries using RAG pipeline
    
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
    logger.info(f"Chatbot query: {query_text}")
    
    # Query RAG system
    result = rag_service.query(
        query_text=query_text,
        top_k=5,
        format_type=format_type
    )
    
    return Response(result, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def search_properties(request):
    """
    Structured property search via RAG
    
    POST /api/chatbot/search-properties/
    Body: {
        "bedrooms": 3,
        "city": "Mumbai",
        "max_price": 10000000,
        "min_price": 5000000,
        "status": "available"
    }
    """
    bedrooms = request.data.get('bedrooms')
    city = request.data.get('city')
    max_price = request.data.get('max_price')
    min_price = request.data.get('min_price')
    status_filter = request.data.get('status', 'available')
    
    result = rag_service.search_properties(
        bedrooms=bedrooms,
        city=city,
        max_price=max_price,
        min_price=min_price,
        status=status_filter
    )
    
    return Response(result, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def chatbot_health(request):
    """
    Check if RAG service is available
    
    GET /api/chatbot/health/
    GET /api/chatbot/health/?init=true  (trigger initialization)
    """
    try:
        # Check if we should trigger initialization
        should_init = request.GET.get('init', '').lower() == 'true'
        
        if should_init and not rag_service._initialized:
            # Trigger initialization in background (don't wait)
            import threading
            def init_worker():
                logger.info("Background RAG initialization requested via API")
                rag_service.initialize()
            thread = threading.Thread(target=init_worker, daemon=True)
            thread.start()
            
            return Response({
                'rag_available': False,
                'status': 'initializing',
                'message': 'RAG initialization started in background. Check back in 30-60 seconds.'
            }, status=status.HTTP_200_OK)
        
        is_available = rag_service.is_available()
        
        return Response({
            'rag_available': is_available,
            'status': 'healthy' if is_available else 'degraded',
            'message': 'RAG service is operational' if is_available else 'RAG service unavailable - using fallback responses'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return Response({
            'rag_available': False,
            'status': 'error',
            'message': f'Health check failed: {str(e)}'
        }, status=status.HTTP_200_OK)
