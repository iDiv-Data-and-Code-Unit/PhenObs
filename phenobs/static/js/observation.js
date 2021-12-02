import { fillInOldData, fillInModalDates, fillInButtons } from "./modals.js";
import { getCollections } from "./collection.js";

export function getFields() {
    return {
        "dropdowns": $('select').not('[id*="-old"]').not('[id*="plant"]'),
        "intensities": $('input[type="number"]').not('[id*="-old"]'),
        "checkboxes": $('input[type="checkbox"]').not('[id*="-old"]'),
        "textarea": $('textarea').not('[id*="-old"]')
    };
}

export function selectPlant(order, lastCollectionId, currentCollectionId, collections, collectionType) {
    // Read values from JSON into fields
    let plants = document.getElementById('plant');
    if (order > plants.children.length)
        return;
    let fields = getFields();
    // Choose the current plant from local storage
    let record = collections["unfinished"][currentCollectionId]["records"][plants.children[order - 1].value];

    // Set the plant
    plants.selectedIndex = order - 1;

    if (order === 1) {
        $('#prev-btn').addClass("d-none");
    } else {
        $('#prev-btn').removeClass("d-none");
    }

    console.log(order, Object.keys(collections["unfinished"][currentCollectionId]['records']).length)

    if (order === Object.keys(collections["unfinished"][currentCollectionId]['records']).length) {
        $('#next-btn').val("Finish")
    } else {
        $('#next-btn').removeClass("d-none");
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
        fields["checkboxes"][i].checked = record[fields["checkboxes"][i].id];
    }

    // Set the textarea
    fields["textarea"][0].value = record["remarks"];
    // Call button and modal filling functions
    fillInOldData(collections["done"][lastCollectionId], record["plant"]);
    fillInModalDates(collections["done"][lastCollectionId]);
    fillInButtons(collections["done"][lastCollectionId], record["plant"]);
    // Cache the record
    cacheRecord(currentCollectionId, record["done"], getCollections());
    noObservationPossible(record["no-observation"]);
}

export function selectNextPlant(order, lastCollectionId, collectionId, collections) {
    let valid = true;
    $('[required]').each(function() {
        if ($(this).is(':invalid') || !$(this).val()) {
            $(this).focus();
            valid = false;
        }
    });
    if (!valid) alert("Please fill all fields!");
    else {
        cacheRecord(collectionId, true, getCollections());
        let int_order = parseInt(order);
        // Select the next plant
        selectPlant(int_order + 1, lastCollectionId, collectionId, collections);
    }
}

export function selectPreviousPlant(order, lastCollectionId, collectionId, collections) {
    let valid = true;
    $('[required]').each(function() {
        if ($(this).is(':invalid') || !$(this).val()) {
            $(this).focus();
            console.log(this);
            valid = false;
        }
    });
    if (!valid) alert("Please fill all fields!");
    else {
        cacheRecord(collectionId, true, getCollections());
        let int_order = parseInt(order);
        selectPlant(int_order - 1, lastCollectionId, collectionId, collections);
    }
}

export function checkDefault(lastCollectionId, collectionId, flag, collections) {
    let current = collections["unfinished"][collectionId]["records"][document.getElementById("plant").value];
    let defaultFlag = true;
    // Check the values
    for (let key in current) {
        if (current[key] === 'y' ||
            current[key] === 'u' ||
            current[key] === 'm' ||
            current[key] === true) {
            defaultFlag = false;
        }
    }
    // Check if the values are default
    if (defaultFlag && !current["done"]) {
        if (confirm("You have not changed any default value. Are you sure you want to move on?")) {
            if (flag)
                selectNextPlant(document.getElementById("plant").selectedIndex + 1, lastCollectionId, collectionId, collections);
            else
                selectPreviousPlant(document.getElementById("plant").selectedIndex + 1, lastCollectionId, collectionId, collections);
        }
    } else {
        if (flag)
            selectNextPlant(document.getElementById("plant").selectedIndex + 1, lastCollectionId, collectionId, collections);
        else
            selectPreviousPlant(document.getElementById("plant").selectedIndex + 1, lastCollectionId, collectionId, collections);
    }
}

export function cacheRecord(collectionId, isDone, collections) {
    let collection = collections["unfinished"][collectionId];
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
            "removed",
            "no-observation"
        ]
    };

    // Cache the values
    ids['values'].forEach(function(id) {
       record[id] = document.getElementById(id).value
    });
    ids['checked'].forEach(function(id) {
       record[id] = document.getElementById(id).checked
    });

    let plants = document.getElementById("plant");
    record['done'] = (isDone) ?
        isDone :
        collection["records"][plants.children[plants.selectedIndex].value]["done"];
    record['name'] = plants.children[plants.selectedIndex].name;
    record['order'] = plants.selectedIndex + 1;

    // Check if the plant is finished
    if (isDone) {
        // Remove the order from the remaining orders list
        const index = collection["remaining"].indexOf(plants.selectedIndex + 1);
        // If the element is already finished
        if (index > -1)
            collection["remaining"].splice(index, 1);
        // Highlight the plant in the dropdown
        $('option[id='+ (plants.selectedIndex + 1).toString() +']').addClass("done-plant");
    }

    // Done collection button
    let doneBtn = $("#done-btn");
    // If there exists no plant, then disable the button
    if (!collection["remaining"].length) {
        doneBtn.prop("disabled", false);
        doneBtn.addClass("text-white");
        doneBtn.removeClass("text-black");
        doneBtn.addClass("done-btn-ready");
    } else {
        doneBtn.prop("disabled", true);
        doneBtn.addClass("text-black");
        doneBtn.removeClass("text-white");
        doneBtn.removeClass("done-btn-ready");
    }
    // Update the "Done" button to show updated progress
    doneBtn.text(
        (Object.keys(collection["records"]).length - collection["remaining"].length) +
        "/" +
        Object.keys(collection["records"]).length +
        " Done"
    );

    if (!collection["remaining"].length && !collection["records"][record["plant"]]["done"] && isDone)
        alert("Collection is ready to be saved");

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
    let senescence = $('#senescence');
    let senescenceIntensity = $('#senescence-intensity');
    let flowersOpening = $('#flowers-opening');
    let floweringIntensity = $('#flowering-intensity');

    if (senescence.val() == 'y' && !senescence.prop('disabled')) {
        senescenceIntensity.prop('disabled', false);
        senescenceIntensity.prop('required', true);
        senescenceIntensity.removeClass('disabled-btn');
    } else {
        senescenceIntensity.addClass('disabled-btn');
        senescenceIntensity.prop('disabled', true);
        senescenceIntensity.prop('required', false);
    }
    if (flowersOpening.val() == 'y' && !flowersOpening.prop('disabled')) {
        floweringIntensity.prop('disabled', false);
        floweringIntensity.prop('required', true);
        floweringIntensity.removeClass('disabled-btn');
    } else {
        floweringIntensity.addClass('disabled-btn');
        floweringIntensity.prop('disabled', true);
        floweringIntensity.prop('required', false);
    }
}
