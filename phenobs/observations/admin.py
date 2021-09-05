from django.contrib import admin

from .models import DataCollection, DataRecord


@admin.register(DataCollection)
class DataCollectionAdmin(admin.ModelAdmin):
    list_display = ("id", "garden", "timestamp", "user")
    search_fields = ("id", "garden", "user")
    list_per_page = 10


@admin.register(DataRecord)
class DataRecordAdmin(admin.ModelAdmin):
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
