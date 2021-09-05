from django.contrib import admin

from .models import Plant


@admin.register(Plant)
class PlantAdmin(admin.ModelAdmin):
    list_display = ("id", "garden", "species", "garden_name", "order", "active")
    search_fields = ("id", "garden", "species", "garden_name", "order", "active")
    list_per_page = 10
