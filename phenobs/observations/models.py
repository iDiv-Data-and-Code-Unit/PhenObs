from datetime import datetime

from django.contrib.auth.models import User
from django.db import models

from ..gardens.models import Garden


class DataCollection(models.Model):
    garden = models.ForeignKey(Garden, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(
        default=datetime.now, help_text="Date and time of collection"
    )
    doy = models.IntegerField(help_text="Day of year")
    user = models.ForeignKey(User, on_delete=models.DO_NOTHING)


class DataRecord(models.Model):
    collection = models.ForeignKey(DataCollection, on_delete=models.CASCADE)
    timestamp_entry = models.DateTimeField(
        default=datetime.now, help_text="Date and time of record entry"
    )
    timestamp_edit = models.DateTimeField(
        default=datetime.now, help_text="Date and time of record edit"
    )
    editor = models.ForeignKey(User, on_delete=models.DO_NOTHING)

    observation_choices = [("y", "yes"), ("m", "missed"), ("u", "unsure")]

    initial_vegetative_growth = models.CharField(
        max_length=1, blank=True, choices=observation_choices
    )
    young_leaves_unfolding = models.CharField(
        max_length=1, blank=True, choices=observation_choices
    )
    flowers_open = models.CharField(
        max_length=1, blank=True, choices=observation_choices
    )
    peak_flowering = models.CharField(
        max_length=1, blank=True, choices=observation_choices
    )
    flowering_intensity = models.IntegerField(blank=True)
    ripe_fruits = models.CharField(
        max_length=1, blank=True, choices=observation_choices
    )
    senescence = models.CharField(max_length=1, blank=True, choices=observation_choices)
    maintenance = models.TextField(blank=True)
    remarks = models.TextField(blank=True)

    done = models.BooleanField()
