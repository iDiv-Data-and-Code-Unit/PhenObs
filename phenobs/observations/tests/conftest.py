import csv
import random

import pytest
from django.contrib.auth.models import Group
from django.contrib.messages.storage.fallback import FallbackStorage
from django.contrib.sessions.middleware import SessionMiddleware

# from .factories import *


@pytest.fixture
def admin_group():
    group = Group(name="Admins")
    group.save()
    return group


@pytest.fixture
def user_group():
    group = Group(name="Users")
    group.save()
    return group


@pytest.fixture
def admin_user(admin_group, user_factory):
    user = user_factory(is_staff=True, status="staff")
    user.groups.set([admin_group])
    return user


@pytest.fixture
def default_user(user, user_group):
    user.is_staff = False
    user.groups.set([user_group])
    return user


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


@pytest.fixture
def subgarden_user(subgarden_factory, user):
    subgarden = subgarden_factory()
    subgarden.auth_users.set([user])

    return user


def reverse_map_values(value):
    options = {
        "y": "yes",
        "u": "unsure",
        "m": "missed",
        "no": "no",
    }

    intensities = {
        "5": "5%",
        "10": "10%",
        "15": "15%",
        "20": "20%",
        "25": "25%",
        "30": "30%",
        "35": "35%",
        "40": "40%",
        "45": "45%",
        "50": "50%",
        "55": "55%",
        "60": "60%",
        "65": "65%",
        "70": "70%",
        "75": "75%",
        "80": "80%",
        "85": "85%",
        "90": "90%",
        "95": "95%",
        "100": "100%",
    }

    if value in options:
        return options[value]
    elif value in intensities:
        return intensities[value]
    elif value is None:
        return "nan"
    else:
        return None


@pytest.fixture
def csv_data_generator(
    record_factory, plant_factory, main_garden_factory, subgarden_factory
):
    main_garden_1 = main_garden_factory()
    main_garden_2 = main_garden_factory()

    subgarden_1 = subgarden_factory(main_garden=main_garden_1)
    subgarden_2 = subgarden_factory(main_garden=main_garden_1)
    subgarden_3 = subgarden_factory(main_garden=main_garden_2)
    subgarden_4 = subgarden_factory(main_garden=main_garden_2)

    plant_1 = plant_factory(garden=subgarden_1, active=True)
    plant_2 = plant_factory(garden=subgarden_1, active=True)
    plant_3 = plant_factory(garden=subgarden_2, active=True)
    plant_4 = plant_factory(garden=subgarden_2, active=True)
    plant_5 = plant_factory(garden=subgarden_3, active=True)
    plant_6 = plant_factory(garden=subgarden_3, active=True)
    plant_7 = plant_factory(garden=subgarden_4, active=True)
    plant_8 = plant_factory(garden=subgarden_4, active=True)

    record_1 = record_factory.build()
    record_2 = record_factory.build()
    record_3 = record_factory.build()
    record_4 = record_factory.build()
    record_5 = record_factory.build()
    record_6 = record_factory.build()
    record_7 = record_factory.build()
    record_8 = record_factory.build()

    records = [
        {
            "main_garden": main_garden_1,
            "subgarden": subgarden_1,
            "records": [
                {"record": record_1, "plant": plant_1},
                {"record": record_2, "plant": plant_2},
            ],
        },
        {
            "main_garden": main_garden_1,
            "subgarden": subgarden_2,
            "records": [
                {"record": record_3, "plant": plant_3},
                {"record": record_4, "plant": plant_4},
            ],
        },
        {
            "main_garden": main_garden_2,
            "subgarden": subgarden_3,
            "records": [
                {"record": record_5, "plant": plant_5},
                {"record": record_6, "plant": plant_6},
            ],
        },
        {
            "main_garden": main_garden_2,
            "subgarden": subgarden_4,
            "records": [
                {"record": record_7, "plant": plant_7},
                {"record": record_8, "plant": plant_8},
            ],
        },
    ]

    return records


def to_rows(csv_data):
    rows = []

    for collection in csv_data:
        subgarden = collection["subgarden"]
        main_garden = collection["main_garden"]

        day = random.randint(1, 28)
        month = random.randint(1, 12)
        year = random.randint(1980, 2022)

        for record_obj in collection["records"]:
            record = record_obj["record"]
            plant = record_obj["plant"]

            rows.append(
                [
                    main_garden.name,
                    subgarden.name,
                    day,
                    month,
                    year,
                    plant.garden_name,
                    reverse_map_values(record.initial_vegetative_growth),
                    reverse_map_values(record.young_leaves_unfolding),
                    reverse_map_values(record.flowers_open),
                    reverse_map_values(record.peak_flowering),
                    reverse_map_values(str(record.flowering_intensity)),
                    reverse_map_values(record.ripe_fruits),
                    reverse_map_values(record.senescence),
                    reverse_map_values(str(record.senescence_intensity)),
                    str([x for x in record.maintenance if x != "None"])[1:-1].replace(
                        "'", ""
                    ),
                    record.remarks,
                ]
            )

    return rows


def csv_file(tmp_path, rows, delimiter):
    d = tmp_path / "sub"
    d.mkdir()

    file = open(d / "test.csv", "w")

    writer = csv.writer(file, delimiter=delimiter)
    writer.writerow(
        [
            "Garden",
            "Subgarden",
            "Day",
            "Month",
            "Year",
            "Species",
            "Initial vegetative growth",
            "Young leaves unfolding",
            "Flowers opening",
            "Peak flowering",
            "Flowering intensity",
            "Ripe fruits",
            "Senescence",
            "Senescence intensity",
            "Maintenance",
            "Remarks",
        ]
    )

    for row in rows:
        writer.writerow(row)

    file.close()
    file = open(d / "test.csv", "r")

    return file


def upload_csv_request(request_factory, file, admin_user, delimiter):
    request = request_factory.post(
        "/admin/observations/record/upload-csv/", data={"delimiter": delimiter}
    )
    request.user = admin_user
    request.FILES["csv_upload"] = file

    middleware = SessionMiddleware()
    middleware.process_request(request)
    request.session.save()

    messages = FallbackStorage(request)
    setattr(request, "_messages", messages)

    return request
