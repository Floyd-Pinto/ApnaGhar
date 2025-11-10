from rest_framework import permissions


class IsOwnerOrBuilderOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow:
    - Anyone to view unsold properties (status='available')
    - Only the buyer who owns the property or the builder to view sold properties
    """

    def has_object_permission(self, request, view, obj):
        # Property object
        property_obj = obj
        
        # Allow any GET, HEAD or OPTIONS request for available properties
        if property_obj.status == 'available':
            return True
        
        # For sold/booked properties, check if user is the buyer or builder
        if request.user and request.user.is_authenticated:
            # Check if user is the buyer
            if property_obj.buyer == request.user:
                return True
            
            # Check if user is the builder/developer
            try:
                from .models import Developer
                developer = Developer.objects.get(user=request.user)
                if property_obj.project.developer == developer:
                    return True
            except Developer.DoesNotExist:
                pass
        
        # Deny access if none of the above conditions are met
        return False


class IsBuilderOrReadOnly(permissions.BasePermission):
    """
    Permission to only allow builders/developers to edit projects
    """

    def has_permission(self, request, view):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to authenticated builders
        if request.user and request.user.is_authenticated:
            try:
                from .models import Developer
                Developer.objects.get(user=request.user)
                return True
            except Developer.DoesNotExist:
                return False
        
        return False

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the developer who owns the project
        if request.user and request.user.is_authenticated:
            try:
                from .models import Developer
                developer = Developer.objects.get(user=request.user)
                
                # Handle different object types
                if hasattr(obj, 'developer'):
                    # For Project objects
                    return obj.developer == developer
                elif hasattr(obj, 'project'):
                    # For ConstructionMilestone, Property, etc. that have a project FK
                    return obj.project.developer == developer
                else:
                    return False
            except Developer.DoesNotExist:
                return False
        
        return False
