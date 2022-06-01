from datetime import date, timedelta

from django.contrib.auth.decorators import login_required
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import render
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from ..gardens.models import Garden
from ..plants.models import Plant
from ..users.models import User
from .get import get
from .models import Collection, Record


@login_required(login_url="/accounts/login/")
def all(request: HttpRequest) -> HttpResponse:
    """The page showing all local and online collections

    Args:
        request: The received request with metadata

    Returns:
        context: Empty context object for the front-end

    """
    garden = Garden.objects.filter(auth_users=request.user).get()
    context = {"garden": garden}
    return render(request, "observations/observations.html", context)


@login_required(login_url="/accounts/login/")
def overview(request: HttpRequest) -> HttpResponse:
    """The page showing all local and online collections

    Args:
        request: The received request with metadata

    Returns:
        context: Empty context object for the front-end

    """
    context = {"gardens": []}

    is_admin = False

    if request.user.groups.filter(name="Admins").exists():
        is_admin = True

    if is_admin:
        gardens = Garden.objects.filter(main_garden=None).all()
    else:
        subgarden = Garden.objects.filter(auth_users=request.user).get()
        gardens = [subgarden.main_garden]

    for garden in gardens:
        garden_dict = {"name": garden.name, "id": garden.id, "subgardens": []}
        subgardens = Garden.objects.filter(main_garden=garden).all()
        for sub in subgardens:
            subgarden_dict = {"name": sub.name, "id": sub.id}

            garden_dict["subgardens"].append(subgarden_dict)
        context["gardens"].append(garden_dict)

    return render(request, "observations/overview.html", context)


@login_required(login_url="/accounts/login/")
def add(request: HttpRequest) -> HttpResponse:
    """The page for adding a new collection

    Args:
        request: The received request with metadata

    Returns:
        context: JSON object consisting of all the necessary IDs and
                 labels for JS functions to fill in with data received

    """
    garden = Garden.objects.filter(auth_users=request.user).get()
    subgardens = Garden.objects.filter(main_garden=garden.main_garden).all()
    context = {
        "garden": garden,
        "subgardens": subgardens,
        "range": range(5, 105, 5),  # The intensity values from 5 to 100 (steps of 5)
        "ids": [
            {"id": "initial-vegetative-growth", "label": "Initial vegetative growth"},
            {"id": "young-leaves-unfolding", "label": "Young leaves unfolding"},
            {"id": "flowers-opening", "label": "Flowers opening"},
            {"id": "peak-flowering", "label": "Peak flowering"},
            {"id": "peak-flowering-estimation", "label": "Peak flowering estimation"},
            {"id": "flowering-intensity", "label": "Flowering intensity"},
            {"id": "ripe-fruits", "label": "Ripe fruits"},
            {"id": "senescence", "label": "Senescence"},
            {"id": "senescence-intensity", "label": "Senescence intensity"},
        ],
    }

    return render(request, "observations/add_observation.html", context)


@csrf_exempt
@login_required(login_url="/accounts/login/")
def new(request: HttpRequest, garden_id: int) -> JsonResponse:
    """Creates a new entry in the DB and returns data

    Args:
        request: The received request with metadata

    Returns:
        {}: A JSON object containing new collection and related records' data

    """
    if request.method == "POST":
        today = timezone.now()
        doy = today.date() - date(today.date().year, 1, 1) + timedelta(days=1)
        # garden = Garden.objects.filter(auth_users=request.user).get()
        garden = Garden.objects.filter(id=garden_id).get()
        creator = User.objects.filter(id=request.user.id).get()
        all_plants = (
            Plant.objects.order_by("order").filter(garden=garden, active=True).all()
        )

        collection = Collection(
            garden=garden,
            date=today.date(),
            doy=doy.days,
            creator=creator,
            finished=False,
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


@login_required(login_url="/accounts/login/")
def edit(request: HttpRequest, id: int) -> HttpResponse:
    """Edit page where the collection is received to be modified

    Args:
        request: The received request with metadata
        id: Collection ID

    Returns:
        context: JSON object consisting of all the necessary IDs and
                 labels for JS functions to fill in with data received

    """
    garden = Garden.objects.filter(auth_users=request.user).get()
    context = {
        "garden": garden,
        "id": id,
        "range": range(5, 105, 5),
        "ids": [
            {"id": "initial-vegetative-growth", "label": "Initial vegetative growth"},
            {"id": "young-leaves-unfolding", "label": "Young leaves unfolding"},
            {"id": "flowers-opening", "label": "Flowers opening"},
            {"id": "peak-flowering", "label": "Peak flowering"},
            {"id": "peak-flowering-estimation", "label": "Peak flowering estimation"},
            {"id": "flowering-intensity", "label": "Flowering intensity"},
            {"id": "ripe-fruits", "label": "Ripe fruits"},
            {"id": "senescence", "label": "Senescence"},
            {"id": "senescence-intensity", "label": "Senescence intensity"},
        ],
    }

    return render(request, "observations/edit_observation.html", context)
