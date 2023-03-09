from rest_framework import serializers, fields

from phenobs.observations.models import Collection, Record


class RecordSerializer(serializers.ModelSerializer):
    id = fields.IntegerField(read_only=False)
    maintenance = fields.MultipleChoiceField(choices=Record.maintenance_choices)

    class Meta:
        model = Record
        fields = '__all__'


class CollectionSerializer(serializers.ModelSerializer):
    id = fields.IntegerField(read_only=False, required=False)
    records = RecordSerializer(many=True, required=False)
    includeRecords = fields.BooleanField(required=False, write_only=True)

    class Meta:
        model = Collection
        fields = '__all__'

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if self.context.get('thin', False):
            data.pop('records', None)
        return data

    def create(self, validated_data):
        collection = Collection.objects.create(**validated_data)

        for plant in collection.get_plants():
            Record.objects.create(plant=plant, collection=collection, editor=collection.creator)

        return collection

    def update(self, instance, validated_data):
        records = validated_data.get('records', [])

        instance.date = validated_data.get('date', instance.date)
        instance.finished = validated_data.get('finished', instance.finished)
        instance.save()

        for record in records:
            Record.objects.filter(id=record.get('id')).update(**record)

        return instance
