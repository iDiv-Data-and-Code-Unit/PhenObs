import random
from unittest.mock import patch

import pytest
from django.http import HttpResponse

from phenobs.observations.download import download, return_csv, return_xlsx


@pytest.mark.django_db
def test_download_valid_method_filetype_csv_valid_collection_valid_json(
    request_factory, user, collection_factory
):
    collection_1 = collection_factory()
    collection_2 = collection_factory()

    request = request_factory.post("observations/download/csv/")
    request.user = user
    request._body = "[%d, %d]" % (collection_1.id, collection_2.id)

    with patch(
        "phenobs.observations.download.return_csv", side_effects=return_csv
    ) as return_csv_mock:
        download(request, "csv")

    return_csv_mock.assert_called()


@pytest.mark.django_db
def test_download_valid_method_filetype_xlsx_valid_collection_valid_json_valid_schema(
    request_factory, user, collection_factory
):
    collection_1 = collection_factory()
    collection_2 = collection_factory()

    request = request_factory.post("observations/download/csv/")
    request.user = user
    request._body = "[%d, %d]" % (collection_1.id, collection_2.id)

    with patch(
        "phenobs.observations.download.return_xlsx", side_effects=return_xlsx
    ) as return_xlsx_mock:
        download(request, "xlsx")

    return_xlsx_mock.assert_called()


@pytest.mark.django_db
def test_download_invalid_method(request_factory, user):
    filetype = random.choice(["csv", "xlsx"])

    request = request_factory.get("observations/download/%s/" % filetype)
    request.user = user
    request._body = "[]"

    response = download(request, filetype)

    assert response.status_code == 405


@pytest.mark.django_db
def test_download_valid_method_invalid_filetype(request_factory, user):
    request = request_factory.post("observations/download/test/")
    request.user = user
    request._body = "[]"

    response = download(request, "test")

    assert response.status_code == 404


@pytest.mark.django_db
def test_download_valid_method_filetype_csv_invalid_json(request_factory, user):
    filetype = random.choice(["csv", "xlsx"])

    request = request_factory.post("observations/download/%s/" % filetype)
    request.user = user
    request._body = "{"

    response = download(request, filetype)

    assert response.status_code == 500


@pytest.mark.django_db
def test_download_valid_method_valid_filetype_valid_json_invalid_schema(
    request_factory, user
):
    filetype = random.choice(["csv", "xlsx"])

    request = request_factory.post("observations/download/%s/" % filetype)
    request.user = user
    request._body = "['test', 'test']"

    response = download(request, filetype)

    assert response.status_code == 500


@pytest.mark.django_db
def test_download_valid_method_valid_filetype_valid_json_valid_schema_invalid_collection(
    request_factory, user
):
    filetype = random.choice(["csv", "xlsx"])

    request = request_factory.post("observations/download/%s/" % filetype)
    request.user = user
    request._body = "[-1]"

    response = download(request, filetype)

    assert response.status_code == 404


@pytest.fixture
def columns():
    return [
        "Garden",
        "Date",
        "Doy",
        "Species",
        "Initial vegetative growth",
        "Young leaves unfolding",
        "Flowers opening",
        "Flowering intensity",
        # "Peak flowering",
        # "Peak flowering estimation",
        "Ripe fruits",
        "Senescence",
        "Senescence intensity",
        "Maintenance",
        "Remarks",
    ]


@pytest.mark.django_db
def test_return_csv_valid_collections(request_factory, user, collection, columns):
    collections = [collection]

    request = request_factory.post("observations/download/csv/")
    request.user = user
    request._body = "[%d]" % collection.id

    response = return_csv(request, columns, collections)

    assert type(response) == HttpResponse
    assert response["content-type"] == "text/csv"
    assert response["Content-Disposition"] == 'attachment; filename="collections.csv"'


@pytest.mark.django_db
def test_return_csv_invalid_collections(request_factory, user, collection, columns):
    collections = collection

    request = request_factory.post("observations/download/csv/")
    request.user = user
    request._body = "[%d]" % collection.id

    response = return_csv(request, columns, collections)

    assert response.status_code == 500


@pytest.mark.django_db
def test_return_csv_invalid_collection(request_factory, user, record, columns):
    collections = [record]

    request = request_factory.post("observations/download/csv/")
    request.user = user
    request._body = "1"

    response = return_csv(request, columns, collections)

    assert response.status_code == 500


@pytest.mark.django_db
def test_return_xlsx_valid_collections(request_factory, user, collection, columns):
    collections = [collection]

    request = request_factory.post("observations/download/xlsx/")
    request.user = user
    request._body = "[%d]" % collection.id

    response = return_xlsx(request, columns, collections)

    assert type(response) == HttpResponse
    assert (
        response["content-type"]
        == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    assert response["Content-Disposition"] == 'attachment; filename="collections.xlsx"'


@pytest.mark.django_db
def test_return_xlsx_invalid_collections(request_factory, user, collection, columns):
    collections = collection

    request = request_factory.post("observations/download/xlsx/")
    request.user = user
    request._body = "[%d]" % collection.id

    response = return_xlsx(request, columns, collections)

    assert response.status_code == 500


@pytest.mark.django_db
def test_return_xlsx_invalid_collection(request_factory, user, record, columns):
    collections = [record]

    request = request_factory.post("observations/download/xlsx/")
    request.user = user
    request._body = "1"

    response = return_xlsx(request, columns, collections)

    assert response.status_code == 500
