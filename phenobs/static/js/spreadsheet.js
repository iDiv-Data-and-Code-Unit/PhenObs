import { alertModal } from "./modals.js";

async function fillCollections(id, continuous=false) {
    console.log("fill collections");
    let viewCollections = $('#viewCollections');
    let editCollections = $('#editCollections');

    await $.ajax({
        url: "/observations/collections_table/" + id,
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
            const response = data.split("<nav");
            viewCollections.html("<nav" + response[1]);
            editCollections.html("<nav" + response[2]);
            // collectionsElement.html(innerHTML + collectionsHTML);
            initNav();
            $("#uploadSelected").unbind().click(uploadSelected);
        }
    });
}

async function fillForSubgardens(id) {
    let subs = $('[name*="' + id + '"]');
    if (!subs.length)
        $('#collections').html('')
    for (let j = 0; j < subs.length; j++)
        await fillCollections(subs[j].id, !!j);
}

$("#gardens").change(async (e) => {
    if (e.target.selectedOptions[0].id.length)
        await fillCollections(e.target.selectedOptions[0].id);
})

function formatCollection(id) {
    console.log();

    let collection = {
        "id": parseInt(id),
        "date": $("#date-" + id).val(),
        "garden": $("#garden-" + id).attr("name"),
        "records": []
    };

    const records = $("#collection-" + id + ' tr[id*="record-"]');

    for (let i = 0; i < records.length; i++) {
        let record = {
            "id": parseInt(records[i].id.substr(7)),
            "no-observation": false,
            "done": true,
        };

        let inputs = $('#record-' + record["id"] + ' input');
        let selects = $('#record-' + record["id"] + ' select');

        for (let j = 0; j < inputs.length; j++) {
            if (inputs[j].type === "checkbox")
                record[inputs[j].id.substr(inputs[j].id.match("-").index + 1)] = inputs[j].checked;
            else
                record[inputs[j].id.substr(inputs[j].id.match("-").index + 1)] = inputs[j].value;
        }
        for (let j = 0; j < selects.length; j++)
            record[selects[j].id.substr(inputs[j].id.match("-").index + 1)] = selects[j].value;

        collection["records"].push(record);
    }

    return collection;
}

function selectAll(view=false) {
    const ids = "selected" + ((view) ? "view-" : "-");
    const checkboxes = $('input[id*="' + ids + '"]');
    let collections = [];
    for (let i = 0; i < checkboxes.length; i++)
        if (checkboxes[i].checked)
            collections.push(parseInt(checkboxes[i].id.substr((view) ? 13 : 9)))

    return collections;
}

function checkAll(checked=true, view=false) {
    const ids = "selected" + ((view) ? "view-" : "-");
    console.log(ids)
    const checkboxes = $('input[id*="' + ids + '"]');
    for (let i = 0; i < checkboxes.length; i++)
        checkboxes[i].checked = checked;
}

function downloadFile(filetype){
    const collections = selectAll(true);
    if (collections.length)
        location.href=`/observations/download/${filetype}/[${selectAll(true)}]`;
    else
        alertModal("You have not selected any collection.");
}

function initNav() {
    $("#downloadCSV").unbind().click(() => downloadFile('csv'));
    $("#downloadXLSX").unbind().click(() => downloadFile('xlsx'));
    $("#selectAll").unbind().click((e) => {e.preventDefault(); checkAll(true)});
    $("#deselectAll").unbind().click((e) => {e.preventDefault(); checkAll(false)});
    $("#viewSelectAll").unbind().click((e) => {e.preventDefault(); checkAll(true, true)});
    $("#viewDeselectAll").unbind().click((e) => {e.preventDefault(); checkAll(false, true)});

    document.getElementById("uploadSelected").addEventListener("click", async () => await uploadSelected());

    const saveButtons = $('button[id*="-save"]');
    const cancelButtons = $('button[id*="-cancel"]');

    for (let i = 0; i < saveButtons.length; i++) {
        saveButtons[i].addEventListener(
            'click',
            () => uploadSelected(parseInt(saveButtons[i].id.split('-')[0]))
        );

        const oldValues = formatCollection(saveButtons[i].id.split('-')[0]);

        cancelButtons[i].addEventListener(
            'click',
            () => {
                const id = oldValues["id"];

                document.getElementById("date-" + id).value = oldValues["date"];

                for (let j = 0; j < oldValues["records"].length; j++) {
                    const recordId = oldValues["records"][j]["id"];
                    for (let key in oldValues["records"][j]) {
                        if (key === "id" || key === "no-observation" || key === "done")
                            continue;
                        else {
                            if (oldValues["records"][j][key] === true || oldValues["records"][j][key] === false) {
                                document.getElementById(recordId + "-" + key).checked = oldValues["records"][j][key];
                            }
                            else {
                                document.getElementById(recordId + "-" + key).value = oldValues["records"][j][key];
                            }
                        }
                    }
                }

                $("#collection-" + id).collapse('hide');
            }
        )
    }
}

async function uploadSelected(collection=null) {
    let selected = (collection == null) ? selectAll() : [collection];
    let collections = [];
    let invalid = false;

    for (let i = 0; i < selected.length; i++)
        collections.push(formatCollection(selected[i]));

    console.log(collections);

    for (let i = 0; i < collections.length; i++) {
        const collection = collections[i];
        console.log(collection);
        for (let j = 0; j < collection["records"].length; j++) {
            const record = collection["records"][j];

            if ((record["senescence-intensity"] === 0 ||
                    record["senescence-intensity"] == null ||
                    record["senescence-intensity"].length === 0) &&
                record["senescence"] === "y") {
                alertModal("Fill in all the required fields.")
                $('#' + record["id"] + '-senescence-intensity').css({
                    "border-radius": "5px",
                    "border": "2px red solid"
                });
                invalid = true;
            } else if (record["senescence-intensity"] > 0 && record["senescence"] !== "y") {
                alertModal("Fill in all the required fields.")
                $('#' + record["id"] + '-senescence').css({
                    "border-radius": "5px",
                    "border": "2px red solid"
                });
                invalid = true;
            }
            if ((record["flowering-intensity"] === 0 ||
                    record["flowering-intensity"] == null ||
                    record["flowering-intensity"].length === 0) &&
                record["flowers-opening"] === "y") {
                alertModal("Fill in all the required fields.")
                $('#' + record["id"] + '-flowering-intensity').css({
                    "border-radius": "5px",
                    "border": "2px red solid"
                });
                invalid = true;
            } else if (record["flowering-intensity"] > 0 && record["flowers-opening"] !== "y") {
                alertModal("Fill in all the required fields.")
                $('#' + record["id"] + '-flowers-opening').css({
                    "border-radius": "5px",
                    "border": "2px red solid"
                });
                invalid = true;
            }

            for (let key in record) {
                if ((key !== "id" && key !== "done" && key !== "remarks") && record[key].length === 0) {
                    if (key === "senescence-intensity" && record["senescence-intensity"].length === 0 && record["senescence"] !== "y")
                        continue;
                    else if (key === "flowering-intensity" && record["flowering-intensity"].length === 0 && record["flowers-opening"] !== "y")
                        continue;
                    alertModal("Fields cannot be left empty.");
                    $('#' + record["id"] + '-' + key).css({
                        "border-radius": "5px",
                        "border": "2px red solid"
                    });
                    invalid = true;
                }
            }
        }
    }

    if (invalid)
        return;

    if (collections.length) {
        await $.ajax({
            url: "/observations/save/",
            type: "POST",
            data: JSON.stringify(collections),
            contentType: "application/json; charset=utf-8",
            error: function (jqXHR) {
                // alert("Could not establish a connection with database.");
                alertModal("Could not establish a connection with database.");
            },
            beforeSend: function () {
                $("body").addClass("loading");
            },
            complete: function () {
                $("body").removeClass("loading");
            },
            success: async function (data) {

                // const response = data.split("<nav");
                // initNav();
                // $("#uploadSelected").unbind().click(uploadSelected);
                await fillCollections(document.getElementById("gardens").selectedOptions[0].id)
            }
        });
    } else {
        alertModal("You have not selected any collection.");
    }

    return collections;
}
