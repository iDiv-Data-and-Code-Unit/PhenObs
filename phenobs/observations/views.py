from django.shortcuts import render


# Create your views here.
def all(request):
    return render(request, "observations/observations.html")


def add(request):
    return render(request, "observations/add_collection.html")
