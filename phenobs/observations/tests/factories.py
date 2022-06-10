import factory
from pytest_factoryboy import register

from phenobs.gardens.models import Garden
from phenobs.observations.models import Collection
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
