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

    name = models.CharField(max_length=100, blank=False, null=False)
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
    # If main != null, then it is a subgarden. Else, it is a main garden that has subgardens.
    main_garden = models.ForeignKey(
        "self", on_delete=models.DO_NOTHING, blank=True, null=True
    )

    class Meta:
        unique_together = (
            "name",
            "main_garden",
        )

    def __str__(self) -> str:
        """Returns name of the garden."""
        if self.main_garden is not None:
            return str(self.main_garden.name + ": " + self.name)
        return str(self.name)

    def is_subgarden(self):
        if self.main_garden is None:
            return False
        return True
