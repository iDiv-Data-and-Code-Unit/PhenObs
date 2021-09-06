from datetime import datetime

from django.contrib.auth.models import User
from django.db import models

from ..gardens.models import Garden
from ..plants.models import Plant


class Collection(models.Model):
    """Collection of observations done in a specific garden on the given date and time."""

    garden = models.ForeignKey(Garden, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(
        default=datetime.now, help_text="Date and time of collection"
    )
    doy = models.IntegerField(help_text="Day of year")
    creator = models.ForeignKey(User, on_delete=models.DO_NOTHING)

    def __str__(self) -> str:
        """Returns the garden, date and time information for the collection."""
        return str(self.garden) + " " + str(self.timestamp)


class Record(models.Model):
    """Record of observation for a specific plant at a garden."""

    collection = models.ForeignKey(Collection, on_delete=models.CASCADE)
    plant = models.ForeignKey(Plant, on_delete=models.CASCADE)
    timestamp_entry = models.DateTimeField(
        default=datetime.now, help_text="Date and time of record entry"
    )
    timestamp_edit = models.DateTimeField(
        default=datetime.now, help_text="Date and time of record edit"
    )
    editor = models.ForeignKey(User, on_delete=models.DO_NOTHING)

    initial_vegetative_growth = models.BooleanField(null=True)
    young_leaves_unfolding = models.BooleanField(null=True)
    flowers_open = models.BooleanField(null=True)
    peak_flowering = models.BooleanField(null=True)
    flowering_intensity = models.IntegerField(blank=True)
    ripe_fruits = models.BooleanField(null=True)
    senescence = models.BooleanField(null=True)
    maintenance = models.TextField(blank=True)
    remarks = models.TextField(blank=True)

    done = models.BooleanField()

    def __str__(self) -> str:
        """Returns the collection, plant, editing and editor information for the record."""

        return (
            str(self.collection)
            + " "
            + str(self.plant)
            + " "
            + str(self.timestamp_edit)
            + " "
            + str(self.editor)
        )
