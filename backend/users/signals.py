from django.dispatch import receiver
from allauth.socialaccount.signals import pre_social_login
from allauth.account.signals import user_logged_in
import os
from django.shortcuts import redirect


@receiver(user_logged_in)
def handle_social_login(sender, request, user, **kwargs):
    """
    Handle post-login for social accounts
    This signal is fired AFTER the user is logged in
    """
    # Check if this is a social login by checking the session
    if request.session.get('socialaccount_sociallogin'):
        print(f"Social login detected for user: {user.email}")
        
        # Store a flag in session to redirect to token generation
        request.session['pending_oauth_redirect'] = True
        request.session.modified = True
