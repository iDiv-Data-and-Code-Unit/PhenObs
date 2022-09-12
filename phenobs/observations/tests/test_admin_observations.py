import pytest
from django.contrib.messages import get_messages

from phenobs.observations.admin import import_from_csv

from .conftest import csv_file, upload_csv_request


def csv_data_valid(tmp_path, csv_data_generator, delimiter):
    csv_data = csv_data_generator
    for collection in csv_data:
        for obj in collection["records"]:
            record = obj["record"]
            if record.flowers_open != "y":
                record.flowering_intensity = None
            if record.senescence != "y":
                record.senescence_intensity = None

    return csv_file(tmp_path, csv_data, delimiter)


@pytest.fixture
def csv_data_valid_comma(tmp_path, csv_data_generator):
    return csv_data_valid(tmp_path, csv_data_generator, ",")


@pytest.fixture
def csv_data_valid_semicolon(tmp_path, csv_data_generator):
    return csv_data_valid(tmp_path, csv_data_generator, ";")


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
