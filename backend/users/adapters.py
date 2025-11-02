import os
from allauth.account.adapter import DefaultAccountAdapter
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.account.models import EmailAddress
from django.contrib.auth import get_user_model

User = get_user_model()


class CustomAccountAdapter(DefaultAccountAdapter):
    def get_login_redirect_url(self, request):
        """Redirect to custom endpoint after regular login"""
        backend_url = os.getenv('BACKEND_URL', 'https://apnaghar-2emb.onrender.com')
        return f"{backend_url}/api/auth/google/redirect/"
    
    def get_signup_redirect_url(self, request):
        """Redirect to custom endpoint after signup"""
        backend_url = os.getenv('BACKEND_URL', 'https://apnaghar-2emb.onrender.com')
        return f"{backend_url}/api/auth/google/redirect/"


class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def pre_social_login(self, request, sociallogin):
        """
        Handle logic before social login:
        - Connect social account to existing user with same email
        - Verify email if social login is used
        - Set default role for new users
        """
        email = sociallogin.account.extra_data.get("email")
        
        if not email:
            return
        
        # If this is a new social login, check for existing user with same email
        if not sociallogin.is_existing:
            existing_user = User.objects.filter(email=email).first()
            if existing_user:
                # Connect the social account to existing user
                sociallogin.connect(request, existing_user)
        
        # If social account exists, ensure email is verified
        if sociallogin.is_existing:
            user = sociallogin.user
            email_address, created = EmailAddress.objects.get_or_create(
                user=user, 
                email=email
            )
            if not email_address.verified:
                email_address.verified = True
                email_address.save()
        
        # Set default role for new users
        user = sociallogin.user
        if not user.id:  # New user
            if not hasattr(user, 'role') or not user.role:
                user.role = 'buyer'
    
    def save_user(self, request, sociallogin, form=None):
        """
        Save user and ensure email is verified for social logins
        """
        user = super().save_user(request, sociallogin, form)
        email = user.email
        
        # Ensure email is verified for social login users
        email_address, created = EmailAddress.objects.get_or_create(
            user=user, 
            email=email
        )
        if not email_address.verified:
            email_address.verified = True
            email_address.save()
        
        return user
    
    def get_login_redirect_url(self, request):
        """
        Redirect after successful social login
        Redirect to custom endpoint that generates JWT tokens
        """
        backend_url = os.getenv('BACKEND_URL', 'https://apnaghar-2emb.onrender.com')
        return f"{backend_url}/api/auth/google/redirect/"
    
    def get_connect_redirect_url(self, request, socialaccount):
        """
        Redirect after connecting a social account to existing user
        """
        backend_url = os.getenv('BACKEND_URL', 'https://apnaghar-2emb.onrender.com')
        return f"{backend_url}/api/auth/google/redirect/"
