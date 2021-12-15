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
        "edit/<int:id>",
        views.edit,
        name="edit",
    ),
    path(
        "get/<int:id>/",
        views.get,
        name="get",
    ),
    path(
        "all_collections/",
        views.get_all_collections,
        name="get_all_collections",
    ),
]
