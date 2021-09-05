from django.db import models

from ..observations.models import DataRecord


class Image(models.Model):
    record = models.ForeignKey(
        DataRecord, on_delete=models.CASCADE, help_text="Associated data record"
    )
    image = models.ImageField(unique=True)
    description = models.TextField(blank=True)
