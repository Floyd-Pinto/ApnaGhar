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
    
    def populate_user(self, request, sociallogin, data):
        """
        Populate user instance with data from social login
        Set default role for new users
        """
        user = super().populate_user(request, sociallogin, data)
        
        # Set default role for new users
        if not user.id and (not hasattr(user, 'role') or not user.role):
            user.role = 'buyer'
        
        return user
    
    def save_user(self, request, sociallogin, form=None):
        """
        Save user and ensure email is verified for social logins
        Also ensure OAuth users have unusable password
        """
        user = super().save_user(request, sociallogin, form)
        email = user.email
        
        # Set unusable password for social login users (OAuth users)
        # This ensures they must login via OAuth and can later set their own password
        user.set_unusable_password()
        user.save()
        
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
        IMPORTANT: At this point, the user MUST be authenticated
        """
        print(f"Adapter get_login_redirect_url - User authenticated: {request.user.is_authenticated}")
        print(f"Adapter - User: {request.user}")
        
        backend_url = os.getenv('BACKEND_URL', 'https://apnaghar-2emb.onrender.com')
        return f"{backend_url}/api/auth/google/redirect/"
    
    def get_connect_redirect_url(self, request, socialaccount):
        """
        Redirect after connecting a social account to existing user
        """
        backend_url = os.getenv('BACKEND_URL', 'https://apnaghar-2emb.onrender.com')
        return f"{backend_url}/api/auth/google/redirect/"
