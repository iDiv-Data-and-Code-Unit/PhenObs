from django.contrib.auth.models import Group
from django.db import models

from ..users.models import User


class Garden(models.Model):
    """Garden being monitored by PhenObs.

    Attributes:
        name (str): Name of the garden
        latitude (double): Latitude of the garden
        longitude (double): Longitude of the garden
        auth_groups (list): User groups with access to the garden
        auth_users (list): Users with access to the garden

    """

    name = models.CharField(max_length=100, unique=True, blank=False, null=False)
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6, blank=False, help_text="WGS 84"
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6, blank=False, help_text="WGS 84"
    )
    auth_groups = models.ManyToManyField(
        Group, blank=True, verbose_name="Access groups"
    )
    auth_users = models.ManyToManyField(User, blank=True, verbose_name="Access users")

    def __str__(self) -> str:
        """Returns name of the garden."""
        return str(self.name)
