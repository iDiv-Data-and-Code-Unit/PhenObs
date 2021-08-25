from django.contrib import admin

from .models import DataRecord


class DataRecordAdmin(admin.ModelAdmin):
    list_display = ("id", "collection_id", "maintenance", "remarks")
    search_fields = ("collection_id",)
    list_per_page = 25


admin.site.register(DataRecord, DataRecordAdmin)
