from django.contrib import admin

from .models import Garden

# TODO: Get rid of redundant descriptions


@admin.register(Garden)
class GardenAdmin(admin.ModelAdmin):
    """Registers Garden model in Django Admin with the given configuration."""

    list_display = ("id", "name", "latitude", "longitude")
    list_display_links = ("id", "name")

    fieldsets = (
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

    search_fields = ("id", "name")
    list_per_page = 10
