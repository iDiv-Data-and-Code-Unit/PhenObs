from django.contrib import admin
from django.urls import path

from .models import Collection, Record
from .upload_csv import import_from_csv


@admin.register(Collection)
class CollectionAdmin(admin.ModelAdmin):
    """Registers Collection model in Django Admin with the given configuration."""

    list_display = ("id", "garden", "date", "creator", "finished")
    list_display_links = ("id", "date")
    search_fields = ("id", "garden__name", "garden__main_garden__name", "creator__username")
    list_per_page = 10


@admin.register(Record)
class RecordAdmin(admin.ModelAdmin):
    """Registers Record model in Django Admin with the given configuration."""

    list_display = (
        "id",
        "collection",
        "timestamp_edit",
        "editor",
        "remarks",
        "done",
    )
    list_display_links = ("id", "collection", "timestamp_edit")
    search_fields = (
        "id", "collection__garden__name", "collection__garden__main_garden__name", "editor__username", "maintenance",
        "remarks", "plant__garden_name")
    list_per_page = 10

    def get_urls(self):
        urls = super().get_urls()
        new_urls = [
            path("upload-csv/", self.upload_csv),
        ]
        return new_urls + urls

    def upload_csv(self, request):
        return import_from_csv(request)
