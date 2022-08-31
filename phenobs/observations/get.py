import datetime
import json

from django.contrib.auth.decorators import login_required
from django.db.models.query import QuerySet
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from jsonschema import validate
from jsonschema.exceptions import ValidationError

from ..gardens.models import Garden
from .models import Collection, Record
from .schemas import collection_schema, collections_schema


@csrf_exempt
@login_required(login_url="/accounts/login/")
def get_all_collections(request: HttpRequest) -> JsonResponse:
    """Fetches all the collections from database for the given garden

    Args:
        request: The received request with metadata

    Returns:
        collections_json: JSON object consisting of all the received collections

    """
    try:
        garden = Garden.objects.get(auth_users=request.user)

        if garden.is_subgarden():
            collections = Collection.objects.filter(
                garden__main_garden=garden.main_garden
            ).order_by("date")
        else:
            collections = Collection.objects.filter(
                garden__main_garden=garden
            ).order_by("date")

        collections_json = []

        data = json.loads(request.body)
        validate(instance=data, schema=collections_schema)

        for collection in collections:
            records = None
            if collection.id in data:
                records = format_records(Record.objects.filter(collection=collection))

            prev_collection = Collection.objects.filter(
                date__lt=collection.date, garden=collection.garden, finished=True
            ).last()

            if prev_collection is not None:
                last_collection_id = prev_collection.id
            else:
                last_collection_id = None

            collections_json.append(
                {
                    "id": collection.id,
                    "date": collection.date,
                    "creator": collection.creator.username,
                    "finished": collection.finished,
                    "records": records,
                    "garden": collection.garden.id,
                    "garden-name": collection.garden.name,
                    "last-collection-id": last_collection_id,
                }
            )
        return JsonResponse(collections_json, safe=False)

    except Garden.DoesNotExist:
        response = JsonResponse(
            "No subgarden has been assigned to the user.", safe=False
        )
        response.status_code = 404
        return response

    except Garden.MultipleObjectsReturned:
        response = JsonResponse(
            "Multiple subgardens are assigned to the user. Please assign only one subgarden per user.",
            safe=False,
        )
        response.status_code = 409
        return response

    except json.JSONDecodeError:
        response = JsonResponse("JSON decoding error was raised.", safe=False)
        response.status_code = 400
        return response

    except ValidationError:
        response = JsonResponse("Received JSON could not be validated.", safe=False)
        response.status_code = 500
        return response

    except Exception as e:
        response = JsonResponse(e, safe=False)
        response.status_code = 500
        return response


@csrf_exempt
def get_collections(request, id):
    try:
        data = json.loads(request.body)

        start_date_json = data["start_date"]
        end_date_json = data["end_date"]
        start_date = None
        end_date = None
        start_date_string = ""
        end_date_string = ""

        if start_date_json is not None:
            start_date, start_date_string = json_date_formatter(start_date_json)

        if start_date_json is not None:
            end_date, end_date_string = json_date_formatter(end_date_json)

        context = {
            "start_date": start_date_string,
            "end_date": end_date_string,
            "gardens": [],
            "range": range(5, 105, 5),
        }

        is_admin = False
        context["subgarden_options"] = []

        if request.user.groups.filter(name="Admins").exists():
            is_admin = True

        auth_garden = Garden.objects.get(auth_users=request.user)
        for subgarden in Garden.objects.filter(main_garden=auth_garden.main_garden):
            context["subgarden_options"].append(
                {
                    "main_garden": subgarden.main_garden.name,
                    "name": subgarden.name,
                    "id": subgarden.id,
                }
            )

        if id == "all":
            if is_admin:
                gardens = Garden.objects.all()
            else:
                sub = Garden.objects.get(auth_users=request.user)
                gardens = [sub.main_garden]

            for garden in gardens:
                subgardens = Garden.objects.filter(main_garden=garden)

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
            garden = Garden.objects.get(id=int(id))
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
                subgardens = Garden.objects.filter(main_garden=garden)

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
                collections = Collection.objects.filter(
                    garden_id=subgarden["id"]
                ).order_by("date")
                if start_date is not None and end_date is not None:
                    collections = collections.filter(
                        date__gte=start_date, date__lte=end_date
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

                    subgarden["collections"].append(collection_dict)

        return render(request, "observations/views_content.html", context)

    except json.JSONDecodeError:
        context = {"exception": Exception("JSON decoding error was raised.")}
        return render(request, "error.html", context, status=400)

    except Garden.DoesNotExist:
        context = {
            "exception": Exception(
                "No subgarden has been assigned to the user. Please assign user to a subgarden."
            )
        }
        return render(request, "error.html", context, status=404)

    except Garden.MultipleObjectsReturned:
        context = {
            "exception": Exception(
                "Multiple subgardens are assigned to the user. Please assign only one subgarden per user."
            )
        }

        return render(request, "error.html", context, status=409)

    except Exception as e:
        context = {"exception": e}
        return render(request, "error.html", context, status=500)


def json_date_formatter(json_date):
    date_string = ""
    date_object = None

    if (
        json_date["year"] is not None
        and json_date["month"] is not None
        and json_date["day"] is not None
        and json_date["string"] is not None
    ):
        date_object = datetime.date(
            year=json_date["year"], month=json_date["month"], day=json_date["day"]
        )
        date_string = json_date["string"]

    return date_object, date_string


@login_required
def edit_collection_content(request, id):
    try:
        context = collection_content(id)
        context["collection_id"] = id
        return render(request, "observations/edit_records.html", context)

    except Collection.DoesNotExist:
        response = HttpResponse("Collection could not be retrieved.")
        response.status_code = 404
        return response

    except Exception as e:
        response = HttpResponse(e)
        response.status_code = 500
        return response


@login_required
def view_collection_content(request, id):
    try:
        context = collection_content(id)
        return render(request, "observations/view_records.html", context)

    except Collection.DoesNotExist:
        response = HttpResponse("Collection could not be retrieved.")
        response.status_code = 404
        return response

    except Exception as e:
        response = HttpResponse(e)
        response.status_code = 500
        return response


def collection_content(collection_id):
    collection = Collection.objects.get(id=collection_id)
    records = Record.objects.filter(collection=collection)
    records_values = []

    for record in records:
        maintenance = []
        for option in record.maintenance:
            if option != "None":
                maintenance.append(option.replace("_", " "))

        records_values.append(
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

    context = {"records": records_values, "range": range(5, 105, 5)}

    return context


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
        response = JsonResponse("Collection could not be retrieved.", safe=False)
        response.status_code = 404
        return response

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
    if type(collection) is not Collection:
        raise Collection.DoesNotExist("Collection is not valid.")

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
        prev_records_db = Record.objects.filter(collection=prev_collection_db)
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
    try:
        data = json.loads(request.body)
        validate(instance=data, schema=collection_schema)
        collection = Collection.objects.filter(id=data["id"]).get()
        collection.date = data["date"]

        return JsonResponse(get_older(collection), safe=False)

    except json.JSONDecodeError:
        response = JsonResponse("JSON decoding error was raised.", safe=False)
        response.status_code = 400
        return response

    except ValidationError:
        response = JsonResponse("Received JSON could not be validated.", safe=False)
        response.status_code = 500
        return response

    except Collection.DoesNotExist:
        response = JsonResponse("Collection could not be retrieved.", safe=False)
        response.status_code = 404
        return response

    except Exception as e:
        response = JsonResponse(e, safe=False)
        response.status_code = 500
        return response


def format_records(collection_records: QuerySet):
    """Converts records data into a JSON object

    Args:
        collection_records: The records to be converted into JSON object

    Returns:
        records: JSON object containing all the records

    """
    records = {}

    if (
        type(collection_records) is not QuerySet
        or collection_records.model is not Record
    ):
        return records

    for record in collection_records:
        no_obs = check_no_observation(record)

        records[record.plant.order] = {
            "id": record.id,
            "order": record.plant.order,
            "done": False if record.done is None else record.done,
            "name": record.plant.garden_name,
            "initial-vegetative-growth": record.initial_vegetative_growth,
            "young-leaves-unfolding": record.young_leaves_unfolding,
            "flowers-opening": record.flowers_open,
            "peak-flowering": record.peak_flowering,
            "flowering-intensity": record.flowering_intensity,
            "ripe-fruits": record.ripe_fruits,
            "senescence": record.senescence,
            "senescence-intensity": record.senescence_intensity,
            "covered-artificial": check_maintenance_option(
                record.maintenance, "covered_artificial"
            ),
            "covered-natural": check_maintenance_option(
                record.maintenance, "covered_natural"
            ),
            "cut-partly": check_maintenance_option(record.maintenance, "cut_partly"),
            "cut-total": check_maintenance_option(record.maintenance, "cut_total"),
            "transplanted": check_maintenance_option(
                record.maintenance, "transplanted"
            ),
            "removed": check_maintenance_option(record.maintenance, "removed"),
            "remarks": record.remarks,
            "peak-flowering-estimation": record.peak_flowering_estimation,
            "no-observation": no_obs,
        }

    return records


def check_no_observation(record):
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
        return True
    return False


def check_maintenance_option(maintenance, option):
    if maintenance is None:
        return None
    else:
        return option in maintenance
