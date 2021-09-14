from django.contrib import admin

from .models import Plant


@admin.register(Plant)
class PlantAdmin(admin.ModelAdmin):
    """Registers Plant model in Django Admin with the given configuration"""

    list_display = ("id", "garden", "order", "species", "garden_name", "active")
    list_display_links = ("id", "garden_name", "species")
    search_fields = ("id", "garden", "species", "garden_name", "order", "active")
    list_per_page = 10
