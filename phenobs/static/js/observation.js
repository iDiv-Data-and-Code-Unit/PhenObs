import {
    alertModal,
    confirmModal,
    fillInButtons,
    fillInModalDates,
    fillInOldData,
    formatDate,
    toggleButtons
} from "./modals.js";
import {fetchCollection, getCollection, setCollection} from "./collection.js";

/**
 * Returns the available fields for data collection
 * @param {boolean} isOld - Whether to get the fields for a previous collection or not
 * @return {Object} An object with all the available fields organized by field types
 */
export function getFields(isOld=false) {
    return {
        "dropdowns": $('select')
            .filter((isOld) ? '[id*="-old"]' : '[id!=""]')
            .not((isOld) ? '[id*=""]' : '[id*="-old"]')
            .not('[id*="plant"]').not('[id*="subgarden"]').not('[id*="intensity"]'),
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

/**
 * Populates plant selection dropdown
 * @param {number} id - ID of the current collection
 * @param {boolean} orderedList - Whether the plants to be ordered in alphabetical order or numerical
 * @param {boolean} fillCall - Whether the function was called to setup plants or change the order and select current plant in the dropdown
 */
export async function setupPlants(id, orderedList=false, fillCall=false) {
    const collection = await getCollection(id);

    if (collection['last-collection-id'] != null) {
        let lastCollection = await getCollection(collection['last-collection-id']);

        if (lastCollection === undefined || lastCollection == null || !("last-collection-id" in lastCollection)) {
            await fetchCollection(collection['last-collection-id'], true);
            lastCollection = await getCollection(collection['last-collection-id']);
        }

        let lastCollectionDate = document.getElementById('last-obs-date');
        lastCollectionDate.innerText = formatDate(new Date(lastCollection["date"]), false).toString();
    }

    let plants = document.getElementById('plant');

    let chosen = null;

    if (plants.children.length > 0 && !$("#emptyOption").length && !fillCall)
        chosen = parseInt(plants.selectedOptions[0].id);

    plants.innerHTML = '<option value="" name="" id="emptyOption"></option>';

    let ordered = collection["records"];
    if (orderedList) {
        // Sorting for alphabetical order
        let names = {};
        for (let key in collection["records"]) {
            const plant = collection["records"][key];
            names[plant["name"]] = plant;
        }
        ordered = Object.keys(names).sort().reduce(
            (obj, key) => {
            obj[key] = collection["records"][names[key]["order"]];
            return obj;
            }, {}
        );

        $("#orderedList").attr("name", "numeric");
        $("#orderedList").removeClass("bi-sort-alpha-down");
        $("#orderedList").addClass("bi-sort-numeric-down");

        $("#next-btn").addClass("d-none");
        $("#prev-btn").addClass("d-none");
    } else {
        $("#orderedList").attr("name", "alpha");
        $("#orderedList").addClass("bi-sort-alpha-down");
        $("#orderedList").removeClass("bi-sort-numeric-down");
    }

    for (let key in ordered) {
        const plant = ordered[key];

        plants.innerHTML +=
            '<option value="' +
            plant["name"] +
            '" name="' +
            plant["name"] +
            '" id="' +
            plant["order"] + '"' +
            ((plant["order"] === chosen) ? "selected" : "") +
            '>' +
            plant["name"] +
            '</option>';
    }

    if (chosen == null) {
        plants.selectedIndex = 0;
        toggleButtons(true);
        $("#done-btn").text("Done");
    } else
        $("#emptyOption").remove();

    $("#done-btn").prop("disabled", "disabled");
}

/**
 * Returns the index of the plant with the given order in the plants dropdown
 * @param {number} order - Order of the current plant
 * @return {number} Index of the plant in the dropdown (-1 if not found)
 */
function findOptionIndex(order) {
    let plants = document.getElementById('plant');
    for (let i = 0; i < plants.length; i++)
        if (plants[i].id == order.toString())
            return i;
    return -1;
}

/**
 * Fills in the form fields for a particular plant
 * @param {number} id - ID of the collection
 * @param {number} order - Order of the current plant
 * @param {number, null} lastCollectionId - ID of the previous collection to populate previous collection buttons
 */
export async function fillInFields(id, order, lastCollectionId=null) {
    let collection = await getCollection(id);
    let currentCollection = null;

    if (lastCollectionId != null) {
        currentCollection = collection;
        collection = await getCollection(lastCollectionId);
    }

    let fields = getFields();

    let plants = document.getElementById('plant');
    const index = findOptionIndex(order);

    plants.selectedIndex = index;

    let plant = collection["records"][parseInt(order)];

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
    if (lastCollectionId == null)
        for (let i = 0; i < fields["checkboxes"].length; i++) {
            fields["checkboxes"][i].checked = plant[fields["checkboxes"][i].id];
        }

    // Set the textarea
    if (lastCollectionId == null)
        $('#remarks').val(plant["remarks"])

    if ((currentCollection == null && collection['last-collection-id'] != null) ||
        currentCollection != null) {
        let lastCollection = collection;
        if (currentCollection == null)
            lastCollection = await getCollection(collection['last-collection-id']);

        // Call button and modal filling functions
        fillInOldData(lastCollection, plant["order"]);
        fillInModalDates(lastCollection);
        fillInButtons(lastCollection, plant["order"]);
    } else
        toggleButtons(true);
    await cacheRecord(
        id, order,
        (currentCollection == null)
            ? plant['done']
            : currentCollection["records"][order]["done"]
    );
    noObservationPossible(plant["no-observation"]);
}

/**
 * Selects the plant in the dropdown and fills in fields with its data
 * @param {number} id - ID of the collection
 * @param {number} order - Order of the plant to be chosen
 */
export async function selectPlant(id, order) {
    let collection = await getCollection(id);
    if (order in collection['records']) {
        await fillInFields(id, order);

        $("#emptyOption").remove();

        // Display "finish" button
        if (collection['remaining'].length === 1 && collection['remaining'][0] === order && !collection["finished"]) {
            $('#finish-btn').removeClass("d-none");
        } else {
            $('#finish-btn').addClass("d-none");
        }

        // Move the screen back to the top
        location.href = "#title";
    }
}

/**
 * Checks if all the required fields are filled
 * @return {boolean} Whether the all the fields are filled and valid
 */
export function checkValid() {
    const elements = $('[required]');
    for (let i = 0; i < elements.length; i++)
        if ($(elements[i]).is(':invalid') || $(elements[i]).val().length === 0) {
            $(elements[i]).focus();
            return false;
        }
    return true;
}

/**
 * @deprecated Next and Previous buttons were abandoned for dropdown selection
 *
 * Checks if all the required fields are filled, updates local storage then selects the next plant in line
 * @param {number} id - ID of the collection
 * @param {number} order - Order of the current plant
 */
export async function selectNextPlant(id, order) {
    if (!checkValid())
        alertModal("Please fill all fields!");
    else {
        let collection = await getCollection(id);
        await cacheRecord(id, order, true);
        // Select the next plant
        const next = parseInt(Object.keys(collection["records"]).find(num => num > order));

        await selectPlant(id, next);
    }
}

/**
 * @deprecated Next and Previous buttons were abandoned for dropdown selection
 *
 * Checks if all the required fields are filled, updates local storage then selects the previous plant in line
 * @param {number} id - ID of the collection
 * @param {number} order - Order of the current plant
 */
export async function selectPreviousPlant(id, order) {
    if (!checkValid())
        alertModal("Please fill all fields!");
    else {
        let collection = await getCollection(id);
        await cacheRecord(id, order, true);
        // Select the previous plant
        const prev = parseInt(Object.keys(collection["records"]).reverse().find(num => num < order));

        await selectPlant(id, prev);
    }
}

/**
 * Marks the collection as finished and ready for upload
 * @param {number} id - ID of the collection
 */
export async function markDone(id) {
    let collection = await getCollection(id);
    for (let record in collection["records"]) {
        if (collection["records"][record]["done"]) {
            $('option[id=' + collection["records"][record]["order"] + ']').addClass("done-plant");
            const tmp = $('option[id=' + collection["records"][record]["order"] + ']').text();
            if (!tmp.includes("✓"))
                $('option[id=' + collection["records"][record]["order"] + ']').text("✓ " + tmp);
        }
    }
}

/**
 * Checks if none of the required fields were filled and still has the default values
 * and displays a confirm modal to verify
 * @param {number} id - ID of the collection
 * @param {boolean} nextFlag - Whether the function was called by the next or previous button
 * @param {boolean} manual - Whether the function was called from dropdown selection
 * @return {boolean} Whether the data is valid and user is able to continue with their data collection
 */
export async function checkDefault(id, nextFlag, manual=false) {
    let collection = await getCollection(id);
    let plants = document.getElementById('plant');

    if (!plants.selectedIndex && document.getElementById("emptyOption") != null)
        return false;

    let current = await collection["records"][parseInt(plants.selectedOptions[0].id)];
    let defaultFlag = true;

    // Check the values
    for (let key in current) {
        if (current[key] === 'y' ||
            current[key] === 'u' ||
            current[key] === 'm' ||
            current[key] === true) {
            defaultFlag = false;
            break;
        }
    }

    const order = parseInt(plants.selectedOptions[0].id);

    // Check if the values are default
    if (defaultFlag && !current["done"] && current["remarks"].length == 0) {
        confirmModal("You have not changed any default value. Are you sure you want to move on?");
        $('#confirm-yes').unbind().click(
            async () => await checkManual(manual, nextFlag, checkValid(), id, order)
        );
        return true;
    } else {
        return await checkManual(manual, nextFlag, checkValid(), id, order);
    }
}

/**
 * Runs checks on the current record and if the user is able to continue to the next plant
 * @param {boolean} manual - Whether the function was called from dropdown selection
 * @param {boolean} nextFlag - Whether the function was called by the next or previous button
 * @param {boolean} isValid - Result of checkValid() function and if all the required fields are filled or not
 * @param {number} id - ID of the collection
 * @param {number} order - Order of the current plant
 * @return {boolean} Whether the data is valid and user is able to continue with their data collection
 */
async function checkManual(manual, nextFlag, isValid, id, order) {
    if (!manual) {
        if (nextFlag)
            await selectNextPlant(id, order);
        else
            await selectPreviousPlant(id, order);
    } else if (!isValid) {
        alertModal("Please fill all fields!");
        return false;
    } else {
        await cacheRecord(id, order, true);
        return true;
    }
}

/**
 * Updates the local storage values for the current collection and plant
 * @param {number} id - ID of the collection
 * @param {number, string} order - Order of the current plant
 * @param {boolean} isDone - Whether the plant was marked as finished
 * @param {boolean} isOld - Whether the collection is marked as finished
 * @return {boolean} Whether the data is valid and user is able to continue with their data collection
 */
export async function cacheRecord(id, order, isDone, isOld=false) {
    let collection = await getCollection(id);
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
        record['done'] = (isDone) ? true : record["done"];

        // Check if the plant is finished
        if (isDone) {
            // Remove the order from the remaining orders list
            let index = collection["remaining"].indexOf(parseInt(order));
            // If the element is already finished
            if (index > -1)
                collection["remaining"].splice(index, 1);
            // Highlight the plant in the dropdown
            $('option[id=' + order + ']').addClass("done-plant");
            let tmp = $('option[id=' + order + ']').text();
            if (!tmp.includes("✓"))
                $('option[id=' + order + ']').text("✓ " + tmp);
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

        if (
            !collection["remaining"].length &&
            !collection["records"][record["order"]]["done"] &&
            isDone
        )
            // alert("Collection is ready to be saved");
            alertModal("Collection is ready to be saved");
    } else {
        collection["edited"] = true;
        collection["uploaded"] = false;
    }

    collection["records"][record["order"]] = record;
    // Update the collections and return
    return await setCollection(collection);
}

/**
 * Disables all the fields if no observation was possible and vice versa
 * @param {boolean} flag - True if no-observation was checked and all fields need to disabled
 */
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

/**
 * If the either one of or both of the senescence and flowers-opening fields are set to true, requires respective
 * intensity fields, otherwise, disables them
 */
export function requireIntensities() {
    let senescence = $('#senescence');
    let senescenceIntensity = $('#senescence-intensity');
    let flowersOpening = $('#flowers-opening');
    let floweringIntensity = $('#flowering-intensity');
    let peakFlowering = $('#peak-flowering');

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

        peakFlowering.prop('disabled', false);
        peakFlowering.prop('required', true);
        peakFlowering.removeClass('disabled-btn');
    } else {
        floweringIntensity.addClass('disabled-btn');
        floweringIntensity.prop('disabled', true);
        floweringIntensity.prop('required', false);

        peakFlowering.addClass('disabled-btn');
        peakFlowering.prop('disabled', true);
        peakFlowering.prop('required', false);
    }
}
