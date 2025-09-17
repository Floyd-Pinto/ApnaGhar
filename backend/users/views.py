from django.shortcuts import render
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate, login
from .serializers import UserRegistrationSerializer, UserLoginSerializer
from .models import CustomUser

class RegisterView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        return Response({
            "message": "Registration endpoint",
            "method": "POST",
            "required_fields": {
                "username": "string",
                "first_name": "string",
                "last_name": "string",
                "email": "string",
                "password": "string",
                "password2": "string"
            },
            "example": {
                "username": "testuser",
                "first_name": "Test",
                "last_name": "User",
                "email": "test@example.com",
                "password": "your_password",
                "password2": "your_password"
            }
        })

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                "status": "success",
                "message": "User registered successfully",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name
                }
            }, status=status.HTTP_201_CREATED)
        return Response({
            "status": "error",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            "message": "Login endpoint",
            "method": "POST",
            "required_fields": {
                "email_or_username": "string",
                "password": "string"
            },
            "example": {
                "email_or_username": "testuser",
                "password": "your_password"
            }
        })

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            email_or_username = serializer.validated_data['email_or_username']
            password = serializer.validated_data['password']
            
            # Try username first
            user = authenticate(username=email_or_username, password=password)
            
            # If username fails, try email
            if user is None:
                try:
                    user_obj = CustomUser.objects.get(email=email_or_username)
                    user = authenticate(username=user_obj.username, password=password)
                except CustomUser.DoesNotExist:
                    user = None

            if user:
                login(request, user)
                return Response({
                    "status": "success",
                    "message": "Login successful",
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                        "first_name": user.first_name,
                        "last_name": user.last_name
                    }
                }, status=status.HTTP_200_OK)
            
            return Response({
                "status": "error",
                "message": "Invalid credentials"
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        return Response({
            "status": "error",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
