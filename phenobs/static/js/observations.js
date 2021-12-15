import { getCollections, deleteCollection, uploadCollection } from "./collection.js";

async function insertRows(tableName) {
    // TODO: get all online collections
    let collections = await getCollections();
    let table = document.getElementById(tableName + '-collections-body');
    table.innerHTML = '';

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
                '  <a onclick="">\n' +
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
    // await getAllCollections();
    addUploadLink();
    addRemoveLink();
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

function addRemoveLink() {
    let allButtons = $('[id*="-cancel"]');

    for (let i = 0; i < allButtons.length; i++) {
        const id = parseInt(allButtons[i].id.split('-')[0]);
        allButtons[i].parentElement.addEventListener(
            'click',
            async () => {
                await deleteCollection(id);
                await initTables();
            }
        );
        allButtons[i].parentElement.style.cursor = 'pointer';
    }
}

async function getAllCollections() {
    await $.ajax({
        url: "/observations/all_collections/",
        method: "GET",
        error: function (jqXHR) {
            alert("Could not establish a connection with database.");
        },
        beforeSend: function(){
            $("body").addClass("loading");
        },
        complete: function(){
            $("body").removeClass("loading");
        },
        success: async function (data) {
            await addOnlineCollections(data);
        }
    });
}

async function addOnlineCollections(collections) {
    const localCollections = await getCollections();
    let noLocalCollections = false;
    let table = document.getElementById('uploaded-collections-body');
    let rowHTML = '';

    if (localCollections == null)
        noLocalCollections = true;

    for (let i = 0; collections.length; i++) {
        if (noLocalCollections || !(parseInt(collections[i]['id']) in localCollections)) {
            rowHTML =
                '<tr class="d-table-row">' +
                '<th scope="row" class="text-left">' + collections[i]['date'] + '</th>' +
                '<td class="text-left">' + collections[i]['creator'] + '</td>' +
                '<td>\n' +
                '<i class="bi bi-cloud-check-fill" style="font-size: 1.5rem; color: green;" id="' + collections[i]['id'] + '-online"></i>\n' +
                '</td>' +
                '<td>\n' +
                '<a href="edit/' + collections[i]['id'] + '">\n' +
                '<i class="bi bi-pencil-fill" style="font-size: 1.5rem; color: gray;" id="' + collections[i]['id'] + '-edit"></i>\n' +
                '</a>\n' +
                '</td>';

            table.innerHTML += rowHTML;
        }
    }
}
