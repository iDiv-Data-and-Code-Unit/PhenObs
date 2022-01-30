import {fillInOldData, fillInModalDates, fillInButtons, toggleButtons, confirmModal, alertModal, formatDate} from "./modals.js";
import {setCollections, setCollection, getCollections, getCollection, fetchCollection} from "./collection.js";

export function getFields(isOld=false) {
    return {
        "dropdowns": $('select')
            .filter((isOld) ? '[id*="-old"]' : '[id!=""]')
            .not((isOld) ? '[id*=""]' : '[id*="-old"]')
            .not('[id*="plant"]').not('[id*="intensity"]'),
        "intensities": $('select[id*="intensity"]')
            .filter((isOld) ? '[id*="-old"]' : '[id!=""]')
            .not((isOld) ? '[id*=""]' : '[id*="-old"]'),
        "checkboxes": $('input[type="checkbox"]')
            .filter((isOld) ? '[id*="-old"]' : '[id!=""]')
            .not((isOld) ? '[id*=""]' : '[id*="-old"]'),
        "textarea": $('textarea')
            .filter((isOld) ? '[id*="-old"]' : '[id!=""]')
            .not((isOld) ? '[id*=""]' : '[id*="-old"]')
    };
}

export async function setupPlants(id) {

    const collection = await getCollection(id);

    if (collection['last-collection-id'] != null) {
        let lastCollection = await getCollection(collection['last-collection-id']);

        if (lastCollection === undefined || lastCollection == null || !("last-collection-id" in lastCollection)) {
            lastCollection = await fetchCollection(collection['last-collection-id']);
        }

        let lastCollectionDate = document.getElementById('last-collection-date');
        lastCollectionDate.innerText = formatDate(new Date(lastCollection["date"])).toString();
    }

    let plants = document.getElementById('plant');

    for (let key in collection["records"]) {
        const plant = collection["records"][key];

        console.log(key, plant['name'], plant['order']);

        plants.innerHTML +=
            '<option value="' +
            plant["name"] +
            '" name="' +
            plant["name"] +
            '" id="' +
            plant["order"] + '">' +
            plant["name"] +
            '</option>';
    }

    plants.selectedIndex = 0;
}

function findOptionIndex(order) {
    let plants = document.getElementById('plant');
    for (let i = 0; i < plants.length; i++)
        if (plants[i].id == order.toString())
            return i;
    return -1;
}

// Fills in the form fields for a particular plant
export async function fillInFields(id, order) {
    // console.log('fillIn');
    const collection = await getCollection(id);
    let fields = getFields();

    let plants = document.getElementById('plant');
    const index = findOptionIndex(order);

    plants.selectedIndex = index;

    let plant = collection["records"][order];

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
        if (plant[fields["intensities"][i].id] == null)
            $('#'+fields["intensities"][i].id).val(null);
        else
            fields["intensities"][i].value = plant[fields["intensities"][i].id];
    }
    // Set the checkboxes
    for (let i = 0; i < fields["checkboxes"].length; i++) {
        fields["checkboxes"][i].checked = plant[fields["checkboxes"][i].id];
    }

    // Set the textarea
    $('#remarks').val(plant["remarks"])

    if (collection['last-collection-id'] != null) {
        const lastCollection = await getCollection(collection['last-collection-id']);

        // Call button and modal filling functions
        fillInOldData(lastCollection, plant["order"]);
        fillInModalDates(lastCollection);
        fillInButtons(lastCollection, plant["order"]);
    } else
        toggleButtons(true);

    // Cache the record
    await cacheRecord(id, order, plant['done']);
    noObservationPossible(plant["no-observation"]);
}

export async function selectPlant(id, order) {
    let collection = await getCollection(id);
    if (order in collection['records']) {
        await fillInFields(id, order);

        // Display/Hide "Previous" button
        if (order === Math.min.apply(null,Object.keys(collection["records"]))) {
            $('#prev-btn').addClass("d-none");
        } else {
            $('#prev-btn').removeClass("d-none");
        }

        // Display/Rename "Next" button
        if (collection['remaining'].length === 1 && collection['remaining'][0] === order) {
            $('#next-btn').val("Finish")
        } else if (order == Math.max.apply(null,Object.keys(collection["records"]))) {
            $('#next-btn').addClass("d-none");
        }
        else {
            $('#next-btn').removeClass("d-none");
        }

        // Move the screen back to the top
        location.href = "#title";
    }
}

function checkValid() {
    const elements = $('[required]');
    for (let i = 0; i < elements.length; i++)
        if ($(elements[i]).is(':invalid') || $(elements[i]).val().length === 0) {
            $(elements[i]).focus();
            return false;
        }
    return true;
}

export async function selectNextPlant(id, order) {
    if (!checkValid()) 
        // alert("Please fill all fields!");
        alertModal("Please fill all fields!");
    else {
        let collection = await getCollection(id);
        // console.log(collection);
        await cacheRecord(id, order, true);
        // Select the next plant
        const next = parseInt(Object.keys(collection["records"]).find(num => num > order));

        await selectPlant(id, next);
    }
}

export async function selectPreviousPlant(id, order) {
    if (!checkValid()) 
        // alert("Please fill all fields!");
        alertModal("Please fill all fields!");
    else {
        let collection = await getCollection(id);
        await cacheRecord(id, order, true);
        // Select the previous plant
        const prev = parseInt(Object.keys(collection["records"]).reverse().find(num => num < order));

        await selectPlant(id, prev);
    }
}

export async function markDone(id) {
    let collection = await getCollection(id);
    for (let record in collection["records"]) {
        if (collection["records"][record]["done"])
        $('option[id=' + collection["records"][record]["order"] + ']').addClass("done-plant");
    }
}

export async function checkDefault(id, nextFlag) {
    let collection = await getCollection(id);
    const plants = document.getElementById('plant');
    let current = await collection["records"][parseInt(plants.selectedOptions[0].id)];
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

    const order = parseInt(plants.selectedOptions[0].id);

    // Check if the values are default
    if (defaultFlag && !current["done"]) {
        // if (confirm("You have not changed any default value. Are you sure you want to move on?")) {
        //     if (nextFlag)
        //         await selectNextPlant(id, order);
        //     else
        //         await selectPreviousPlant(id, order);
        // }
        confirmModal("You have not changed any default value. Are you sure you want to move on?");
        $('#confirm-yes').click(
            async function() {
                if (nextFlag)
                    await selectNextPlant(id, order);
                else
                    await selectPreviousPlant(id, order);
            }
        );
    } else {
        if (nextFlag)
            await selectNextPlant(id, order);
        else
            await selectPreviousPlant(id, order);
    }
}

export async function cacheRecord(id, order, isDone, isOld=false) {
    let collection = await getCollection(id);
    let plants = document.getElementById("plant");
    // Current record to be cached
    let record = collection["records"][parseInt(order)];
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
    ids['values'].forEach(function (id) {
        // console.log(id, isOld);
        record[id] = document.getElementById(id + ((isOld) ? '-old' : '')).value
    });
    ids['checked'].forEach(function (id) {
        if (isOld && id === "no-observation") return;
        record[id] = document.getElementById(id + ((isOld) ? '-old' : '')).checked
    });
    if (!isOld) {
        record['done'] = (isDone) ?
            isDone :
            record["done"];

        // Check if the plant is finished
        if (isDone) {
            // Remove the order from the remaining orders list
            const index = collection["remaining"].indexOf(parseInt(order));
            // If the element is already finished
            if (index > -1)
                collection["remaining"].splice(index, 1);
            // Highlight the plant in the dropdown
            $('option[id=' + order + ']').addClass("done-plant");
        }

        // Done collection button
        let doneBtn = $("#done-btn");
        // If there exists no plant, then disable the button
        if (!collection["remaining"].length) {
            collection['finished'] = true;
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
            // alert("Collection is ready to be saved");
            alertModal("Collection is ready to be saved");
    } else {
        collection['edited'] = true;
        collection['uploaded'] = false;
    }

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
