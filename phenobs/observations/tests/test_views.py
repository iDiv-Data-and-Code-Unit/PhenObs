import random

import pytest
from django.http import Http404

from phenobs.observations.views import add, all, edit, new, overview


@pytest.fixture
def valid_garden_user(garden, user):
    garden.auth_users.set([user])
    return user


@pytest.fixture
def multiple_gardens_user(garden_factory, user):
    garden_1 = garden_factory()
    garden_2 = garden_factory()
    garden_1.auth_users.set([user])
    garden_2.auth_users.set([user])

    return user


@pytest.mark.django_db
def test_all_valid_garden(request_factory, valid_garden_user):
    request = request_factory.get("/observations/")
    request.user = valid_garden_user

    response = all(request)

    assert response.status_code == 200


@pytest.mark.django_db
def test_all_invalid_garden(request_factory, user):
    request = request_factory.get("/observations/")
    request.user = user

    response = all(request)

    assert response.status_code == 404


@pytest.mark.django_db
def test_all_multiple_gardens(garden_factory, request_factory, multiple_gardens_user):
    request = request_factory.get("/observations/")
    request.user = multiple_gardens_user

    response = all(request)

    assert response.status_code == 409


@pytest.mark.django_db
def test_add_valid_garden(garden, request_factory, valid_garden_user):
    request = request_factory.get("/observations/add/")
    request.user = valid_garden_user

    response = all(request)

    assert response.status_code == 200


@pytest.mark.django_db
def test_add_invalid_garden(request_factory, user):
    request = request_factory.get("/observations/add/")
    request.user = user

    response = add(request)

    assert response.status_code == 404


@pytest.mark.django_db
def test_add_multiple_gardens(request_factory, multiple_gardens_user):
    request = request_factory.get("/observations/add/")
    request.user = multiple_gardens_user

    response = add(request)

    assert response.status_code == 409


@pytest.mark.django_db
def test_edit_valid_garden_valid_collection(
    request_factory, valid_garden_user, collection_factory
):
    collection = collection_factory(creator=valid_garden_user)

    request = request_factory.get("/observations/edit/%d/" % collection.id)
    request.user = valid_garden_user

    response = edit(request, collection.id)

    assert response.status_code == 200


@pytest.mark.django_db
def test_edit_valid_garden_invalid_collection(request_factory, valid_garden_user):
    try:
        request = request_factory.get("/observations/edit/%d/" % random.randint(1, 100))
        request.user = valid_garden_user

        edit(request, random.randint(1, 100))

        assert False
    except Http404:
        assert True


@pytest.mark.django_db
def test_edit_invalid_garden(request_factory, user):
    request = request_factory.get("/observations/edit/%d/" % random.randint(1, 100))
    request.user = user

    response = edit(request, random.randint(1, 100))

    assert response.status_code == 404


@pytest.mark.django_db
def test_edit_multiple_gardens(request_factory, multiple_gardens_user):
    request = request_factory.get("/observations/edit/%d/" % random.randint(1, 100))
    request.user = multiple_gardens_user

    response = edit(request, random.randint(1, 100))

    assert response.status_code == 409


@pytest.mark.django_db
def test_new_invalid_method(request_factory, user):
    request = request_factory.get("/observations/new/%d/" % random.randint(1, 100))
    request.user = user

    response = new(request, random.randint(1, 100))

    assert response.status_code == 405
    assert response.content == b'"Method not allowed."'


@pytest.mark.django_db
def test_new_valid_garden(request_factory, user, subgarden_factory):
    subgarden = subgarden_factory()
    subgarden.auth_users.set([user])

    request = request_factory.post("/observations/new/%d/" % subgarden.id)
    request.user = user

    response = new(request, subgarden.id)

    assert response.status_code == 200


@pytest.mark.django_db
def test_new_invalid_garden(request_factory, user, subgarden_factory):
    subgarden = subgarden_factory()

    request = request_factory.post("/observations/new/%d/" % subgarden.id)
    request.user = user

    response = new(request, subgarden.id)

    assert response.status_code == 404
    assert (
        response.content
        == b'"You do not have permission to create collections for this garden."'
    )


@pytest.mark.django_db
def test_overview_admin_user(request_factory, admin_user):
    request = request_factory.get("/observations/overview/")
    request.user = admin_user

    response = overview(request)

    assert response.status_code == 200


@pytest.mark.django_db
def test_overview_invalid_garden_default_user(request_factory, default_user):
    request = request_factory.get("/observations/overview/")
    request.user = default_user

    response = overview(request)

    assert response.status_code == 404


@pytest.mark.django_db
def test_overview_valid_garden_default_user(
    request_factory, default_user, subgarden_factory
):
    subgarden = subgarden_factory()
    subgarden.auth_users.set([default_user])

    request = request_factory.get("/observations/overview/")
    request.user = default_user

    response = overview(request)

    assert response.status_code == 200


@pytest.mark.django_db
def test_overview_multiple_gardens_default_user(
    request_factory, default_user, subgarden_factory
):
    subgarden_1 = subgarden_factory()
    subgarden_1.auth_users.set([default_user])

    subgarden_2 = subgarden_factory()
    subgarden_2.auth_users.set([default_user])

    request = request_factory.get("/observations/overview/")
    request.user = default_user

    response = overview(request)

    assert response.status_code == 409
