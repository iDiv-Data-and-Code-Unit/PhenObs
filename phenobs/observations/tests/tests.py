from datetime import date

import pytest
from django.utils import timezone

# Faker for arbitrary values


# Fixture. Factory + Faker
"""
class GardenFactory(factoryboy.Factory):
    name = "TestMainGarden"
    latitude = str(random.randint(-90, 90))
    longitude = "12"
    main_garden = None

    class Meta:
        model = Garden
"""


# @pytest.fixture
# def subgarden(main_garden):
#     return Garden.objects.create(
#         name="TestSubgarden", latitude="12", longitude="12", main_garden=main_garden
#     )


@pytest.fixture
def current_date():
    return timezone.localdate()


@pytest.fixture
def doy(current_date):
    return (current_date - date(current_date.year, 1, 1)).days


@pytest.mark.django_db
def test_collection_create_success(collection):
    assert collection.garden.main_garden != collection.garden


# Django Client API loggedin user and anonymous
