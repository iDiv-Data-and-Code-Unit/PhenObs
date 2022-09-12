import csv

import factory
import pytest
from django.contrib.admin.sites import AdminSite
from django.test import Client

from phenobs.gardens.models import Garden
from phenobs.plants.admin import PlantAdmin
from phenobs.plants.models import Plant


@pytest.fixture
def plant_admin():
    instance = PlantAdmin(model=Plant, admin_site=AdminSite)
    return instance


def csv_plants(
    tmp_path, subgarden_factory, main_garden_factory, plant_factory, delimiter
):
    main_garden = main_garden_factory(name=factory.Faker("city"))
    subgarden_1 = subgarden_factory(name=factory.Faker("city"), main_garden=main_garden)
    subgarden_2 = subgarden_factory(name=factory.Faker("city"), main_garden=main_garden)
    subgarden_3 = subgarden_factory(name=factory.Faker("city"), main_garden=main_garden)

    plant_1 = plant_factory.build()
    plant_2 = plant_factory.build()
    plant_3 = plant_factory.build()
    plant_4 = plant_factory.build()
    plant_5 = plant_factory.build()
    plant_6 = plant_factory.build()

    d = tmp_path / "sub"
    d.mkdir()

    file = open(d / "test.csv", "w")

    writer = csv.writer(file, delimiter=delimiter)
    writer.writerow(["Order", "Name", "Subgarden"])
    writer.writerow([1, plant_1.garden_name, subgarden_1.name])
    writer.writerow([2, plant_2.garden_name, subgarden_1.name])
    writer.writerow([1, plant_3.garden_name, subgarden_2.name])
    writer.writerow([2, plant_4.garden_name, subgarden_2.name])
    writer.writerow([1, plant_5.garden_name, subgarden_3.name])
    writer.writerow([2, plant_6.garden_name, subgarden_3.name])

    file.close()
    file = open(d / "test.csv", "r")

    return file, main_garden.id


@pytest.fixture
def csv_plants_comma_duplicate_plants(
    tmp_path, subgarden_factory, main_garden_factory, plant_factory
):
    main_garden = main_garden_factory(name=factory.Faker("city"))
    subgarden_1 = subgarden_factory(name=factory.Faker("city"), main_garden=main_garden)

    plant_1 = plant_factory.build()

    d = tmp_path / "sub"
    d.mkdir()

    file = open(d / "test.csv", "w")

    writer = csv.writer(file, delimiter=",")
    writer.writerow(["Order", "Name", "Subgarden"])
    writer.writerow([1, plant_1.garden_name, subgarden_1.name])
    writer.writerow([2, plant_1.garden_name, subgarden_1.name])

    file.close()
    file = open(d / "test.csv", "r")

    return file, main_garden.id, plant_1.garden_name, subgarden_1.name


@pytest.fixture
@pytest.mark.django_db
def csv_plants_comma(tmp_path, subgarden_factory, main_garden_factory, plant_factory):
    return csv_plants(
        tmp_path, subgarden_factory, main_garden_factory, plant_factory, ","
    )


@pytest.fixture
@pytest.mark.django_db
def csv_plants_semicolon(
    tmp_path, subgarden_factory, main_garden_factory, plant_factory
):
    return csv_plants(
        tmp_path, subgarden_factory, main_garden_factory, plant_factory, ";"
    )


@pytest.mark.django_db
def test_upload_csv_comma_success(csv_plants_comma):
    c = Client()

    file, main_garden_id = csv_plants_comma

    response = c.post(
        "/admin/plants/plant/upload-csv/",
        {"csv_upload": file, "delimiter": "2", "garden": main_garden_id},
    )

    assert response.status_code == 302


@pytest.mark.django_db
def test_upload_csv_semicolon_success(csv_plants_semicolon):
    c = Client()

    file, main_garden_id = csv_plants_semicolon

    response = c.post(
        "/admin/plants/plant/upload-csv/",
        {"csv_upload": file, "delimiter": "1", "garden": main_garden_id},
    )

    assert response.status_code == 302


@pytest.mark.django_db
def test_upload_csv_comma_no_file(csv_plants_comma):
    c = Client()

    file, main_garden_id = csv_plants_comma

    response = c.post(
        "/admin/plants/plant/upload-csv/", {"delimiter": "2", "garden": main_garden_id}
    )

    messages = list(response.context["messages"])

    assert response.status_code == 400
    assert (
        str(messages[0])
        == "Upload failed. No CSV file was found in the previous request."
    )


@pytest.mark.django_db
def test_upload_csv_method_not_allowed(csv_plants_comma):
    c = Client()

    file, main_garden_id = csv_plants_comma

    response = c.get(
        "/admin/plants/plant/upload-csv/",
        {"csv_upload": file, "delimiter": "2", "garden": main_garden_id},
    )

    messages = list(response.context["messages"])

    assert response.status_code == 405
    assert str(messages[0]) == "Method not allowed."


@pytest.mark.django_db
def test_upload_csv_comma_no_delimiter(csv_plants_comma):
    c = Client()

    file, main_garden_id = csv_plants_comma

    response = c.post(
        "/admin/plants/plant/upload-csv/",
        {"csv_upload": file, "garden": main_garden_id},
    )

    messages = list(response.context["messages"])

    assert response.status_code == 400
    assert (
        str(messages[0])
        == "Upload failed. No delimiter was chosen. Please choose a delimiter before submitting."
    )


@pytest.mark.django_db
def test_upload_csv_comma_invalid_delimiter(csv_plants_comma):
    c = Client()

    file, main_garden_id = csv_plants_comma

    response = c.post(
        "/admin/plants/plant/upload-csv/",
        {"csv_upload": file, "delimiter": "", "garden": main_garden_id},
    )

    messages = list(response.context["messages"])

    assert response.status_code == 400
    assert (
        str(messages[0])
        == "Upload failed. Please select a delimiter from the available choices."
    )


@pytest.mark.django_db
def test_upload_csv_comma_wrong_filetype(tmp_path):
    c = Client()

    d = tmp_path / "sub"
    d.mkdir()
    file = open(d / "test.test", "w")
    file.close()

    response = c.post(
        "/admin/plants/plant/upload-csv/",
        {"csv_upload": open(d / "test.test", "r"), "delimiter": "", "garden": ""},
    )

    messages = list(response.context["messages"])

    assert response.status_code == 400
    assert (
        str(messages[0])
        == "The wrong file type was uploaded. Please upload a CSV file."
    )


@pytest.mark.django_db
def test_upload_csv_comma_empty_garden(csv_plants_comma):
    c = Client()

    file, main_garden_id = csv_plants_comma

    response = c.post(
        "/admin/plants/plant/upload-csv/",
        {"csv_upload": file, "delimiter": "2", "garden": ""},
    )

    messages = list(response.context["messages"])

    assert response.status_code == 400
    assert str(messages[0]) == "Upload failed. No garden was provided."


@pytest.mark.django_db
def test_upload_csv_comma_no_garden(csv_plants_comma):
    c = Client()

    file, main_garden_id = csv_plants_comma

    response = c.post(
        "/admin/plants/plant/upload-csv/",
        {
            "csv_upload": file,
            "delimiter": "2",
        },
    )

    messages = list(response.context["messages"])

    assert response.status_code == 400
    assert (
        str(messages[0])
        == "Upload failed. KeyError was raised. Please make sure the chosen delimiter"
        " is correct and a garden is provided."
    )


@pytest.mark.django_db
def test_upload_csv_comma_garden_not_found(csv_plants_comma):
    c = Client()

    file, main_garden_id = csv_plants_comma

    response = c.post(
        "/admin/plants/plant/upload-csv/",
        {"csv_upload": file, "delimiter": "2", "garden": -1},
    )

    messages = list(response.context["messages"])

    assert response.status_code == 404
    assert (
        str(messages[0])
        == "Upload failed. Selected garden was not found in the database."
    )


@pytest.mark.django_db
def test_upload_csv_comma_wrong_delimiter(csv_plants_comma):
    c = Client()

    file, main_garden_id = csv_plants_comma

    response = c.post(
        "/admin/plants/plant/upload-csv/",
        {"csv_upload": file, "delimiter": "1", "garden": main_garden_id},
    )

    messages = list(response.context["messages"])

    assert response.status_code == 400
    assert (
        str(messages[0]) == "Upload failed. KeyError was raised. Please make sure the"
        " chosen delimiter is correct and a garden is provided."
    )


@pytest.mark.django_db
def test_upload_csv_comma_not_main_garden(csv_plants_comma, subgarden_factory):
    c = Client()

    file, main_garden_id = csv_plants_comma
    subgarden = subgarden_factory()

    response = c.post(
        "/admin/plants/plant/upload-csv/",
        {"csv_upload": file, "delimiter": "2", "garden": subgarden.id},
    )

    messages = list(response.context["messages"])

    assert response.status_code == 400
    assert str(messages[0]) == "Upload failed. Selected garden is not a main garden."


@pytest.mark.django_db
def test_upload_csv_comma_subgarden_not_found(tmp_path, main_garden_factory):
    main_garden = main_garden_factory()

    d = tmp_path / "sub"
    d.mkdir()
    file = open(d / "test.csv", "w")

    plant_name = factory.Faker("name")
    subgarden_name = factory.Faker("city")

    writer = csv.writer(file, delimiter=",")
    writer.writerow(["Order", "Name", "Subgarden"])
    writer.writerow([1, plant_name, subgarden_name])
    file.close()

    c = Client()

    response = c.post(
        "/admin/plants/plant/upload-csv/",
        {
            "csv_upload": open(d / "test.csv", "r"),
            "delimiter": "2",
            "garden": main_garden.id,
        },
    )

    messages = list(response.context["messages"])

    assert response.status_code == 500
    assert (
        str(messages[0]) == 'Upload failed. Listed subgarden "%s" for the '
        'plant "%s" was not found in the main'
        ' garden "%s". '
        "Please check the CSV file for typos and create the missing subgardens."
        % (
            subgarden_name,
            plant_name,
            main_garden.name,
        )
    )


@pytest.mark.django_db
def test_upload_csv_comma_plant_already_exists(csv_plants_comma_duplicate_plants):
    c = Client()

    file, main_garden_id, plant_name, subgarden_name = csv_plants_comma_duplicate_plants

    response = c.post(
        "/admin/plants/plant/upload-csv/",
        {"csv_upload": file, "delimiter": "2", "garden": main_garden_id},
    )

    messages = list(response.context["messages"])

    assert response.status_code == 500
    assert str(
        messages[0]
    ) == 'Plant with the name "%s" already exists in the subgarden "%s". It was skipped.' % (
        plant_name,
        subgarden_name,
    )


@pytest.mark.django_db
def test_upload_csv_comma_multiple_plants(
    csv_plants_comma_duplicate_plants, plant_factory
):
    c = Client()

    file, main_garden_id, plant_name, subgarden_name = csv_plants_comma_duplicate_plants
    plant_factory(
        garden_name=plant_name, garden=Garden.objects.get(name=subgarden_name)
    )
    plant_factory(
        garden_name=plant_name, garden=Garden.objects.get(name=subgarden_name)
    )

    response = c.post(
        "/admin/plants/plant/upload-csv/",
        {"csv_upload": file, "delimiter": "2", "garden": main_garden_id},
    )

    messages = list(response.context["messages"])

    assert response.status_code == 500
    assert (
        str(messages[0])
        == 'Plant was skipped. Multiple plants with the name "%s" in the subgarden'
        ' "%s" were found.'
        " Please delete redundant plants."
        % (
            plant_name,
            subgarden_name,
        )
    )
