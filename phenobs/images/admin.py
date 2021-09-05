from django.contrib import admin

from .models import Image


@admin.register(Image)
class ImageAdmin(admin.ModelAdmin):
    list_display = ("id", "record", "description")
    search_fields = ("id", "record", "description")
    list_per_page = 10
