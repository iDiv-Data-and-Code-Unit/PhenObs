from django.shortcuts import redirect, render
from django.utils.timezone import datetime
from django.contrib.auth.decorators import login_required

from phenobs.gardens.models import Garden


@login_required(login_url='/accounts/login/')
def home(request):
    if request.user.is_authenticated:
        garden = Garden.objects.filter(auth_users=request.user).get()
        date = datetime.now().date()

        context = {"garden": garden, "date": date}

        return render(request, "pages/home.html", context)

# def index(request):
#     if request.user.is_authenticated:
#         return redirect("/phenobs/home")
#     else:
#         return redirect("/phenobs/accounts/login")
