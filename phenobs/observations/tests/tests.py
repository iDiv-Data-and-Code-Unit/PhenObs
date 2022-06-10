import json
from datetime import date
from unittest.mock import patch

import pytest
from django.http.response import JsonResponse
from django.test import RequestFactory
from django.utils import timezone

from phenobs.observations.upload import upload

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
