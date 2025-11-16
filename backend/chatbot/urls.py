"""
Chatbot URL Configuration
"""
from django.urls import path
from . import views

urlpatterns = [
    path('query/', views.chatbot_query, name='chatbot-query'),
    path('search-properties/', views.search_properties, name='chatbot-search-properties'),
    path('health/', views.chatbot_health, name='chatbot-health'),
]
