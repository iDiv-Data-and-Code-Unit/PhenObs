from django.contrib import admin
from django.contrib.auth import admin as auth_admin
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _

from phenobs.users.forms import UserChangeForm, UserCreationForm
from phenobs.users.models import Organization

User = get_user_model()


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    """Registers the Organization model in Django Admin with the given configuration."""

    list_display = ("name",)


@admin.register(User)
class UserAdmin(auth_admin.UserAdmin):
    """Registers the User model in Django Admin with the given configuration."""

    form = UserChangeForm
    add_form = UserCreationForm
    fieldsets = (
        (None, {"fields": ("username", "password")}),
        (
            _("Personal info"),
            {
                "fields": (
                    "name",
                    "email",
                    "first_name",
                    "last_name",
                    "status",
                    "organization",
                )
            },
        ),
        (
            _("Permissions"),
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                ),
            },
        ),
        (_("Important dates"), {"fields": ("last_login", "date_joined")}),
    )
    list_display = ["username", "name", "is_superuser"]
    search_fields = ["name", "username"]
