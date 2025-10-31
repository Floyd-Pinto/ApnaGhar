from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from .views import LoginView, RegisterView, LogoutView, UserProfileView, GoogleLogin, GoogleLoginCallback

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', RegisterView.as_view(), name='register'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    
    # OAuth URLs
    path('google/', GoogleLogin.as_view(), name='google_login'),
    path('google/callback/', GoogleLoginCallback.as_view(), name='google_callback'),
]