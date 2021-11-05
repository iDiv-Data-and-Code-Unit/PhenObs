from django.urls import path

from . import views

app_name = "observations"

urlpatterns = [
    path(
        "",
        views.all,
        name="all",
    ),
    path(
        "add/",
        views.add,
        name="add",
    ),
    path("add/<int:order>/", views.add_observation, name="add_observation"),
]
