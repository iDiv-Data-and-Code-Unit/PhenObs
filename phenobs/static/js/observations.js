import {getCollections, deleteCollection, uploadCollection, insertCollection} from "./collection.js";
import {confirmModal, alertModal, formatDate} from './modals.js';
import {isReachable} from "./project.js";

async function insertRows(tableName) {
    // TODO: get all online collections
    let collections = await getCollections();
    let table = document.getElementById(tableName + '-collections-body');
    table.innerHTML = '';

    for (let key in collections) {
        // console.log(collections[key], key)
        if (tableName === "uploaded") {
            if (!collections[key]["uploaded"] || !collections[key]["finished"])
                continue;
        } else if (tableName === "unfinished") {
            if (collections[key]["finished"])
                continue;
        } else {
            if (!(!collections[key]["uploaded"] && collections[key]["finished"] && !collections[key]["edited"]) &&
                !(collections[key]["edited"] && !collections[key]["uploaded"] && collections[key]["finished"]))
                continue;
        }
        // console.log('-----------------------')
        // console.log(collections[key], key)
        let rowHTML =
            '<tr class="d-table-row">\n' +
            // '<th class="text-left d-table-cell">' + collections[key]["id"].toString() + '</th>' +
            '<th class="text-left d-table-cell">' + formatDate(new Date(collections[key]["date"])).toString() + '</th>\n' +
            '<td class="text-left d-table-cell">' + collections[key]["creator"] + '</td>\n' +
            '<td class="text-left d-table-cell">\n';

        if (!collections[key]["finished"]) 
            rowHTML +=
                '  <i class="bi bi-hdd-fill" style="font-size: 1.5rem; color: gray;" id="' + key + '-local"></i>\n' +
                '  <i class="bi bi-exclamation-circle-fill" style="font-size: 1.5rem; color: red;" id="' + key + '-unfinished"></i>\n' +
            '</td>\n';

        if (collections[key]["finished"] && collections[key]["uploaded"])
            rowHTML +=
                '  <i class="bi bi-hdd-fill" style="font-size: 1.5rem; color: green;" id="' + key + '-local"></i>\n' +
                '  <i class="bi bi-cloud-check-fill" style="font-size: 1.5rem; color: green;" id="' + key + '-online"></i>\n' +
            '</td>\n';

        if (collections[key]["finished"] && !collections[key]["uploaded"])
            rowHTML +=
                '  <i class="bi bi-hdd-fill" style="font-size: 1.5rem; color: gray;" id="' + key + '-local"></i>\n' +
            '</td>\n';

        if ((collections[key]["edited"] && collections[key]["finished"]) || (collections[key]["finished"] && !collections[key]["uploaded"]))
            rowHTML +=
                '<td class="text-left d-table-cell">\n' +
                '  <a onclick="">\n' +
                '    <i class="bi bi-cloud-arrow-up-fill" style="font-size: 1.5rem; color: blue;" id="' + key + '-upload"></i>\n' +
                '  </a>\n' +
                '</td>\n';

        if (tableName === "uploaded" || tableName === "unfinished")
            rowHTML +=
                '<td class="text-left d-table-cell">\n' +
                '</td>\n';

        rowHTML +=
            '<td class="text-left d-table-cell">\n' +
            // '  <a href="edit/' + key + '">\n' +
            '    <i class="bi bi-pencil-fill" style="font-size: 1.5rem; color: gray;" id="' + key + '-edit"></i>\n' +
            '  </a>\n' +
            '</td>\n';

        rowHTML +=
            '<td class="text-left d-table-cell">\n' +
            '  <a onclick="">\n' +
            '    <i class="bi bi-trash-fill" style="font-size: 1.5rem; color: gray;" id="' + key + '-cancel"></i>\n' +
            '  </a>\n' +
            '</td>\n' +
            '</tr>';

        table.innerHTML += rowHTML;
    }
}

await initTables();

async function initTables() {
    await insertRows("unfinished");
    await insertRows("uploaded");
    await insertRows("ready");
    addUploadLink();
    addRemoveLink();
    addEditLink();
}

function addUploadLink() {
    let allButtons = $('[id*="-upload"]');

    for (let i = 0; i < allButtons.length; i++) {
        const id = parseInt(allButtons[i].id.split('-')[0]);
        allButtons[i].parentElement.addEventListener(
            'click',
            async () => {
                await uploadCollection(id);
                await initTables();
            }
        );
        allButtons[i].parentElement.style.cursor = 'pointer';
    }
}

function addEditLink() {
    let editButtons = $('[id*="-edit"]');

    for (let i = 0; i < editButtons.length; i++) {
        const id = parseInt(editButtons[i].id.split('-')[0]);
        editButtons[i].parentElement.addEventListener(
            'click',
            () => {
                isReachable('/200').then(function(online) {
                    if (online) {
                        location.href = '/observations/edit/' + id;
                    } else {
                        // alert('Edit functionality is not available in offline mode');
                        alertModal('Edit functionality is not available in offline mode');
                    }
                });
            }
        );
        editButtons[i].parentElement.style.cursor = 'pointer';
    }
}

function addRemoveLink(collections=null) {
    let allButtons = $('[id*="-cancel"]');

    if (collections != null) {
        allButtons = [];
        for (let i = 0; i < collections.length; i++)
            if (
                !$('[id="' + collections[i]["id"] + '-upload"]').length && 
                !$('[id="' + collections[i]["id"] + '-unfinished"]').length
            )
                allButtons.push($('[id="' + collections[i]["id"] + '-cancel"]')[0])
    }

    for (let i = 0; i < allButtons.length; i++) {
        if (allButtons[i] !== undefined) {
            const id = parseInt(allButtons[i].id.split('-')[0]);
            allButtons[i].parentElement.addEventListener(
                'click',
                async () => {
                    // if (confirm("Are you sure you want to delete the collection from device?")) {
                    //     await deleteCollection(id);
                    //     await initTables();
                    // }
                    confirmModal("Are you sure you want to delete the collection from device?");
                    $('#confirm-yes').click(
                        async function() {
                            await deleteCollection(id);
                            await initTables();
                        }
                    );
                }
            );
            
            allButtons[i].parentElement.style.cursor = 'pointer';
        }
    }
}

async function getAllCollections() {
    await $.ajax({
        url: "/observations/all_collections/",
        method: "GET",
        error: function (jqXHR) {
            // alert("Could not establish a connection with database.");
            alertModal("Could not establish a connection with database.");
        },
        beforeSend: function(){
            $("body").addClass("loading");
        },
        complete: function(){
            $("body").removeClass("loading");
        },
        success: async function (data) {
            await addOnlineCollections(data);
            addEditLink();
            addRemoveLink(data);
        }
    });
}

async function addOnlineCollections(collections) {
    await insertRows("uploaded");
    const localCollections = await getCollections();

    // Make sure local collections are up-to-date
    for (let i = 0; i < collections.length; i++)
        if (localCollections != null && (collections[i]["id"] in localCollections) &&
            localCollections[collections[i]["id"]]["uploaded"])
            insertCollection(collections[i], true);

    let table = document.getElementById('uploaded-collections-body');
    let rowHTML = '';

    for (let i = 0; i < collections.length; i++) {
        if (localCollections == null || Object.keys(localCollections).length === 0 || !(parseInt(collections[i]['id']) in localCollections)) {
            rowHTML =
                '<tr class="d-table-row">' +
                // '<th class="text-left d-table-cell">' + collections[i]["id"].toString() + '</th>' +
                '<th class="text-left d-table-cell">' + formatDate(new Date(collections[i]["date"])).toString() + '</th>' +
                '<td class="text-left d-table-cell">' + collections[i]['creator'] + '</td>' +
                '<td class="text-left d-table-cell">\n';

            if (collections[i]["finished"] == true)
                rowHTML += 
                    '<i class="bi bi-cloud-check-fill" style="font-size: 1.5rem; color: green;" id="' + collections[i]['id'] + '-online"></i>\n' +
                    '</td>' +
                    '<td class="text-left d-table-cell">\n';
            else
                rowHTML += 
                    '<i class="bi bi-cloud-fill" style="font-size: 1.5rem; color: gray;" id="' + collections[i]['id'] + '-online"></i>\n' +
                    '<i class="bi bi-exclamation-circle-fill" style="font-size: 1.5rem; color: red;" id="' + collections[i]['id'] + '-unfinished"></i>\n' +
                    '</td>' +
                    '<td class="text-left d-table-cell">\n';
                // '<a href="edit/' + collections[i]['id'] + '">\n' +
            rowHTML +=
                '</td>\n' +
                '<td class="text-left d-table-cell">\n';
            rowHTML += '<i class="bi bi-pencil-fill" style="font-size: 1.5rem; color: gray;" id="' + collections[i]['id'] + '-edit"></i>\n' +
                '</a>\n' +
                '</td>';
            rowHTML +=
                '<td class="text-left d-table-cell">\n' +
                '</td>\n</tr>\n';

            table.innerHTML += rowHTML;
        }
    }
}

$('#get-collections').click(async function () {
    await getAllCollections();
});
