from rest_framework import viewsets
from rest_framework.response import Response

from phenobs.gardens.models import Garden
from phenobs.gardens.serializers import GardenSerializer
from phenobs.observations.permissions import IsAuthenticatedAndHasAccess


class GardenViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Garden.objects.all()
    serializer_class = GardenSerializer
    permission_classes = [IsAuthenticatedAndHasAccess]

    def list(self, request, *args, **kwargs):
        subgarden = Garden.objects.get(auth_users=request.user)
        query = self.get_queryset().filter(main_garden=subgarden.main_garden)
        serializer = self.get_serializer(query, many=True)

        data = {
            "user": {
                "id": request.user.id,
                "username": request.user.username,
                "subgarden": subgarden.id
            },
            "main_garden": {
                "id": subgarden.main_garden.id,
                "name": subgarden.main_garden.name
            },
            "subgardens": serializer.data
        }

        return Response(data)
