from django import forms
from django.contrib import admin, messages
from django.shortcuts import render
from django.urls import path
from django.utils.datastructures import MultiValueDictKeyError
from pandas import read_csv

from ..gardens.models import Garden
from ..species.models import Species
from .models import Plant


class CsvImportForm(forms.Form):
    garden = forms.ModelChoiceField(
        queryset=Garden.objects.filter(main_garden=None).all()
    )
    csv_upload = forms.FileField()
    DELIMITER_CHOICES = [("1", "Semicolon (;)"), ("2", "Comma (,)")]
    delimiter = forms.ChoiceField(widget=forms.RadioSelect, choices=DELIMITER_CHOICES)


@admin.register(Plant)
class PlantAdmin(admin.ModelAdmin):
    """Registers Plant model in Django Admin with the given configuration"""

    list_display = ("id", "garden", "order", "species", "garden_name", "active")
    list_display_links = ("id", "garden_name", "species")
    search_fields = ("id", "garden", "species", "garden_name", "order", "active")
    list_per_page = 10

    def get_urls(self):
        urls = super().get_urls()
        new_urls = [
            path("upload-csv/", self.upload_csv),
        ]
        return new_urls + urls

    def upload_csv(self, request):
        add_plants_status = 200
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
                            print("COMMA SEPARATED")
                            print(file_data)
                            add_plants_status = add_plants(request, file_data)
                        except Exception as e:
                            messages.error(request, e)
                            status = 500
                    elif delimiter == "1":
                        try:
                            file_data = read_csv(csv_file, sep=";")
                            print("SEMICOLON SEPARATED")
                            print(file_data)
                            add_plants_status = add_plants(request, file_data)
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
            messages.error(request, "Method not allowed.")
            status = 405

        form = CsvImportForm()
        context = {"form": form}

        if add_plants_status != 200 and status == 200:
            status = add_plants_status

        return render(request, "admin/csv_upload.html", context, status=status)


def add_plants(request, file_data):
    added = 0
    total = 0
    status = 200

    try:
        garden = request.POST["garden"]

        if len(garden) == 0:
            messages.error(request, "Upload failed. No garden was provided.")
            return 400

        chosen_garden = Garden.objects.get(id=int(garden))

        if chosen_garden.is_subgarden() is True:
            messages.error(
                request, "Upload failed. Selected garden is not a main garden."
            )
            return 400

        plants = []

        for index, row in file_data.iterrows():
            plants.append(
                {
                    "order": row["Order"],
                    "name": row["Name"],
                    "subgarden": row["Subgarden"],
                }
            )

        total = len(plants)

        for plant in plants:
            try:
                subgarden = Garden.objects.get(
                    name=plant["subgarden"], main_garden=chosen_garden
                )

                print(plant)

                # Create a new Species for the plant if it does not already exist
                species, created = Species.objects.get_or_create(
                    reference_name=plant["name"]
                )

                # Create the new plant for the created species and chosen garden
                try:
                    existing_plant = Plant.objects.filter(
                        garden_name=plant["name"], garden=subgarden
                    )

                    if len(existing_plant) > 1:
                        raise Plant.MultipleObjectsReturned

                    if not existing_plant:
                        Plant(
                            garden=subgarden,
                            order=int(plant["order"]),
                            garden_name=plant["name"],
                            active=True,
                            species=species if species else created,
                        ).save()

                        added = added + 1
                    else:
                        messages.warning(
                            request,
                            'Plant with the name "%s" already exists in the subgarden "%s".'
                            " It was skipped." % (plant["name"], plant["subgarden"]),
                        )
                        status = 500

                except Plant.MultipleObjectsReturned:
                    messages.error(
                        request,
                        'Plant was skipped. Multiple plants with the name "%s" in the subgarden "%s"'
                        " were found. Please delete redundant plants."
                        % (plant["name"], plant["subgarden"]),
                    )
                    status = 500

            except Garden.DoesNotExist:
                messages.error(
                    request,
                    'Upload failed. Listed subgarden "%s" for the plant "%s" was not found in the main'
                    ' garden "%s". Please check the CSV file for typos and create the missing subgardens.'
                    % (plant["subgarden"], plant["name"], chosen_garden.name),
                )
                status = 500
    except Garden.DoesNotExist:
        messages.error(
            request, "Upload failed. Selected garden was not found in the database."
        )
        status = 404
    except KeyError:
        messages.error(
            request,
            "Upload failed. KeyError was raised. Please make sure the chosen delimiter is correct and"
            " a garden is provided.",
        )
        status = 400
    except Exception as e:
        messages.error(
            request, "Upload failed. Following error message was received: %s" % e
        )
        status = 500

    if added > 0:
        messages.success(
            request,
            "%d out of %d listed plants were successfully added." % (added, total),
        )

    return status
