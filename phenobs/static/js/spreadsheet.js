import { alertModal } from "./modals.js";

async function fillCollections(id, edit=false, reset=false) {
    const prefix = (edit) ? "#edit" : "#view";

    const start_date_e = $(prefix + "-start-date");
    const end_date_e = $(prefix + "-end-date");
    let start_date = null;
    let end_date = null;

    console.log(start_date_e.val())
    console.log(end_date_e.val())

    if (!reset) {
        if (start_date_e) {
            const start_date_object = new Date(start_date_e.val());
            start_date = {
                year: start_date_object.getFullYear(),
                month: start_date_object.getMonth() + 1,
                day: start_date_object.getDate(),
                string: start_date_e.val()
            }
        }

        if (end_date_e) {
            const end_date_object = new Date(end_date_e.val());
            end_date = {
                year: end_date_object.getFullYear(),
                month: end_date_object.getMonth() + 1,
                day: end_date_object.getDate(),
                string: end_date_e.val()
            }
        }
    }

    const date_range = {
        start_date: start_date,
        end_date: end_date
    }

    console.log(date_range)

    await $.ajax({
        url: `/observations/collections/${id}/`,
        method: "POST",
        data: JSON.stringify(date_range),
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

            if (edit) {
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

            const start_date_edit = $("#edit-start-date");
            const end_date_edit = $("#edit-end-date");
            const start_date_view = $("#view-start-date");
            const end_date_view = $("#view-end-date");
            start_date_edit.change(() => lowerLimitDate(true));
            end_date_edit.change(() => upperLimitDate(true));
            start_date_view.change(() => lowerLimitDate());
            end_date_view.change(() => upperLimitDate());

            document.getElementById("edit-in-range").addEventListener(
                "click",
                async () => await checkDateRange(true)
            );
            document.getElementById("view-in-range").addEventListener(
                "click",
                async () => await checkDateRange()
            );
            document.getElementById("create-new").addEventListener(
                "click",
                async() => await createNewCollection()
            );
        }
    });
}

async function checkDateRange(edit=false) {
    const prefix = (edit) ? "#edit" : "#view";

    const start_date_val = $(prefix + "-start-date").val();
    const end_date_val = $(prefix + "-end-date").val();

    if (start_date_val.length && end_date_val.length) {
        if (start_date_val <= end_date_val) {
            const gardenId = $("#gardens")[0].selectedOptions[0].id;

            await fillCollections(gardenId, edit);
        } else {
            alertModal("The end date should be later than the start date.")
        }
    } else {
        alertModal("Please select start and end dates.")
    }
}

function lowerLimitDate(edit=false) {
    const prefix = (edit) ? "edit" : "view";

    const start_date_val = document.getElementById(prefix + "-start-date").value;
    const end_date = document.getElementById(prefix + "-end-date");

    end_date.min = start_date_val;
}

function upperLimitDate(edit=false) {
    const prefix = (edit) ? "edit" : "view";

    const end_date_val = document.getElementById(prefix + "-end-date").value;
    const start_date = document.getElementById(prefix + "-start-date");

    start_date.max = end_date_val;
}

$("#gardens").change(async (e) => {
    if (e.target.selectedOptions[0].id.length)
        await fillCollections(e.target.selectedOptions[0].id, false, true);
});

function formatCollection(id) {

    let collection = {
        "id": parseInt(id),
        "date": $("#date-" + id).val(),
        "garden": parseInt($("#garden-" + id).attr("name")),
        "records": {},
        "creator": $("#collection-creator-" + id).text(),
        "finished": true
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
            else if (inputs[j].type === "hidden")
                record[inputs[j].id.substr(inputs[j].id.match("-").index + 1)] = parseInt(inputs[j].value);
            else
                record[inputs[j].id.substr(inputs[j].id.match("-").index + 1)] = inputs[j].value;
        }
        for (let j = 0; j < selects.length; j++)
            record[selects[j].id.substr(selects[j].id.match("-").index + 1)] = selects[j].value;

        collection["records"][record["order"]] = record;
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
        const data = JSON.stringify(selectAll(true))

        let request = new XMLHttpRequest();
        request.onreadystatechange = function() {
            if(request.readyState === 4) {
                if (request.status === 200) {
                    console.log(typeof request.response); // should be a blob
                    let filename = "";
                    let disposition = request.getResponseHeader('Content-Disposition');
                    if (disposition && disposition.indexOf('attachment') !== -1) {
                        let filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                        let matches = filenameRegex.exec(disposition);
                        if (matches != null && matches[1]) filename = matches[1].replace(/['"]/g, '');
                    }

                    if (typeof window.navigator.msSaveBlob !== 'undefined') {
                        // IE workaround for "HTML7007: One or more blob URLs were revoked by closing the blob for which they were created. These URLs will no longer resolve as the data backing the URL has been freed."
                        window.navigator.msSaveBlob(request.response, filename);
                    } else if (typeof window.navigator.msSaveBlob === 'undefined') {
                        let URL = window.URL || window.webkitURL;
                        let downloadUrl = URL.createObjectURL(request.response);

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

                        setTimeout(function () {
                            URL.revokeObjectURL(downloadUrl);
                        }, 100); // cleanup
                    } else if (request.responseText !== "") {
                        console.log(request.responseText);
                    }
                }
            } else if (request.readyState === 2) {
                if (request.status === 200) {
                    request.responseType = "blob";
                } else {
                    request.responseType = "text";
                }
            } else if (request.readyState === 3 && request.responseType !== "blob") {
                alertModal(request.response);
            }
        };
        request.open("POST", `/observations/download/${filetype}/`, true);
        request.send(data);
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


    console.log(collections)

    for (let i = 0; i < collections.length; i++) {
        const collection = collections[i];

        console.log(collection)

        for (let key in collection["records"]) {
            const record = collection["records"][key];

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
            } else if (record["senescence-intensity"].length > 0 && parseInt(record["senescence-intensity"]) > 0 && record["senescence"] !== "y") {
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
            } else if (record["flowering-intensity"].length > 0 && parseInt(record["flowering-intensity"]) > 0 && record["flowers-opening"] !== "y") {
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
        console.log(collections)
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

        if (collectionId === "new")
            continue;

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

async function createNewCollection() {
    const createBtn = document.getElementById("create-new");
    const garden = document.getElementById("new-subgarden");
    const gardenSelected = garden.selectedOptions[0].id;

    if (garden.length) {
        await $.ajax({
            url: `/observations/new/${gardenSelected}`,
            method: "POST",
            error: function (jqXHR) {
                // alert(jqXHR.responseText);
                alertModal(jqXHR.responseJSON);
            },
            beforeSend: function(){
                $("body").addClass("loading");
            },
            complete: function(data){
                // console.log(data["id"]);
                $("body").removeClass("loading");
            },
            success: async function (data) {
                const collectionDiv = document.getElementById("collection-new");
                const collectionGarden = document.getElementById("garden-new");
                const collectionCreator = document.getElementById("collection-creator-new");
                const collectionToggle = document.getElementById("collapse-toggle-new");

                const collectionId = data["id"];
                const collectionDate = document.getElementById("new-date");
                const collectionDateLabel = document.getElementById("new-date-label");
                const collectionContent = document.getElementById("edit-records-new");

                collectionDate.id = `date-${collectionId}`;
                collectionContent.id = `edit-records-${collectionId}`;
                collectionDiv.id = `collection-${collectionId}`;
                $(collectionGarden).prop("name", gardenSelected);
                collectionGarden.id = `garden-${collectionId}`;
                collectionCreator.id = `collection-creator-${collectionId}`;

                $(collectionDateLabel).prop("for", collectionDate.id);
                $(garden).prop("disabled", true);

                createBtn.remove();
                collectionDate.classList.remove("d-none");
                collectionDate.value = data["date"];
                collectionContent.classList.remove("d-none");
                collectionDateLabel.classList.remove("d-none");

                collectionToggle.dataset["target"] = `#collection-${collectionId}`;

                await fillInContent(parseInt(collectionId), true);
                cancelAndSaveButtons(collectionId);
            }
        });
    } else {
        alertModal("Please choose a date and a subgarden.")
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
