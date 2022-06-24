import csv
import io
import json

import xlsxwriter
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from jsonschema import validate
from jsonschema.exceptions import ValidationError
from multiselectfield.db.fields import MSFList

from .models import Collection, Record
from .schemas import collections_schema


@csrf_exempt
@login_required(login_url="/accounts/login/")
def download(request, filetype):
    if request.method == "POST":
        try:
            collections = []

            data = json.loads(request.body)
            validate(instance=data, schema=collections_schema)

            for parsed_id in data:
                try:
                    collections.append(Collection.objects.get(id=int(parsed_id)))
                except Collection.DoesNotExist:
                    context = {
                        "exception": Exception(
                            "Collection with ID: %d could not be retrieved"
                            % int(parsed_id)
                        )
                    }
                    return render(request, "error.html", context, status=404)
                except Exception as e:
                    context = {"exception": e}
                    return render(request, "error.html", context, status=500)

            columns = [
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

            if filetype.lower() == "csv":
                return return_csv(request, columns, collections)
            elif filetype.lower() == "xlsx":
                return return_xlsx(request, columns, collections)
            else:
                context = {"exception": Exception("Filetype was not recognized.")}
                return render(request, "error.html", context, status=404)
        except json.JSONDecodeError:
            context = {"exception": Exception("JSON decoding error was raised.")}
            return render(request, "error.html", context, status=500)
        except ValidationError:
            context = {"exception": Exception("Received JSON could not be validated.")}
            return render(request, "error.html", context, status=500)
        except Exception as e:
            context = {"exception": e}
            return render(request, "error.html", context, status=500)
    else:
        context = {"exception": Exception("Method not allowed.")}

        return render(request, "error.html", context, status=405)


def return_xlsx(request, columns, collections):
    if type(collections) is not list:
        context = {"exception": "Invalid argument received."}
        return render(request, "error.html", context, status=500)

    output = io.BytesIO()
    workbook = xlsxwriter.Workbook(output)
    worksheet = workbook.add_worksheet()

    for col in range(len(columns)):
        worksheet.write(0, col, columns[col])

    row = 1

    for collection in collections:
        if type(collection) is not Collection:
            context = {"exception": "Received list contains invalid collection."}
            return render(request, "error.html", context, status=500)
        records = Record.objects.filter(collection=collection).values_list(
            # 'collection__garden__name',
            # 'collection__date',
            "collection__doy",
            "plant__garden_name",
            "initial_vegetative_growth",
            "young_leaves_unfolding",
            "flowers_open",
            "flowering_intensity",
            # "peak_flowering",
            # "peak_flowering_estimation",
            "ripe_fruits",
            "senescence",
            "senescence_intensity",
            "maintenance",
            "remarks",
        )
        for record in records:
            worksheet.write(row, 0, collection.garden.main_garden.name)
            worksheet.write(row, 1, collection.date.strftime("%d.%m.%Y"))
            col = 2
            for cell in record:
                if type(cell) == MSFList:
                    options = []
                    for option in cell:
                        if option != "None":
                            options.append(option)
                    maintenance = str(options)[1:-1].replace("_", " ").replace("'", "")
                    worksheet.write(row, col, maintenance)
                elif cell is not None:
                    worksheet.write(row, col, str(cell))
                else:
                    worksheet.write(row, col, "")
                col += 1
            row += 1

    workbook.close()
    output.seek(0)

    response = HttpResponse(
        output,
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
    response["Content-Disposition"] = 'attachment; filename="collections.xlsx"'

    return response


def return_csv(request, columns, collections):
    if type(collections) is not list:
        context = {"exception": "Invalid argument received."}
        return render(request, "error.html", context, status=500)

    response = HttpResponse(content_type="text/csv")

    writer = csv.writer(response, delimiter=";")
    writer.writerow(columns)

    rows = []

    for collection in collections:
        if type(collection) is not Collection:
            context = {"exception": "Received list contains invalid collection."}
            return render(request, "error.html", context, status=500)

        records = Record.objects.filter(collection=collection).values_list(
            # 'collection__garden__name',
            # 'collection__date',
            # 'collection__doy',
            "plant__garden_name",
            "initial_vegetative_growth",
            "young_leaves_unfolding",
            "flowers_open",
            "flowering_intensity",
            # "peak_flowering",
            # "peak_flowering_estimation",
            "ripe_fruits",
            "senescence",
            "senescence_intensity",
            "maintenance",
            "remarks",
        )

        for record in records:
            rows.append(
                [
                    collection.garden.main_garden.name,
                    collection.date.strftime("%d.%m.%Y"),
                    collection.doy,
                    record[0],
                    record[1],
                    record[2],
                    record[3],
                    record[4],
                    record[5],
                    record[6],
                    record[7],
                    str([x for x in record[8] if x != "None"])[1:-1]
                    .replace("_", " ")
                    .replace("'", ""),
                    record[9],
                ]
            )

    writer.writerows(sorted(rows, key=lambda row: row[2]))

    response["Content-Disposition"] = 'attachment; filename="collections.csv"'

    return response
