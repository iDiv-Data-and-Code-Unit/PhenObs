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
    path(
        "new/",
        views.new,
        name="new",
    ),
    path(
        "upload/",
        views.upload,
        name="upload",
    ),
    path(
        "edit/<int:collection_id>/",
        views.edit,
        name="edit",
    ),
]
