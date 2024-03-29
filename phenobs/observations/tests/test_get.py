import json
import random
from datetime import datetime
from unittest.mock import patch

import pytest

from phenobs.observations.get import (
    check_maintenance_option,
    check_no_observation,
    collection_content,
    edit_collection_content,
    format_records,
    get,
    get_all_collections,
    get_collections,
    get_older,
    last,
    view_collection_content,
)
from phenobs.observations.models import Collection, Record


@pytest.mark.django_db
def test_get_all_collections_valid_garden_valid_json_valid_schema(
    request_factory, collection_factory, subgarden_factory, user
):
    subgarden = subgarden_factory()
    subgarden.auth_users.set([user])

    collection_1 = collection_factory(garden=subgarden)
    collection_2 = collection_factory(garden=subgarden)

    request = request_factory.get("observations/garden_collections/")
    request.user = user
    request._body = "[%d, %d]" % (collection_1.id, collection_2.id)

    with patch(
        "phenobs.observations.get.format_records", side_effect=format_records
    ) as format_records_mock:
        response = get_all_collections(request)

    format_records_mock.assert_called()

    assert response.status_code == 200
    assert format_records_mock.call_count == 2


@pytest.mark.django_db
def test_get_all_collections_invalid_garden(request_factory, user):
    request = request_factory.get("observations/garden_collections/")
    request.user = user
    request._body = "[]"

    response = get_all_collections(request)

    assert response.status_code == 404


@pytest.mark.django_db
def test_get_all_collections_multiple_gardens(request_factory, multiple_gardens_user):
    request = request_factory.get("observations/garden_collections/")
    request.user = multiple_gardens_user
    request._body = "[]"

    response = get_all_collections(request)

    assert response.status_code == 409


@pytest.mark.django_db
def test_get_all_collections_valid_garden_invalid_json(request_factory, subgarden_user):
    request = request_factory.get("observations/garden_collections/")
    request.user = subgarden_user
    request._body = "[{]"

    response = get_all_collections(request)

    assert response.status_code == 400
    assert response.content == b'"JSON decoding error was raised."'


@pytest.mark.django_db
def test_get_all_collections_valid_garden_valid_json_invalid_schema(
    request_factory, subgarden_user
):
    request = request_factory.get("observations/garden_collections/")
    request.user = subgarden_user
    request._body = "[1, 2, true]"

    response = get_all_collections(request)

    assert response.status_code == 500
    assert response.content == b'"Received JSON could not be validated."'


@pytest.mark.django_db
def test_get_collections_all_invalid_json_data(request_factory, valid_garden_user):
    request = request_factory.get("collections/all/")
    request.user = valid_garden_user
    request._body = json.dumps({})

    response = get_collections(request, "all")

    assert response.status_code == 500


@pytest.mark.django_db
def test_get_collections_all_valid_json_data(request_factory, valid_garden_user):
    start_date = datetime(
        year=random.randint(1980, 2022),
        month=random.randint(1, 12),
        day=random.randint(1, 28),
    )
    end_date = datetime(
        year=random.randint(start_date.year + 1, 2023),
        month=random.randint(1, 12),
        day=random.randint(1, 28),
    )

    request = request_factory.get("collections/all/")
    request.user = valid_garden_user
    request._body = json.dumps(
        {
            "start_date": {
                "year": start_date.year,
                "month": start_date.month,
                "day": start_date.day,
                "string": start_date.date().isoformat(),
            },
            "end_date": {
                "year": end_date.year,
                "month": end_date.month,
                "day": end_date.day,
                "string": end_date.date().isoformat(),
            },
        }
    )

    response = get_collections(request, "all")

    assert response.status_code == 200


@pytest.mark.django_db
def test_get_collections_all_valid_json_data_invalid_date_range(
    request_factory, valid_garden_user
):
    start_date = datetime(
        year=random.randint(1981, 2022),
        month=random.randint(1, 12),
        day=random.randint(1, 28),
    )
    end_date = datetime(
        year=random.randint(1980, start_date.year - 1),
        month=random.randint(1, 12),
        day=random.randint(1, 28),
    )

    request = request_factory.get("collections/all/")
    request.user = valid_garden_user
    request._body = json.dumps(
        {
            "start_date": {
                "year": start_date.year,
                "month": start_date.month,
                "day": start_date.day,
                "string": start_date.date().isoformat(),
            },
            "end_date": {
                "year": end_date.year,
                "month": end_date.month,
                "day": end_date.day,
                "string": end_date.date().isoformat(),
            },
        }
    )

    response = get_collections(request, "all")

    assert response.status_code == 400


@pytest.mark.django_db
def test_get_collections_all_valid_json_data_invalid_date_string(
    request_factory, valid_garden_user
):
    start_date = datetime(
        year=random.randint(1980, 2022),
        month=random.randint(1, 12),
        day=random.randint(1, 28),
    )
    end_date = datetime(
        year=random.randint(start_date.year + 1, 2023),
        month=random.randint(1, 12),
        day=random.randint(1, 28),
    )

    request = request_factory.get("collections/all/")
    request.user = valid_garden_user
    request._body = json.dumps(
        {
            "start_date": {
                "year": start_date.year,
                "month": start_date.month,
                "day": start_date.day,
                "string": "2022-22-22",
            },
            "end_date": {
                "year": end_date.year,
                "month": end_date.month,
                "day": end_date.day,
                "string": "2022-22-22",
            },
        }
    )

    response = get_collections(request, "all")

    assert response.status_code == 500


@pytest.mark.django_db
def test_get_collections_admin_user_all(request_factory, admin_user, garden):
    garden.auth_users.set([admin_user])

    request = request_factory.get("collections/all/")
    request.user = admin_user

    response = get_collections(request, "all")

    assert response.status_code == 200


@pytest.mark.django_db
def test_get_collections_admin_user_valid_subgarden(
    request_factory, admin_user, subgarden_factory
):
    subgarden = subgarden_factory()
    subgarden.auth_users.set([admin_user])

    request = request_factory.get("collections/%d/" % subgarden.id)
    request.user = admin_user

    response = get_collections(request, str(subgarden.id))

    assert response.status_code == 200


@pytest.mark.django_db
def test_get_collections_admin_user_valid_main_garden(
    request_factory, admin_user, main_garden_factory, subgarden_factory
):
    main_garden = main_garden_factory()
    subgarden = subgarden_factory(main_garden=main_garden)
    subgarden.auth_users.set([admin_user])

    request = request_factory.get("collections/%d/" % main_garden.id)
    request.user = admin_user

    response = get_collections(request, str(main_garden.id))

    assert response.status_code == 200


@pytest.mark.django_db
def test_get_collections_admin_user_invalid_garden(request_factory, admin_user):
    request = request_factory.get("collections/%d/" % -1)
    request.user = admin_user

    response = get_collections(request, str(-1))

    assert response.status_code == 404


@pytest.mark.django_db
def test_get_collections_default_user_all(
    request_factory, subgarden_factory, default_user
):
    subgarden = subgarden_factory()
    subgarden.auth_users.set([default_user])

    request = request_factory.get("collections/all/")
    request.user = default_user

    response = get_collections(request, "all")

    assert response.status_code == 200


@pytest.mark.django_db
def test_get_collections_default_user_valid_subgarden(
    request_factory, subgarden_factory, default_user
):
    subgarden = subgarden_factory()
    subgarden.auth_users.set([default_user])

    request = request_factory.get("collections/%d/" % subgarden.id)
    request.user = default_user

    response = get_collections(request, "%d" % subgarden.id)

    assert response.status_code == 200


@pytest.mark.django_db
def test_get_collections_default_user_invalid_subgarden(request_factory, default_user):
    request = request_factory.get("collections/-1/")
    request.user = default_user

    response = get_collections(request, "-1")

    assert response.status_code == 404


@pytest.mark.django_db
def test_get_collections_default_user_multiple_gardens(
    request_factory, default_user, subgarden_factory
):
    subgarden_1 = subgarden_factory()
    subgarden_2 = subgarden_factory()
    subgarden_1.auth_users.set([default_user])
    subgarden_2.auth_users.set([default_user])

    request = request_factory.get("collections/all/")
    request.user = default_user

    response = get_collections(request, "all")

    assert response.status_code == 409


@pytest.mark.django_db
def test_view_collection_content_valid_collection(
    request_factory, collection, record_factory, user
):
    record_factory(collection=collection)
    record_factory(collection=collection)
    collection.creator = user

    request = request_factory.get("view_collection/%d/" % collection.id)
    request.user = user

    with patch(
        "phenobs.observations.get.collection_content", side_effect=collection_content
    ) as collection_content_mock:
        response = view_collection_content(request, collection.id)

    collection_content_mock.assert_called_once_with(collection.id)

    assert response.status_code == 200


@pytest.mark.django_db
def test_view_collection_content_invalid_collection(request_factory, user):
    request = request_factory.get("view_collection/%d/" % -1)
    request.user = user

    with patch(
        "phenobs.observations.get.collection_content", side_effect=collection_content
    ) as collection_content_mock:
        response = view_collection_content(request, -1)

    collection_content_mock.assert_called_once_with(-1)

    assert response.status_code == 404
    assert response.content == b"Collection could not be retrieved."


@pytest.mark.django_db
def test_edit_collection_content_valid_collection(
    request_factory, collection, record_factory, user
):
    record_factory(collection=collection)
    record_factory(collection=collection)
    collection.creator = user

    request = request_factory.get("edit_collection/%d/" % collection.id)
    request.user = user

    with patch(
        "phenobs.observations.get.collection_content", side_effect=collection_content
    ) as collection_content_mock:
        response = edit_collection_content(request, collection.id)

    collection_content_mock.assert_called_once_with(collection.id)

    assert response.status_code == 200


@pytest.mark.django_db
def test_edit_collection_content_invalid_collection(request_factory, user):
    request = request_factory.get("edit_collection/%d/" % -1)
    request.user = user

    with patch(
        "phenobs.observations.get.collection_content", side_effect=collection_content
    ) as collection_content_mock:
        response = edit_collection_content(request, -1)

    collection_content_mock.assert_called_once_with(-1)

    assert response.status_code == 404
    assert response.content == b"Collection could not be retrieved."


@pytest.mark.django_db
def test_get_valid_collection(request_factory, collection_factory, user):
    collection = collection_factory(creator=user)

    request = request_factory.get("observations/get/%d/" % collection.id)
    request.user = user

    with patch(
        "phenobs.observations.get.get_older", side_effect=get_older
    ) as get_older_mock:
        with patch(
            "phenobs.observations.get.format_records", side_effect=format_records
        ) as format_records_mock:
            response = get(request, collection.id)

    format_records_mock.assert_called()
    get_older_mock.assert_called()

    response_json = json.loads(response.content)
    assert response.status_code == 200
    assert response_json["id"] == collection.id
    assert response_json["date"] == collection.date
    assert response_json["creator"] == collection.creator.username
    assert response_json["garden"] == collection.garden.id
    assert response_json["garden-name"] == collection.garden.name
    assert response_json["finished"] == collection.finished


@pytest.mark.django_db
def test_get_invalid_collection(request_factory, user):
    request = request_factory.get("observations/get/-1/")
    request.user = user

    response = get(request, -1)

    assert response.status_code == 404
    assert response.content == b'"Collection could not be retrieved."'


@pytest.mark.django_db
def test_last_valid_json_valid_schema_valid_collection(
    request_factory, user, collection_valid_json
):
    request = request_factory.get("observations/last/")
    request.user = user
    request._body = json.dumps(collection_valid_json)

    with patch(
        "phenobs.observations.get.get_older", side_effect=get_older
    ) as get_older_mock:
        response = last(request)

    get_older_mock.assert_called_once()

    assert response.status_code == 200


@pytest.mark.django_db
def test_last_invalid_json(request_factory, user):
    request = request_factory.get("observations/last/")
    request.user = user
    request._body = "{"

    response = last(request)

    assert response.status_code == 400
    assert response.content == b'"JSON decoding error was raised."'


@pytest.mark.django_db
def test_last_valid_json_invalid_schema(request_factory, user, collection_valid_json):
    collection_valid_json["id"] = "test"

    request = request_factory.get("observations/last/")
    request.user = user
    request._body = json.dumps(collection_valid_json)

    response = last(request)

    assert response.status_code == 500
    assert response.content == b'"Received JSON could not be validated."'


@pytest.mark.django_db
def test_last_valid_json_valid_schema_invalid_collection(
    request_factory, user, collection_valid_json
):
    collection_valid_json["id"] = -1

    request = request_factory.get("observations/last/")
    request.user = user
    request._body = json.dumps(collection_valid_json)

    response = last(request)

    assert response.status_code == 404
    assert response.content == b'"Collection could not be retrieved."'


@pytest.mark.django_db
def test_get_older_valid_collection_with_previous_collection(
    collection_factory, subgarden_factory, user
):
    subgarden = subgarden_factory()
    subgarden.auth_users.set([user])

    collection_1 = collection_factory(garden=subgarden, finished=True)
    collection_2 = collection_factory(garden=subgarden, finished=True)

    assert collection_1.date != collection_2.date

    with patch("phenobs.observations.get.format_records") as format_records_mock:
        if collection_1.date > collection_2.date:
            returned = get_older(collection_1)
            older = collection_2
        else:
            returned = get_older(collection_2)
            older = collection_1

    format_records_mock.assert_called()
    assert returned["id"] == older.id
    assert returned["creator"] == older.creator.username
    assert returned["garden"] == older.garden.id
    assert returned["garden-name"] == older.garden.name
    assert returned["date"] == datetime.strptime(older.date, "%Y-%m-%d").date()
    assert returned["uploaded"] is True
    assert returned["finished"] == older.finished


@pytest.mark.django_db
def test_get_older_valid_collection_no_previous_collection(
    collection_factory, subgarden_factory, user
):
    subgarden = subgarden_factory()
    subgarden.auth_users.set([user])

    collection = collection_factory(garden=subgarden, finished=True)

    with patch("phenobs.observations.get.format_records") as format_records_mock:
        returned = get_older(collection)

    format_records_mock.assert_not_called()
    assert returned is None


@pytest.mark.django_db
def test_get_older_invalid_collection():
    try:
        get_older({})
        assert False
    except Collection.DoesNotExist:
        assert True


@pytest.mark.django_db
def test_format_records_invalid_collection_records():
    returned = format_records({})

    assert returned == {}


@pytest.mark.django_db
def test_format_records_empty_collection_records():
    collection_records = Record.objects.all()

    with patch(
        "phenobs.observations.get.check_no_observation"
    ) as check_no_observation_mock:
        returned = format_records(collection_records)

    check_no_observation_mock.assert_not_called()

    assert returned == {}


@pytest.mark.django_db
def test_format_records_valid_collection_records(record_factory):
    number_of_records = random.randint(1, 10)

    for i in range(number_of_records):
        record_factory()

    collection_records = Record.objects.all()

    with patch(
        "phenobs.observations.get.check_no_observation"
    ) as check_no_observation_mock:
        with patch(
            "phenobs.observations.get.check_maintenance_option"
        ) as check_maintenance_option_mock:
            returned = format_records(collection_records)

    check_no_observation_mock.assert_called()
    check_maintenance_option_mock.assert_called()

    assert check_no_observation_mock.call_count == number_of_records
    assert check_maintenance_option_mock.call_count == number_of_records * 6
    assert len(returned.keys()) == number_of_records


@pytest.mark.django_db
def test_check_no_observation_valid_record_no_observation_true(record_factory):
    record = record_factory(
        initial_vegetative_growth=None,
        young_leaves_unfolding=None,
        flowers_open=None,
        peak_flowering=None,
        ripe_fruits=None,
        senescence=None,
        peak_flowering_estimation=None,
        remarks="test",
    )

    no_obs = check_no_observation(record)

    assert no_obs is True


@pytest.mark.django_db
def test_check_no_observation_valid_record_no_observation_false(record_factory):
    record = record_factory(remarks="")

    no_obs = check_no_observation(record)

    assert no_obs is False


def test_check_no_observation_invalid_record():
    try:
        check_no_observation({})
        assert False
    except AttributeError:
        assert True


def test_check_maintenance_option_valid_maintenance_valid_option():
    assert check_maintenance_option(["cut_partly"], "cut_partly") is True


def test_check_maintenance_option_valid_maintenance_invalid_option():
    assert check_maintenance_option(["cut_partly"], "removed") is False


def test_check_maintenance_option_empty_maintenance():
    assert check_maintenance_option([], "removed") is False


def test_check_maintenance_option_none_maintenance():
    assert check_maintenance_option(None, "removed") is None


def test_check_maintenance_option_invalid_maintenance():
    try:
        check_maintenance_option(12, "removed")
        assert False
    except TypeError as e:
        assert str(e) == "argument of type 'int' is not iterable"
