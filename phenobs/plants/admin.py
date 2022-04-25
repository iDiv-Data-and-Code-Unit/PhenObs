from django import forms
from django.contrib import admin, messages
from django.shortcuts import render
from django.urls import path
from pandas import read_csv
from pandas.errors import EmptyDataError

from ..gardens.models import Garden
from ..species.models import Species
from .models import Plant


class CsvImportForm(forms.Form):
    gardens = Garden.objects.filter(main_garden=None).all()
    garden_choices = []

    for garden in gardens:
        garden_choices.append((garden.id, str(garden.name)))

    garden = forms.IntegerField(widget=forms.Select(choices=garden_choices))
    csv_upload = forms.FileField()


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
        if request.method == "POST":
            csv_file = request.FILES["csv_upload"]

            if not csv_file.name.endswith(".csv"):
                messages.warning(
                    request,
                    "The wrong file type was uploaded. Please upload a CSV file",
                )

            try:
                file_data = read_csv(csv_file, sep=",")
                print("COMMA SEPARATED")
                print(file_data)
                add_plants(request, file_data)
            except EmptyDataError:
                try:
                    file_data = read_csv(csv_file, sep=";")
                    print("SEMICOLON SEPARATED")
                    print(file_data)
                    add_plants(request, file_data)
                except EmptyDataError:
                    messages.warning(
                        request,
                        "The uploaded file could not be parsed. Please check the file.",
                    )

        form = CsvImportForm()
        context = {"form": form}

        return render(request, "admin/csv_upload.html", context)


def add_plants(request, file_data):
    added = False
    garden = request.POST.get("garden")
    chosen_garden = Garden.objects.filter(id=int(garden)).get()

    plants = []

    for index, row in file_data.iterrows():
        plants.append(
            {"order": row["Order"], "name": row["Name"], "subgarden": row["Subgarden"]}
        )

    for plant in plants:
        subgarden = Garden.objects.filter(
            name=plant["subgarden"], main_garden=chosen_garden
        ).get()

        if not subgarden:
            messages.warning(
                request,
                'Subgarden with the name "'
                + plant["subgarden"]
                + '" does not exist in the "'
                + chosen_garden.name
                + '" garden. Please check the CSV file for errors or create the missing subgardens.',
            )
        print(plant)
        # Create a new Species for the plant if it does not already exist
        species, created = Species.objects.get_or_create(reference_name=plant["name"])

        # Create the new plant for the created species and chosen garden
        existing_plants = Plant.objects.filter(
            garden_name=plant["name"], garden=subgarden
        ).all()
        if not existing_plants:
            Plant(
                garden=subgarden,
                order=int(plant["order"]),
                garden_name=plant["name"],
                active=True,
                species=species if species else created,
            ).save()
            added = True
        else:
            messages.warning(
                request,
                'Plant with the name "'
                + plant["name"]
                + '" already exists in the subgarden "'
                + plant["subgarden"]
                + '". It was skipped.',
            )

    if added:
        messages.success(request, "Plants were added successfully.")
