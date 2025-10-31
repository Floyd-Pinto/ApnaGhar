from django.shortcuts import render, redirect
from django.conf import settings
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from allauth.socialaccount.models import SocialToken, SocialAccount
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
import os
from .serializers import LoginSerializer, RegisterSerializer, UserProfileSerializer, UserProfileUpdateSerializer

# Create your views here.

class LoginView(TokenObtainPairView):
    permission_classes = (AllowAny,)
    serializer_class = LoginSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            return Response({
                "error": "Invalid credentials"
            }, status=status.HTTP_401_UNAUTHORIZED)

        return Response({
            "success": "Login successful",
            "tokens": {
                "access": serializer.validated_data.get('access'),
                "refresh": serializer.validated_data.get('refresh')
            },
            "user": {
                "id": serializer.validated_data.get('id'),
                "username": serializer.validated_data.get('username'),
                "email": serializer.validated_data.get('email'),
                "role": serializer.validated_data.get('role')
            }
        }, status=status.HTTP_200_OK)

class RegisterView(generics.CreateAPIView):
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        print("Registration data received:", request.data)  # Debug log
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            # Log and return detailed validation errors
            print("Registration validation errors:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user = serializer.save()
        
        # Generate tokens for the new user
        refresh = RefreshToken.for_user(user)
        
        return Response({
            "success": "User registered successfully",
            "tokens": {
                "access": str(refresh.access_token),
                "refresh": str(refresh)
            },
            "user": {
                "id": str(user.id),
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role
            }
        }, status=status.HTTP_201_CREATED)

class LogoutView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data["refresh_token"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)
        except Exception:
            return Response({"error": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        """Get user profile information"""
        user = request.user
        serializer = UserProfileSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def put(self, request):
        """Update user profile information"""
        user = request.user
        serializer = UserProfileUpdateSerializer(user, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            # Return updated profile
            profile_serializer = UserProfileSerializer(user)
            return Response({
                "message": "Profile updated successfully",
                "user": profile_serializer.data
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self, request):
        """Partially update user profile information"""
        return self.put(request)


class GoogleLogin(SocialLoginView):
    """
    Google OAuth2 login view
    """
    adapter_class = GoogleOAuth2Adapter
    callback_url = os.getenv('BACKEND_URL', 'https://apnaghar-2emb.onrender.com') + '/api/auth/google/callback/'
    client_class = OAuth2Client


class GoogleLoginCallback(APIView):
    """
    Handle Google OAuth callback and return JWT tokens
    """
    permission_classes = (AllowAny,)
    
    def get(self, request):
        code = request.GET.get('code')
        if not code:
            return Response({'error': 'No code provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Exchange code for tokens using GoogleLogin view
        try:
            # Import here to avoid circular imports
            from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
            from allauth.socialaccount.providers.oauth2.client import OAuth2Client
            
            adapter = GoogleOAuth2Adapter(request)
            callback_url = os.getenv('BACKEND_URL', 'https://apnaghar-2emb.onrender.com') + '/api/auth/google/callback/'
            client = OAuth2Client(request, adapter.get_provider().get_app(request), callback_url=callback_url)
            
            # Get access token from Google
            access_token = adapter.complete_login(request, None, code)
            
            # Get or create user
            social_login = adapter.complete_login(request, None, code)
            user = social_login.user
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            # Redirect to frontend with tokens
            frontend_url = os.getenv('FRONTEND_URL', 'https://apnaghar-five.vercel.app')
            redirect_url = f"{frontend_url}/auth/callback?access={str(refresh.access_token)}&refresh={str(refresh)}&user_id={user.id}"
            
            return redirect(redirect_url)
            
        except Exception as e:
            print(f"Google OAuth error: {str(e)}")
            frontend_url = os.getenv('FRONTEND_URL', 'https://apnaghar-five.vercel.app')
            return redirect(f"{frontend_url}/login?error=oauth_failed")
