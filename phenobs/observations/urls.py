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
        "edit/<str:collection_type>-<int:collection_id>",
        views.edit,
        name="edit",
    ),
    path(
        "get/<int:collection_id>/",
        views.get,
        name="get",
    ),
]
