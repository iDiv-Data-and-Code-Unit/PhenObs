import { fillInOldData, fillInModalDates, fillInButtons } from "./modals.js";

function getFields() {
    return {
        "dropdowns": $('select').not('[id*="-old"]').not('[id*="plant"]'),
        "intensities": $('input[type="number"]').not('[id*="-old"]'),
        "checkboxes": $('input[type="checkbox"]').not('[id*="-old"]'),
        "textarea": $('textarea').not('[id*="-old"]')
    };
}

export function selectPlant(order, lastCollectionId, currentCollectionId) {
    let collections = JSON.parse(
        localStorage.getItem("collections")
    );
    // Get the last collection from local storage
    let lastCollection = collections["done"][lastCollectionId];
    // Get the current collection
    let collection = collections["unfinished"][currentCollectionId];

    // Read values from JSON into fields
    let plants = $('select[id*="plant"]');
    let fields = getFields();
    // Choose the current plant from local storage
    let record = null;
    for (let key in collection["records"]) {
        if (collection["records"][key]["order"] == order)
            record = collection["records"][key];
    }
    // Set the plant
    for (let i = 0; i < plants.children.length; i++) {
        if (plants.children[i].name == record["order"]) {
            plants.children[i].selected = true;
            break;
        }
    }
    // Set the dropdowns
    for (let i = 0; i < fields["dropdowns"].length; i++) {
        for (let j = 0; j < fields["dropdowns"][i].children.length; j++) {
            fields["dropdowns"][i].children[i].selected =
                record[fields["dropdowns"][i].id] == fields["dropdowns"][i].children[i].value;
        }
    }
    // Set the intensities
    for (let i = 0; i < fields["intensities"].length; i++) {
        fields["intensities"][i].value = record[fields["intensities"][i].id];
    }
    // Set the checkboxes
    for (let i = 0; i < fields["checkboxes"].length; i++) {
        fields["checkboxes"][i].value = record[fields["checkboxes"][i].id];
    }
    // Set the textarea
    fields["textarea"].val(record["remarks"]);
    // Call button and modal filling functions
    fillInOldData(lastCollection, record["plant"]);
    fillInModalDates(lastCollectionId);
    fillInButtons(lastCollection, record["plant"]);
    // Cache the record
    cacheRecord(currentCollectionId, record["done"]);
}

export function selectNextPlant(order, collectionId) {
    let collections = JSON.parse(
        localStorage.getItem("collections")
    );
    // Select the next plant
    if (collections["unfinished"][collectionId]["remaining"].indexOf(order + 1) > -1)
        selectPlant(order + 1);
    // Select a remaining plant
    else if (collections["unfinished"][collectionId]["remaining"].length > 0)
        selectPlant(collections["unfinished"][collectionId]["remaining"][0]);
}

export function selectPreviousPlant(order, collectionId) {
     let collections = JSON.parse(
        localStorage.getItem("collections")
    );
    // Select the next plant
    if (collections["unfinished"][collectionId]["remaining"].indexOf(order - 1) > -1)
        selectPlant(order - 1);
}

function checkDefault(collectionId) {
    let collections = JSON.parse(
        localStorage.getItem("collections")
    );
    let collection = collections["unfinished"][collectionId];
    let current = collection["records"][document.getElementById("plant").value];
    let defaultFlag = true;
    // Check the values
    for (let i = 0; i < current.length; i++) {
        if (current[i] == 'y' ||
            current[i] == 'u' ||
            current[i] == 'm' ||
            current[i] == true)
            defaultFlag = false;
    }
    // Check if the values are default
    if (defaultFlag) {
        if (confirm("You have not changed any default value. Are you sure you want to move on?"))
            selectNextPlant(document.getElementById("plant").name, collectionId);
    } else {
        selectNextPlant(document.getElementById("plant").name, collectionId);
    }
}

export function cacheRecord(collectionId, isDone) {
    // Current record to be cached
    let record = {}
    // IDs of the elements to be cached
    const ids = {
        "values": [
            "plant",
            "initial-vegetative-growth",
            "young-leaves-unfolding",
            "flowers-opening",
            "peak-flowering",
            "ripe-fruits",
            "senescence",
            "flowering-intensity",
            "senescence-intensity",
            "remarks",
            "peak-flowering-estimation"
        ], "checked": [
            "cut-partly",
            "cut-total",
            "covered-natural",
            "covered-artificial",
            "transplanted",
            "removed"
        ]
    };

    // Cache the values
    ids['values'].forEach(function(id) {
       record[id] = document.getElementById(id).value
    });
    ids['checked'].forEach(function(id) {
       record[id] = document.getElementById(id).checked
    });
    record['done'] = isDone;

    // Get the collections
    let collections = JSON.parse(
        localStorage.getItem("collections")
    );
    let collection = collections["unfinished"][collectionId];

    // Check if the plant is finished
    if (isDone) {
        let remaining = collection["remaining"];
        let plants = document.getElementById("plant");
        let doneBtn = $("#done-btn");
        let order = null;

        for (let plant in plants) {
            if (plant.selected) {
                order = plant.name;
                // Disable "Previous" button if the plant is the first in line
                if (order == "1") {
                    $('#prev-btn').addClass("d-none");
                } else {
                    $('#prev-btn').removeClass("d-none");
                }
            }
        }
        // Remove the order from the remaining orders list
        const index = remaining.indexOf(parseInt(order));
        // If the element is already finished
        if (index > -1)
            remaining.splice(index, 1);
        // Check if there remains only 1 plant, then rename "Next" to "Finish"
        // If there exists no plant, then disable the button
        if (remaining.length === 1)
            $('#next-btn').val("Finish");
        else if (!remaining.length) {
            $('#next-btn').prop('disabled', true);
            doneBtn.prop("disabled", false);
        }
        else {
            $('#next-btn').val("Next");
            doneBtn.prop("disabled", true);
        }
        // Highlight the plant in the dropdown
        $('option[name='+ order +']').addClass("done-plant");
        // Update the "Done" button to show updated progress
        doneBtn.val(
            (collection["records"].length - remaining.length) +
            "/" +
            collection["records"].length +
            " Done"
        );
    }

    // Update the collection
    collection["records"][record["plant"]] = record;
    // Update the collections
    collections["unfinished"][collectionId] = collection;
    localStorage.setItem(
        "collections", JSON.stringify(collections)
    );
}

export function noObservationPossible(flag) {
    let fields = getFields();
    // Disabled/Enable the fields if the flag is True/False
    for (let key in fields) {
        for (let i = 0; i < fields[key].length; i++) {
            fields[key][i].disabled = flag;
            fields[key][i].required = false;
        }
    }

    // Enable "Remarks" and require it if necessary
    fields["textarea"].disabled = false;
    fields["textarea"].required = flag;

    // Check intensity requirement
    if (!flag)
        requireIntensities();
}

export function requireIntensities() {
    if ($('#senescence').val() == 'y') {
        $('#senescence-intensity').prop('disabled', false);
        $('#senescence-intensity').prop('required', true);
    }
    if ($('#flowers-opening').val() == 'y') {
        $('#flowering-intensity').prop('disabled', false);
        $('#flowering-intensity').prop('required', true);
    }
}
