import json
from datetime import date, datetime

from django.contrib.auth.decorators import login_required
from django.http import HttpRequest, JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from ..gardens.models import Garden
from ..plants.models import Plant
from ..users.models import User
from .models import Collection, Record


@csrf_exempt
@login_required(login_url="/accounts/login/")
def upload(request: HttpRequest) -> JsonResponse:
    """Uploads and edits the collection and its records

    Args:
        request: The received request with metadata

    Returns:
        {}: "OK" if the object was saved correctly

    """
    if request.method == "POST":
        data = json.loads(request.body)
        print(request.body)
        update_collection(data, request.user.username)

        return JsonResponse("OK", safe=False)


@csrf_exempt
def upload_selected(request):
    if request.method == "POST":
        data = json.loads(request.body)

        for collection in data:
            update_collection(collection, request.user.username)

        return JsonResponse("OK", safe=False)


def update_collection(data, username):
    collection_date = datetime.strptime(data["date"], "%Y-%m-%d")
    doy = collection_date.date() - date(collection_date.year, 1, 1)

    collection = Collection(
        id=data["id"],
        garden=Garden.objects.filter(id=data["garden"]).get(),
        date=collection_date.date(),
        doy=doy.days,
        finished=True,
        creator=Collection.objects.filter(id=data["id"]).get().creator,
    )
    collection.save()

    for record in data["records"]:
        if type(record) == str:
            record = data["records"][record]
        timestamp = timezone.now()
        new_record = Record(
            collection=collection,
            id=int(record["id"]),
            plant=Plant.objects.filter(
                order=record["order"],
                garden_id=int(data["garden"]),
            ).get(),
            timestamp_entry=timestamp,
            timestamp_edit=timestamp,
            editor=User.objects.filter(username=username).get(),
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
