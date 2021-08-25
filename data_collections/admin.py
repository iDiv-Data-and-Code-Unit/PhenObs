from django.contrib import admin

from .models import DataCollection


class DataCollectionAdmin(admin.ModelAdmin):
    list_display = ("id", "date", "species", "garden_id", "collector_id")
    search_fields = ("id", "date", "species", "garden_id", "collector_id")
    list_per_page = 25


admin.site.register(DataCollection, DataCollectionAdmin)
