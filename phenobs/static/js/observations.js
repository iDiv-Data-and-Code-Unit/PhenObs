import { getCollections, cancelCollection, collectionDone } from "./collection.js";

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

function insertRows(tableName, collectionName) {
    // TODO: get all online collections
    let collections = getCollections()[collectionName]["collections"];
    let table = document.getElementById(tableName + '-collections-body');

    for (let key in collections) {
        let rowHTML =
            ' <tr class="d-table-row">\n' +
            '<th scope="row" class="text-left">' + collections[key]["collection-date"] + '</th>\n' +
            '<td class="text-left">' + collections[key]["creator"] + '</td>\n' +
            '<td>\n';

        if (collectionName === "edited" || collectionName === "local")
            rowHTML +=
                '  <i class="bi bi-hdd-fill" style="font-size: 1.5rem; color: gray;" id="' + collections[key]["collection-id"] + '-local"></i>\n' +
                '</td>\n';

        if (collectionName === "unfinished")
            rowHTML +=
                '  <i class="bi bi-hdd-fill" style="font-size: 1.5rem; color: gray;" id="' + collections[key]["collection-id"] + '-local"></i>\n' +
                '  <i class="bi bi-exclamation-circle-fill" style="font-size: 1.5rem; color: red;" id="' + collections[key]["collection-id"] + '-unfinished"></i>\n' +
            '</td>\n';

        if (collectionName === "online")
            rowHTML +=
                '  <i class="bi bi-hdd-fill" style="font-size: 1.5rem; color: green;" id="' + collections[key]["collection-id"] + '-local"></i>\n' +
                '  <i class="bi bi-cloud-check-fill" style="font-size: 1.5rem; color: green;" id="' + collections[key]["collection-id"] + '-online"></i>\n' +
            '</td>\n';

        if (collectionName === "local")
            rowHTML +=
                '  <i class="bi bi-hdd-fill" style="font-size: 1.5rem; color: gray;" id="' + collections[key]["collection-id"] + '-local"></i>\n' +
            '</td>\n';

        if (collectionName === "local" || collectionName === "edited")
            rowHTML +=
                '<td>\n' +
                '  <a onclick="collectionDone(\'' + collectionName + '\', ' + collections[key]["collection-id"] + ')">\n' +
                '    <i class="bi bi-cloud-arrow-up-fill" style="font-size: 1.5rem; color: blue;" id="' + collections[key]["collection-id"] + '-upload"></i>\n' +
                '  </a>\n' +
                '</td>\n';

        rowHTML +=
            '<td>\n' +
            '  <a href="edit/' + collectionName + '-' + key + '">\n' +
            '    <i class="bi bi-pencil-fill" style="font-size: 1.5rem; color: gray;" id="' + collections[key]["collection-id"] + '-edit"></i>\n' +
            '  </a>\n' +
            '</td>\n';

        rowHTML +=
            '<td>\n' +
            '  <a onclick="cancelCollection(\'' + collectionName + '\', ' + collections[key]["collection-id"] + ')">\n' +
            '    <i class="bi bi-trash-fill" style="font-size: 1.5rem; color: gray;" id="' + collections[key]["collection-id"] + '-cancel"></i>\n' +
            '  </a>\n' +
            '</td>\n' +
            '</tr>';

        table.innerHTML += rowHTML;
    }
}

insertRows("unfinished", "unfinished");
insertRows("done", "online");
insertRows("ready", "local");
insertRows("ready", "edited");
