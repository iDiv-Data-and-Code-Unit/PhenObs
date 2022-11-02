import { alertModal } from "./modals.js";

/**
 * Fills in rows for collections for the chosen garden and, if available, date range and attaches click
 * listeners to fetch the collection info when clicked
 * @param {string} id - ID of the garden
 * @param {boolean} edit - Whether the call was made from edit tab or view tab
 * @param {boolean} reset - Whether to filter by date range or not
 */
async function fillCollections(id, edit=false, reset=false) {
    const prefix = (edit) ? "#edit" : "#view";

    const start_date_e = $(prefix + "-start-date");
    const end_date_e = $(prefix + "-end-date");
    let start_date = null;
    let end_date = null;

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

    await $.ajax({
        url: `/observations/collections/${id}/`,
        method: "POST",
        data: JSON.stringify(date_range),
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
            await assignListeners(collectionCardsEdit, true);
            await assignListeners(collectionCardsView, false);

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

/**
 * Checks if the date range is valid
 * @param {boolean} edit - Whether the call was made from edit tab or view tab
 */
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

/**
 * Sets a lower limit for the datepicker
 * @param {boolean} edit - Whether the call was made from edit tab or view tab
 */
function lowerLimitDate(edit=false) {
    const prefix = (edit) ? "edit" : "view";

    const start_date_val = document.getElementById(prefix + "-start-date").value;
    const end_date = document.getElementById(prefix + "-end-date");

    end_date.min = start_date_val;
}

/**
 * Sets an upper limit for the datepicker
 * @param {boolean} edit - Whether the call was made from edit tab or view tab
 */
function upperLimitDate(edit=false) {
    const prefix = (edit) ? "edit" : "view";

    const end_date_val = document.getElementById(prefix + "-end-date").value;
    const start_date = document.getElementById(prefix + "-start-date");

    start_date.max = end_date_val;
}

// Adds a click listener to fetch respective collections when garden choice has changed
$("#gardens").change(async (e) => {
    if (e.target.selectedOptions[0].id.length)
        await fillCollections(e.target.selectedOptions[0].id, false, true);
});

/**
 * Gathers records' information for the collection with the provided ID and returns upload-ready object
 * @param {number} collectionId - ID of the collection
 * @return {Object} Formatted collection object with all the records' data
 */
function formatCollection(collectionId) {
    console.log(collectionId)
    let collection = {
        "id": parseInt(collectionId),
        "date": $("#date-" + collectionId).val(),
        "garden": parseInt($("#garden-" + collectionId).attr("name")),
        "records": {},
        "creator": $("#collection-creator-" + collectionId).text(),
        "finished": true
    };

    const records = $("#collection-" + collectionId + ' tr[id*="record-"]');

    for (let i = 0; i < records.length; i++) {
        let record = {
            "id": parseInt(records[i].id.substr(7)),
            "no-observation": false,
            "done": true,
        };

        let inputs = $('#record-' + record["id"] + ' input');
        let selects = $('#record-' + record["id"] + ' select');

        for (let j = 0; j < inputs.length; j++) {
            if ($(inputs[j]).prop("type") === "checkbox")
                record[inputs[j].id.substr(inputs[j].id.match("-").index + 1)] = $(inputs[j]).prop("checked");
            else if ($(inputs[j]).prop("type") === "hidden")
                record[inputs[j].id.substr(inputs[j].id.match("-").index + 1)] = parseInt($(inputs[j]).val());
            else
                record[inputs[j].id.substr(inputs[j].id.match("-").index + 1)] = $(inputs[j]).val();
        }
        for (let j = 0; j < selects.length; j++)
            if (selects[j].id.includes("intensity")) {
                record[selects[j].id.substr(selects[j].id.match("-").index + 1)] = parseInt(selects[j].value);
            }
            else
                record[selects[j].id.substr(selects[j].id.match("-").index + 1)] = selects[j].value;

        collection["records"][record["order"]] = record;
    }

    return collection;
}

/**
 * Returns a list of all the available collections' IDs
 * @param {boolean} view - Whether the call was made from view tab or edit tab
 * @return {Array} Array of available collections' IDs
 */
function selectAll(view=false) {
    const ids = "selected" + ((view) ? "view-" : "-");
    const checkboxes = $('input[id*="' + ids + '"]');
    let collections = [];
    for (let i = 0; i < checkboxes.length; i++)
        if (checkboxes[i].checked)
            collections.push(parseInt(checkboxes[i].id.substr((view) ? 13 : 9)))

    return collections;
}

/**
 * Checks/unchecks all the available collections
 * @param {boolean} checked - Whether to check or uncheck
 * @param {boolean} view - Whether the call was made from view tab or edit tab
 */
function checkAll(checked=true, view=false) {
    const ids = "selected" + ((view) ? "view-" : "-");
    const checkboxes = $('input[id*="' + ids + '"]');

    for (let i = 0; i < checkboxes.length; i++) {
        if (!(checkboxes[i].classList.contains("d-none")))
            checkboxes[i].checked = checked;
    }
}

/**
 * Sends a request to download selected collections as a file (CSV or XLSX) and saves it
 * @param {string} filetype - File type of the requested file to be downloaded
 */
async function downloadFile(filetype){
    const collections = selectAll(true);
    if (collections.length) {
        const data = JSON.stringify(selectAll(true))

        let request = new XMLHttpRequest();
        request.onreadystatechange = function() {
            if(request.readyState === 4) {
                if (request.status === 200) {
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

/**
 * Unbinds previous and attached click listeners for all the buttons in the navigation bar
 */
function initNav() {
    $("#downloadCSV").unbind().click(async () => await downloadFile('csv'));
    $("#downloadXLSX").unbind().click(async () => await downloadFile('xlsx'));
    $("#selectAll").unbind().click((e) => {e.preventDefault(); checkAll(true)});
    $("#deselectAll").unbind().click((e) => {e.preventDefault(); checkAll(false)});
    $("#viewSelectAll").unbind().click((e) => {e.preventDefault(); checkAll(true, true)});
    $("#viewDeselectAll").unbind().click((e) => {e.preventDefault(); checkAll(false, true)});

    document.getElementById("uploadSelected").addEventListener("click", async () => await uploadSelected());
}

/**
 * Checks all the selected collections to be uploaded, highlights missing or invalid input
 * If all valid, uploads all the chosen collections
 * @param {string, int, null} collection - ID of the single collection to be uploaded. If null, then upload all selected
 * @return {Array} An array of the uploaded collections
 */
async function uploadSelected(collection=null) {
    let selected = (
        collection == null ||
        (
            typeof collection !== "number" &&
            typeof collection !== "string"
        )
    ) ? selectAll() : [collection];

    let collections = [];
    let invalid = false;

    console.log(selected, selected.length)

    for (let i = 0; i < selected.length; i++) {
        const collection = formatCollection(selected[i])
        collections.push(collection);
    }

    for (let i = 0; i < collections.length; i++) {
        const collection = collections[i];

        for (let key in collection["records"]) {
            const record = collection["records"][key];

            const fields = $("[id*=" + record["id"] + "-]");
            for (let k = 0; k < fields.length; k++) {
                fields[k].classList.remove("invalidField");
            }

            if ((isNaN(record["senescence-intensity"]) ||
                record["senescence-intensity"] == null ||
                record["senescence-intensity"] === 0 ||
                record["senescence-intensity"].length === 0) &&
                record["senescence"] === "y") {
                alertModal("Fill in all the required fields.")
                $('#' + record["id"] + '-senescence-intensity').addClass("invalidField");
                invalid = true;
            } else if (record["senescence-intensity"] != null && parseInt(record["senescence-intensity"]) > 0 && record["senescence"] !== "y") {
                alertModal("Fill in all the required fields.")
                $('#' + record["id"] + '-senescence').addClass("invalidField");
                invalid = true;
            }
            if ((isNaN(record["flowering-intensity"]) ||
                record["flowering-intensity"] == null ||
                record["flowering-intensity"] === 0 ||
                record["flowering-intensity"].length === 0) &&
                record["flowers-opening"] === "y") {
                alertModal("Fill in all the required fields.")
                $('#' + record["id"] + '-flowering-intensity').addClass("invalidField");
                invalid = true;
            } else if (record["flowering-intensity"] != null && parseInt(record["flowering-intensity"]) > 0 && record["flowers-opening"] !== "y") {
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

    if (collections.length > 0) {
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
               await fillCollections(document.getElementById("gardens").selectedOptions[0].id,true, true)
            }
        });
    } else {
        alertModal("You have not selected any collection.");
    }

    return collections;
}

/**
 * Attaches listeners to every collection to fetch its data or simply collapse it
 * and adds functionality to cancel and save buttons
 * @param {Object} cards - ID of the collection to be returned from the local storage
 * @param {boolean} edit - Whether the call was made from edit tab or view tab
 */
async function assignListeners(cards, edit=false) {
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
                        await cancelAndSaveButtons(collectionId);
                    }
                }
            }
        )
    }
}

/**
 * Sends a request to gather data for new collection creation for a chosen subgarden, then updates the page
 */
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
                await cancelAndSaveButtons(parseInt(collectionId));
            }
        });
    } else {
        alertModal("Please choose a date and a subgarden.")
    }
}

/**
 * Attaches listeners to cancel and save buttons for the given collection
 * @param {string, int} collectionId - ID of the collection to add cancel and saving functionality
 */
async function cancelAndSaveButtons(collectionId) {
    document.getElementById(`${collectionId}-save`).addEventListener(
        'click',
        async () => await uploadSelected(collectionId)
    );

    const oldValues = formatCollection(collectionId);

    document.getElementById(`${collectionId}-cancel`).addEventListener(
        'click',
        () => {
            const id = oldValues["id"];

            document.getElementById("date-" + id).value = oldValues["date"];

            for (let index in oldValues["records"]) {
                let recordId = oldValues["records"][index]["id"];
                for (let key in oldValues["records"][index]) {
                    if (!(key === "id" || key === "no-observation" || key === "done")) {
                        if (oldValues["records"][index][key] === true || oldValues["records"][index][key] === false) {
                            document.getElementById(recordId + "-" + key).checked = oldValues["records"][index][key];
                        } else {
                            document.getElementById(recordId + "-" + key).value = oldValues["records"][index][key];
                        }
                    }
                }
            }

            $("#collection-" + id).collapse('hide');
        }
    )
}

/**
 * Fetches records' for the collection and populates its body with the received content
 * @param {number} id - ID of the collection
 * @param {boolean} edit - Whether the call was made from edit tab or view tab
 */
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
