from django.db import models

from data_collections.models import DataCollection


class DataRecord(models.Model):
    collection = models.ForeignKey(DataCollection, on_delete=models.CASCADE)
    initial_vegetative_growth = models.CharField(max_length=1)
    young_leaves_unfolding = models.CharField(max_length=1)
    flowers_open = models.CharField(max_length=1)
    peak_flowering = models.CharField(max_length=1)
    flowering_intensity = models.IntegerField()
    ripe_fruits = models.CharField(max_length=1)
    senescence = models.CharField(max_length=1)
    senescence_intensity = models.IntegerField()
    maintenance = models.CharField(max_length=100)
    remarks = models.CharField(max_length=100)

    def __str__(self):
        return self.collection + " " + self.remarks
