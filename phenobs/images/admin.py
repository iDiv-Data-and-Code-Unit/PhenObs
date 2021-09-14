from django.contrib import admin

from .models import Image


@admin.register(Image)
class ImageAdmin(admin.ModelAdmin):
    """Registers Image model in Django Admin with the given configuration."""

    list_display = ("id", "record", "description")
    list_display_links = ("id", "record", "description")
    search_fields = ("id", "record", "description")
    list_per_page = 10
