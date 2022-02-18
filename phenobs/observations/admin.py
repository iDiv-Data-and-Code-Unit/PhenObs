from django.contrib import admin

from .models import Collection, Record


@admin.register(Collection)
class CollectionAdmin(admin.ModelAdmin):
    """Registers Collection model in Django Admin with the given configuration."""

    list_display = ("id", "garden", "date", "creator", "finished")
    list_display_links = ("id", "date")
    search_fields = ("id", "garden", "user")
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
    search_fields = ("id", "collection", "editor", "maintenance", "remarks", "done")
    list_per_page = 10
