from datetime import datetime

from django.db import models

from collectors.models import Collector
from gardens.models import Garden


class DataCollection(models.Model):
    garden = models.ForeignKey(Garden, on_delete=models.DO_NOTHING)
    date = models.DateTimeField(default=datetime.now, blank=True)
    doy = models.IntegerField()
    species = models.CharField(max_length=100)
    collector = models.ForeignKey(Collector, on_delete=models.DO_NOTHING)

    def __str__(self):
        return self.date + " " + self.garden + " " + self.collector
