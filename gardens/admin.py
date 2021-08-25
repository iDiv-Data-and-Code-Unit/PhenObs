from django.contrib import admin

from .models import Garden


class GardenAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "longitude", "latitude")
    search_fields = ("id", "name")
    list_per_page = 10


admin.site.register(Garden, GardenAdmin)
