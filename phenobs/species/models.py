from django.db import models


class Species(models.Model):
    reference_name = models.CharField(max_length=100)
    reference_id = models.IntegerField(unique=True)
