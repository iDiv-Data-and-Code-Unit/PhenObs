from django.contrib.auth.models import AbstractUser
from django.db.models import DO_NOTHING, CharField, ForeignKey, Model
from django.urls import reverse
from django.utils.translation import gettext_lazy as _


class Organization(Model):
    """Organization the user is a member of."""

    name = CharField(_("Name of Organization"), blank=True, max_length=255)


class User(AbstractUser):
    """Default user for PhenObs."""

    #: First and last name do not cover name patterns around the globe
    name = CharField(_("Name of User"), blank=True, max_length=255)
    first_name = CharField(_("First name"), blank=True, max_length=255)
    last_name = CharField(_("Last name"), blank=True, max_length=255)
    status = CharField(
        _("Status of Member"),
        max_length=255,
        choices=(("stuff", "stuff"), ("student", "student")),
    )
    organization = ForeignKey(
        Organization,
        verbose_name=_("Organization"),
        blank=True,
        null=True,
        on_delete=DO_NOTHING,
    )


def get_absolute_url(self) -> str:
    """Get url for user's detail view.

    Returns:
        str: URL for user detail.

    """
    return reverse("users:detail", kwargs={"username": self.username})
