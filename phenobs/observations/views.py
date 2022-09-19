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

    try:
        garden = Garden.objects.filter(auth_users=request.user).get()
        if garden.is_subgarden():
            context = {"garden": garden}
        else:
            context = {
                "exception": Exception(
                    "User has been assigned to a main garden.\n"
                    "Please get unassigned from the garden '%s' and "
                    "get assigned to a subgarden." % garden.name
                )
            }

            return render(request, "error.html", context, status=400)

        return render(request, "observations/observations.html", context)

    except Garden.DoesNotExist:
        context = {
            "exception": Exception(
                "No subgarden has been assigned to the user. Please assign user to a subgarden."
            )
        }

        return render(request, "error.html", context, status=404)

    except Garden.MultipleObjectsReturned:
        gardens = Garden.objects.filter(auth_users=request.user)

        context = {
            "exception": Exception(
                "Multiple gardens are assigned to the user. Please assign only one subgarden per user. "
                "Assigned gardens are: %s"
                % str([garden.name for garden in gardens])[1:-1]
            )
        }

        return render(request, "error.html", context, status=409)

    except Exception as e:
        context = {"exception": e}
        return render(request, "error.html", context, status=500)


@login_required(login_url="/accounts/login/")
def overview(request: HttpRequest) -> HttpResponse:
    """The page showing all local and online collections

    Args:
        request: The received request with metadata

    Returns:
        context: Empty context object for the front-end

    """
    try:
        context = {"gardens": []}

        is_admin = False

        if request.user.groups.filter(name="Admins").exists():
            is_admin = True

        if is_admin:
            gardens = Garden.objects.filter(main_garden=None).all()
            # Check if the next line raises any error
            Garden.objects.get(auth_users=request.user)
        else:
            try:
                subgarden = Garden.objects.get(auth_users=request.user)
                if subgarden.is_subgarden():
                    gardens = [subgarden.main_garden]
                else:
                    context = {
                        "exception": Exception(
                            "User has been assigned to a main garden.\n"
                            "Please get unassigned from the garden '%s' and "
                            "get assigned to a subgarden." % subgarden.name
                        )
                    }

                    return render(request, "error.html", context, status=400)
            except Garden.MultipleObjectsReturned:
                gardens = Garden.objects.filter(auth_users=request.user)

                context = {
                    "exception": Exception(
                        "Multiple gardens are assigned to the user. Please assign only one subgarden per user. "
                        "Assigned gardens are: %s"
                        % str([garden.name for garden in gardens])[1:-1]
                    )
                }

                return render(request, "error.html", context, status=409)

        for garden in gardens:
            garden_dict = {"name": garden.name, "id": garden.id, "subgardens": []}
            subgardens = Garden.objects.filter(main_garden=garden).all()
            for sub in subgardens:
                subgarden_dict = {"name": sub.name, "id": sub.id}

                garden_dict["subgardens"].append(subgarden_dict)
            context["gardens"].append(garden_dict)

        return render(request, "observations/overview.html", context)

    except Garden.DoesNotExist:
        context = {
            "exception": Exception(
                "No subgarden has been assigned to the user. Please assign user to a subgarden."
            )
        }

        return render(request, "error.html", context, status=404)

    except Garden.MultipleObjectsReturned:
        gardens = Garden.objects.filter(auth_users=request.user)

        context = {
            "exception": Exception(
                "Multiple gardens are assigned to the user. Please assign only one subgarden per user. "
                "Assigned gardens are: %s"
                % str([garden.name for garden in gardens])[1:-1]
            )
        }

        return render(request, "error.html", context, status=409)

    except Exception as e:
        context = {"exception": e}
        return render(request, "error.html", context, status=500)


@login_required(login_url="/accounts/login/")
def add(request: HttpRequest) -> HttpResponse:
    """The page for adding a new collection

    Args:
        request: The received request with metadata

    Returns:
        context: JSON object consisting of all the necessary IDs and
                 labels for JS functions to fill in with data received

    """
    try:
        garden = Garden.objects.filter(auth_users=request.user).get()

        if garden.is_subgarden():
            subgardens = Garden.objects.filter(main_garden=garden.main_garden).all()
        else:
            context = {
                "exception": Exception(
                    "User has been assigned to a main garden.\n"
                    "Please get unassigned from the garden '%s' and "
                    "get assigned to a subgarden." % garden.name
                )
            }

            return render(request, "error.html", context, status=400)

        context = {
            "garden": garden,
            "subgardens": subgardens,
            "range": range(
                5, 105, 5
            ),  # The intensity values from 5 to 100 (steps of 5)
            "ids": [
                {
                    "id": "initial-vegetative-growth",
                    "label": "Initial vegetative growth",
                },
                {"id": "young-leaves-unfolding", "label": "Young leaves unfolding"},
                {"id": "flowers-opening", "label": "Flowers opening"},
                {"id": "peak-flowering", "label": "Peak flowering"},
                # {
                #     "id": "peak-flowering-estimation",
                #     "label": "Peak flowering estimation",
                # },
                {"id": "flowering-intensity", "label": "Flowering intensity"},
                {"id": "ripe-fruits", "label": "Ripe fruits"},
                {"id": "senescence", "label": "Senescence"},
                {"id": "senescence-intensity", "label": "Senescence intensity"},
            ],
        }

        return render(request, "observations/add_observation.html", context)

    except Garden.DoesNotExist:
        context = {
            "exception": Exception(
                "No subgarden has been assigned to the user. Please assign user to a subgarden."
            )
        }
        return render(request, "error.html", context, status=404)

    except Garden.MultipleObjectsReturned:
        gardens = Garden.objects.filter(auth_users=request.user)

        context = {
            "exception": Exception(
                "Multiple gardens are assigned to the user. Please assign only one subgarden per user. "
                "Assigned gardens are: %s"
                % str([garden.name for garden in gardens])[1:-1]
            )
        }

        return render(request, "error.html", context, status=409)

    except Exception as e:
        context = {"exception": e}
        return render(request, "error.html", context, status=500)


@csrf_exempt
@login_required(login_url="/accounts/login/")
def new(request: HttpRequest, garden_id: int) -> JsonResponse:
    """Creates a new entry in the DB and returns data

    Args:
        request: The received request with metadata
        garden_id: ID of the subgarden new collection will be made for

    Returns:
        {}: A JSON object containing new collection and related records' data

    """
    if request.method == "POST":
        today = timezone.now()
        doy = today.date() - date(today.date().year, 1, 1) + timedelta(days=1)

        is_admin = False

        if request.user.groups.filter(name="Admins").exists():
            is_admin = True

        try:
            garden = Garden.objects.filter(id=garden_id).get()
            creator = User.objects.filter(id=request.user.id).get()

            if garden.is_subgarden() is False:
                response = JsonResponse(
                    "You have been assigned to a main garden, instead of a subgarden. "
                    "Please, get unassigned from the garden '%s' and get assigned to a "
                    "subgarden." % garden.name,
                    safe=False,
                )
                response.status_code = 400
                return response

            if not is_admin and not check_garden_auth_user(creator, garden):
                response = JsonResponse(
                    "You do not have permission to create collections for this garden.",
                    safe=False,
                )
                response.status_code = 404
                return response

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

        except Garden.DoesNotExist:
            response = JsonResponse(
                "No subgarden has been assigned to the user.", safe=False
            )
            response.status_code = 404
            return response

        except Garden.MultipleObjectsReturned:
            gardens = Garden.objects.filter(auth_users=request.user)

            response = JsonResponse(
                "Multiple gardens are assigned to the user. Please assign only one subgarden per user. "
                "Assigned gardens are: %s"
                % str([garden.name for garden in gardens])[1:-1],
                safe=False,
            )
            response.status_code = 409
            return response

        except User.DoesNotExist:
            response = JsonResponse(
                "User could not be retrieved from database.", safe=False
            )
            response.status_code = 404
            return response

        except Exception as e:
            response = JsonResponse(e, safe=False)
            response.status_code = 500
            return response
    else:
        response = JsonResponse("Method not allowed.", safe=False)
        response.status_code = 405
        return response


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
    try:
        garden = Garden.objects.filter(auth_users=request.user).get()

        try:
            collection = Collection.objects.get(id=id)
            if collection.garden.main_garden != garden.main_garden:
                context = {
                    "exception": Exception(
                        "You don't have access to edit this collection. "
                    )
                }
                return render(request, "error.html", context, status=404)
        except Collection.DoesNotExist:
            context = {
                "exception": Exception(
                    "Collection was not found in database. "
                    "Please delete the collection from your device, if available."
                )
            }
            return render(request, "error.html", context, status=404)

        context = {
            "garden": garden,
            "id": id,
            "range": range(5, 105, 5),
            "ids": [
                {
                    "id": "initial-vegetative-growth",
                    "label": "Initial vegetative growth",
                },
                {"id": "young-leaves-unfolding", "label": "Young leaves unfolding"},
                {"id": "flowers-opening", "label": "Flowers opening"},
                {"id": "peak-flowering", "label": "Peak flowering"},
                # {
                #     "id": "peak-flowering-estimation",
                #     "label": "Peak flowering estimation",
                # },
                {"id": "flowering-intensity", "label": "Flowering intensity"},
                {"id": "ripe-fruits", "label": "Ripe fruits"},
                {"id": "senescence", "label": "Senescence"},
                {"id": "senescence-intensity", "label": "Senescence intensity"},
            ],
        }

        return render(request, "observations/edit_observation.html", context)

    except Garden.DoesNotExist:
        context = {
            "exception": Exception(
                "No subgarden has been assigned to the user. Please assign user to a subgarden."
            )
        }
        return render(request, "error.html", context, status=404)

    except Garden.MultipleObjectsReturned:
        gardens = Garden.objects.filter(auth_users=request.user)

        context = {
            "exception": Exception(
                "Multiple gardens are assigned to the user. Please assign only one subgarden per user. "
                "Assigned gardens are: %s"
                % str([garden.name for garden in gardens])[1:-1]
            )
        }

        return render(request, "error.html", context, status=409)

    except Exception as e:
        context = {"exception": e}
        return render(request, "error.html", context, status=500)


def check_garden_auth_user(user, garden):
    if garden.auth_users.filter(pk=user.pk).exists():
        return True

    try:
        users_garden = Garden.objects.filter(auth_users=user).get()
        if users_garden.main_garden == garden.main_garden:
            return True

    except Garden.DoesNotExist:
        return False

    except Garden.MultipleObjectsReturned:
        return False
