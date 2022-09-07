from datetime import date, datetime, timedelta

from django import forms
from django.contrib import admin, messages
from django.shortcuts import redirect, render
from django.urls import path
from django.utils import timezone
from django.utils.datastructures import MultiValueDictKeyError
from pandas import read_csv

from ..gardens.models import Garden
from .models import Collection, Plant, Record


class CsvImportForm(forms.Form):
    csv_upload = forms.FileField()
    DELIMITER_CHOICES = [("1", "Semicolon (;)"), ("2", "Comma (,)")]
    delimiter = forms.ChoiceField(widget=forms.RadioSelect, choices=DELIMITER_CHOICES)


@admin.register(Collection)
class CollectionAdmin(admin.ModelAdmin):
    """Registers Collection model in Django Admin with the given configuration."""

    list_display = ("id", "garden", "date", "creator", "finished")
    list_display_links = ("id", "date")
    search_fields = ("id", "garden", "user")
    list_per_page = 10


@admin.register(Record)
class RecordAdmin(admin.ModelAdmin):
    """Registers Record model in Django Admin with the given configuration."""

    list_display = (
        "id",
        "collection",
        "timestamp_edit",
        "editor",
        "remarks",
        "done",
    )
    list_display_links = ("id", "collection", "timestamp_edit")
    search_fields = ("id", "collection", "editor", "maintenance", "remarks", "done")
    list_per_page = 10

    def get_urls(self):
        urls = super().get_urls()
        new_urls = [
            path("upload-csv/", self.upload_csv),
        ]
        return new_urls + urls

    def upload_csv(self, request):
        add_data_status = 200
        added = 0
        total = 0
        status = 200

        if request.method == "POST":
            try:
                csv_file = request.FILES["csv_upload"]

                # delimiter = '1' for semicolon
                # delimiter = '2' for comma
                try:
                    delimiter = request.POST["delimiter"]

                    if not csv_file.name.endswith(".csv"):
                        messages.error(
                            request,
                            "The wrong file type was uploaded. Please upload a CSV file.",
                        )
                        status = 406

                    if delimiter == "2":
                        try:
                            file_data = read_csv(csv_file, sep=",")
                            print("IMPORT DATA FROM CSV: COMMA SEPARATED")
                            print(file_data)
                            format_data_status, formatted, total, data = format_data(
                                request, file_data
                            )
                            print(format_data_status, formatted, total)

                            if format_data_status == 200 and formatted == total:
                                add_data_status, added = add_data(request, data)
                            else:
                                messages.error(
                                    request,
                                    "Please fix the typos and errors and try again",
                                )
                                status = 500

                        except Exception as e:
                            messages.error(request, e)
                            status = 500

                    elif delimiter == "1":
                        try:
                            file_data = read_csv(csv_file, sep=";")
                            print("IMPORT DATA FROM CSV: SEMICOLON SEPARATED")
                            print(file_data)
                            format_data_status, formatted, total, data = format_data(
                                request, file_data
                            )
                            print(format_data_status, formatted, total)
                            if format_data_status == 200 and formatted == total:
                                add_data_status, added = add_data(request, data)
                            else:
                                messages.error(
                                    request,
                                    "Please fix the typos and errors and try again",
                                )
                                status = 500

                        except Exception as e:
                            messages.error(request, e)
                            status = 500

                    else:
                        messages.error(
                            request,
                            "Upload failed. Please select a delimiter from the available choices.",
                        )
                        status = 400

                except KeyError:
                    messages.error(
                        request,
                        "Upload failed. No delimiter was chosen. Please choose a delimiter before submitting.",
                    )
                    status = 400

            except MultiValueDictKeyError:
                messages.error(
                    request,
                    "Upload failed. No CSV file was found in the previous request.",
                )
                status = 400
            except Exception as e:
                messages.error(
                    request,
                    "Upload failed. Following error message was received: %s" % e,
                )
                status = 500

        else:
            if "csv_upload" in request.FILES:
                messages.error(request, "Method not allowed.")
                status = 405

        form = CsvImportForm()
        context = {"form": form}

        if add_data_status != 200 and status == 200:
            status = add_data_status

        if status == 200 and added > 0:
            messages.success(
                request,
                "%d out of %d listed plants were successfully added." % (added, total),
            )

        if status == 200 and request.method == "POST":
            return redirect("/admin/observations/record/")

        return render(request, "admin/import_from_csv.html", context, status=status)


def format_data(request, file_data):
    formatted = 0
    total = 0
    status = 200

    records = []
    subgardens = {}

    try:
        columns = file_data.columns

        required_columns = [
            "garden",
            "subgarden",
            "day",
            "month",
            "year",
            "species",
            "initial vegetative growth",
            "young leaves unfolding",
            "flowers opening",
            "peak flowering",
            "flowering intensity",
            "ripe fruits",
            "senescence",
            "senescence intensity",
            "maintenance",
            "remarks",
        ]

        redundant_columns = []

        for column in columns:
            if column.lower() not in required_columns:
                redundant_columns.append(column)
            else:
                required_columns.pop(required_columns.index(column.lower()))

        if len(redundant_columns) > 0:
            messages.error(
                request,
                "Upload failed. There are unrecognized columns in the uploaded CSV file. These columns are: %s\n"
                "Please use the data entry template to avoid typos and errors."
                % str(redundant_columns),
            )
            status = 400

        if len(required_columns) > 0:
            messages.error(
                request,
                "Upload failed. Some required columns are missing in the uploaded CSV file. These columns are: %s\n"
                "Please use the data entry template to avoid typos and errors."
                % str(required_columns),
            )
            status = 400

        if status == 200:
            for index, row in file_data.iterrows():
                record = {}
                for column in columns:
                    key = column.lower().replace(" ", "_")
                    record[key] = row[column]

                records.append(record)

            total = len(records)
            print(total)

            for record in records:
                try:
                    garden = Garden.objects.get(name=record["garden"])
                    print(garden)
                    try:
                        subgarden = Garden.objects.get(
                            name=record["subgarden"], main_garden=garden
                        )
                        print("Subgarden", subgarden)

                        if "%s: %s" % (garden.name, subgarden.name) not in subgardens:
                            subgardens["%s: %s" % (garden.name, subgarden.name)] = {
                                "object": subgarden,
                                "collections": {},
                            }

                        try:
                            day = int(record["day"])
                            month = int(record["month"])
                            year = int(record["year"])

                            collection_date = datetime(day=day, month=month, year=year)

                            print(subgardens)
                            if (
                                collection_date.strftime("%d.%m.%Y")
                                not in subgardens[
                                    "%s: %s" % (garden.name, subgarden.name)
                                ]["collections"]
                            ):

                                doy = (
                                    collection_date.date()
                                    - date(collection_date.year, 1, 1)
                                    + timedelta(1)
                                )

                                subgardens["%s: %s" % (garden.name, subgarden.name)][
                                    "collections"
                                ][collection_date.strftime("%d.%m.%Y")] = {
                                    "date": collection_date.date(),
                                    "creator": request.user,
                                    "doy": doy,
                                    "finished": True,
                                    "records": [],
                                }
                        except ValueError:
                            messages.error(
                                request,
                                "Upload failed. Please make sure the entered values form a valid date. "
                                "Entered values were Day: '%s' Month: '%s' Year '%s'. "
                                "Please check the columns 'Day', 'Month' and 'Year'."
                                % (record["day"], record["month"], record["year"]),
                            )
                            status = 400
                            break

                        except KeyError:
                            messages.error(
                                request,
                                "Upload failed. KeyError was raised. "
                                "Please make sure the column names are correct. "
                                "Please check the columns 'Day', 'Month' and 'Year'.",
                            )
                            status = 400
                            break

                        subgardens["%s: %s" % (garden.name, subgarden.name)][
                            "collections"
                        ][collection_date.strftime("%d.%m.%Y")]["records"].append(
                            record
                        )

                        formatted = formatted + 1
                    except Garden.DoesNotExist:
                        messages.error(
                            request,
                            "Upload failed. Subgarden '%s' does not exist in the garden '%s'. Please check for typos."
                            % (record["subgarden"], record["garden"]),
                        )
                        status = 404
                        break
                    except KeyError as e:
                        messages.error(
                            request,
                            "Upload failed. KeyError was raised: '%s'. "
                            "Please make sure the column names are correct. Check 'Subgarden' column"
                            % e,
                        )
                        status = 400
                except Garden.DoesNotExist:
                    messages.error(
                        request,
                        "Upload failed. Garden '%s' does not exist. Please check for typos."
                        % record["garden"],
                    )
                    status = 404
                except KeyError:
                    messages.error(
                        request,
                        "Upload failed. KeyError was raised. "
                        "Please make sure the column names are correct. Check 'Garden' column",
                    )
                    status = 400
    except Exception as e:
        messages.error(
            request, "Upload failed. Following error message was received: %s" % e
        )
        status = 500

    return status, formatted, total, subgardens


def add_data(request, data):
    status = 200
    added = 0

    for subgarden_key in data:
        subgarden = data[subgarden_key]
        if status == 200:
            try:
                for key in subgarden["collections"]:
                    collection = subgarden["collections"][key]
                    all_plants = Plant.objects.filter(garden=subgarden["object"])
                    all_active_plants = all_plants.filter(active=True)
                    available_plants = []
                    deactivated_plants = []

                    for plant in all_active_plants:
                        available_plants.append(plant.garden_name)

                    print(collection)

                    for record in collection["records"]:
                        if all_active_plants.filter(garden_name=record["species"]):
                            available_plants.pop(
                                available_plants.index(record["species"])
                            )
                        elif all_plants.filter(garden_name=record["species"]):
                            deactivated_plants.append(record["species"])
                        else:
                            messages.error(
                                request,
                                "Upload failed. Unrecognized species was found in the collection. "
                                "Plant with the name '%s' does not exist in the subgarden '%s'."
                                % (record["species"], subgarden["object"]),
                            )
                            status = 500
                            break

                    if len(available_plants) > 0:
                        messages.error(
                            request,
                            "Upload failed. Following species were missing for the subgarden '%s' from uploaded CSV: %s"
                            % (subgarden["object"], available_plants),
                        )
                        status = 500
                        break

                    if status == 200:
                        if len(deactivated_plants) > 0:
                            messages.warning(
                                request,
                                "Following plants were found in the subgarden '%s' but are not actively monitored: %s"
                                % (subgarden["object"], deactivated_plants),
                            )

                        new_collection = Collection.objects.create(
                            garden=subgarden["object"],
                            date=collection["date"],
                            creator=collection["creator"],
                            finished=collection["finished"],
                            doy=collection["doy"].days,
                        )
                        print("Collection", collection)

                        timestamp = timezone.now()

                        for record in collection["records"]:
                            try:
                                plant = Plant.objects.get(
                                    garden_name=record["species"],
                                    garden=subgarden["object"],
                                )

                                maintenance = []
                                maintenance_options = [
                                    "cut_partly",
                                    "cut_total",
                                    "covered_natural",
                                    "covered_artificial",
                                    "transplanted",
                                    "removed",
                                ]

                                chosen_maintenance_values = []

                                if str(record["maintenance"]) != "nan":
                                    maintenance = (
                                        record["maintenance"]
                                        .replace(" ", "")
                                        .split(",")
                                    )

                                for option in maintenance:
                                    if option not in maintenance_options:
                                        messages.error(
                                            request,
                                            "Upload failed. Maintenance field contains unrecognized keyword '%s' "
                                            "for the record with Species '%s' on Date '%s' in the Garden '%s: %s'."
                                            % (
                                                option,
                                                record["species"],
                                                collection["date"],
                                                record["garden"],
                                                record["subgarden"],
                                            ),
                                        )
                                        status = 500
                                        break
                                    else:
                                        chosen_maintenance_values.append(option)

                                if status == 200:
                                    (
                                        status,
                                        no_observation,
                                        mapped_record,
                                    ) = map_record_values(request, record)
                                    if status == 200:
                                        if (
                                            no_observation is True
                                            and len(mapped_record["remarks"]) == 0
                                        ):
                                            messages.error(
                                                request,
                                                "If all the fields are left empty, it means no observation was "
                                                "possible. In that case 'Remarks' cannot be left empty. "
                                                "Species '%s' on Date '%s' in the Garden '%s: %s'."
                                                % (
                                                    record["species"],
                                                    collection["date"],
                                                    record["garden"],
                                                    record["subgarden"],
                                                ),
                                            )
                                            status = 500
                                            break

                                        Record(
                                            collection=new_collection,
                                            editor=request.user,
                                            timestamp_entry=timestamp,
                                            timestamp_edit=timestamp,
                                            plant=plant,
                                            initial_vegetative_growth=mapped_record[
                                                "initial_vegetative_growth"
                                            ],
                                            young_leaves_unfolding=mapped_record[
                                                "young_leaves_unfolding"
                                            ],
                                            flowers_open=mapped_record[
                                                "flowers_opening"
                                            ],
                                            peak_flowering=mapped_record[
                                                "peak_flowering"
                                            ],
                                            peak_flowering_estimation="no",
                                            flowering_intensity=mapped_record[
                                                "flowering_intensity"
                                            ],
                                            ripe_fruits=mapped_record["ripe_fruits"],
                                            senescence=mapped_record["senescence"],
                                            senescence_intensity=mapped_record[
                                                "senescence_intensity"
                                            ],
                                            remarks=mapped_record["remarks"],
                                            maintenance=chosen_maintenance_values,
                                            done=True,
                                        ).save()

                                        added = added + 1
                            except Plant.DoesNotExist:
                                messages.error(
                                    request,
                                    "Upload failed. Plant with the name '%s' does not exist in the Subgarden '%s'"
                                    % (
                                        record["species"],
                                        "%s: %s"
                                        % (
                                            subgarden["object"].main_garden.name,
                                            subgarden["object"].name,
                                        ),
                                    ),
                                )
                                status = 404
            except Exception as e:
                messages.error(
                    request, "Upload failed. Following message was received: '%s'" % e
                )
                status = 500

    print("**********************")
    print(status, added)
    print("**********************")
    return status, added


def map_values(value, key):
    options = {
        "yes": "y",
        "unsure": "u",
        "missed": "m",
        "no": "no",
    }

    intensities = {
        "5%": 5,
        "10%": 10,
        "15%": 15,
        "20%": 20,
        "25%": 25,
        "30%": 30,
        "35%": 35,
        "40%": 40,
        "45%": 45,
        "50%": 50,
        "55%": 55,
        "60%": 60,
        "65%": 65,
        "70%": 70,
        "75%": 75,
        "80%": 80,
        "85%": 85,
        "90%": 90,
        "95%": 95,
        "100%": 100,
    }

    if value in options:
        return options[value]
    elif value in intensities and "intensity" in key:
        return intensities[value]
    elif value is None or str(value) == "nan":
        return "null"
    else:
        return None


def map_record_values(request, record):
    status = 200
    no_observation = False
    null_fields = []

    keys = [
        "initial_vegetative_growth",
        "young_leaves_unfolding",
        "flowers_opening",
        "peak_flowering",
        "flowering_intensity",
        "ripe_fruits",
        "senescence",
        "senescence_intensity",
    ]

    for key in keys:
        value = map_values(record[key], key)

        if value == "null":
            null_fields.append(key)
            record[key] = None
            continue

        elif value is None:
            messages.error(
                request,
                "Upload failed. Unrecognized value '%s' in the field '%s'. Please check for typos."
                "Subgarden: '%s'\nDay: '%s'\nMonth: '%s'\nYear: '%s'\nSpecies: '%s'"
                % (
                    record[key],
                    key.replace("_", " "),
                    "%s: %s" % (record["garden"], record["subgarden"]),
                    record["day"],
                    record["month"],
                    record["year"],
                    record["species"],
                ),
            )
            status = 500
            break

        record[key] = value

    if status == 200:
        if (
            record["flowering_intensity"] is not None
            and record["flowering_intensity"] > 0
            and record["flowers_opening"] != "y"
        ):
            messages.error(
                request,
                "Upload failed. 'Flowering intensity' field should be left empty "
                "if the 'flowers opening' field is not set 'yes'. "
                "Subgarden: '%s'\nDay: '%s'\nMonth: '%s'\nYear: '%s'\nSpecies: '%s'"
                % (
                    "%s: %s" % (record["garden"], record["subgarden"]),
                    record["day"],
                    record["month"],
                    record["year"],
                    record["species"],
                ),
            )
            status = 500

        if (
            record["senescence_intensity"] is not None
            and record["senescence_intensity"] > 0
            and record["senescence"] != "y"
        ):
            messages.error(
                request,
                "Upload failed. 'Senescence intensity' field should be left empty "
                "if the 'senescence' field is not set 'yes'. "
                "Subgarden: '%s'\nDay: '%s'\nMonth: '%s'\nYear: '%s'\nSpecies: '%s'"
                % (
                    "%s: %s" % (record["garden"], record["subgarden"]),
                    record["day"],
                    record["month"],
                    record["year"],
                    record["species"],
                ),
            )
            status = 500

        if record["flowering_intensity"] is None and record["flowers_opening"] == "y":
            messages.error(
                request,
                "Upload failed. 'Flowering intensity' field should not be left empty "
                "if the 'flowers opening' field is set 'yes'. "
                "Subgarden: '%s'\nDay: '%s'\nMonth: '%s'\nYear: '%s'\nSpecies: '%s'"
                % (
                    "%s: %s" % (record["garden"], record["subgarden"]),
                    record["day"],
                    record["month"],
                    record["year"],
                    record["species"],
                ),
            )
            status = 500

        if record["senescence_intensity"] is None and record["senescence"] == "y":
            messages.error(
                request,
                "Upload failed. 'Senescence intensity' field should not be left empty "
                "if the 'senescence' field is set 'yes'. "
                "Subgarden: '%s'\nDay: '%s'\nMonth: '%s'\nYear: '%s'\nSpecies: '%s'"
                % (
                    "%s: %s" % (record["garden"], record["subgarden"]),
                    record["day"],
                    record["month"],
                    record["year"],
                    record["species"],
                ),
            )
            status = 500

        if len(null_fields) > 0 and len(null_fields) != len(keys):
            for value in null_fields:
                if "intensity" in value:
                    continue
                else:
                    messages.error(
                        request,
                        "Upload failed. '%s' field should not be left empty. "
                        "Subgarden: '%s'\nDay: '%s'\nMonth: '%s'\nYear: '%s'\nSpecies: '%s'"
                        % (
                            value,
                            "%s: %s" % (record["garden"], record["subgarden"]),
                            record["day"],
                            record["month"],
                            record["year"],
                            record["species"],
                        ),
                    )
                    status = 500

        elif len(null_fields) == len(keys):
            no_observation = True

    return status, no_observation, record
