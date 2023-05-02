from rest_framework import viewsets

from phenobs.observations.permissions import IsAuthenticatedAndHasAccess
from phenobs.users.models import User
from phenobs.users.serializers import UserSerializer


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticatedAndHasAccess]
