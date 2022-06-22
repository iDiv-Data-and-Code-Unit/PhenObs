import json
from unittest.mock import patch

import pytest
from django.http.response import Http404, JsonResponse
from jsonschema.exceptions import ValidationError

from phenobs.observations.upload import (
    normalize_record,
    update_collection,
    upload,
    upload_selected,
)


@pytest.fixture
def post_request_upload_valid_json(request_factory, user):
    request = request_factory.post("/observations/upload/")
    request.user = user
    request._body = "{}"

    return request


@pytest.fixture
def post_request_upload_invalid_json(post_request_upload_valid_json):
    request = post_request_upload_valid_json
    request._body = "{"

    return request


@pytest.fixture
def get_request_upload_valid_json(request_factory, user):
    request = request_factory.get("/observations/upload/")
    request.user = user
    request._body = "{}"

    return request


@pytest.fixture
def post_request_upload_selected_valid_json(request_factory, user):
    request = request_factory.post("/observations/save/")
    request.user = user
    request._body = "[{}, {}]"

    return request


@pytest.fixture
def post_request_upload_selected_invalid_json(post_request_upload_selected_valid_json):
    request = post_request_upload_selected_valid_json
    request._body = "[{}, {}"

    return request


@pytest.fixture
def get_request_upload_selected_valid_json(request_factory, user):
    request = request_factory.get("/observations/save/")
    request.user = user
    request._body = "[{}, {}]"

    return request


@pytest.mark.django_db
def test_upload_with_post(post_request_upload_valid_json):
    with patch(
        "phenobs.observations.upload.update_collection"
    ) as update_collection_mock:
        response = upload(post_request_upload_valid_json)

    update_collection_mock.assert_called_once_with(
        {}, post_request_upload_valid_json.user.username
    )

    assert isinstance(response, JsonResponse)
    assert json.loads(response.content) == "OK"


@pytest.mark.django_db
def test_upload_with_get(get_request_upload_valid_json):
    try:
        upload(get_request_upload_valid_json)
        assert False
    except Http404:
        assert True


@pytest.mark.django_db
def test_upload_invalid_json(post_request_upload_invalid_json):
    response = upload(post_request_upload_invalid_json)

    assert isinstance(response, JsonResponse)
    assert json.loads(response.content) == "Upload failed. JSON decoding error."


@pytest.mark.django_db
def test_upload_selected_with_post(post_request_upload_selected_valid_json):
    with patch(
        "phenobs.observations.upload.update_collection"
    ) as update_collection_mock:
        response = upload_selected(post_request_upload_selected_valid_json)

    update_collection_mock.assert_called_with(
        {}, post_request_upload_selected_valid_json.user.username
    )

    assert update_collection_mock.call_count == 2
    assert isinstance(response, JsonResponse)
    assert json.loads(response.content) == "OK"


@pytest.mark.django_db
def test_upload_selected_invalid_json(post_request_upload_selected_invalid_json):
    response = upload(post_request_upload_selected_invalid_json)

    assert isinstance(response, JsonResponse)
    assert json.loads(response.content) == "Upload failed. JSON decoding error."


@pytest.mark.django_db
def test_upload_selected_with_get(get_request_upload_selected_valid_json):
    try:
        upload(get_request_upload_selected_valid_json)
        assert False
    except Http404:
        assert True


@pytest.fixture
def collection_invalid_key_json():
    return "{}"


@pytest.fixture
def collection_invalid_json():
    return '{"id": "test"}'


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


@pytest.fixture
def collection_valid_json_no_observation(collection_valid_json):
    collection = collection_valid_json

    for key in collection["records"]:
        assert isinstance(key, str)
        collection["records"][key]["no-observation"] = True

    return collection


@pytest.mark.django_db
def test_update_collection_valid_json(collection_valid_json, user):
    try:
        update_collection(collection_valid_json, user.username)
        assert True
    except ValidationError:
        assert False


@pytest.mark.django_db
def test_normalize_record_valid_json_no_observation(
    collection_valid_json_no_observation,
):
    for key in collection_valid_json_no_observation["records"]:
        record = normalize_record(collection_valid_json_no_observation["records"][key])

        assert record["no-observation"] is True
        assert record["initial-vegetative-growth"] is None
        assert record["young-leaves-unfolding"] is None
        assert record["flowers-opening"] is None
        assert record["peak-flowering"] is None
        assert record["flowering-intensity"] is None
        assert record["ripe-fruits"] is None
        assert record["senescence"] is None
        assert record["senescence-intensity"] is None
        assert record["peak-flowering-estimation"] is None


@pytest.mark.django_db
def test_update_collection_valid_json_no_observation(
    collection_valid_json_no_observation, user
):
    try:
        with patch(
            "phenobs.observations.upload.normalize_record", side_effect=normalize_record
        ) as normalize_record_mock:
            update_collection(collection_valid_json_no_observation, user.username)

        normalize_record_mock.assert_called()
        assert normalize_record_mock.call_count == 2

    except ValidationError:
        assert False


@pytest.mark.django_db
def test_update_collection_invalid_key_json(collection_invalid_key_json, user):
    try:
        update_collection(json.loads(collection_invalid_key_json), user.username)
        assert False
    except KeyError:
        assert True


@pytest.mark.django_db
def test_update_collection_invalid_json(collection_invalid_json, user):
    try:
        update_collection(json.loads(collection_invalid_json), user.username)
        assert False
    except ValidationError:
        assert True
