from django.urls import path
from django.views.generic import TemplateView

app_name = "observations"

urlpatterns = [
    path(
        "",
        TemplateView.as_view(template_name="observations/observations.html"),
        name="all",
    ),
    path(
        "add/",
        TemplateView.as_view(template_name="observations/add_collection.html"),
        name="add",
    ),
]
