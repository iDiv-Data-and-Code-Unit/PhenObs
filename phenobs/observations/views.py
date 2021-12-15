import json
from datetime import date, datetime

from django.http import HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from ..gardens.models import Garden
from ..plants.models import Plant
from ..users.models import User
from .models import Collection, Record


def get_context(request):
    garden = Garden.objects.filter(auth_users=request.user).get()
    collections = Collection.objects.filter(garden=garden).all()
    last_collection = Collection.objects.filter(garden=garden).order_by("date").last()

    recs = Record.objects.filter(collection_id=last_collection.id)
    plants = Plant.objects.order_by("order").filter(garden_id=garden.id).all()
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
        "last_collection": last_collection,
        "new_collection_id": last_collection.id + 1,
        "garden": garden,
        "collections": collections,
        "records": records,
        "plants": plants,
    }

    return context


def get_all_collections(request):
    if request.user.is_authenticated:
        garden = Garden.objects.filter(auth_users=request.user).get()
        collections = Collection.objects.filter(garden=garden).all()
        collections_json = []
        for collection in collections:
            collections_json.append(
                {
                    "id": collection.id,
                    "date": collection.date,
                    "creator": collection.creator.username,
                }
            )
        return JsonResponse(collections_json, safe=False)
    return JsonResponse("ERROR", safe=False)


def all(request):
    if request.user.is_authenticated:
        context = get_context(request)
        return render(request, "observations/observations.html", context)
    else:
        return HttpResponseRedirect(request.META.get("HTTP_REFERER", "/accounts/login"))


def add(request):
    if request.user.is_authenticated:
        context = get_context(request)
        context["ids"] = [
            {"id": "initial-vegetative-growth", "label": "Initial vegetative growth"},
            {"id": "young-leaves-unfolding", "label": "Young leaves unfolding"},
            {"id": "flowers-opening", "label": "Flowers opening"},
            {"id": "peak-flowering", "label": "Peak flowering"},
            {"id": "peak-flowering-estimation", "label": "Peak flowering estimation"},
            {"id": "flowering-intensity", "label": "Flowering intensity"},
            {"id": "ripe-fruits", "label": "Ripe fruits"},
            {"id": "senescence", "label": "Senescence"},
            {"id": "senescence-intensity", "label": "Senescence intensity"},
        ]

        return render(request, "observations/add_observation.html", context)
    else:
        return HttpResponseRedirect(request.META.get("HTTP_REFERER", "/accounts/login"))


@csrf_exempt
def new(request):
    if request.method == "POST" and request.user.is_authenticated:
        today = timezone.now()
        doy = today.date() - date(today.date().year, 1, 1)
        garden = Garden.objects.filter(auth_users=request.user).get()
        creator = User.objects.filter(id=request.user.id).get()
        all_plants = (
            Plant.objects.order_by("order").filter(garden=garden, active=True).all()
        )

        collection = Collection(
            garden=garden, date=today.date(), doy=doy.days, creator=creator
        )
        collection.save()

        for plant in all_plants:
            record = Record(
                collection=collection,
                plant=plant,
                timestamp_entry=today,
                timestamp_edit=today,
                editor=creator,
                done=False,
            )
            record.save()

        records = format_records(Record.objects.filter(collection=collection).all())

        prev_collection_db = (
            Collection.objects.filter(date__lt=collection.date, garden=garden)
            .exclude(id=collection.id)
            .last()
        )

        prev_collection_json = None

        if prev_collection_db is not None:
            prev_records_db = Record.objects.filter(collection=prev_collection_db).all()
            prev_records_json = format_records(prev_records_db)

            prev_prev_collection_db = Collection.objects.filter(
                date__lt=prev_collection_db.date, garden=garden
            ).last()

            prev_collection_json = {
                "id": prev_collection_db.id,
                "creator": prev_collection_db.creator.username,
                "garden": prev_collection_db.garden.name,
                "date": prev_collection_db.date,
                "records": prev_records_json,
                "last-collection-id": prev_prev_collection_db.id
                if (prev_prev_collection_db is not None)
                else None,
            }

        return JsonResponse(
            {
                "id": collection.id,
                "date": today.date(),
                "creator": request.user.username,
                "garden": garden.name,
                "records": records,
                "last-collection": prev_collection_json,
            }
        )
    return JsonResponse("ERROR", safe=False)


#
# def new(request):
#     garden = Garden.objects.filter(auth_users=request.user).get()
#     all_plants = (
#         Plant.objects.order_by("order").filter(garden=garden, active=True).all()
#     )
#     last_collection = Collection.objects.filter(garden=garden).order_by("date").last()
#     fat_context = get_context(request)
#     plants = []
#     records = {}
#
#     # If no collection is found, then return NULL
#     if last_collection is None:
#         return JsonResponse(
#             {
#                 "creator": request.user.username,
#                 "garden": garden.name,
#                 "plants": plants,
#                 "last-collection": None,
#             }
#         )
#
#     # Structuring last observation values to JSON
#     for record in fat_context["records"]:
#         records[
#             record["record"].plant.garden_name + "-" + str(record["record"].plant.order)
#         ] = {
#             "plant": record["record"].plant.garden_name
#             + "-"
#             + str(record["record"].plant.order),
#             "initial-vegetative-growth": record["record"].initial_vegetative_growth,
#             "young-leaves-unfolding": record["record"].young_leaves_unfolding,
#             "flowers-opening": record["record"].flowers_open,
#             "peak-flowering": record["record"].peak_flowering,
#             "flowering-intensity": record["record"].flowering_intensity,
#             "ripe-fruits": record["record"].ripe_fruits,
#             "senescence": record["record"].senescence,
#             "senescence-intensity": record["record"].senescence_intensity,
#             "covered-artificial": "covered_artificial" in record["record"].maintenance,
#             "covered-natural": "covered_natural" in record["record"].maintenance,
#             "cut-partly": "cut_partly" in record["record"].maintenance,
#             "cut-total": "cut_total" in record["record"].maintenance,
#             "transplanted": "transplanted" in record["record"].maintenance,
#             "removed": "removed" in record["record"].maintenance,
#             "remarks": record["record"].remarks,
#             "peak-flowering-estimation": record["record"].peak_flowering_estimation,
#         }
#     # records = format_records(fat_context["records"])
#     # Last collection all details
#     last_collection_json = {
#         "collection-id": fat_context["last_collection"].id,
#         "collection-date": fat_context["last_collection"].date,
#         "creator": fat_context["last_collection"].creator.name,
#         "garden": fat_context["last_collection"].garden.name,
#         "records": records,
#     }
#     # Plant list for the garden
#     for plant in all_plants:
#         plants.append({"name": plant.garden_name, "order": plant.order})
#     # Necessary information for the new collection
#     new_collection = {
#         "collection-id": last_collection.id + 1,
#         "creator": request.user.username,
#         "garden": garden.name,
#         "last-collection": last_collection_json,
#         "plants": plants,
#     }
#
#     return JsonResponse(new_collection)


@csrf_exempt
def upload(request):
    if request.method == "POST" and request.user.is_authenticated:
        data = json.loads(request.body)
        print(data)
        collection_date = datetime.strptime(data["date"], "%Y-%m-%d")
        doy = collection_date.date() - date(collection_date.year, 1, 1)

        collection = Collection(
            id=data["id"],
            garden=Garden.objects.filter(auth_users=request.user).get(),
            date=collection_date.date(),
            doy=doy.days,
            creator=User.objects.filter(username=data["creator"]).get(),
        )

        collection.save()

        for key in data["records"]:
            record = data["records"][key]
            timestamp = timezone.now()
            new_record = Record(
                collection=collection,
                plant=Plant.objects.filter(
                    order=record["order"],
                    garden_id=Garden.objects.filter(name=data["garden"]).get().id,
                ).get(),
                timestamp_entry=timestamp,
                timestamp_edit=timestamp,
                editor=User.objects.filter(username=data["creator"]).get(),
                initial_vegetative_growth=record["initial-vegetative-growth"],
                young_leaves_unfolding=record["young-leaves-unfolding"],
                flowers_open=record["flowers-opening"],
                peak_flowering=record["peak-flowering"],
                flowering_intensity=None
                if (
                    len(str(record["flowering-intensity"])) == 0
                    or record["flowering-intensity"] is None
                )
                else int(record["flowering-intensity"]),
                ripe_fruits=record["ripe-fruits"],
                senescence=record["senescence"],
                senescence_intensity=None
                if (
                    len(str(record["senescence-intensity"])) == 0
                    or record["senescence-intensity"] is None
                )
                else int(record["senescence-intensity"]),
                maintenance=[
                    "cut_partly" if (record["cut-partly"]) else None,
                    "cut_total" if (record["cut-total"]) else None,
                    "covered_natural" if (record["covered-natural"]) else None,
                    "covered_artificial" if (record["covered-artificial"]) else None,
                    "transplanted" if (record["transplanted"]) else None,
                    "removed" if (record["removed"]) else None,
                ],
                remarks=record["remarks"],
                peak_flowering_estimation=record["peak-flowering-estimation"],
                done=record["done"],
            )

            new_record.save()

        return JsonResponse("OK", safe=False)
    return JsonResponse("ERROR", safe=False)


#
# def upload(request):
#     if request.method == "POST" and request.user.is_authenticated:
#         data = json.loads(request.body)
#         collection_date = datetime.strptime(data["collection-date"], "%Y-%m-%d")
#         doy = collection_date.date() - date(collection_date.year, 1, 1)
#
#         # TODO: Fix bugs related to retrieving from front-end
#
#         # Create and save the new collection
#         collection = Collection(
#             id=data['id'],
#             garden=Garden.objects.filter(auth_users=request.user).get(),
#             date=collection_date.date(),
#             doy=doy.days,
#             creator=request.user.username,
#         )
#         collection.save()
#
#         # Create and save each observation/record
#         for key in data["records"]:
#             record = data["records"][key]
#             timestamp = timezone.now()
#             new_record = Record(
#                 collection=Collection.objects.filter(
#                     creator=User.objects.filter(username=data["creator"]).get()
#                 ).last(),
#                 plant=Plant.objects.filter(
#                     order=record["order"],
#                     garden_id=Garden.objects.filter(name=data["garden"]).get().id,
#                 ).get(),
#                 timestamp_entry=timestamp,
#                 timestamp_edit=timestamp,
#                 editor=User.objects.filter(username=data["creator"]).get(),
#                 initial_vegetative_growth=record["initial-vegetative-growth"],
#                 young_leaves_unfolding=record["young-leaves-unfolding"],
#                 flowers_open=record["flowers-opening"],
#                 peak_flowering=record["peak-flowering"],
#                 flowering_intensity=None
#                 if (len(record["flowering-intensity"]) == 0)
#                 else int(record["flowering-intensity"]),
#                 ripe_fruits=record["ripe-fruits"],
#                 senescence=record["senescence"],
#                 senescence_intensity=None
#                 if (len(record["senescence-intensity"]) == 0)
#                 else int(record["senescence-intensity"]),
#                 maintenance=[
#                     "cut_partly" if (record["cut-partly"]) else None,
#                     "cut_total" if (record["cut-total"]) else None,
#                     "covered_natural" if (record["covered-natural"]) else None,
#                     "covered_artificial" if (record["covered-artificial"]) else None,
#                     "transplanted" if (record["transplanted"]) else None,
#                     "removed" if (record["removed"]) else None,
#                 ],
#                 remarks=record["remarks"],
#                 peak_flowering_estimation=record["peak-flowering-estimation"],
#                 done=record["done"],
#             )
#
#             new_record.save()
#
#         return JsonResponse("OK", safe=False)
#     return JsonResponse("ERROR", safe=False)
#
#
def format_records(collection_records):
    records = {}
    for record in collection_records:
        records[record.plant.order] = {
            "id": record.id,
            "order": record.plant.order,
            "done": False if (record.done is None) else record.done,
            "name": record.plant.garden_name,
            "initial-vegetative-growth": record.initial_vegetative_growth,
            "young-leaves-unfolding": record.young_leaves_unfolding,
            "flowers-opening": record.flowers_open,
            "peak-flowering": record.peak_flowering,
            "flowering-intensity": record.flowering_intensity,
            "ripe-fruits": record.ripe_fruits,
            "senescence": record.senescence,
            "senescence-intensity": record.senescence_intensity,
            "covered-artificial": None
            if (record.maintenance is None)
            else "covered_artificial" in record.maintenance,
            "covered-natural": None
            if (record.maintenance is None)
            else "covered_natural" in record.maintenance,
            "cut-partly": None
            if (record.maintenance is None)
            else "cut_partly" in record.maintenance,
            "cut-total": None
            if (record.maintenance is None)
            else "cut_total" in record.maintenance,
            "transplanted": None
            if (record.maintenance is None)
            else "transplanted" in record.maintenance,
            "removed": None
            if (record.maintenance is None)
            else "removed" in record.maintenance,
            "remarks": record.remarks,
            "peak-flowering-estimation": record.peak_flowering_estimation,
        }

    return records


def edit(request, id):
    if request.user.is_authenticated:
        context = get_context(request)

        context["id"] = id
        context["ids"] = [
            {"id": "initial-vegetative-growth", "label": "Initial vegetative growth"},
            {"id": "young-leaves-unfolding", "label": "Young leaves unfolding"},
            {"id": "flowers-opening", "label": "Flowers opening"},
            {"id": "peak-flowering", "label": "Peak flowering"},
            {"id": "peak-flowering-estimation", "label": "Peak flowering estimation"},
            {"id": "flowering-intensity", "label": "Flowering intensity"},
            {"id": "ripe-fruits", "label": "Ripe fruits"},
            {"id": "senescence", "label": "Senescence"},
            {"id": "senescence-intensity", "label": "Senescence intensity"},
        ]
        return render(request, "observations/edit_observation.html", context)
    else:
        return HttpResponseRedirect(request.META.get("HTTP_REFERER", "/accounts/login"))


# def get(request, id):
#     if request.user.is_authenticated:
#         collection = Collection.objects.filter(id=id).get()
#         last_collection = Collection.objects.filter(date__lt=collection.date).last()
#
#         recs = Record.objects.filter(collection_id=id).all()
#         records = format_records(recs)
#
#         context = {
#             "collection-id": id,
#             "creator": collection.creator.name,
#             "garden": collection.garden.name,
#             "last-collection": last_collection.id,
#             "records": records,
#         }
#
#         return JsonResponse(context, safe=False)
#     return JsonResponse("ERROR", safe=False)
#     # return render(request, "observations/edit_observation.html", context)


def get(request, id):
    if request.user.is_authenticated:
        garden = Garden.objects.filter(auth_users=request.user).get()
        collection = Collection.objects.filter(id=id).get()
        collection_records = Record.objects.filter(collection=collection).all()

        prev_collection_db = (
            Collection.objects.filter(date__lt=collection.date, garden=garden)
            .exclude(id=id)
            .last()
        )

        prev_collection_json = None

        if prev_collection_db is not None:
            prev_records_db = Record.objects.filter(collection=prev_collection_db).all()
            prev_records_json = format_records(prev_records_db)
            prev_collection_json = {
                "id": prev_collection_db.id,
                "creator": prev_collection_db.creator.username,
                "garden": prev_collection_db.garden.name,
                "date": prev_collection_db.date,
                "records": prev_records_json,
            }

        records = format_records(collection_records)

        return JsonResponse(
            {
                "id": collection.id,
                "date": collection.date,
                "creator": request.user.username,
                "garden": garden.name,
                "records": records,
                "last-collection": prev_collection_json,
            }
        )
    return JsonResponse("ERROR", safe=False)
