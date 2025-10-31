import os
from allauth.account.adapter import DefaultAccountAdapter
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.conf import settings


class CustomAccountAdapter(DefaultAccountAdapter):
    def get_login_redirect_url(self, request):
        """Redirect to frontend after login"""
        frontend_url = os.getenv('FRONTEND_URL', 'https://apnaghar-five.vercel.app')
        return f"{frontend_url}/dashboard"


class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def get_login_redirect_url(self, request):
        """
        Redirect to our custom endpoint that will generate JWT tokens
        and then redirect to frontend with tokens
        """
        backend_url = os.getenv('BACKEND_URL', 'https://apnaghar-2emb.onrender.com')
        return f"{backend_url}/api/auth/google/redirect/"
    
    def get_connect_redirect_url(self, request, socialaccount):
        """
        Redirect to our custom endpoint that will generate JWT tokens
        and then redirect to frontend with tokens
        """
        backend_url = os.getenv('BACKEND_URL', 'https://apnaghar-2emb.onrender.com')
        return f"{backend_url}/api/auth/google/redirect/"
    
    def pre_social_login(self, request, socialaccount):
        """
        Handle user data before social login.
        Set default role to 'buyer' if not specified.
        """
        user = socialaccount.user
        if user.id:
            return
        
        # Set default role if creating new user
        if not hasattr(user, 'role') or not user.role:
            user.role = 'buyer'
