from django.conf import settings
from django.contrib.postgres.fields import ArrayField
from django.db import models

from gardens.models import Garden


class Collector(models.Model):
    User = settings.AUTH_USER_MODEL
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    gardens = ArrayField(base_field=Garden.garden_id, verbose_name="Garden")

    def __str__(self):
        return self.user
