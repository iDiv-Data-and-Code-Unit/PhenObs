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
            "exception_title": "No subgarden assigned",
            "exception": Exception(
                "No subgarden has been assigned to the user. Please assign user to a subgarden."
            ),
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
