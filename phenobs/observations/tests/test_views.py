import json
from unittest.mock import patch

import pytest
from django.http.response import Http404, JsonResponse
from django.test import RequestFactory

from phenobs.observations.upload import upload, upload_selected

# from jsonschema.exceptions import ValidationError


@pytest.fixture
def request_factory():
    return RequestFactory()


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


#
#
# @pytest.fixture
# def collection_valid_json(collection, records):
#     return {
#         "id": collection.id,
#         "date": str(collection.date),
#         "creator": collection.creator.username,
#         "finished": collection.finished,
#         "records": {
#             : {
#                 "id": 1,
#                 "order": 1,
#                 "done": true,
#                 "name": "Test",
#                 "initial-vegetative-growth": "no",
#                 "young-leaves-unfolding": "no",
#                 "flowers-opening": "no",
#                 "peak-flowering": "no",
#                 "flowering-intensity": null,
#                 "ripe-fruits": "no",
#                 "senescence": "no",
#                 "senescence-intensity": null,
#                 "covered-artificial": false,
#                 "covered-natural": false,
#                 "cut-partly": false,
#                 "cut-total": false,
#                 "transplanted": false,
#                 "removed": false,
#                 "remarks": "",
#                 "peak-flowering-estimation": "no",
#                 "no-observation": false
#             },
#             "2": {
#                 "id": 2,
#                 "order": 2,
#                 "done": true,
#                 "name": "Testing",
#                 "initial-vegetative-growth": "no",
#                 "young-leaves-unfolding": "no",
#                 "flowers-opening": "no",
#                 "peak-flowering": "no",
#                 "flowering-intensity": null,
#                 "ripe-fruits": "no",
#                 "senescence": "no",
#                 "senescence-intensity": null,
#                 "covered-artificial": false,
#                 "covered-natural": false,
#                 "cut-partly": false,
#                 "cut-total": false,
#                 "transplanted": false,
#                 "removed": false,
#                 "remarks": "",
#                 "peak-flowering-estimation": "no",
#                 "no-observation": false
#             }
#         },
#         "garden": 1,
#         "garden-name": "Test",
#         "last-collection-id": null
#     }
#
#
# @pytest.mark.django_db
# def test_update_collection_invalid_json(collection_valid_json, user):
#     try:
#         update_collection(json.loads(collection_valid_json), user.username)
#         assert True
#     except ValidationError:
#         assert False
#     except Exception:
#         assert True
