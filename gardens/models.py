from django.db import models


class Garden(models.Model):
    name = models.CharField(max_length=20)
    latitude = models.DecimalField(max_digits=15, decimal_places=10)
    longitude = models.DecimalField(max_digits=15, decimal_places=10)
