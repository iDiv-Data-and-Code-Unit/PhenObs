from django.db import models

from ..gardens.models import Garden
from ..species.models import Species


class Plant(models.Model):
    """Plant in the specific garden with a specific order."""

    garden = models.ForeignKey(Garden, on_delete=models.CASCADE)
    species = models.ForeignKey(Species, on_delete=models.CASCADE)
    garden_name = models.CharField(
        max_length=100, help_text="Name used for the plant at the garden"
    )
    order = models.IntegerField(help_text="Order of the plant for the given garden")
    active = models.BooleanField(help_text="Plant is actively observed or not")

    def __str__(self) -> str:
        """Returns the name and order of the plant."""
        return str(self.garden_name) + " " + str(self.order)

    class Meta:
        unique_together = ["garden", "order"]
