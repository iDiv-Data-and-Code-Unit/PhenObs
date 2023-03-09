from rest_framework import viewsets, mixins, status
from rest_framework.response import Response

from phenobs.gardens.models import Garden
from phenobs.observations.models import Collection, Record
from phenobs.observations.permissions import IsAuthenticatedAndHasAccess
from phenobs.observations.serializers import CollectionSerializer, RecordSerializer


class RecordViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Record.objects.all()
    serializer_class = RecordSerializer


class CollectionViewSet(mixins.CreateModelMixin, mixins.UpdateModelMixin, mixins.ListModelMixin,
                        mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = Collection.objects.all()
    serializer_class = CollectionSerializer
    permission_classes = [IsAuthenticatedAndHasAccess]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if not serializer.validated_data['garden'].has_access(request.user):
            return Response(status=status.HTTP_403_FORBIDDEN)

        serializer.save()
        return Response(serializer.data)

    def list(self, request, *args, **kwargs):
        subgarden = Garden.objects.get(auth_users=request.user)
        query = self.get_queryset().filter(garden__main_garden=subgarden.main_garden)
        serializer = self.get_serializer(query, many=True, context={'thin': 'thin' in request.query_params})

        return Response(serializer.data)
