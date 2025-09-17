from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Property
from .serializers import PropertySerializer

class PropertyViewSet(viewsets.ModelViewSet):
    queryset = Property.objects.all()
    serializer_class = PropertySerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def list(self, request, *args, **kwargs):
        properties = self.get_queryset()
        serializer = PropertySerializer(properties, many=True)
        return Response({
            "status": "success",
            "message": "Properties retrieved successfully",
            "count": properties.count(),
            "properties": serializer.data
        })

# Create your views here.
