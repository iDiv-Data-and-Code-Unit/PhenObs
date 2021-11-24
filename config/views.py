from django.shortcuts import redirect, render
from django.utils.timezone import datetime

from phenobs.gardens.models import Garden


def home(request):
    if request.user.is_authenticated:
        garden = Garden.objects.filter(auth_users=request.user).get()
        date = datetime.now().date()

        context = {"garden": garden, "date": date}

        return render(request, "pages/home.html", context)
    else:
        return redirect("accounts/login")
