from rest_framework import permissions

from phenobs.gardens.models import Garden


class IsAuthenticatedAndHasAccess(permissions.BasePermission):
    """Permission class to check if the user is authenticated and has access to list,
    create, retrieve or update the collection by checking the garden.
    """

    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        user_subgarden = Garden.objects.get(auth_users=request.user)
        return user_subgarden.main_garden == obj.garden.main_garden
