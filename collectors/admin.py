from django.contrib import admin

from .models import Collector


class CollectorAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user_id",
        "gardens",
    )
    search_fields = ("id", "user_id")
    list_per_page = 25


admin.site.register(Collector, CollectorAdmin)
