import csv
import io
import json

import xlsxwriter
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, StreamingHttpResponse
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
                    return HttpResponse(
                        "Collection with ID: %d could not be retrieved"
                        % int(parsed_id),
                        status=404,
                    )
                except Exception as e:
                    return HttpResponse(str(e), status=500)

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
                return return_csv(columns, collections)
            elif filetype.lower() == "xlsx":
                return return_xlsx(columns, collections)
            else:
                return HttpResponse("Filetype was not recognized.", status=404)
        except json.JSONDecodeError:
            return HttpResponse("JSON decoding error was raised.", status=500)
        except ValidationError:
            return HttpResponse("Received JSON could not be validated.", status=500)
        except Exception as e:
            return HttpResponse(str(e), status=500)
    else:
        return HttpResponse("Method not allowed.", status=405)


class Echo(object):
    def write(self, value):
        return value.encode("utf-8")


def return_xlsx(columns, collections):
    if type(collections) is not list:
        return HttpResponse("Invalid argument received.", status=500)

    output = io.BytesIO()
    workbook = xlsxwriter.Workbook(output)
    worksheet = workbook.add_worksheet()

    for col in range(len(columns)):
        worksheet.write(0, col, columns[col])

    row = 1

    for collection in collections:
        if type(collection) is not Collection:
            return HttpResponse(
                "Received list contains invalid collection.", status=500
            )
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

    response = StreamingHttpResponse(
        output,
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
    response["Content-Disposition"] = 'attachment; filename="collections.xlsx"'

    return response


def return_csv(columns, collections):
    if type(collections) is not list:
        return HttpResponse("Invalid argument received.", status=500)

    pseudo_buffer = Echo()
    writer = csv.writer(pseudo_buffer, delimiter=",")

    rows = [columns]

    for collection in collections:
        if type(collection) is not Collection:
            return HttpResponse(
                "Received list contains invalid collection.", status=500
            )

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

    response = StreamingHttpResponse(
        (writer.writerow(row) for row in rows), content_type="text/csv"
    )
    response["Content-Disposition"] = 'attachment; filename="collections.csv"'

    return response
