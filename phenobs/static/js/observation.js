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

export async function setupPlants(id) {
    const collection = await getCollection(id);
    let lastCollection = await getCollection(collection['last-collection-id']);
    let plants = document.getElementById('plant');

    let lastCollectionDate = document.getElementById('last-collection-date');
    lastCollectionDate.innerText = lastCollection["date"];

    for (let key in collection["records"]) {
        const plant = collection["records"][key];

        console.log(key, plant['name'], plant['order']);

        plants.innerHTML +=
            '<option value="' +
            plant["name"] + '-' +
            plant["order"] +
            '" name="' +
            plant["name"] +
            '" id="' +
            plant["order"] + '">' +
            plant["name"] + '-' +
            plant["order"] +
            '</option>';
    }

    plants.selectedIndex = 0;
}

// Fills in the form fields for a particular plant
export async function fillInFields(id, order) {
    console.log('fillIn');
    const collection = await getCollection(id);
    const lastCollection = await getCollection(collection['last-collection-id']);
    let fields = getFields();

    let plants = document.getElementById('plant');

    plants.selectedIndex = order - 1;

    console.log(plants)

    let plant = collection["records"][parseInt(plants.children[order - 1].id)];

    // Set the dropdowns
    for (let i = 0; i < fields["dropdowns"].length; i++) {
        for (let j = 0; j < fields["dropdowns"][i].children.length; j++) {
            if (plant[fields["dropdowns"][i].id] == null)
                fields["dropdowns"][i].children[j].selected = 3;
            else
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
    $('#remarks').val(plant["remarks"])

    // Call button and modal filling functions
    fillInOldData(lastCollection, plant["order"]);
    fillInModalDates(lastCollection);
    fillInButtons(lastCollection, plant["order"]);
    // Cache the record
    await cacheRecord(id, plant['done']);
    noObservationPossible(plant["no-observation"]);
}

export async function selectPlant(id, order) {
    let collection = await getCollection(id);
    await fillInFields(id, order);

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

export async function selectNextPlant(id, order) {
    if (!checkValid()) alert("Please fill all fields!");
    else {
        await cacheRecord(id, true);
        // Select the next plant
        await selectPlant(id, parseInt(order) + 1);
    }
}

export async function selectPreviousPlant(id, order) {
    if (!checkValid()) alert("Please fill all fields!");
    else {
        await cacheRecord(id, true);
        // Select the previous plant
        await selectPlant(id, parseInt(order) - 1);
    }
}

export async function checkDefault(id, nextFlag) {
    let collection = await getCollection(id);
    const plants = document.getElementById('plant');
    let current = await collection["records"][parseInt(plants.children[plants.selectedIndex].id)];
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

    const order = plants.selectedIndex + 1;

    // Check if the values are default
    if (defaultFlag && !current["done"]) {
        if (confirm("You have not changed any default value. Are you sure you want to move on?")) {
            if (nextFlag)
                await selectNextPlant(id, order);
            else
                await selectPreviousPlant(id, order);
        }
    } else {
        if (nextFlag)
            await selectNextPlant(id, order);
        else
            await selectPreviousPlant(id, order);
    }
}

export async function cacheRecord(id, isDone) {
    let collection = await getCollection(id);
    let plants = document.getElementById("plant");
    // Current record to be cached
    let record = await collection["records"][parseInt(plants.children[plants.selectedIndex].id)];
    // IDs of the elements to be cached
    const ids = {
        "values": [
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

    record['done'] = (isDone) ?
        isDone :
        record["done"];

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
    await setCollection(collection);
}

export function noObservationPossible(flag) {
    let fields = getFields();
    // Disabled/Enable the fields if the flag is True/False
    for (let key in fields) {
        for (let i = 0; i < fields[key].length; i++) {
            if (fields[key][i].id !== 'no-observation') {
                fields[key][i].disabled = flag;
                fields[key][i].required = false;
            }
        }
    }

    // Enable "Remarks" and require it if necessary
    document.getElementById('remarks').disabled = false;
    document.getElementById('remarks').required = flag;

    // Check intensity requirement
    requireIntensities();
}

export function requireIntensities() {
    let senescence = $('#senescence');
    let senescenceIntensity = $('#senescence-intensity');
    let flowersOpening = $('#flowers-opening');
    let floweringIntensity = $('#flowering-intensity');

    if (senescence.val() === 'y' && !senescence.prop('disabled')) {
        senescenceIntensity.prop('disabled', false);
        senescenceIntensity.prop('required', true);
        senescenceIntensity.removeClass('disabled-btn');
    } else {
        senescenceIntensity.addClass('disabled-btn');
        senescenceIntensity.prop('disabled', true);
        senescenceIntensity.prop('required', false);
    }
    if (flowersOpening.val() === 'y' && !flowersOpening.prop('disabled')) {
        floweringIntensity.prop('disabled', false);
        floweringIntensity.prop('required', true);
        floweringIntensity.removeClass('disabled-btn');
    } else {
        floweringIntensity.addClass('disabled-btn');
        floweringIntensity.prop('disabled', true);
        floweringIntensity.prop('required', false);
    }
}
