from django.conf import settings
from django.contrib.postgres.fields import ArrayField
from django.db import models


class Collector(models.Model):
    User = settings.AUTH_USER_MODEL
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    gardens = ArrayField(models.CharField(max_length=50))

    def __str__(self):
        return self.user
