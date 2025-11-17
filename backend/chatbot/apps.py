from django.apps import AppConfig
import logging

logger = logging.getLogger(__name__)


class ChatbotConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'chatbot'
    
    def ready(self):
        """Chatbot runs as external service via ngrok - no initialization needed"""
        logger.info("🤖 Chatbot configured to use external RAG service via ngrok")
