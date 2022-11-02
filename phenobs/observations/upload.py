import json
from datetime import date, datetime, timedelta
from typing import Dict

from django.contrib.auth.decorators import login_required
from django.http import HttpRequest, JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from jsonschema import validate
from jsonschema.exceptions import ValidationError

from ..gardens.models import Garden
from ..plants.models import Plant
from ..users.models import User
from .models import Collection, Record
from .schemas import collection_schema


@csrf_exempt
@login_required(login_url="/accounts/login/")
def upload(request: HttpRequest) -> JsonResponse:
    """Uploads and edits the collection and its records

    Args:
        request: The received request with metadata

    Returns:
        "OK" if the object was saved correctly

    """
    if request.method == "POST":
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse("Upload failed. JSON decoding error.", safe=False)

        print(request.body)

        return update_collection(data, request.user.username)
    else:
        response = JsonResponse("Method not allowed.", safe=False)
        response.status_code = 405
        return response


@csrf_exempt
def upload_selected(request: HttpRequest) -> JsonResponse:
    """Uploads multiple collections

    Args:
        request: The received request with collection data as json payload

    Returns:
        "OK" if the object was saved correctly

    """
    if request.method == "POST":
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse(
                "Upload failed. JSON decoding error was raised.", status=500, safe=False
            )

        for collection in data:
            response = update_collection(collection, request.user.username)
            if response.status_code != 200:
                return response
        return JsonResponse("OK", safe=False)
    else:
        response = JsonResponse("Method not allowed.", safe=False)
        response.status_code = 405
        return response


def normalize_record(record: Dict) -> Dict:
    """Checks and normalizes record's values

    Args:
        record: Record to be normalized

    Returns:
        record: Normalized and edited record

    """
    if record["no-observation"] is True:
        record["initial-vegetative-growth"] = None
        record["young-leaves-unfolding"] = None
        record["flowers-opening"] = None
        record["peak-flowering"] = None
        record["flowering-intensity"] = None
        record["ripe-fruits"] = None
        record["senescence"] = None
        record["senescence-intensity"] = None
        record["peak-flowering-estimation"] = None

    if (
        len(str(record["flowering-intensity"])) == 0
        or record["flowering-intensity"] is None
        or record["flowers-opening"] != "y"
    ):
        record["flowering-intensity"] = None
    else:
        record["flowering-intensity"] = int(record["flowering-intensity"])

    if (
        len(str(record["senescence-intensity"])) == 0
        or record["senescence-intensity"] is None
        or record["senescence"] != "y"
    ):
        record["senescence-intensity"] = None
    else:
        record["senescence-intensity"] = int(record["senescence-intensity"])

    record["maintenance"] = [
        "cut_partly" if (record["cut-partly"]) else None,
        "cut_total" if (record["cut-total"]) else None,
        "covered_natural" if (record["covered-natural"]) else None,
        "covered_artificial" if (record["covered-artificial"]) else None,
        "transplanted" if (record["transplanted"]) else None,
        "removed" if (record["removed"]) else None,
    ]

    return record


def update_collection(data: Dict, username: str) -> JsonResponse:
    """Edits and updates the collection

    Args:
        data: Sent json data with the necessary collection and record information
        username: Username of the user who uploaded the edited collection

    Returns:
        "OK" if the object was saved correctly

    """
    print(data)
    try:
        try:
            validate(instance=data, schema=collection_schema)
        except ValidationError as e:
            response = JsonResponse(
                "Upload failed for collection. "
                "Received JSON could not be validated. Following message was received: %s"
                % e,
                safe=False,
            )
            response.status_code = 500
            return response

        collection_date = datetime.strptime(data["date"], "%Y-%m-%d")
        doy = collection_date.date() - date(collection_date.year, 1, 1) + timedelta(1)

        collection = Collection.objects.get(id=data["id"])
        collection.garden = Garden.objects.filter(id=data["garden"]).get()
        collection.date = collection_date.date()
        collection.doy = doy.days
        collection.finished = True
        collection.creator = Collection.objects.filter(id=data["id"]).get().creator
        collection.save()

        for record in data["records"]:
            current_record = normalize_record(
                data["records"][record] if type(record) == str else record
            )
            timestamp = timezone.now()
            new_record = Record(
                collection=collection,
                id=int(current_record["id"]),
                plant=Plant.objects.filter(
                    order=int(current_record["order"]),
                    garden_id=int(data["garden"]),
                ).get(),
                timestamp_entry=timestamp,
                timestamp_edit=timestamp,
                editor=User.objects.filter(username=username).get(),
                initial_vegetative_growth=current_record["initial-vegetative-growth"],
                young_leaves_unfolding=current_record["young-leaves-unfolding"],
                flowers_open=current_record["flowers-opening"],
                peak_flowering=current_record["peak-flowering"],
                flowering_intensity=current_record["flowering-intensity"],
                ripe_fruits=current_record["ripe-fruits"],
                senescence=current_record["senescence"],
                senescence_intensity=current_record["senescence-intensity"],
                maintenance=current_record["maintenance"],
                remarks=current_record["remarks"],
                peak_flowering_estimation=current_record["peak-flowering-estimation"],
                done=current_record["done"],
            )

            new_record.save()

    except ValueError as e:
        response = JsonResponse(
            "Upload failed for collection with ID: %s. "
            "Received the following error:\n%s" % (data["id"], e),
            safe=False,
        )
        response.status_code = 500
        return response
    except Collection.DoesNotExist:
        response = JsonResponse(
            "Upload failed for collection with ID: %s. "
            "Collection could not be retrieved from database." % data["id"],
            safe=False,
        )
        response.status_code = 404
        return response
    except Garden.DoesNotExist:
        response = JsonResponse(
            "Upload failed for collection with ID: %s. "
            "Garden with the ID=%s could not be retrieved from database."
            % (data["id"], data["garden"]),
            safe=False,
        )
        response.status_code = 404
        return response
    except Record.DoesNotExist as e:
        response = JsonResponse(
            "Upload failed for collection with ID: %s. "
            "Error occurred while retrieving a record:\n%s" % (data["id"], e),
            safe=False,
        )
        response.status_code = 404
        return response
    except Plant.DoesNotExist as e:
        response = JsonResponse(
            "Upload failed for collection with ID: %s. "
            "Error occurred while retrieving the plant for a record:\n%s"
            % (data["id"], e),
            safe=False,
        )
        response.status_code = 404
        return response
    except Exception as e:
        response = JsonResponse(
            "Upload failed for the collection."
            "Following error message was received:\n%s" % e,
            safe=False,
        )
        response.status_code = 500
        return response

    return JsonResponse("OK", safe=False)
