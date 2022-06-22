import json
from datetime import date, datetime, timedelta

from django.contrib.auth.decorators import login_required
from django.http import Http404, HttpRequest, JsonResponse
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
        {}: "OK" if the object was saved correctly

    """
    if request.method == "POST":
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse("Upload failed. JSON decoding error.", safe=False)

        print(request.body)

        try:
            update_collection(data, request.user.username)
        except ValidationError:
            return JsonResponse(
                "Upload failed. Received JSON could not be validated against schema."
            )
        except ValueError as e:
            return JsonResponse("Upload failed. Received the following error:\n%s" % e)
        except Collection.DoesNotExist:
            return JsonResponse(
                "Upload failed. Collection could not be retrieved from database."
            )
        except Garden.DoesNotExist:
            return JsonResponse(
                "Upload failed. Garden could not be retrieved from database."
            )
        except Record.DoesNotExist as e:
            return JsonResponse(
                "Upload failed. Error occurred while retrieving a record:\n%s" % e
            )
        except Plant.DoesNotExist as e:
            return JsonResponse(
                "Upload failed. Error occurred while retrieving the plant for a record:\n%s"
                % e
            )
        except Exception as e:
            return JsonResponse(
                "Upload failed. Following error message was received:\n%s" % e
            )

        return JsonResponse("OK", safe=False)
    else:
        raise Http404()


@csrf_exempt
def upload_selected(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse(
                "Upload failed. JSON decoding error was raised.", safe=False
            )

        for collection in data:
            try:
                update_collection(collection, request.user.username)
            except ValidationError:
                return JsonResponse(
                    "Upload failed for collection with ID: %s. "
                    "Received JSON could not be validated." % collection["id"]
                )
            except ValueError as e:
                return JsonResponse(
                    "Upload failed for collection with ID: %s. "
                    "Received the following error:\n%s" % (collection["id"], e)
                )
            except Collection.DoesNotExist:
                return JsonResponse(
                    "Upload failed for collection with ID: %s. "
                    "Collection could not be retrieved from database."
                    % collection["id"]
                )
            except Garden.DoesNotExist:
                return JsonResponse(
                    "Upload failed for collection with ID: %s. "
                    "Garden with the ID=%s could not be retrieved from database."
                    % (collection["id"], collection["garden"])
                )
            except Record.DoesNotExist as e:
                return JsonResponse(
                    "Upload failed for collection with ID: %s. "
                    "Error occurred while retrieving a record:\n%s"
                    % (collection["id"], e)
                )
            except Plant.DoesNotExist as e:
                return JsonResponse(
                    "Upload failed for collection with ID: %s. "
                    "rror occurred while retrieving the plant for a record:\n%s"
                    % (collection["id"], e)
                )
            except Exception as e:
                return JsonResponse(
                    "Upload failed for collection with ID: %s. "
                    "Following error message was received:\n%s" % (collection["id"], e)
                )

        return JsonResponse("OK", safe=False)
    else:
        raise Http404()


def normalize_record(record):
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


def update_collection(data, username):
    validate(instance=data, schema=collection_schema)

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
