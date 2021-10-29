from django.shortcuts import render

from ..gardens.models import Garden
from ..plants.models import Plant
from .models import Collection, Record


def get_context(request):
    last_collection = Collection.objects.order_by("date").last()
    collections = Collection.objects.all()
    garden = Garden.objects.filter(auth_users=request.user).get()

    recs = Record.objects.filter(collection_id=last_collection.id)
    plants = Plant.objects.order_by("order").filter(garden_id=last_collection.garden_id)
    records = []

    for record in recs:
        records.append(
            {
                "record": record,
                "columns": [
                    record.initial_vegetative_growth,
                    record.young_leaves_unfolding,
                    record.flowers_open,
                    record.peak_flowering,
                    record.flowering_intensity,
                    record.ripe_fruits,
                    record.senescence,
                    record.senescence_intensity,
                ],
            }
        )

    context = {
        "garden": garden,
        "collections": collections,
        "records": records,
        "plants": plants,
    }

    return context


def all(request):
    context = get_context(request)

    return render(request, "observations/observations.html", context)


def add(request):
    context = get_context(request)

    return render(request, "observations/add_collection.html", context)


def add_observation(request, plant_id):
    context = get_context(request)
    plant = Plant.objects.filter(id=plant_id).get()
    last_collection = Collection.objects.order_by("date").last()
    record = Record.objects.filter(collection_id=last_collection.id).get()

    context["ids"] = [
        {
            "id": "initial-vegetative-growth",
            "label": "Initial vegetative growth",
            "value": record.initial_vegetative_growth,
        },
        {
            "id": "young-leaves-unfolding",
            "label": "Young leaves unfolding",
            "value": record.young_leaves_unfolding,
        },
        {
            "id": "flowers-opening",
            "label": "Flowers opening",
            "value": record.flowers_open,
        },
        {
            "id": "peak-flowering",
            "label": "Peak flowering",
            "value": record.peak_flowering,
        },
        {
            "id": "flowering-intensity",
            "label": "Flowering intensity",
            "value": record.flowering_intensity,
        },
        {"id": "ripe-fruits", "label": "Ripe fruits", "value": record.ripe_fruits},
        {"id": "senescence", "label": "Senescence", "value": record.senescence},
        {
            "id": "senescence-intensity",
            "label": "Senescence intensity",
            "value": record.senescence_intensity,
        },
    ]

    context["record"] = record
    context["last_collection"] = last_collection
    context["current"] = plant

    return render(request, "observations/add_observation.html", context)
