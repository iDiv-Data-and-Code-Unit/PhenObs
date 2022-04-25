from django.db import models


class Species(models.Model):
    """Species being monitored by PhenObs.

    Attributes:
        reference_name (str): Scientific name according to the plant list
        reference_id (int): ID according to the TRY database

    """

    reference_name = models.CharField(max_length=100)
    reference_id = models.IntegerField(blank=True, null=True)

    def __str__(self) -> str:
        """Returns reference name for the species."""
        return self.reference_name

    class Meta:
        verbose_name_plural = "species"
