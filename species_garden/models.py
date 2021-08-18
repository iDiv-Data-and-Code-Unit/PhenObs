from django.contrib.postgres.fields import ArrayField
from django.db import models

from gardens.models import Garden


class SpeciesGarden(models.Model):
    garden = models.ForeignKey(Garden, on_delete=models.DO_NOTHING)
    species = ArrayField(models.CharField(max_length=100))
    garden_name = models.CharField(max_length=100)
    order = models.IntegerField()
