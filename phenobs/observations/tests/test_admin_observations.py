import pytest
from django.contrib.messages import get_messages

from phenobs.observations.admin import import_from_csv

from .conftest import csv_file, to_rows, upload_csv_request


def csv_data_valid(tmp_path, csv_data_generator, delimiter):
    csv_data = csv_data_generator
    rows = to_rows(csv_data)

    """
        row[0]: Main garden name
        row[1]: Subgarden name
        row[2]: Day
        row[3]: Month
        row[4]: Year
        row[5]: Species
        row[6]: Initial vegetative growth
        row[7]: Young leaves unfolding
        row[8]: Flowers opening
        row[9]: Peak flowering
        row[10]: Flowering intensity
        row[11]: Ripe fruits
        row[12]: Senescence
        row[13]: Senescence intensity
        row[14]: Maintenance
        row[15]: Remarks
    """

    for row in rows:
        if row[8] != "yes":
            row[10] = None
        if row[12] != "yes":
            row[13] = None

    return csv_file(tmp_path, rows, delimiter)


def csv_data_invalid_main_garden(tmp_path, csv_data_generator, delimiter):
    csv_data = csv_data_generator
    rows = to_rows(csv_data)

    for row in rows:
        row[0] = "thisdoesnotexist"

    return csv_file(tmp_path, rows, delimiter)


@pytest.fixture
def csv_data_valid_comma(tmp_path, csv_data_generator):
    return csv_data_valid(tmp_path, csv_data_generator, ",")


@pytest.fixture
def csv_data_valid_semicolon(tmp_path, csv_data_generator):
    return csv_data_valid(tmp_path, csv_data_generator, ";")


@pytest.fixture
def csv_data_invalid_main_garden_comma(tmp_path, csv_data_generator):
    return csv_data_invalid_main_garden(tmp_path, csv_data_generator, ",")


@pytest.fixture
def csv_data_invalid_main_garden_semicolon(tmp_path, csv_data_generator):
    return csv_data_invalid_main_garden(tmp_path, csv_data_generator, ";")


@pytest.mark.django_db
def test_upload_csv_valid_comma(csv_data_valid_comma, request_factory, admin_user):
    file = csv_data_valid_comma

    request = upload_csv_request(request_factory, file, admin_user, "2")

    response = import_from_csv(request)
    messages = list(get_messages(request))

    assert str(messages[0]) == "8 out of 8 listed plants were successfully added."
    assert response.status_code == 302


@pytest.mark.django_db
def test_upload_csv_valid_semicolon(
    csv_data_valid_semicolon, request_factory, admin_user
):
    file = csv_data_valid_semicolon

    request = upload_csv_request(request_factory, file, admin_user, "1")

    response = import_from_csv(request)
    messages = list(get_messages(request))

    assert str(messages[0]) == "8 out of 8 listed plants were successfully added."
    assert response.status_code == 302


@pytest.mark.django_db
def test_upload_csv_comma_invalid_main_garden(
    csv_data_invalid_main_garden_comma, request_factory, admin_user
):
    file = csv_data_invalid_main_garden_comma

    request = upload_csv_request(request_factory, file, admin_user, "2")

    response = import_from_csv(request)
    messages = list(get_messages(request))

    assert (
        str(messages[0])
        == "Upload failed. Garden 'thisdoesnotexist' does not exist. Please check for typos."
    )
    assert response.status_code == 404


@pytest.mark.django_db
def test_upload_csv_semicolon_invalid_main_garden(
    csv_data_invalid_main_garden_semicolon, request_factory, admin_user
):
    file = csv_data_invalid_main_garden_semicolon

    request = upload_csv_request(request_factory, file, admin_user, "1")

    response = import_from_csv(request)
    messages = list(get_messages(request))

    assert (
        str(messages[0])
        == "Upload failed. Garden 'thisdoesnotexist' does not exist. Please check for typos."
    )
    assert response.status_code == 404


@pytest.mark.django_db
def test_upload_csv_invalid_method_comma(
    csv_data_valid_comma, request_factory, admin_user
):
    file = csv_data_valid_comma

    request = upload_csv_request(request_factory, file, admin_user, "2")
    request.method = "GET"

    response = import_from_csv(request)
    messages = list(get_messages(request))

    assert str(messages[0]) == "Method not allowed."
    assert response.status_code == 405


@pytest.mark.django_db
def test_upload_csv_invalid_method_semicolon(
    csv_data_valid_semicolon, request_factory, admin_user
):
    file = csv_data_valid_semicolon

    request = upload_csv_request(request_factory, file, admin_user, "1")
    request.method = "GET"

    response = import_from_csv(request)
    messages = list(get_messages(request))

    assert str(messages[0]) == "Method not allowed."
    assert response.status_code == 405


@pytest.mark.django_db
def test_upload_csv_valid_get(request_factory, admin_user):
    request = request_factory.get("/admin/observations/record/upload-csv/")
    request.user = admin_user

    response = import_from_csv(request)
    messages = list(get_messages(request))

    assert len(messages) == 0
    assert response.status_code == 200
