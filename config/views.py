from django.contrib.auth.decorators import login_required
from django.http import HttpRequest, HttpResponse
from django.shortcuts import render
from django.utils.timezone import datetime

from phenobs.gardens.models import Garden


@login_required(login_url="/accounts/login/")
def home(request: HttpRequest) -> HttpResponse:
    """Home page showing garden, date and user information

    Args:
        request: The received request with metadata

    Returns:
        context: JSON object consisting of the garden and date details

    """
    try:
        garden = Garden.objects.get(auth_users=request.user)
        date = datetime.now().date()

        context = {"garden": garden, "date": date}

        return render(request, "pages/home.html", context)

    except Garden.DoesNotExist:
        context = {
            "exception": Exception(
                "No subgarden has been assigned to the user. Please assign user to a subgarden."
            ),
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
