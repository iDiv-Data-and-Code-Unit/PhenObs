from django.db import models


class Species(models.Model):
    """Species being monitored by PhenObs"""

    reference_name = models.CharField(max_length=100)
    reference_id = models.IntegerField(unique=True)

    def __str__(self) -> str:
        """Returns reference name for the species"""
        return self.reference_name
