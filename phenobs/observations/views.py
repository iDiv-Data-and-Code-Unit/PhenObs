import json
from datetime import date, datetime, timedelta

from django.http import HttpResponseRedirect, JsonResponse, HttpRequest, HttpResponse
from django.shortcuts import render
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.db.models.query import QuerySet

from ..gardens.models import Garden
from ..plants.models import Plant
from ..users.models import User
from .models import Collection, Record


@csrf_exempt
@login_required(login_url='/accounts/login/')
def get_all_collections(request: HttpRequest) -> JsonResponse:
    """Fetches all the collections from database for the given garden

    Args:
        request: The received request with metadata

    Returns:
        collections_json: JSON object consisting of all the received collections

    """
    garden = Garden.objects.filter(auth_users=request.user).get()
    collections = Collection.objects.filter(garden=garden).order_by("date").all()
    collections_json = []

    for collection in collections:
        finished, records = format_records(Record.objects.filter(collection=collection).all())

        prev_collection = Collection.objects.filter(
            date__lt=collection.date, garden=garden, finished=True
        ).last()

        collections_json.append(
            {
                "id": collection.id,
                "date": collection.date,
                "creator": collection.creator.username,
                "finished": finished,
                "records": records,
                "garden": collection.garden.name,
                "last-collection-id": prev_collection.id
                if (prev_collection is not None)
                else None
            }
        )
    return JsonResponse(collections_json, safe=False)


@login_required(login_url='/accounts/login/')
def all(request: HttpRequest) -> HttpResponse:
    """The page showing all local and online collections

    Args:
        request: The received request with metadata

    Returns:
        context: Empty context object for the front-end

    """
    context = {}
    return render(request, "observations/observations.html", context)
   

@login_required(login_url='/accounts/login/')
def add(request: HttpRequest) -> HttpResponse:
    """The page for adding a new collection

    Args:
        request: The received request with metadata

    Returns:
        context: JSON object consisting of all the necessary IDs and labels for JS functions to fill in with data received

    """

    context = {}

    # The intensity values from 5 to 100 (steps of 5)
    context["range"] = range(5, 105, 5)
    
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


@csrf_exempt
@login_required(login_url='/accounts/login/')
def new(request: HttpRequest) -> JsonResponse:
    """Creates a new entry in the DB and returns data

    Args:
        request: The received request with metadata

    Returns:
        {}: A JSON object containing new collection and related records' data 

    """
    if request.method == "POST":
        today = timezone.now()
        doy = today.date() - date(today.date().year, 1, 1) + timedelta(days=1)
        garden = Garden.objects.filter(auth_users=request.user).get()
        creator = User.objects.filter(id=request.user.id).get()
        all_plants = (
            Plant.objects.order_by("order").filter(garden=garden, active=True).all()
        )

        collection = Collection(
            garden=garden, date=today.date(), doy=doy.days, creator=creator, finished=False
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

        return get(request, collection.id)
    return JsonResponse("ERROR", safe=False)


@csrf_exempt
@login_required(login_url='/accounts/login/')
def upload(request: HttpRequest) -> JsonResponse:
    """Uploads and edits the collection and its records

    Args:
        request: The received request with metadata

    Returns:
        {}: "OK" if the object was saved correctly

    """
    if request.method == "POST":
        data = json.loads(request.body)
        collection_date = datetime.strptime(data["date"], "%Y-%m-%d")
        doy = collection_date.date() - date(collection_date.year, 1, 1)

        collection = Collection(
            id=data["id"],
            garden=Garden.objects.filter(auth_users=request.user).get(),
            date=collection_date.date(),
            doy=doy.days,
            creator=User.objects.filter(username=data["creator"]).get(),
            finished=True
        )
        collection.save()

        for key in data["records"]:
            record = data["records"][key]
            timestamp = timezone.now()
            new_record = Record(
                collection=collection,
                id=record["id"],
                plant=Plant.objects.filter(
                    order=record["order"],
                    garden_id=Garden.objects.filter(name=data["garden"]).get().id,
                ).get(),
                timestamp_entry=timestamp,
                timestamp_edit=timestamp,
                editor=User.objects.filter(username=request.user.username).get(),
                initial_vegetative_growth=record["initial-vegetative-growth"]
                if (record["no-observation"] is False)
                else None,
                young_leaves_unfolding=record["young-leaves-unfolding"]
                if (record["no-observation"] is False)
                else None,
                flowers_open=record["flowers-opening"]
                if (record["no-observation"] is False)
                else None,
                peak_flowering=record["peak-flowering"]
                if (record["no-observation"] is False)
                else None,
                flowering_intensity=None
                if (
                    len(str(record["flowering-intensity"])) == 0
                    or record["flowering-intensity"] is None
                    or record["flowers-opening"] != "y"
                )
                else int(record["flowering-intensity"]),
                ripe_fruits=record["ripe-fruits"]
                if (record["no-observation"] is False)
                else None,
                senescence=record["senescence"]
                if (record["no-observation"] is False)
                else None,
                senescence_intensity=None
                if (
                    len(str(record["senescence-intensity"])) == 0
                    or record["senescence-intensity"] is None
                    or record["senescence"] != "y"
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
                peak_flowering_estimation=record["peak-flowering-estimation"]
                if (record["no-observation"] is False)
                else None,
                done=record["done"],
            )

            new_record.save()

        return JsonResponse("OK", safe=False)


def format_records(collection_records: QuerySet) -> tuple:
    """Converts records data into a JSON object

    Args:
        collection_records: The records to be converted into JSON object

    Returns:
        finished: True if all the records are marked "done", False otherwise
        records: JSON object containing all the records

    """
    records = {}
    finished = True
    for record in collection_records:
        no_obs = False
        if (record.initial_vegetative_growth is None and
            record.young_leaves_unfolding is None and
            record.flowers_open is None and
            record.peak_flowering is None and
            record.ripe_fruits is None and
            record.senescence is None and
            record.peak_flowering_estimation is None and
            len(record.remarks) > 0):
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
            "no-observation": no_obs
        }

        if (record.done is None or record.done is False):
            finished = False

    return finished, records

@login_required(login_url='/accounts/login/')
def edit(request: HttpRequest, id: int) -> HttpResponse:
    """Edit page where the collection is received to be modified

    Args:
        request: The received request with metadata
        id: Collection ID

    Returns:
        context: JSON object consisting of all the necessary IDs and labels for JS functions to fill in with data received

    """
    context = {}

    context["id"] = id

    # The intensity values from 5 to 100 (steps of 5)
    context["range"] = range(5, 105, 5)

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
    

@login_required(login_url='/accounts/login/')
def get(request: HttpRequest, id: int) -> JsonResponse:
    """Fetches the collections from database with the given ID

    Args:
        request: The received request with metadata
        id: Collection ID

    Returns:
        {}: A JSON object containing the collection and related records' data 

    """
    garden = Garden.objects.filter(auth_users=request.user).get()
    collection = Collection.objects.filter(id=id).get()
    collection_records = Record.objects.filter(collection=collection).all()

    prev_collection_db = (
        Collection.objects.filter(date__lt=collection.date, garden=garden, finished=True)
        .exclude(id=id)
        .order_by("date")
        .last()
    )

    prev_collection_json = None

    if prev_collection_db is not None:
        prev_records_db = Record.objects.filter(collection=prev_collection_db).all()
        prev_finished, prev_records_json = format_records(prev_records_db)
        prev_collection_json = {
            "id": prev_collection_db.id,
            "creator": prev_collection_db.creator.username,
            "garden": prev_collection_db.garden.name,
            "date": prev_collection_db.date,
            "records": prev_records_json,
            "uploaded": True,
            "finished": prev_finished
        }

    finished, records = format_records(collection_records)

    return JsonResponse(
        {
            "id": collection.id,
            "date": collection.date,
            "creator": collection.creator.username,
            "garden": garden.name,
            "records": records,
            "last-collection": prev_collection_json,
            "finished": finished
        }
    )
