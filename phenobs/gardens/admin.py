from django.contrib import admin

from .models import Garden


@admin.register(Garden)
class GardenAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "longitude",
        "latitude",
        "auth_perm",
        "auth_groups",
        "auth_users",
    )
    search_fields = ("id", "name")
    list_per_page = 10
