import csv
import io

import xlsxwriter
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from multiselectfield.db.fields import MSFList

from .models import Collection, Record


@login_required(login_url="/accounts/login/")
def download(request, filetype, ids):
    collections = []
    parsed_ids = ids[1:-1].split(",")

    for parsed_id in parsed_ids:
        collections.append(Collection.objects.filter(id=int(parsed_id)).get())

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

    if filetype == "csv":
        return return_csv(columns, collections)
    elif filetype == "xlsx":
        return return_xlsx(columns, collections)
    else:
        return HttpResponse("Filetype was not recognized.")


def return_xlsx(columns, collections):
    output = io.BytesIO()
    workbook = xlsxwriter.Workbook(output)
    worksheet = workbook.add_worksheet()

    for col in range(len(columns)):
        worksheet.write(0, col, columns[col])

    row = 1

    for collection in collections:
        records = (
            Record.objects.filter(collection=collection)
            .all()
            .values_list(
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


def return_csv(columns, collections):
    response = HttpResponse(content_type="text/csv")

    writer = csv.writer(response, delimiter=";")
    writer.writerow(columns)

    rows = []

    for collection in collections:
        records = (
            Record.objects.filter(collection=collection)
            .all()
            .values_list(
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
