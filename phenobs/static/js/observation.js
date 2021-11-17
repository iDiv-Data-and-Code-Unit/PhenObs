import { fillInOldData, fillInModalDates, fillInButtons } from "./modals.js";

export function getFields() {
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
    let plants = document.getElementById('plant');
    let fields = getFields();
    // Choose the current plant from local storage
    let record = null;
    for (let key in collection["records"]) {
        // console.log(key)
        // console.log(collection["records"][key])
        // console.log(collection["records"][key]["order"])
        // console.log(order)
        if (collection["records"][key]["order"] == order)
            record = collection["records"][key];
    }
    // Set the plant
    plants.selectedIndex = order - 1;

    if (plants.selectedIndex == 0 || !collection["remaining"].length) {
        $('#prev-btn').addClass("d-none");
    } else {
        $('#prev-btn').removeClass("d-none");
    }

    // Set the dropdowns
    for (let i = 0; i < fields["dropdowns"].length; i++) {
        for (let j = 0; j < fields["dropdowns"][i].children.length; j++) {
            fields["dropdowns"][i].children[j].selected =
                record[fields["dropdowns"][i].id] == fields["dropdowns"][i].children[j].value;
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
    fields["textarea"].value = record["remarks"];
    // Call button and modal filling functions
    fillInOldData(lastCollection, record["plant"]);
    fillInModalDates(lastCollectionId);
    fillInButtons(lastCollection, record["plant"]);
    // Cache the record
    cacheRecord(currentCollectionId, record["done"]);
}

export function selectNextPlant(order, lastCollectionId, collectionId) {
    let valid = true;
    $('[required]').each(function() {
        if ($(this).is(':invalid') || !$(this).val()) {
            $(this).focus();
            valid = false;
        }
    });
    if (!valid) alert("Please fill all fields!");
    else {
        let collections = JSON.parse(
            localStorage.getItem("collections")
        );
        let int_order = parseInt(order);
        // Select the next plant
        if (collections["unfinished"][collectionId]["remaining"].indexOf(int_order + 1) > -1)
            selectPlant(int_order + 1, lastCollectionId, collectionId);
        // Select a remaining plant
        else if (collections["unfinished"][collectionId]["remaining"].length > 0)
            selectPlant(collections["unfinished"][collectionId]["remaining"][0], lastCollectionId, collectionId);
        else
            alert("Collection is ready to be saved");
    }
}

export function selectPreviousPlant(order, lastCollectionId, collectionId) {
    let valid = true;
    $('[required]').each(function() {
        if ($(this).is(':invalid') || !$(this).val()) {
            $(this).focus();
            valid = false;
        }
    });
    if (!valid) alert("Please fill all fields!");
    else {
        let collections = JSON.parse(
            localStorage.getItem("collections")
        );
        let int_order = parseInt(order);
        // Select the next plant
        if (collections["unfinished"][collectionId]["remaining"].indexOf(int_order - 1) > -1)
            selectPlant(int_order - 1, lastCollectionId, collectionId);
    }
}

export function checkDefault(lastCollectionId, collectionId, flag) {
    console.log(collectionId);
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
        if (confirm("You have not changed any default value. Are you sure you want to move on?")) {
            cacheRecord(collectionId, true);
            if (flag)
                selectNextPlant(document.getElementById("plant").selectedIndex + 1, lastCollectionId, collectionId);
            else
                selectPreviousPlant(document.getElementById("plant").selectedIndex + 1, lastCollectionId, collectionId);
        }
    } else {
        cacheRecord(collectionId, true);
        if (flag)
            selectNextPlant(document.getElementById("plant").selectedIndex + 1, lastCollectionId, collectionId);
        else
            selectPreviousPlant(document.getElementById("plant").selectedIndex + 1, lastCollectionId, collectionId);
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

    const plants = document.getElementById("plant");
    record['name'] = plants.children[plants.selectedIndex].name;
    record['order'] =  plants.children[plants.selectedIndex].id;

    // Get the collections
    let collections = JSON.parse(
        localStorage.getItem("collections")
    );
    let collection = collections["unfinished"][collectionId];

    // Check if the plant is finished
    if (isDone) {
        console.log(isDone);
        let remaining = collection["remaining"];
        let plants = document.getElementById("plant");
        let doneBtn = $("#done-btn");

        // Remove the order from the remaining orders list
        const index = remaining.indexOf(plants.selectedIndex + 1);
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
        $('option[id='+ (plants.selectedIndex + 1).toString() +']').addClass("done-plant");
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
            if (fields[key][i].id != 'no-observation') {
                fields[key][i].disabled = flag;
                fields[key][i].required = false;
            }
        }
    }

    // Enable "Remarks" and require it if necessary
    fields["textarea"][0].disabled = false;
    fields["textarea"][0].required = flag;

    // Check intensity requirement
    requireIntensities();
}

export function requireIntensities() {
    if ($('#senescence').val() == 'y' && !$('#senescence').prop('disabled')) {
        $('#senescence-intensity').prop('disabled', false);
        $('#senescence-intensity').prop('required', true);
        $('#senescence-intensity').removeClass('disabled-btn');
    } else {
        $('#senescence-intensity').addClass('disabled-btn');
        $('#senescence-intensity').prop('disabled', true);
        $('#senescence-intensity').prop('required', false);
    }
    if ($('#flowers-opening').val() == 'y' && !$('#flowers-opening').prop('disabled')) {
        $('#flowering-intensity').prop('disabled', false);
        $('#flowering-intensity').prop('required', true);
        $('#flowering-intensity').removeClass('disabled-btn');
    } else {
        $('#flowering-intensity').addClass('disabled-btn');
        $('#flowering-intensity').prop('disabled', true);
        $('#flowering-intensity').prop('required', false);
    }
}
