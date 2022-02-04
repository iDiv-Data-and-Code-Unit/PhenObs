from django.shortcuts import redirect, render
from django.utils.timezone import datetime
from django.contrib.auth.decorators import login_required
from django.http import HttpRequest, HttpResponse

from phenobs.gardens.models import Garden


@login_required(login_url='/accounts/login/')
def home(request: HttpRequest) -> HttpResponse:
    """Home page showing garden, date and user information

    Args:
        request: The received request with metadata

    Returns:
        context: JSON object consisting of the garden and date details

    """
    garden = Garden.objects.filter(auth_users=request.user).get()
    date = datetime.now().date()

    context = {"garden": garden, "date": date}

    return render(request, "pages/home.html", context)
