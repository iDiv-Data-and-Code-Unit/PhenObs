import factory
from pytest_factoryboy import register

from phenobs.gardens.models import Garden
from phenobs.observations.models import Collection, Record
from phenobs.plants.models import Plant
from phenobs.species.models import Species
from phenobs.users.models import Organization, User


@register
class OrganizationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Organization

    name = factory.Faker("pystr", max_chars=255)


@register
class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    name = factory.Faker("name")
    username = factory.Faker("pystr", max_chars=150)
    status = factory.Faker(
        "words", nb=1, ext_word_list=["staff", "student"], unique=True
    )
    is_staff = factory.Faker("pybool")
    is_active = factory.Faker("pybool")
    password = factory.Faker("password")
    organization = factory.SubFactory(OrganizationFactory)


@register
class GardenFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Garden

    name = factory.Faker("city")
    latitude = factory.Faker("latitude")
    longitude = factory.Faker("longitude")


@register
class MainGardenFactory(GardenFactory):
    @factory.LazyAttribute
    def main_garden(self):
        return None


@register
class SubgardenFactory(GardenFactory):
    @factory.LazyAttribute
    def main_garden(self):
        return MainGardenFactory.create()


@register
class CollectionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Collection

    garden = factory.SubFactory(SubgardenFactory)
    date = factory.Faker("date")
    doy = factory.Faker("pyint")
    creator = factory.SubFactory(UserFactory)
    finished = factory.Faker("pybool")


@register
class SpeciesFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Species

    reference_name = factory.Faker("name")


@register
class PlantFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Plant

    garden = factory.SubFactory(SubgardenFactory)
    species = factory.SubFactory(SpeciesFactory)
    garden_name = factory.Faker("name")
    order = factory.Faker("pyint")
    active = factory.Faker("pybool")


@register
class RecordFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Record

    collection = factory.SubFactory(CollectionFactory)
    plant = factory.SubFactory(PlantFactory)
    timestamp_entry = factory.Faker("date_time_this_year")
    timestamp_edit = factory.Faker("date_time_this_year")
    editor = factory.SubFactory(UserFactory)
    initial_vegetative_growth = factory.Faker(
        "words", nb=1, ext_word_list=["y", "u", "no", "m"], unique=True
    )
    young_leaves_unfolding = factory.Faker(
        "words", nb=1, ext_word_list=["y", "u", "no", "m"], unique=True
    )
    flowers_open = factory.Faker(
        "words", nb=1, ext_word_list=["y", "u", "no", "m"], unique=True
    )
    peak_flowering = factory.Faker(
        "words", nb=1, ext_word_list=["y", "u", "no", "m"], unique=True
    )
    flowering_intensity = factory.Faker("random_int", min=5, max=100, step=5)
    ripe_fruits = factory.Faker(
        "words", nb=1, ext_word_list=["y", "u", "no", "m"], unique=True
    )
    senescence = factory.Faker(
        "words", nb=1, ext_word_list=["y", "u", "no", "m"], unique=True
    )
    senescence_intensity = factory.Faker("random_int", min=5, max=100, step=5)
    maintenance = factory.Faker(
        "random_elements",
        elements=(
            "cut_partly",
            "cut_total",
            "covered_natural",
            "covered_artificial",
            "removed",
            "transplanted",
        ),
        unique=True,
    )
    remarks = factory.Faker("pystr", max_chars=255)
    peak_flowering_estimation = factory.Faker(
        "words", nb=1, ext_word_list=["y", "u", "no", "m"], unique=True
    )
    done = factory.Faker("pybool")
