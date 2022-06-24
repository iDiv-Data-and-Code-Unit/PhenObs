import { alertModal } from "./modals.js";

async function fillCollections(id, edit=null) {
    await $.ajax({
        url: "/observations/collections/" + id,
        error: function (jqXHR) {
            // alert("Could not establish a connection with database.");
            alertModal(jqXHR.responseJSON);
        },
        beforeSend: function(){
            $("body").addClass("loading");
        },
        complete: function(){
            $("body").removeClass("loading");
        },
        success: async function (data) {
            $("#viewsContent").html(data);
            initNav();
            $("#uploadSelected").unbind().click(uploadSelected);

            if (edit != null) {
                $("#edit-tab").addClass("active");
                $("#view-tab").removeClass("active");
                $("#edit").addClass("active");
                $("#edit").addClass("show");
                $("#view").removeClass("active");
                $("#view").removeClass("show");
            } else {
                $("#edit-tab").removeClass("active");
                $("#view-tab").addClass("active");
                $("#edit").removeClass("active");
                $("#edit").removeClass("show");
                $("#view").addClass("active");
                $("#view").addClass("show");
            }

            const collectionCardsEdit = $('[id^="collection-"]');
            const collectionCardsView = $('[id^="view-collection-"]');

            assignListeners(collectionCardsEdit, true);
            assignListeners(collectionCardsView, false);
        }
    });
}

$("#gardens").change(async (e) => {
    if (e.target.selectedOptions[0].id.length)
        await fillCollections(e.target.selectedOptions[0].id);
});

function formatCollection(id) {

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
            record[selects[j].id.substr(selects[j].id.match("-").index + 1)] = selects[j].value;

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
    const checkboxes = $('input[id*="' + ids + '"]');

    console.log(checkboxes)

    for (let i = 0; i < checkboxes.length; i++) {
        if (!(checkboxes[i].classList.contains("d-none")))
            checkboxes[i].checked = checked;
    }
}

async function downloadFile(filetype){
    const collections = selectAll(true);
    if (collections.length) {
        await $.ajax({
            url: `/observations/download/${filetype}/`,
            data: JSON.stringify(selectAll(true)),
            method: "POST",
            xhrFields: {
                responseType: 'blob'
            },
            error: function (jqXHR) {
                // alert("Could not establish a connection with database.");
                alertModal(jqXHR.responseJSON);
            },
            beforeSend: function() {
                $("body").addClass("loading");
            },
            complete: function(){
                $("body").removeClass("loading");
            },
            success: function(blob, status, xhr) {
                // check for a filename
                let filename = "";
                let disposition = xhr.getResponseHeader('Content-Disposition');
                if (disposition && disposition.indexOf('attachment') !== -1) {
                    let filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                    let matches = filenameRegex.exec(disposition);
                    if (matches != null && matches[1]) filename = matches[1].replace(/['"]/g, '');
                }

                if (typeof window.navigator.msSaveBlob !== 'undefined') {
                    // IE workaround for "HTML7007: One or more blob URLs were revoked by closing the blob for which they were created. These URLs will no longer resolve as the data backing the URL has been freed."
                    window.navigator.msSaveBlob(blob, filename);
                } else {
                    let URL = window.URL || window.webkitURL;
                    let downloadUrl = URL.createObjectURL(blob);

                    if (filename) {
                        // use HTML5 a[download] attribute to specify filename
                        let a = document.createElement("a");
                        // safari doesn't support this yet
                        if (typeof a.download === 'undefined') {
                            window.location.href = downloadUrl;
                        } else {
                            a.href = downloadUrl;
                            a.download = filename;
                            document.body.appendChild(a);
                            a.click();
                        }
                    } else {
                        window.location.href = downloadUrl;
                    }

                    setTimeout(function () { URL.revokeObjectURL(downloadUrl); }, 100); // cleanup
                }
            }
        });
        // location.href = `/observations/download/${filetype}/[${selectAll(true)}]`;
    }
    else
        alertModal("You have not selected any collection.");
}

function initNav() {
    $("#downloadCSV").unbind().click(async () => await downloadFile('csv'));
    $("#downloadXLSX").unbind().click(async () => await downloadFile('xlsx'));
    $("#selectAll").unbind().click((e) => {e.preventDefault(); checkAll(true)});
    $("#deselectAll").unbind().click((e) => {e.preventDefault(); checkAll(false)});
    $("#viewSelectAll").unbind().click((e) => {e.preventDefault(); checkAll(true, true)});
    $("#viewDeselectAll").unbind().click((e) => {e.preventDefault(); checkAll(false, true)});

    document.getElementById("uploadSelected").addEventListener("click", async () => await uploadSelected());
}

async function uploadSelected(collection=null) {
    let selected = (collection == null) ? selectAll() : [collection];
    let collections = [];
    let invalid = false;

    for (let i = 0; i < selected.length; i++)
        collections.push(formatCollection(selected[i]));


    for (let i = 0; i < collections.length; i++) {
        const collection = collections[i];

        for (let j = 0; j < collection["records"].length; j++) {
            const record = collection["records"][j];

            const fields = $("[id*=" + record["id"] + "-]");
            for (let k = 0; k < fields.length; k++) {
                fields[k].classList.remove("invalidField");
            }

            if ((record["senescence-intensity"] === 0 ||
                    record["senescence-intensity"] == null ||
                    record["senescence-intensity"].length === 0) &&
                record["senescence"] === "y") {
                alertModal("Fill in all the required fields.")
                $('#' + record["id"] + '-senescence-intensity').addClass("invalidField");
                invalid = true;
            } else if (record["senescence-intensity"] > 0 && record["senescence"] !== "y") {
                alertModal("Fill in all the required fields.")
                $('#' + record["id"] + '-senescence').addClass("invalidField");
                invalid = true;
            }
            if ((record["flowering-intensity"] === 0 ||
                    record["flowering-intensity"] == null ||
                    record["flowering-intensity"].length === 0) &&
                record["flowers-opening"] === "y") {
                alertModal("Fill in all the required fields.")
                $('#' + record["id"] + '-flowering-intensity').addClass("invalidField");
                invalid = true;
            } else if (record["flowering-intensity"] > 0 && record["flowers-opening"] !== "y") {
                alertModal("Fill in all the required fields.")
                $('#' + record["id"] + '-flowers-opening').addClass("invalidField");
                invalid = true;
            }

            for (let key in record) {
                if ((key !== "id" && key !== "done" && key !== "remarks") && record[key].length === 0) {
                    if (key === "senescence-intensity" && record["senescence-intensity"].length === 0 && record["senescence"] !== "y")
                        continue;
                    else if (key === "flowering-intensity" && record["flowering-intensity"].length === 0 && record["flowers-opening"] !== "y")
                        continue;
                    alertModal("Fields cannot be left empty.");
                    $('#' + record["id"] + '-' + key).addClass("invalidField");
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
                alertModal(jqXHR.responseJSON);
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
               await fillCollections(document.getElementById("gardens").selectedOptions[0].id,true)
            }
        });
    } else {
        alertModal("You have not selected any collection.");
    }

    return collections;
}

function assignListeners(cards, edit=false) {
    for (let i = 0; i < cards.length; i++) {
        const idSplit = cards[i].id.split('-');
        const collectionId = idSplit[idSplit.length - 1];

        $(cards[i]).on("show.bs.collapse",
            async () => {
                if ($(`#${(edit) ? "edit" : "view"}-records-${collectionId}`).html().length === 0) {
                    await fillInContent(
                        parseInt(collectionId),
                        edit
                    );

                    if (edit) {
                        $(`#selected-${collectionId}`).removeClass("d-none");
                        cancelAndSaveButtons(collectionId);
                    }
                }
            }
        )
    }
}

function cancelAndSaveButtons(collectionId) {
    document.getElementById(`${collectionId}-save`).addEventListener(
        'click',
        () => uploadSelected(parseInt(collectionId))
    );

    const oldValues = formatCollection(collectionId);

    document.getElementById(`${collectionId}-cancel`).addEventListener(
        'click',
        () => {
            const id = oldValues["id"];

            document.getElementById("date-" + id).value = oldValues["date"];

            for (let j = 0; j < oldValues["records"].length; j++) {
                const recordId = oldValues["records"][j]["id"];
                for (let key in oldValues["records"][j]) {
                    if (!(key === "id" || key === "no-observation" || key === "done")) {
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

async function fillInContent(id, edit=false) {
    const url = (edit) ?
        `/observations/edit_collection/${id}/` :
        `/observations/view_collection/${id}/`;

    await $.ajax({
        url: url,
        type: "GET",
        error: function (jqXHR) {
            alertModal(jqXHR.responseJSON);
        },
        beforeSend: function () {
            $("body").addClass("loading");
        },
        complete: function () {
            $("body").removeClass("loading");
        },
        success: async function (content) {
            $(`#${(edit) ? "edit" : "view"}-records-${id}`).html(content);
        }
    });
}
