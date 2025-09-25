from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.db.models import Q
from django.contrib.auth.password_validation import validate_password

User = get_user_model()

class LoginSerializer(serializers.Serializer):
    username_or_email = serializers.CharField(
        max_length=255,
        required=True
    )
    password = serializers.CharField(
        max_length=128,
        required=True,
        style={'input_type': 'password'}
    )

    def validate(self, attrs):
        username_or_email = attrs.get('username_or_email')
        password = attrs.get('password')

        if username_or_email and password:
            try:
                user = User.objects.get(
                    Q(username=username_or_email) | Q(email=username_or_email)
                )
            except User.DoesNotExist:
                raise serializers.ValidationError(
                    'No account found with these credentials.'
                )

            if not user.check_password(password):
                raise serializers.ValidationError('Invalid password.')

            # Generate token
            refresh = TokenObtainPairSerializer.get_token(user)

            return {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'id': str(user.id),
                'username': user.username,
                'email': user.email
            }
        
        raise serializers.ValidationError(
            'Must include "username/email" and "password".'
        )

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2', 
                 'first_name', 'last_name')
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'email': {'required': True},
            'username': {'required': True}
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({
                "password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2', None)
        user = User.objects.create(**validated_data)
        return user