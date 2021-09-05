from django.contrib import admin

from .models import Species


@admin.register(Species)
class SpeciesAdmin(admin.ModelAdmin):
    list_display = ("id", "reference_name", "reference_id")
    search_fields = ("id", "reference_name", "reference_id")
    list_per_page = 10
