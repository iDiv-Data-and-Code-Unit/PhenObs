from django.db import models
from django.utils import timezone
from multiselectfield import MultiSelectField

from ..gardens.models import Garden
from ..plants.models import Plant
from ..users.models import User


class Collection(models.Model):
    """Collection of observations done in a specific garden on the given date and time.

    Attributes:
        garden (Garden): Associated garden
        date (Date): Date of collection
        doy (int): Day of year according to the date
        creator (User): Creator of collection

    """

    garden = models.ForeignKey(Garden, on_delete=models.CASCADE)
    date = models.DateField(
        default=timezone.localdate,
        help_text="Date and time of collection",
    )
    doy = models.IntegerField(help_text="Day of year")
    # TODO: make "doy" available only in backend
    creator = models.ForeignKey(User, on_delete=models.DO_NOTHING)

    def __str__(self) -> str:
        """Returns the garden, date and time information for the collection."""
        return str(self.garden) + " " + str(self.date)


class Record(models.Model):
    """Record of observation for a specific plant at a garden.

    Attributes:
        collection (Collection): Collection the record belongs to
        plant (Plant): Observed plant
        timestamp_entry (DateTime): Date and time for the entered record
        timestamp_edit (DateTime): Date and time for the edited record
        editor (User): User who edited the given record and its values
        initial_vegetative_growth (char):
        young_leaves_unfolding (char):
        flowers_open (char):
        peak_flowering (char):
        flowering_intensity (int):
        ripe_fruits (char):
        senescence (char):
        senescence_intensity (int):
        maintenance (list[str]):
        remarks (str):
        peak_flowering_estimated (char):
        done (bool):

    """

    collection = models.ForeignKey(Collection, on_delete=models.CASCADE)
    plant = models.ForeignKey(Plant, on_delete=models.CASCADE)
    timestamp_entry = models.DateTimeField(
        default=timezone.now, help_text="Date and time of record entry"
    )
    timestamp_edit = models.DateTimeField(
        default=timezone.now, help_text="Date and time of record edit"
    )
    editor = models.ForeignKey(User, on_delete=models.DO_NOTHING)

    all_observation_choices = [
        ("y", "yes"),
        ("no", "no"),
        ("u", "unsure"),
        ("m", "missed"),
    ]
    unmissed_observation_choices = all_observation_choices[:3]
    min_observation_choices = all_observation_choices[:2]

    maintenance_choices = [
        ("cut_partly", "cut partly"),
        ("cut_total", "cut total"),
        ("covered_natural", "covered natural"),
        ("covered_artificial", "covered artificial"),
        ("transplanted", "transplanted"),
        ("removed", "removed"),
    ]

    initial_vegetative_growth = models.CharField(
        max_length=2, choices=all_observation_choices, null=True, blank=True
    )
    young_leaves_unfolding = models.CharField(
        max_length=2, choices=all_observation_choices, null=True, blank=True
    )
    flowers_open = models.CharField(
        max_length=2, choices=unmissed_observation_choices, null=True, blank=True
    )
    peak_flowering = models.CharField(
        max_length=2, choices=unmissed_observation_choices, null=True, blank=True
    )
    flowering_intensity = models.IntegerField(blank=True, null=True)
    ripe_fruits = models.CharField(
        max_length=2, choices=unmissed_observation_choices, null=True, blank=True
    )
    senescence = models.CharField(
        max_length=2, choices=unmissed_observation_choices, null=True, blank=True
    )
    senescence_intensity = models.IntegerField(null=True, blank=True)
    maintenance = MultiSelectField(
        max_length=120, choices=maintenance_choices, blank=True, null=True
    )
    remarks = models.TextField(blank=True)
    peak_flowering_estimation = models.CharField(
        max_length=2, choices=min_observation_choices, blank=True
    )
    # TODO: make "peak_flowering_estimation" available only in frontend

    done = models.BooleanField()

    def __str__(self) -> str:
        """Returns the collection, plant, editing and editor information for the record."""

        return (
            str(self.collection)
            + " "
            + str(self.plant)
            + " "
            + str(self.timestamp_edit)
            + " "
            + str(self.editor)
        )
