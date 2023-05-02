from datetime import datetime

from rest_framework import viewsets, mixins, status
from rest_framework.response import Response

from phenobs.gardens.models import Garden
from phenobs.observations.models import Collection, Record
from phenobs.observations.permissions import IsAuthenticatedAndHasAccess
from phenobs.observations.serializers import CollectionSerializer, RecordSerializer


class RecordViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Record.objects.all()
    serializer_class = RecordSerializer


class CollectionViewSet(
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    queryset = Collection.objects.all()
    serializer_class = CollectionSerializer
    permission_classes = [IsAuthenticatedAndHasAccess]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if not serializer.validated_data["garden"].has_access(request.user):
            return Response(status=status.HTTP_403_FORBIDDEN)

        serializer.save()
        return Response(serializer.data)

    def list(self, request, *args, **kwargs):
        subgarden = Garden.objects.get(auth_users=request.user)
        query = (
            self.get_queryset()
            .filter(garden__main_garden=subgarden.main_garden)
            .order_by("-date")[:50]
        )
        serializer = self.get_serializer(
            query, many=True, context={"thin": "thin" in request.query_params}
        )

        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        timestamp = request.query_params.get("date")

        if timestamp:
            try:
                date_obj = datetime.fromtimestamp(int(timestamp))
                print(date_obj)

                previous_collection = Collection.objects.filter(
                    date__lt=date_obj, garden=instance.garden, finished=True
                ).last()

                if previous_collection:
                    serializer_previous = self.get_serializer(previous_collection)
                    return Response(serializer_previous.data)
                else:
                    return Response(status=status.HTTP_404_NOT_FOUND)
            except ValueError:
                return Response(
                    {"error": "Invalid date format"}, status=status.HTTP_400_BAD_REQUEST
                )

        return Response(serializer.data)
