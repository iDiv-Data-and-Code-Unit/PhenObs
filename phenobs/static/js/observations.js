import { getCollections } from "./collection.js";

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

function checkCollections(collections) {
    for (let key in collections["unfinished"]) {
        let table = document.getElementById('all-collections-body');
        table.innerHTML += ' <tr class="d-table-row">\n' +
            '            <th scope="row" class="text-left">' + collections["unfinished"][key]["collection-date"] + '</th>\n' +
            '            <td class="text-left">' + collections["unfinished"][key]["creator"] + '</td>\n' +
            '            <td>\n' +
            '              <i class="bi bi-hdd-fill" style="font-size: 1.5rem; color: gray;" id="' + collections["unfinished"][key]["collection-id"] + '-local"></i>\n' +
            '              <i class="bi bi-exclamation-circle-fill d-none" style="font-size: 1.5rem; color: red;" id="' + collections["unfinished"][key]["collection-id"] + '-unfinished"></i>\n' +
            '            </td>\n' +
            '            <td>\n' +
            '              <a href="">\n' +
            '                <i class="bi bi-cloud-upload-fill d-none" style="font-size: 1.5rem; color: blue;" id="' + collections["unfinished"][key]["collection-id"] + '-upload"></i>\n' +
            '              </a>\n' +
            '            </td>\n' +
            '            <td>\n' +
            '              <a href="">\n' +
            '                <i class="bi bi-pencil-fill" style="font-size: 1.5rem; color: goldenrod;" id="' + collections["unfinished"][key]["collection-id"] + '-edit"></i>\n' +
            '              </a>\n' +
            '            </td>\n' +
            '            <td>\n' +
            '              <a onclick="cancelCollection(' + collections["unfinished"][key]["collection-id"] + ')">\n' +
            '                <i class="bi bi-x-circle-fill" style="font-size: 1.5rem; color: red;" id="' + collections["unfinished"][key]["collection-id"] + '-cancel"></i>\n' +
            '              </a>\n' +
            '            </td>\n' +
            '          </tr>'
    }

    for (let key in collections["unfinished"]) {
        console.log(collections["unfinished"][key]["collection-id"].toString() + "-unfinished")
        if (collections["unfinished"][key]["remaining"].length > 0) {
            let element = document.getElementById(
                collections["unfinished"][key]["collection-id"].toString() + "-unfinished"
                    );
            if (element !== null)
                element.classList.remove("d-none");
        } else {
            let element1 = document.getElementById(
                collections["unfinished"][key]["collection-id"].toString() + "-local"
                    );
            let element2 = document.getElementById(
                collections["unfinished"][key]["collection-id"].toString() + "-upload"
                    );
            if (element1 !== null)
                element1.classList.remove("d-none");
            if (element2 !== null)
                element2.classList.remove("d-none");
        }
    }

    for (let key in collections["done"]) {
        let element = document.getElementById(
            collections["done"][key]["collection-id"].toString() + "-local"
                );
        if (element !== null)
            element.classList.remove("d-none");
    }
}

checkCollections(getCollections());
