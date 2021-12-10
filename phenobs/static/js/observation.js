import { fillInOldData, fillInModalDates, fillInButtons } from "./modals.js";
import { setCollections, setCollection, getCollections, getCollection } from "./collection.js";

export function getFields() {
    return {
        "dropdowns": $('select').not('[id*="-old"]').not('[id*="plant"]'),
        "intensities": $('input[type="number"]').not('[id*="-old"]'),
        "checkboxes": $('input[type="checkbox"]').not('[id*="-old"]'),
        "textarea": $('textarea').not('[id*="-old"]')
    };
}

export function setupPlants(id) {
    let collection = getCollection(id);
    let lastCollection = getCollection(collection['last-collection-id']);

    let plants = document.getElementById('plant');

    let lastCollectionDate = document.getElementById('last-collection-date');
    lastCollectionDate.innerText = lastCollection["date"];

    for (let key in collection["records"]) {
        const plant = collection["records"][key];

        plants.innerHTML +=
            '<option value="' +
            plant["plant"] +
            '" name="' +
            plant["name"] +
            '" id="' +
            plant["order"] + '">' +
            plant["plant"] +
            '</option>';
    }

    plants.selectedIndex = 0;
}

// Fills in the form fields for a particular plant
export function fillInFields(id, order) {
    let collection = getCollection(id);
    let lastCollection = getCollection(collection['last-collection-id']);
    let fields = getFields();

    let plants = document.getElementById('plant');
    let plant = collection["records"][plants.children[order - 1].id];

    plants.selectedIndex = order - 1;

    // Set the dropdowns
    for (let i = 0; i < fields["dropdowns"].length; i++) {
        for (let j = 0; j < fields["dropdowns"][i].children.length; j++) {
            fields["dropdowns"][i].children[j].selected =
                plant[fields["dropdowns"][i].id] === fields["dropdowns"][i].children[j].value;
        }
    }
    // Set the intensities
    for (let i = 0; i < fields["intensities"].length; i++) {
        fields["intensities"][i].value = plant[fields["intensities"][i].id];
    }
    // Set the checkboxes
    for (let i = 0; i < fields["checkboxes"].length; i++) {
        fields["checkboxes"][i].checked = plant[fields["checkboxes"][i].id];
    }

    // Set the textarea
    fields["textarea"][0].value = plant["remarks"];

    // Call button and modal filling functions
    fillInOldData(lastCollection, plant["order"]);
    fillInModalDates(lastCollection);
    fillInButtons(lastCollection, plant["order"]);
    // Cache the record
    cacheRecord(id, plant['done']);
    noObservationPossible(plant["no-observation"]);
}

export function selectPlant(id, order) {
    let collection = getCollection(id);
    fillInFields(id, order);

    // Display/Hide "Previous" button
    if (order === 1) {
        $('#prev-btn').addClass("d-none");
    } else {
        $('#prev-btn').removeClass("d-none");
    }

    // Display/Rename "Next" button
    if (collection['remaining'].length === 1 && collection['remaining'][0] === order) {
        $('#next-btn').val("Finish")
    } else {
        $('#next-btn').removeClass("d-none");
    }
}

function checkValid() {
    $('[required]').each(function() {
        if ($(this).is(':invalid') || !$(this).val()) {
            $(this).focus();
            return false;
        }
    });
    return true;
}

export function selectNextPlant(id, order) {
    if (!checkValid()) alert("Please fill all fields!");
    else {
        cacheRecord(id, true);
        // Select the next plant
        selectPlant(id, parseInt(order) + 1);
    }
}

export function selectPreviousPlant(id, order) {
    if (!checkValid()) alert("Please fill all fields!");
    else {
        cacheRecord(id, true);
        // Select the previous plant
        selectPlant(id, parseInt(order) - 1);
    }
}

export function checkDefault(id, nextFlag) {
    let current = getCollection(id)["records"][document.getElementById("plant").id];
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

    const plants = document.getElementById('plant');
    const order = plants.selectedIndex + 1;

    // Check if the values are default
    if (defaultFlag && !current["done"]) {
        if (confirm("You have not changed any default value. Are you sure you want to move on?")) {
            if (nextFlag)
                selectNextPlant(id, order);
            else
                selectPreviousPlant(id, order);
        }
    } else {
        if (nextFlag)
            selectNextPlant(id, order);
        else
            selectPreviousPlant(id, order);
    }
}

export function cacheRecord(id, isDone) {
    let collection = getCollection(id);
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
        collection["records"][plants.children[plants.selectedIndex].id]["done"];
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

    if (!collection["remaining"].length && !collection["records"][record["order"]]["done"] && isDone)
        alert("Collection is ready to be saved");

    collection["records"][record["order"]] = record;
    // Update the collections
    setCollection(collection);
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
