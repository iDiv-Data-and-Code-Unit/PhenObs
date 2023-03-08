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
        "overview/",
        views.overview,
        name="overview",
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
        "garden_collections/",
        get.get_all_collections,
        name="get_all_collections",
    ),
    path(
        "last/",
        get.last,
        name="last",
    ),
    path(
        "collections/<str:id>/",
        get.get_collections,
        name="get_collections",
    ),
    path(
        "edit_collection/<int:id>/",
        get.edit_collection_content,
        name="edit_collection_content",
    ),
    path(
        "view_collection/<int:id>/",
        get.view_collection_content,
        name="view_collection_content",
    ),
    path("download/<str:filetype>/", download.download, name="download"),
    path("save/", upload.upload_selected, name="save"),
]
