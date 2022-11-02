import {getCollections, deleteCollection, uploadCollection, insertCollection} from "./collection.js";
import {confirmModal, alertModal, formatDate} from './modals.js';

/**
 * Populates the tables with not saved and saved collections depending on the passed tableName
 * @param {string} tableName - A string indicating what prefix to use to identify which table to modify
 */
async function insertRows(tableName) {
    let collections = await getCollections();
    let table = document.getElementById(tableName + '-collections-body');
    table.innerHTML = '';

    for (let key in collections) {
        if (tableName === "saved") {
            if (!collections[key]["uploaded"] || !collections[key]["finished"])
                continue;
        } else if (tableName === "notsaved") {
            if (collections[key]["finished"] && collections[key]["uploaded"])
                continue;
        } else {
            continue;
        }
        let rowHTML =
            '<tr class="d-table-row">\n' +
            '<th class="text-left d-table-cell date-table-cell">' + formatDate(new Date(collections[key]["date"])).toString() + '</th>\n' +
            '<td class="text-left d-table-cell text-truncate creator-table-cell">' + collections[key]["creator"] + '</td>\n' +
            '<td class="text-left d-table-cell text-truncate garden-table-cell">' + collections[key]["garden-name"] + '</td>\n' +
            '<td class="d-table-cell icon-table-cell align-items-center" style="vertical-align: middle;">\n';

        if (!collections[key]["finished"])
            rowHTML +=
                '  <i class="bi bi-hdd-fill" style="font-size: 1.5rem; color: gray;" id="' + key + '-local"></i>\n' +
                '  <i class="bi bi-exclamation-circle-fill ml-1" style="font-size: 1.5rem; color: red;" id="' + key + '-unfinished"></i>\n' +
            '</td>\n';

        if (collections[key]["finished"] && collections[key]["uploaded"])
            rowHTML +=
                '<div class="d-flex align-items-center text-success">' +
                '  <i class="bi bi-hdd-fill" style="font-size: 1.5rem;  border: 0" id="' + key + '-local"></i>\n' +
                '   <img class="ml-2" src="/static/images/db_check_success.png" style="display: table-cell; vertical-align: middle; " height="23"  id="' + key + '-online">\n' +
                '</div>' +
            '</td>\n';

        if (collections[key]["finished"] && !collections[key]["uploaded"])
            rowHTML +=
                '  <i class="bi bi-hdd-fill" style="font-size: 1.5rem; color: gray; display: table-cell; vertical-align: middle; border: 0" id="' + key + '-local"></i>\n' +
            '</td>\n';

        if ((collections[key]["edited"] && collections[key]["finished"]) || (collections[key]["finished"] && !collections[key]["uploaded"]))
            rowHTML +=
                '<td class="d-table-cell icon-table-cell" style="vertical-align: middle">\n' +
                '  <a onclick="" class="">\n' +
                '    <img class="bi" src="/static/images/save_db_primary.png" style="" width="21"  id="' + key + '-upload">\n' +
                '  </a>\n' +
                '</div>\n';

        if (tableName === "saved" || !collections[key]["finished"])
            rowHTML +=
                '<td class="text-left d-table-cell icon-table-cell">\n' +
                '</td>\n';

        rowHTML +=
            '<td class="text-left d-table-cell icon-table-cell" style="vertical-align: middle">\n' +
            '    <i class="bi bi-pencil-fill text-primary" style="font-size: 1.5rem;" id="' + key + '-edit"></i>\n' +
            '  </a>\n' +
            '</td>\n';

        rowHTML +=
            '<td class="text-left d-table-cell icon-table-cell" style="vertical-align: middle">\n' +
            '  <a onclick="">\n' +
            '    <i class="bi bi-trash-fill text-offline" style="font-size: 1.5rem;" id="' + key + '-cancel"></i>\n' +
            '  </a>\n' +
            '</td>\n' +
            '</tr>';

        table.innerHTML += rowHTML;
    }
}

// Fills tables when a user lands on the Local Observations page
(async () => {
    await fillTables();
})();

/**
 * Calls necessary functions to populate tables and add functionality to upload, delete and edit
 */
async function fillTables() {
    await insertRows("notsaved");
    await insertRows("saved");
    addUploadLink();
    addRemoveLink();
    addEditLink();
}

/**
 * Attaches click listeners to saved collections to be saved, if available
 */
function addUploadLink() {
    let allButtons = $('[id*="-upload"]');

    for (let i = 0; i < allButtons.length; i++) {
        const id = parseInt(allButtons[i].id.split('-')[0]);
        allButtons[i].parentElement.addEventListener(
            'click',
            async () => {
                await uploadCollection(id);
                await fillTables();
            }
        );
        allButtons[i].parentElement.style.cursor = 'pointer';
    }
}

/**
 * Attaches click listeners to all collections to edit them
 */
function addEditLink() {
    let editButtons = $('[id*="-edit"]');

    for (let i = 0; i < editButtons.length; i++) {
        const id = parseInt(editButtons[i].id.split('-')[0]);
        editButtons[i].parentElement.addEventListener(
            'click',
            () => {
                if (navigator.onLine) {
                    location.href = '/observations/edit/' + id;
                } else {
                    alertModal('Edit functionality is not available in offline mode');
                }
            }
        );
        editButtons[i].parentElement.style.cursor = 'pointer';
    }
}

/**
 * Attaches click listeners to local collections to delete them from local device storage
 */
function addRemoveLink() {
    let allButtons = $('[id*="-cancel"]');

    for (let i = 0; i < allButtons.length; i++) {
        if (allButtons[i] !== undefined) {
            const id = parseInt(allButtons[i].id.split('-')[0]);
            allButtons[i].parentElement.addEventListener(
                'click',
                async () => {
                    confirmModal("Are you sure you want to delete the collection from device?");
                    $('#confirm-yes').unbind().click(
                        async function() {
                            await deleteCollection(id);
                            await fillTables();
                        }
                    );
                }
            );

            allButtons[i].parentElement.style.cursor = 'pointer';
        }
    }
}

/**
 * Fetches all possible collections for user's main garden
 */
async function getAllCollections() {
    if (!navigator.onLine)
        alertModal("Get collections functionality is not available offline.");

    const collections = await getCollections();
    let ids = [];
    for (let collection in collections) {
        ids.push(parseInt(collection));
    }

    await $.ajax({
        url: "/observations/garden_collections/",
        method: "POST",
        data: JSON.stringify(ids),
        error: function (jqXHR) {
            alertModal(jqXHR.responseJSON);
        },
        beforeSend: function(){
            $("body").addClass("loading");
        },
        complete: function(){
            $("body").removeClass("loading");
        },
        success: async function (data) {
            console.log(data)
            await addOnlineCollections(data);
            addEditLink();
            addRemoveLink();
        }
    });
}

/**
 * Updates local finished, unedited collections and populates saved table with collections available on database
 * @param {Object} collections - All collections for user's main garden
 */
async function addOnlineCollections(collections) {
    await insertRows("saved");
    let localCollections = await getCollections();

    // Make sure local collections are up-to-date
    for (let i = 0; i < collections.length; i++) {
        if (localCollections != null && (collections[i]["id"] in localCollections) &&
            (localCollections[collections[i]["id"]]["uploaded"])) {
            await insertCollection(collections[i], true);
        } else if (localCollections != null && (collections[i]["id"] in localCollections) &&
            !localCollections[collections[i]["id"]]["finished"] && collections[i]["finished"]) {
            await insertCollection(collections[i], true);
        }
    }

    localCollections = await getCollections();
    await fillTables();

    let table = document.getElementById('saved-collections-body');
    let rowHTML = '';

    for (let i = 0; i < collections.length; i++) {
        if (localCollections == null || Object.keys(localCollections).length === 0 || !(parseInt(collections[i]['id']) in localCollections)) {
            rowHTML =
                '<tr class="d-table-row">' +
                '<th class="text-left d-table-cell date-table-cell">' + formatDate(new Date(collections[i]["date"])).toString() + '</th>' +
                '<td class="text-left d-table-cell text-truncate creator-table-cell">' + collections[i]['creator'] + '</td>' +
                '<td class="text-left d-table-cell text-truncate garden-table-cell">' + collections[i]['garden-name'] + '</td>' +
                '<td class="text-left d-table-cell icon-table-cell d-flex align-items-center">\n';

            if (collections[i]["finished"] == true)
                rowHTML +=
                    '<img src="/static/images/db_check_success.png" style="display: table-cell; vertical-align: middle;" height="23"  id="' + collections[i]['id'] + '-online">\n' +
                    '</td>' +
                    '<td class="text-left d-table-cell icon-table-cell">\n';
            else
                rowHTML +=
                    '<img src="/static/images/db_gray.png" style="display: table-cell; vertical-align: middle;" height="22"  id="' + collections[i]['id'] + '-online">\n' +
                    '<i class="bi bi-exclamation-circle-fill ml-2" style="  font-size: 1.5rem; color: red;" id="' + collections[i]['id'] + '-unfinished"></i>\n' +
                    '</td>' +
                    '<td class="text-left d-table-cell icon-table-cell">\n';
            rowHTML +=
                '</td>\n' +
                '<td class="text-left d-table-cell icon-table-cell">\n';
            rowHTML += '<i class="bi bi-pencil-fill text-primary" style="font-size: 1.5rem;" id="' + collections[i]['id'] + '-edit"></i>\n' +
                '</a>\n' +
                '</td>';
            rowHTML +=
                '<td class="text-left d-table-cell icon-table-cell">\n' +
                '</td>\n</tr>\n';

            table.innerHTML += rowHTML;
        }
    }
}

$('#get-collections').click(async function () {
    await getAllCollections();
});
