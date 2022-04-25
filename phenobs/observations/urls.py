from django.urls import path

from . import download, get, upload, views

app_name = "observations"

urlpatterns = [
    path(
        "",
        views.all,
        name="all",
    ),
    path(
        "advanced/",
        views.advanced,
        name="advanced",
    ),
    path(
        "add/",
        views.add,
        name="add",
    ),
    path(
        "new/<int:garden_id>",
        views.new,
        name="new",
    ),
    path(
        "upload/",
        upload.upload,
        name="upload",
    ),
    path(
        "edit/<int:id>",
        views.edit,
        name="edit",
    ),
    path(
        "get/<int:id>/",
        get.get,
        name="get",
    ),
    path(
        "all_collections/",
        get.get_all_collections,
        name="get_all_collections",
    ),
    path(
        "last/",
        get.last,
        name="last",
    ),
    path(
        "collections_table/<str:id>",
        get.get_collections,
        name="get_collections",
    ),
    path("download/<str:filetype>/<str:ids>", download.download, name="download"),
    path("save/", upload.upload_selected, name="save"),
]
