from django.contrib import admin

from .models import SpeciesGarden


# Register your models here.
class SpeciesGardenAdmin(admin.ModelAdmin):
    list_display = ("id", "species", "garden_name", "order", "garden_id")
    search_fields = ("species", "garden_name", "garden_id")
    list_per_page = 25


admin.site.register(SpeciesGarden, SpeciesGardenAdmin)
