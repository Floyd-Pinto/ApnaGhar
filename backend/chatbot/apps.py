from django.apps import AppConfig
import logging
import os

logger = logging.getLogger(__name__)


class ChatbotConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'chatbot'
    
    def ready(self):
        """Initialize RAG service on Django startup"""
        # Skip in Django's autoreloader process (only for runserver)
        if os.environ.get('RUN_MAIN') is not None and os.environ.get('RUN_MAIN') != 'true':
            return
        
        try:
            from .rag_wrapper import rag_service
            logger.info("🤖 Initializing RAG chatbot service at startup...")
            
            # Initialize in background thread to not block startup
            import threading
            def init_rag():
                success = rag_service.initialize()
                if success:
                    logger.info("✅ RAG chatbot ready and available!")
                else:
                    logger.warning("⚠️ RAG chatbot initialization failed - using fallback mode")
            
            thread = threading.Thread(target=init_rag, daemon=True)
            thread.start()
            
        except Exception as e:
            logger.error(f"❌ Failed to start RAG initialization: {e}")
