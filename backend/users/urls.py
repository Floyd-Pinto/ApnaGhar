from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from .views import LoginView, RegisterView, LogoutView, UserProfileView, GoogleOAuthRedirect

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', RegisterView.as_view(), name='register'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    
    # OAuth callback - called after allauth processes Google OAuth
    # Support both with and without trailing slash
    path('google/redirect/', GoogleOAuthRedirect.as_view(), name='google_oauth_redirect'),
    path('google/redirect', GoogleOAuthRedirect.as_view(), name='google_oauth_redirect_no_slash'),
]