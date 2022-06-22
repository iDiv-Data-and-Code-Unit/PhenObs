import json
from datetime import datetime
from unittest.mock import patch

import pytest

from phenobs.observations.get import (
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

# from phenobs.observations.tests.test_upload import collection_valid_json


@pytest.fixture
def collection_valid_json(collection, record_factory, plant_factory):
    plant_1 = plant_factory.create(garden=collection.garden)
    plant_2 = plant_factory.create(garden=collection.garden)
    record_1 = record_factory.create(collection=collection, plant=plant_1)
    record_2 = record_factory.create(collection=collection, plant=plant_2)

    assert plant_1 != plant_2
    assert record_1 != record_2

    return {
        "id": collection.id,
        "date": str(collection.date),
        "creator": collection.creator.username,
        "finished": collection.finished,
        "records": {
            str(plant_1.order): {
                "id": record_1.id,
                "order": int(plant_1.order),
                "done": record_1.done,
                "name": record_1.plant.garden_name,
                "initial-vegetative-growth": record_1.initial_vegetative_growth,
                "young-leaves-unfolding": record_1.young_leaves_unfolding,
                "flowers-opening": record_1.flowers_open,
                "peak-flowering": record_1.peak_flowering,
                "flowering-intensity": record_1.flowering_intensity,
                "ripe-fruits": record_1.ripe_fruits,
                "senescence": record_1.senescence,
                "senescence-intensity": record_1.senescence_intensity,
                "covered-artificial": "covered_artificial" in record_1.maintenance,
                "covered-natural": "covered_natural" in record_1.maintenance,
                "cut-partly": "cut_partly" in record_1.maintenance,
                "cut-total": "cut_total" in record_1.maintenance,
                "transplanted": "transplanted" in record_1.maintenance,
                "removed": "removed" in record_1.maintenance,
                "remarks": record_1.remarks,
                "peak-flowering-estimation": record_1.peak_flowering_estimation,
                "no-observation": False,
            },
            str(plant_2.order): {
                "id": record_2.id,
                "order": int(plant_2.order),
                "done": record_2.done,
                "name": record_2.plant.garden_name,
                "initial-vegetative-growth": record_2.initial_vegetative_growth,
                "young-leaves-unfolding": record_2.young_leaves_unfolding,
                "flowers-opening": record_2.flowers_open,
                "peak-flowering": record_2.peak_flowering,
                "flowering-intensity": record_2.flowering_intensity,
                "ripe-fruits": record_2.ripe_fruits,
                "senescence": record_2.senescence,
                "senescence-intensity": record_2.senescence_intensity,
                "covered-artificial": "covered_artificial" in record_2.maintenance,
                "covered-natural": "covered_natural" in record_2.maintenance,
                "cut-partly": "cut_partly" in record_2.maintenance,
                "cut-total": "cut_total" in record_2.maintenance,
                "transplanted": "transplanted" in record_2.maintenance,
                "removed": "removed" in record_2.maintenance,
                "remarks": record_2.remarks,
                "peak-flowering-estimation": record_2.peak_flowering_estimation,
                "no-observation": False,
            },
        },
        "garden": collection.garden_id,
        "garden-name": collection.garden.name,
        "last-collection-id": None,
    }


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

    assert response.status_code == 400
    assert response.content == b'"Received JSON could not be validated."'


@pytest.mark.django_db
def test_get_collections_admin_user_all(request_factory, admin_user):
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
    request_factory, admin_user, main_garden_factory
):
    main_garden = main_garden_factory()
    main_garden.auth_users.set([admin_user])

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

    assert response.status_code == 400
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

    with patch(
        "phenobs.observations.get.format_records", side_effect=format_records
    ) as format_records_mock:
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
