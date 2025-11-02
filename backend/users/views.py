from django.shortcuts import render, redirect
from django.conf import settings
from django.views import View
from django.contrib.auth import get_user_model
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
import os
from .serializers import (
    LoginSerializer, RegisterSerializer, UserProfileSerializer, 
    UserProfileUpdateSerializer, ChangePasswordSerializer, UpdateUsernameSerializer
)

User = get_user_model()

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


class ChangePasswordView(APIView):
    permission_classes = (IsAuthenticated,)
    
    def post(self, request):
        """Change user password"""
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Password changed successfully"
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UpdateUsernameView(APIView):
    permission_classes = (IsAuthenticated,)
    
    def post(self, request):
        """Update username"""
        serializer = UpdateUsernameSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                "message": "Username updated successfully",
                "username": user.username
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GoogleOAuthRedirect(View):
    """
    After successful Google OAuth, generate JWT tokens and redirect to frontend
    This is a Django View (not DRF APIView) to properly use session authentication
    """
    
    def get(self, request):
        # This endpoint is hit after allauth processes the OAuth callback
        print(f"GoogleOAuthRedirect called - User authenticated: {request.user.is_authenticated}")
        print(f"User: {request.user}")
        print(f"Session keys: {list(request.session.keys())}")
        
        # Check if there's auth data in session
        auth_user_id = request.session.get('_auth_user_id')
        print(f"Auth user ID in session: {auth_user_id}")
        
        # If user is not authenticated but we have a user ID in session,
        # manually get the user (this handles the case where middleware hasn't loaded user yet)
        user = None
        if request.user.is_authenticated:
            user = request.user
            print(f"User from request.user: {user.email}")
        elif auth_user_id:
            try:
                user = User.objects.get(id=auth_user_id)
                print(f"User loaded from session ID: {user.email}")
            except User.DoesNotExist:
                print(f"User with ID {auth_user_id} not found")
        
        if user:
            try:
                # Generate JWT tokens for the authenticated user
                refresh = RefreshToken.for_user(user)
                
                print(f"Generated tokens for user: {user.email}")
                
                # Redirect to frontend with tokens
                frontend_url = os.getenv('FRONTEND_URL', 'https://apnaghar-five.vercel.app')
                redirect_url = f"{frontend_url}/auth/callback?access={str(refresh.access_token)}&refresh={str(refresh)}&user_id={user.id}"
                
                print(f"Redirecting to: {redirect_url}")
                return redirect(redirect_url)
            except Exception as e:
                print(f"Error generating tokens: {e}")
                import traceback
                traceback.print_exc()
                frontend_url = os.getenv('FRONTEND_URL', 'https://apnaghar-five.vercel.app')
                return redirect(f"{frontend_url}/login?error=token_generation_failed")
        else:
            # OAuth failed - user not authenticated
            print("OAuth redirect called but user not authenticated")
            print(f"Session ID: {request.session.session_key}")
            print(f"Session data: {dict(request.session)}")
            frontend_url = os.getenv('FRONTEND_URL', 'https://apnaghar-five.vercel.app')
            return redirect(f"{frontend_url}/login?error=oauth_failed")
