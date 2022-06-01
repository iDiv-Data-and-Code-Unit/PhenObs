import json
import random
from datetime import date
from unittest.mock import patch

import pytest
from django.http.response import JsonResponse
from django.test import RequestFactory
from django.utils import timezone

from ..gardens.models import Garden
from ..users.models import User
from .models import Collection
from .upload import upload

# Faker for arbitrary values


@pytest.fixture
def main_garden():
    return Garden.objects.create(
        name="TestMainGarden", latitude="12", longitude="12", main_garden=None
    )


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


@pytest.fixture
def subgarden(main_garden):
    return Garden.objects.create(
        name="TestSubgarden", latitude="12", longitude="12", main_garden=main_garden
    )


@pytest.fixture
def current_date():
    return timezone.localdate()


@pytest.fixture
def user():
    return User.objects.create(
        name="Test",
        username="TestUsername",
        status="staff",
        is_staff=random.choice([True, False]),
        is_active=True,
        last_name="Lastname",
        password="Test123!",
    )


@pytest.fixture
def doy(current_date):
    return (current_date - date(current_date.year, 1, 1)).days


@pytest.mark.django_db
def test_collection_create_success(subgarden, current_date, user, doy):
    # Creating for Halle-1 subgarden
    # garden = garden
    # garden2 = Garden.objects.filter(id=2).get()
    # # Creating for current date
    # current_date = timezone.localdate()
    # # Creating for user 'zxyctn'
    # user = User.objects.filter(id=1).get()

    collection = Collection.objects.create(
        garden=subgarden, date=current_date, doy=doy, creator=user
    )

    assert collection.garden.name == subgarden.name
    assert collection.date == current_date
    assert collection.doy == doy
    assert collection.creator == user


@pytest.fixture
def request_factory():
    return RequestFactory()


@pytest.fixture
def post_request_loggedin_user_json_body(request_factory, user):
    request = request_factory.post("/observations/upload/")
    request.user = user
    request._body = "{}"

    return request


@pytest.mark.django_db
def test_upload_view_with_post(post_request_loggedin_user_json_body):
    with patch(
        "phenobs.observations.upload.update_collection"
    ) as update_collection_mock:
        response = upload(post_request_loggedin_user_json_body)
        update_collection_mock.assert_called_with(
            {}, post_request_loggedin_user_json_body.user.username
        )
        assert isinstance(response, JsonResponse)
        assert json.loads(response.content) == "OK"


# Django Client API loggedin user and anonymous
