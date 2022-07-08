import pytest

from config.views import home

# from phenobs.observations.tests.conftest import *


@pytest.mark.django_db
def test_home_valid_garden_user(valid_garden_user, request_factory):
    request = request_factory.get("/")
    request.user = valid_garden_user

    response = home(request)

    assert response.status_code == 200


@pytest.mark.django_db
def test_home_invalid_garden_user(default_user, request_factory):
    request = request_factory.get("/")
    request.user = default_user

    response = home(request)

    assert response.status_code == 404


@pytest.mark.django_db
def test_home_multiple_gardens_user(multiple_gardens_user, request_factory):
    request = request_factory.get("/")
    request.user = multiple_gardens_user

    response = home(request)

    assert response.status_code == 409
