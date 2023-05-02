from rest_framework import serializers

from phenobs.gardens.models import Garden


class GardenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Garden
        fields = ('id', 'name')
