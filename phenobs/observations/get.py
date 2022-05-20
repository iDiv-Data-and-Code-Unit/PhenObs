import json

from django.contrib.auth.decorators import login_required
from django.db.models.query import QuerySet
from django.http import HttpRequest, JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt

from ..gardens.models import Garden
from .models import Collection, Record


@csrf_exempt
@login_required(login_url="/accounts/login/")
def get_all_collections(request: HttpRequest) -> JsonResponse:
    """Fetches all the collections from database for the given garden

    Args:
        request: The received request with metadata

    Returns:
        collections_json: JSON object consisting of all the received collections

    """
    garden = Garden.objects.filter(auth_users=request.user).get()
    collections = (
        Collection.objects.filter(garden__main_garden=garden.main_garden)
        .order_by("date")
        .all()
    )
    collections_json = []
    data = json.loads(request.body)

    for collection in collections:
        records = None
        if collection.id in data:
            records = format_records(Record.objects.filter(collection=collection).all())

        prev_collection = Collection.objects.filter(
            date__lt=collection.date, garden=collection.garden, finished=True
        ).last()

        collections_json.append(
            {
                "id": collection.id,
                "date": collection.date,
                "creator": collection.creator.username,
                "finished": collection.finished,
                "records": records,
                "garden": collection.garden.id,
                "garden-name": collection.garden.name,
                "last-collection-id": prev_collection.id
                if (prev_collection is not None)
                else None,
            }
        )
    return JsonResponse(collections_json, safe=False)


def get_collections(request, id):
    context = {"gardens": [], "range": range(5, 105, 5)}

    is_admin = False

    if request.user.groups.filter(name="Admins").exists():
        is_admin = True

    if id == "all":
        if is_admin:
            gardens = Garden.objects.all()
        else:
            sub = Garden.objects.filter(auth_users=request.user).get()
            gardens = [sub.main_garden]

        for garden in gardens:
            subgardens = Garden.objects.filter(main_garden=garden).all()

            garden_dict = {"id": garden.id, "name": garden.name, "subgardens": []}

            for subgarden in subgardens:
                garden_dict["subgardens"].append(
                    {
                        "id": subgarden.id,
                        "name": subgarden.name,
                        "collections": [],
                        "finished": 0,
                    }
                )
            context["gardens"].append(garden_dict)

    else:
        garden = Garden.objects.filter(id=int(id)).get()
        if garden.is_subgarden():
            context["gardens"].append(
                {
                    "id": garden.main_garden_id,
                    "name": garden.main_garden.name,
                    "subgardens": [
                        {
                            "id": garden.id,
                            "name": garden.name,
                            "collections": [],
                            "finished": 0,
                        }
                    ],
                }
            )
        else:
            subgardens = Garden.objects.filter(main_garden=garden).all()

            garden_dict = {"id": garden.id, "name": garden.name, "subgardens": []}

            for subgarden in subgardens:
                garden_dict["subgardens"].append(
                    {
                        "id": subgarden.id,
                        "name": subgarden.name,
                        "collections": [],
                        "finished": 0,
                    }
                )

            context["gardens"].append(garden_dict)

    for garden in context["gardens"]:
        for subgarden in garden["subgardens"]:
            collections = (
                Collection.objects.filter(garden_id=subgarden["id"])
                .order_by("date")
                .all()
            )
            for collection in collections:
                collection_dict = {
                    "id": collection.id,
                    "date_full": collection.date,
                    "date": collection.date.strftime("%Y-%m-%d"),
                    "creator": collection.creator.username,
                    "garden": collection.garden.name,
                    "records": [],
                    "finished": collection.finished,
                }

                if collection.finished:
                    subgarden["finished"] = subgarden["finished"] + 1

                records = Record.objects.filter(collection=collection).all()
                for record in records:
                    maintenance = []
                    for option in record.maintenance:
                        if option != "None":
                            maintenance.append(option.replace("_", " "))

                    collection_dict["records"].append(
                        {
                            "id": record.id,
                            "values": [
                                {"id": "name", "value": record.plant.garden_name},
                                {
                                    "id": "initial-vegetative-growth",
                                    "value": record.initial_vegetative_growth,
                                },
                                {
                                    "id": "young-leaves-unfolding",
                                    "value": record.young_leaves_unfolding,
                                },
                                {"id": "flowers-opening", "value": record.flowers_open},
                                {
                                    "id": "peak-flowering",
                                    "value": record.peak_flowering,
                                },
                                {
                                    "id": "peak-flowering-estimation",
                                    "value": record.peak_flowering_estimation,
                                },
                                {
                                    "id": "flowering-intensity",
                                    "value": record.flowering_intensity,
                                },
                                {"id": "ripe-fruits", "value": record.ripe_fruits},
                                {"id": "senescence", "value": record.senescence},
                                {
                                    "id": "senescence-intensity",
                                    "value": record.senescence_intensity,
                                },
                                {
                                    "id": "cut-partly",
                                    "value": "cut_partly" in record.maintenance,
                                },
                                {
                                    "id": "cut-total",
                                    "value": "cut_total" in record.maintenance,
                                },
                                {
                                    "id": "covered-natural",
                                    "value": "covered_natural" in record.maintenance,
                                },
                                {
                                    "id": "covered-artificial",
                                    "value": "covered_artificial" in record.maintenance,
                                },
                                {
                                    "id": "transplanted",
                                    "value": "transplanted" in record.maintenance,
                                },
                                {
                                    "id": "removed",
                                    "value": "removed" in record.maintenance,
                                },
                                {
                                    "id": "maintenance",
                                    "value": str(maintenance)[1:-1].replace("'", ""),
                                },
                                {"id": "remarks", "value": record.remarks},
                                {"id": "order", "value": record.plant.order},
                            ],
                        }
                    )
                subgarden["collections"].append(collection_dict)

    return render(request, "observations/views_content.html", context)


@login_required(login_url="/accounts/login/")
def get(request: HttpRequest, id: int) -> JsonResponse:
    """Fetches the collections from database with the given ID

    Args:
        request: The received request with metadata
        id: Collection ID

    Returns:
        {}: A JSON object containing the collection and related records' data

    """
    try:
        collection = Collection.objects.filter(id=id).get()
    except Collection.DoesNotExist:
        return JsonResponse({"id": -1})

    collection_records = Record.objects.filter(collection=collection).all()
    prev_collection_json = get_older(collection)

    records = format_records(collection_records)

    return JsonResponse(
        {
            "id": collection.id,
            "date": collection.date,
            "creator": collection.creator.username,
            "garden": collection.garden.id,
            "garden-name": collection.garden.name,
            "records": records,
            "last-collection": prev_collection_json,
            "finished": collection.finished,
        }
    )


def get_older(collection):
    prev_collection_db = (
        Collection.objects.filter(
            date__lt=collection.date, garden=collection.garden, finished=True
        )
        .exclude(id=collection.id)
        .order_by("date")
        .last()
    )

    prev_collection_json = None

    if prev_collection_db is not None:
        prev_records_db = Record.objects.filter(collection=prev_collection_db).all()
        prev_records_json = format_records(prev_records_db)
        prev_collection_json = {
            "id": prev_collection_db.id,
            "creator": prev_collection_db.creator.username,
            "garden": prev_collection_db.garden.id,
            "garden-name": prev_collection_db.garden.name,
            "date": prev_collection_db.date,
            "records": prev_records_json,
            "uploaded": True,
            "finished": prev_collection_db.finished,
        }

    return prev_collection_json


@csrf_exempt
@login_required(login_url="/accounts/login/")
def last(request):
    data = json.loads(request.body)
    collection = Collection.objects.filter(id=data["id"]).get()
    collection.date = data["date"]

    return JsonResponse(get_older(collection), safe=False)


def format_records(collection_records: QuerySet):
    """Converts records data into a JSON object

    Args:
        collection_records: The records to be converted into JSON object

    Returns:
        records: JSON object containing all the records

    """
    records = {}
    for record in collection_records:
        no_obs = False
        if (
            record.initial_vegetative_growth is None
            and record.young_leaves_unfolding is None
            and record.flowers_open is None
            and record.peak_flowering is None
            and record.ripe_fruits is None
            and record.senescence is None
            and record.peak_flowering_estimation is None
            and len(record.remarks) > 0
        ):
            no_obs = True

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
            "no-observation": no_obs,
        }

    return records
