import pytest
from django.contrib.messages import get_messages

from phenobs.observations.admin import import_from_csv

from .conftest import (
    csv_file,
    csv_file_missing_columns,
    csv_file_redundant_columns,
    csv_file_wrong_column_names,
    to_rows,
    upload_csv_request,
    upload_csv_request_no_delimiter,
)


def valid_rows(csv_data_generator):
    csv_data = csv_data_generator
    rows = to_rows(csv_data)

    for index in range(len(rows)):
        if rows[index][8] != "yes":
            rows[index][10] = None
        elif len(rows[index][10]) == 0:
            rows[index][10] = "100%"
        if rows[index][12] != "yes":
            rows[index][13] = None
        elif len(rows[index][13]) == 0:
            rows[index][13] = "100%"

    return rows


def csv_data_valid(tmp_path, csv_data_generator, delimiter):
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

    rows = valid_rows(csv_data_generator)
    return csv_file(tmp_path, rows, delimiter)


@pytest.fixture
def csv_data_valid_comma(tmp_path, csv_data_generator):
    return csv_data_valid(tmp_path, csv_data_generator, ",")


@pytest.fixture
def csv_data_valid_semicolon(tmp_path, csv_data_generator):
    return csv_data_valid(tmp_path, csv_data_generator, ";")


@pytest.mark.django_db
def test_upload_csv_valid_comma(csv_data_valid_comma, request_factory, admin_user):
    file = csv_data_valid_comma

    request = upload_csv_request(request_factory, admin_user, "2", file)
    response = import_from_csv(request)
    messages = list(get_messages(request))

    assert response.status_code == 302
    assert str(messages[0]) == "8 out of 8 listed plants were successfully added."


@pytest.mark.django_db
def test_upload_csv_valid_semicolon(
    csv_data_valid_semicolon, request_factory, admin_user
):
    file = csv_data_valid_semicolon

    request = upload_csv_request(request_factory, admin_user, "1", file)
    response = import_from_csv(request)
    messages = list(get_messages(request))

    assert str(messages[0]) == "8 out of 8 listed plants were successfully added."
    assert response.status_code == 302


@pytest.mark.django_db
def test_upload_csv_invalid_method(csv_data_valid_comma, request_factory, admin_user):
    file = csv_data_valid_comma

    request = upload_csv_request(request_factory, admin_user, "2", file)
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


@pytest.mark.django_db
def test_upload_csv_no_file(request_factory, admin_user):
    request = upload_csv_request(request_factory, admin_user, "2")
    response = import_from_csv(request)
    messages = list(get_messages(request))

    assert (
        str(messages[0])
        == "Upload failed. No CSV file was found in the previous request."
    )
    assert response.status_code == 400


@pytest.mark.django_db
def test_upload_csv_invalid_file(request_factory, admin_user):
    request = upload_csv_request(request_factory, admin_user, "2", "test")
    response = import_from_csv(request)
    messages = list(get_messages(request))

    assert (
        str(messages[0])
        == "The uploaded file could not be read. Please make sure to upload a valid file."
    )
    assert response.status_code == 406


@pytest.mark.django_db
def test_upload_csv_not_csv(tmp_path, request_factory, admin_user):
    d = tmp_path / "sub"
    d.mkdir()

    file = open(d / "test.test", "w")

    request = upload_csv_request(request_factory, admin_user, "2", file)
    response = import_from_csv(request)
    messages = list(get_messages(request))

    assert (
        str(messages[0])
        == "The wrong file type was uploaded. Please upload a CSV file."
    )
    assert response.status_code == 406


@pytest.mark.django_db
def test_upload_csv_no_delimiter(csv_data_valid_comma, request_factory, admin_user):
    file = csv_data_valid_comma

    request = upload_csv_request_no_delimiter(request_factory, admin_user, file)
    response = import_from_csv(request)
    messages = list(get_messages(request))

    assert (
        str(messages[0])
        == "Upload failed. No delimiter was chosen. Please choose a delimiter before submitting."
    )
    assert response.status_code == 400


@pytest.mark.django_db
def test_upload_csv_invalid_delimiter(
    csv_data_valid_comma, request_factory, admin_user
):
    file = csv_data_valid_comma

    request = upload_csv_request(request_factory, admin_user, "", file)
    response = import_from_csv(request)
    messages = list(get_messages(request))

    assert (
        str(messages[0])
        == "Upload failed. Please select a delimiter from the available choices."
    )
    assert response.status_code == 400


# TODO: Test NOT UTF-8 case


@pytest.fixture
def csv_data_invalid_main_garden(tmp_path, csv_data_generator):
    rows = valid_rows(csv_data_generator)

    rows[0][0] = "thisdoesnotexist"

    return csv_file(tmp_path, rows, ",")


@pytest.mark.django_db
def test_upload_csv_invalid_main_garden(
    csv_data_invalid_main_garden, request_factory, admin_user
):
    file = csv_data_invalid_main_garden

    request = upload_csv_request(request_factory, admin_user, "2", file)
    response = import_from_csv(request)
    messages = list(get_messages(request))

    assert (
        str(messages[0])
        == "Upload failed. Garden 'thisdoesnotexist' does not exist. Please check for typos."
    )
    assert response.status_code == 404


@pytest.fixture
def csv_data_invalid_subgarden(tmp_path, csv_data_generator):
    rows = valid_rows(csv_data_generator)

    rows[0][1] = "thisdoesnotexist"

    return csv_file(tmp_path, rows, ",")


@pytest.mark.django_db
def test_upload_csv_invalid_subgarden(
    csv_data_invalid_subgarden, request_factory, admin_user
):
    file = csv_data_invalid_subgarden

    request = upload_csv_request(request_factory, admin_user, "2", file)
    response = import_from_csv(request)
    messages = list(get_messages(request))

    assert (
        "Upload failed. Subgarden 'thisdoesnotexist' does not exist in the garden"
        in str(messages[0])
    )
    assert response.status_code == 404


@pytest.fixture
def csv_data_invalid_date(tmp_path, csv_data_generator):
    rows = valid_rows(csv_data_generator)

    rows[0][2] = 31
    rows[0][3] = 2
    rows[0][4] = 2022

    return csv_file(tmp_path, rows, ",")


@pytest.mark.django_db
def test_upload_csv_invalid_date(csv_data_invalid_date, request_factory, admin_user):
    file = csv_data_invalid_date

    request = upload_csv_request(request_factory, admin_user, "2", file)
    response = import_from_csv(request)
    messages = list(get_messages(request))

    assert (
        "Upload failed. Please make sure the entered values form a valid date."
        in str(messages[0])
    )
    assert response.status_code == 400


@pytest.fixture
def csv_data_invalid_species(tmp_path, csv_data_generator):
    rows = valid_rows(csv_data_generator)

    rows[0][5] = "thisdoesnotexist"

    return csv_file(tmp_path, rows, ",")


@pytest.mark.django_db
def test_upload_csv_invalid_species(
    csv_data_invalid_species, request_factory, admin_user
):
    file = csv_data_invalid_species

    request = upload_csv_request(request_factory, admin_user, "2", file)
    response = import_from_csv(request)
    messages = list(get_messages(request))

    assert (
        "Plant with the name 'thisdoesnotexist' does not exist in the subgarden"
        in str(messages[0])
    )
    assert response.status_code == 500


@pytest.fixture
def csv_data_invalid_option(tmp_path, csv_data_generator):
    rows = valid_rows(csv_data_generator)

    rows[0][6] = "thisdoesnotexist"

    return csv_file(tmp_path, rows, ",")


@pytest.mark.django_db
def test_upload_csv_invalid_option(
    csv_data_invalid_option, request_factory, admin_user
):
    file = csv_data_invalid_option

    request = upload_csv_request(request_factory, admin_user, "2", file)
    response = import_from_csv(request)
    messages = list(get_messages(request))

    assert (
        "Upload failed. Unrecognized value 'thisdoesnotexist' "
        "in the field 'initial vegetative growth'." in str(messages[0])
    )
    assert response.status_code == 500


@pytest.fixture
def csv_data_invalid_intensity(tmp_path, csv_data_generator):
    rows = valid_rows(csv_data_generator)

    rows[0][10] = "test"

    return csv_file(tmp_path, rows, ",")


@pytest.mark.django_db
def test_upload_csv_invalid_intensity(
    csv_data_invalid_intensity, request_factory, admin_user
):
    file = csv_data_invalid_intensity

    request = upload_csv_request(request_factory, admin_user, "2", file)
    response = import_from_csv(request)
    messages = list(get_messages(request))

    assert (
        "Upload failed. Unrecognized value 'test' in the field 'flowering intensity'."
        in str(messages[0])
    )
    assert response.status_code == 500


@pytest.fixture
def csv_data_flowers_open_no_intensity_not_empty(tmp_path, csv_data_generator):
    rows = valid_rows(csv_data_generator)

    rows[0][8] = "no"
    rows[0][10] = "100%"

    return csv_file(tmp_path, rows, ",")


@pytest.mark.django_db
def test_upload_csv_flowers_open_no_intensity_not_empty(
    csv_data_flowers_open_no_intensity_not_empty, request_factory, admin_user
):
    file = csv_data_flowers_open_no_intensity_not_empty

    request = upload_csv_request(request_factory, admin_user, "2", file)
    response = import_from_csv(request)
    messages = list(get_messages(request))

    assert (
        "Upload failed. 'Flowering intensity' field should be left "
        "empty if the 'flowers opening' field is not set 'yes'." in str(messages[0])
    )
    assert response.status_code == 500


@pytest.fixture
def csv_data_flowers_open_yes_intensity_empty(tmp_path, csv_data_generator):
    rows = valid_rows(csv_data_generator)

    rows[0][8] = "yes"
    rows[0][10] = None

    return csv_file(tmp_path, rows, ",")


@pytest.mark.django_db
def test_upload_csv_flowers_open_yes_intensity_empty(
    csv_data_flowers_open_yes_intensity_empty, request_factory, admin_user
):
    file = csv_data_flowers_open_yes_intensity_empty

    request = upload_csv_request(request_factory, admin_user, "2", file)
    response = import_from_csv(request)
    messages = list(get_messages(request))

    assert (
        "Upload failed. 'Flowering intensity' field should not"
        " be left empty if the 'flowers opening' field is set 'yes'."
        in str(messages[0])
    )
    assert response.status_code == 500


@pytest.fixture
def csv_data_senescence_no_intensity_not_empty(tmp_path, csv_data_generator):
    rows = valid_rows(csv_data_generator)

    rows[0][12] = "no"
    rows[0][13] = "100%"

    return csv_file(tmp_path, rows, ",")


@pytest.mark.django_db
def test_upload_csv_senescence_no_intensity_not_empty(
    csv_data_senescence_no_intensity_not_empty, request_factory, admin_user
):
    file = csv_data_senescence_no_intensity_not_empty

    request = upload_csv_request(request_factory, admin_user, "2", file)
    response = import_from_csv(request)
    messages = list(get_messages(request))

    assert (
        "Upload failed. 'Senescence intensity' field should be left "
        "empty if the 'senescence' field is not set 'yes'." in str(messages[0])
    )
    assert response.status_code == 500


@pytest.fixture
def csv_data_senescence_yes_intensity_empty(tmp_path, csv_data_generator):
    rows = valid_rows(csv_data_generator)

    rows[0][12] = "yes"
    rows[0][13] = None

    return csv_file(tmp_path, rows, ",")


@pytest.mark.django_db
def test_upload_csv_senescence_yes_intensity_empty(
    csv_data_senescence_yes_intensity_empty, request_factory, admin_user
):
    file = csv_data_senescence_yes_intensity_empty

    request = upload_csv_request(request_factory, admin_user, "2", file)
    response = import_from_csv(request)
    messages = list(get_messages(request))

    assert (
        "Upload failed. 'Senescence intensity' field should not"
        " be left empty if the 'senescence' field is set 'yes'." in str(messages[0])
    )
    assert response.status_code == 500


@pytest.fixture
def csv_data_wrong_maintenance_option(tmp_path, csv_data_generator):
    rows = valid_rows(csv_data_generator)

    rows[0][14] = "cutt"

    return csv_file(tmp_path, rows, ",")


@pytest.mark.django_db
def test_upload_csv_wrong_maintenance_option(
    csv_data_wrong_maintenance_option, request_factory, admin_user
):
    file = csv_data_wrong_maintenance_option

    request = upload_csv_request(request_factory, admin_user, "2", file)
    response = import_from_csv(request)
    messages = list(get_messages(request))

    assert (
        "Upload failed. Maintenance field contains unrecognized keyword 'cutt'"
        in str(messages[0])
    )
    assert response.status_code == 500


@pytest.fixture
def csv_data_no_observation_remarks_empty(tmp_path, csv_data_generator):
    rows = valid_rows(csv_data_generator)

    rows[0][6] = None
    rows[0][7] = None
    rows[0][8] = None
    rows[0][9] = None
    rows[0][10] = None
    rows[0][11] = None
    rows[0][12] = None
    rows[0][13] = None

    rows[0][15] = ""

    return csv_file(tmp_path, rows, ",")


@pytest.mark.django_db
def test_upload_csv_no_observation_remarks_empty(
    csv_data_no_observation_remarks_empty, request_factory, admin_user
):
    file = csv_data_no_observation_remarks_empty

    request = upload_csv_request(request_factory, admin_user, "2", file)
    response = import_from_csv(request)
    messages = list(get_messages(request))

    assert (
        "If all the fields are left empty, it means no observation was"
        " possible. In that case 'Remarks' cannot be left empty." in str(messages[0])
    )
    assert response.status_code == 500


@pytest.fixture
def csv_data_field_empty(tmp_path, csv_data_generator):
    rows = valid_rows(csv_data_generator)

    rows[0][6] = None

    return csv_file(tmp_path, rows, ",")


@pytest.mark.django_db
def test_upload_csv_field_empty(csv_data_field_empty, request_factory, admin_user):
    file = csv_data_field_empty

    request = upload_csv_request(request_factory, admin_user, "2", file)
    response = import_from_csv(request)
    messages = list(get_messages(request))

    assert "'initial vegetative growth' field should not be left empty." in str(
        messages[0]
    )
    assert response.status_code == 500


@pytest.fixture
def csv_data_missing_column(tmp_path, csv_data_generator):
    rows = valid_rows(csv_data_generator)

    return csv_file_missing_columns(tmp_path, rows, ",")


@pytest.mark.django_db
def test_upload_csv_missing_column(
    csv_data_missing_column, request_factory, admin_user
):
    file = csv_data_missing_column

    request = upload_csv_request(request_factory, admin_user, "2", file)
    response = import_from_csv(request)
    messages = list(get_messages(request))

    assert (
        "Upload failed. Some required columns are "
        "missing in the uploaded CSV file. These columns are: ['remarks']"
        in str(messages[0])
    )
    assert response.status_code == 400


@pytest.fixture
def csv_data_wrong_column_name(tmp_path, csv_data_generator):
    rows = valid_rows(csv_data_generator)

    return csv_file_wrong_column_names(tmp_path, rows, ",")


@pytest.mark.django_db
def test_upload_csv_wrong_column_name(
    csv_data_wrong_column_name, request_factory, admin_user
):
    file = csv_data_wrong_column_name

    request = upload_csv_request(request_factory, admin_user, "2", file)
    response = import_from_csv(request)
    messages = list(get_messages(request))

    assert (
        "Upload failed. There are unrecognized columns in the "
        "uploaded CSV file. These columns are: ['Test']" in str(messages[0])
    )
    assert response.status_code == 400


@pytest.fixture
def csv_data_redundant_column_name(tmp_path, csv_data_generator):
    rows = valid_rows(csv_data_generator)

    return csv_file_redundant_columns(tmp_path, rows, ",")


@pytest.mark.django_db
def test_upload_csv_redundant_column_name(
    csv_data_redundant_column_name, request_factory, admin_user
):
    file = csv_data_redundant_column_name

    request = upload_csv_request(request_factory, admin_user, "2", file)
    response = import_from_csv(request)
    messages = list(get_messages(request))

    assert (
        "Upload failed. There are unrecognized columns in "
        "the uploaded CSV file. These columns are: ['Redundant']" in str(messages[0])
    )
    assert response.status_code == 400


@pytest.fixture
def csv_data_plants_not_actively_monitored(tmp_path, csv_data_generator):
    for collection in csv_data_generator:
        for record in collection["records"]:
            record["plant"].active = False
            record["plant"].save()

    rows = valid_rows(csv_data_generator)

    return csv_file(tmp_path, rows, ",")


@pytest.mark.django_db
def test_upload_csv_plants_not_actively_monitored(
    csv_data_plants_not_actively_monitored, request_factory, admin_user
):
    file = csv_data_plants_not_actively_monitored

    request = upload_csv_request(request_factory, admin_user, "2", file)
    response = import_from_csv(request)
    messages = list(get_messages(request))

    assert "but are not actively monitored:" in str(messages[0])
    assert response.status_code == 302


@pytest.fixture
def csv_data_plants_missing(tmp_path, csv_data_generator):
    for collection in csv_data_generator:
        del collection["records"][0]
        break

    rows = valid_rows(csv_data_generator)

    return csv_file(tmp_path, rows, ",")


@pytest.mark.django_db
def test_upload_csv_plants_missing(
    csv_data_plants_missing, request_factory, admin_user
):
    file = csv_data_plants_missing

    request = upload_csv_request(request_factory, admin_user, "2", file)
    response = import_from_csv(request)
    messages = list(get_messages(request))

    assert "Following species were missing for the subgarden" in str(messages[0])
    assert response.status_code == 500
