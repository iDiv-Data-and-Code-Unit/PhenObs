import { getCollections, deleteCollection, uploadCollection } from "./collection.js";

function update(collections, collectionId) {
    // TODO: Change method to UPDATE
    $.ajax({
        url: "/observations/update",
        data: JSON.stringify(collections["edited"][collectionId]),
        method: "POST",
        error: function (jqXHR) {
            alert("Could not establish a connection with database.");
        },
        beforeSend: function(){
            $("body").addClass("loading");
        },
        complete: function(){
            $("body").removeClass("loading");
        },
        success: function (data) {
            alert("Collection successfully updated!");
        }
    });
}

async function insertRows(tableName) {
    // TODO: get all online collections
    let collections = await getCollections();
    let table = document.getElementById(tableName + '-collections-body');

    for (let key in collections) {
        if (tableName === "uploaded") {
            if (!collections[key]["uploaded"])
                continue;
        } else if (tableName === "unfinished") {
            if (collections[key]["finished"])
                continue;
        } else {
            if (!collections[key]["finished"] ||
                !(collections[key]["edited"] && !collections[key]["uploaded"]))
                continue;
        }
        let rowHTML =
            ' <tr class="d-table-row">\n' +
            '<th scope="row" class="text-left">' + collections[key]["date"] + '</th>\n' +
            '<td class="text-left">' + collections[key]["creator"] + '</td>\n' +
            '<td>\n';

        if (!collections[key]["finished"])
            rowHTML +=
                '  <i class="bi bi-hdd-fill" style="font-size: 1.5rem; color: gray;" id="' + key + '-local"></i>\n' +
                '  <i class="bi bi-exclamation-circle-fill" style="font-size: 1.5rem; color: red;" id="' + key + '-unfinished"></i>\n' +
            '</td>\n';

        if (collections[key]["uploaded"])
            rowHTML +=
                '  <i class="bi bi-hdd-fill" style="font-size: 1.5rem; color: green;" id="' + key + '-local"></i>\n' +
                '  <i class="bi bi-cloud-check-fill" style="font-size: 1.5rem; color: green;" id="' + key + '-online"></i>\n' +
            '</td>\n';

        if (collections[key]["finished"] && !collections[key]["uploaded"])
            rowHTML +=
                '  <i class="bi bi-hdd-fill" style="font-size: 1.5rem; color: gray;" id="' + key + '-local"></i>\n' +
            '</td>\n';

        if (collections[key]["edited"] || (collections[key]["finished"] && !collections[key]["uploaded"]))
            rowHTML +=
                '<td>\n' +
                '  <a onclick="uploadCollection(\'' + key + '\')">\n' +
                '    <i class="bi bi-cloud-arrow-up-fill" style="font-size: 1.5rem; color: blue;" id="' + key + '-upload"></i>\n' +
                '  </a>\n' +
                '</td>\n';

        rowHTML +=
            '<td>\n' +
            '  <a href="edit/' + key + '">\n' +
            '    <i class="bi bi-pencil-fill" style="font-size: 1.5rem; color: gray;" id="' + key + '-edit"></i>\n' +
            '  </a>\n' +
            '</td>\n';

        rowHTML +=
            '<td>\n' +
            '  <a onclick="deleteCollection(' + key + ')">\n' +
            '    <i class="bi bi-trash-fill" style="font-size: 1.5rem; color: gray;" id="' + key + '-cancel"></i>\n' +
            '  </a>\n' +
            '</td>\n' +
            '</tr>';

        table.innerHTML += rowHTML;
    }
}

await insertRows("unfinished");
await insertRows("uploaded");
await insertRows("ready");
