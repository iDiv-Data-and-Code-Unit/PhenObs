from django.contrib import admin

from .models import Collection, Record


@admin.register(Collection)
class CollectionAdmin(admin.ModelAdmin):
    """Registers Collection model in Django Admin with the given configuration."""

    list_display = ("id", "garden", "timestamp", "creator")
    search_fields = ("id", "garden", "user")
    list_per_page = 10


@admin.register(Record)
class RecordAdmin(admin.ModelAdmin):
    """Registers Record model in Django Admin with the given configuration."""

    list_display = (
        "id",
        "collection",
        "timestamp_entry",
        "timestamp_edit",
        "editor",
        "maintenance",
        "remarks",
        "done",
    )
    search_fields = ("id", "collection", "editor", "maintenance", "remarks", "done")
    list_per_page = 10
