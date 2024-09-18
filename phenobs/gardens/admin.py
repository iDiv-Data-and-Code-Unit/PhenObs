from django.contrib import admin

from .models import Garden


@admin.register(Garden)
class GardenAdmin(admin.ModelAdmin):
    """Registers Garden model in Django Admin with the given configuration."""

    list_display = ("id", "name", "main_garden", "latitude", "longitude")
    list_display_links = ("id", "name")

    fieldsets = (
        ("Main", {"fields": ("main_garden",)}),
        ("Name", {"fields": ("name",)}),
        (
            "Coordinates",
            {
                "fields": (
                    "latitude",
                    "longitude",
                )
            },
        ),
        (
            "Permissions",
            {
                "fields": (
                    "auth_groups",
                    "auth_users",
                ),
                "classes": ("wide",),
            },
        ),
    )

    search_fields = ("id", "name", "main_garden__name")
    list_per_page = 10
