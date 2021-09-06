from django.db import models

from ..observations.models import Record


class Image(models.Model):
    """Image taken for the associated record."""

    record = models.ForeignKey(
        Record, on_delete=models.CASCADE, help_text="Associated data record"
    )
    image = models.ImageField(unique=True)
    description = models.TextField(blank=True)

    def __str__(self) -> str:
        """Returns associated record information and description"""
        return str(self.record) + " " + str(self.description)
