from django.shortcuts import render

from ..gardens.models import Garden
from ..plants.models import Plant
from .models import Collection, Record


def get_context(request):
    last_collection = Collection.objects.last()
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
        "last_collection": last_collection,
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

    context["ids"] = [
        {"id": "initial-vegetative-growth", "label": "Initial vegetative growth"},
        {"id": "young-leaves-unfolding", "label": "Young leaves unfolding"},
        {"id": "flowers-opening", "label": "Flowers opening"},
        {"id": "peak-flowering", "label": "Peak flowering"},
        {"id": "flowering-intensity", "label": "Flowering intensity"},
        {"id": "ripe-fruits", "label": "Ripe fruits"},
        {"id": "senescence", "label": "Senescence"},
        {"id": "senescence-intensity", "label": "Senescence intensity"},
    ]

    return render(request, "observations/add_collection.html", context)
