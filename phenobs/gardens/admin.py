from django.contrib import admin

from .models import Garden


@admin.register(Garden)
class GardenAdmin(admin.ModelAdmin):
    """Registers Garden model in Django Admin with the given configuration."""

    list_display = ("id", "name", "longitude", "latitude")

    fieldsets = (
        ("Name", {"fields": ("name",), "description": "Name of the garden"}),
        (
            "Coordinates",
            {
                "fields": (
                    "latitude",
                    "longitude",
                ),
                "description": "Coordinates",
            },
        ),
        (
            "Permissions",
            {
                "fields": (
                    "auth_groups",
                    "auth_users",
                ),
                "description": "Users and groups with access",
            },
        ),
    )

    search_fields = ("id", "name")
    list_per_page = 10
