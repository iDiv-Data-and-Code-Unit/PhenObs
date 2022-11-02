import {
    fetchCollection,
    getCollection,
    setCollection,
    updateCollection,
    uploadCollection,
    markEdited,
    insertCollection
} from "./collection.js";
import {
    cacheRecord,
    checkDefault,
    fillInFields,
    getFields,
    markDone,
    noObservationPossible,
    requireIntensities, selectPlant,
    setupPlants
} from "./observation.js";
import {
    fillInButtons,
    fillInModalDates,
    fillInOldData,
    confirmModal,
    alertModal,
    formatDate,
    toggleButtons
} from "./modals.js";

// Check if the page is Edit page and get collection ID in case it is and fill in collection info
if (location.href.indexOf('edit') !== -1 && location.href.indexOf('not found') === -1) {
    (async () => {
        const id = parseInt(getEditId());
        await fill(id, true);
    })();
}

/**
 * Fills in the data for the collection, populates buttons, dropdowns, change listeners etc.
 * @param {number} id - Collection ID
 * @param {boolean} isOnline - Whether the collection is a saved finished collection or not
 * @param {boolean} isOrdered - Whether to sort in alphabetical order or numerical
 * @param {boolean} orderedListCall - Whether the function was called because of a sorting change
 */
export async function fill(id, isOnline, isOrdered=false, orderedListCall=false) {
    window.onbeforeunload = function() {
        return confirm("Do you want the page to be reloaded?");
    }

    let collection = await getCollection(id);

    // If the collection does not exist locally, fetch it from DB
    if (isOnline && (collection === undefined || collection == null)) {
        await fetchCollection(id, isOnline);
        collection = await getCollection(id);
        if (!"no-observation" in collection)
            $('#no-obs-div').addClass('d-none');
    }

    setDate(new Date(collection["date"]));
    $('#garden').text(collection['garden-name']);
    $('#creator').text(collection['creator']);
    $('#orderedList').unbind().click(async function() {
        if ($(this).attr("name") === "alpha")
            await fill(id, isOnline, true, true)
        else
            await fill(id, isOnline, false, true);
    })
    await setupPlants(parseInt(collection["id"]), isOrdered, !orderedListCall);
    await changeListeners(getFields(), parseInt(collection["id"]), isOnline);
    await markDone(parseInt(collection["id"]));

    // If there exists a previous collection attached to this one, populate the previous collection buttons
    if (collection["last-collection-id"] != null) {
        await oldClickListeners(parseInt(collection["last-collection-id"]));
    }

    await cachingListeners(parseInt(collection["id"]));
}

/**
 * Returns the collection ID from the URL
 * @return {string} Collection ID in the URL
 */
function getEditId() {
    const url = location.href;
    const split = url.split('/');
    return split[split.length - 1];
}

/**
 * Adds change listeners to every field, dropdown to update the collection in local storage
 * @param {Object} fields - Fields to add change listeners
 * @param {number} id - ID of the collection
 * @param {boolean} editFlag - Whether to mark edited after every change
 */
export async function changeListeners(fields, id, editFlag) {
    for (let key in fields) {
        for (let i = 0; i < fields[key].length; i++) {
            $(fields[key][i]).unbind().change(async function() {
                let collection = await getCollection(id);
                // console.log(collection);
                let plants = document.getElementById("plant");
                let isDone = collection["records"][parseInt(plants.selectedOptions[0].id)]["done"];
                await cacheRecord(id, parseInt(plants.selectedOptions[0].id), isDone);
                if (editFlag)
                    await markEdited(id);
            });
        }
    }
}

/**
 * Adds click listeners to the save buttons in editing previous collection values in modals
 * @param {number} id - ID of the collection, which is a previous collection to the current one
 */
export async function oldClickListeners(id) {
    let saveButtons = $('[id*="-save"]');

    for (let i = 0; i < saveButtons.length; i++) {
        $(saveButtons[i]).unbind().click(async function () {
            let order = parseInt(document.getElementById("plant").selectedOptions[0].id);

            // Update the data in local storage for the chosen plant
            await cacheRecord(id, order, true, true);
            let collection = await getCollection(id);
            // Fill in modals and buttons
            fillInOldData(collection, order);
            fillInModalDates(collection);
            fillInButtons(collection, order);
        });
    }
}

/**
 * Sets collection date
 * @param {Date} dateToSet - Passed date object to set the collection-date element's value
 */
export function setDate(dateToSet) {
    const collectionDate = document.getElementById('collection-date');
    collectionDate.value =
        `${dateToSet.getFullYear()}-` +
        `${String(dateToSet.getMonth() + 1).padStart(2, '0')}-` +
        `${String(dateToSet.getDate()).padStart(2, '0')}`;
}

/**
 * Gets a previous collection for the current collection
 * @param {number} id - ID of the current collection
 */
async function getLast(id) {
    let collection = await getCollection(id);
    await $.ajax({
        url: "/observations/last/",
        data: JSON.stringify(collection),
        method: "POST",
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
        success: async function (lastCollection) {
            // Check if a previous collection exists
            if (lastCollection) {
                // Update the current collection and attach this collection's ID to it
                collection['last-collection-id'] = lastCollection["id"]
                // Insert the collection into the local storage
                await insertCollection(lastCollection, true)
                await setCollection(collection);
                const order = parseInt(document.getElementById('plant').selectedOptions[0].id);
                // Populate the previous collection buttons for the chosen plant if a plant is chosen
                if (order) {
                    fillInOldData(lastCollection, order);
                    fillInModalDates(lastCollection);
                    fillInButtons(lastCollection, order);
                }
                // Add click listeners to the buttons
                await oldClickListeners(parseInt(collection["last-collection-id"]));
                let lastCollectionDate = document.getElementById('last-obs-date');
                // Add the collection date for the copy-older button
                lastCollectionDate.innerText = formatDate(new Date(lastCollection["date"]), false).toString();
            } else {
                // If no previous collection was available, mark last collection id null for the current collection
                collection['last-collection-id'] = null;
                await setCollection(collection);
                // Hide previous collection buttons
                toggleButtons(true);
            }
        }
    });
}

/**
 * Unbinds previous listeners and adds new listeners to sync changes with the local storage
 * @param {number} id - ID of the collection
 */
export function cachingListeners(id) {
    $("#collection-date").unbind().change(async (e) => {
        if (e.target.value.length > 0) {
            await updateCollection(id);
            await getLast(id);
            let collection = await getCollection(id);

            if (collection["last-collection-id"] != null) {
                await oldClickListeners(parseInt(collection["last-collection-id"]));
            }
        } else {
            alertModal("Please choose a valid date");
        }
    });

    // Add event listener for finish button
    $("#finish-btn").unbind().click(async () => await checkDefault(id, null, true));

    // Add event listener for #no-observation
    $("#no-observation").unbind().change((e) => noObservationPossible(e.target.checked));

    // Add event listener for done collection button
    $("#done-btn").unbind().click(
        async () => {
            const isReady = await checkDefault(id, null, true);
            if (isReady)
                await uploadCollection(id);
        }
    );

    // Add event listener for cancel collection button
    $("#cancel-btn").unbind().click(() => {
        confirmModal("Are you sure you want to cancel and go back?");
        $('#confirm-yes').unbind().click(() => location.href = "/observations/");
    });

    // Add event listener for #flowers-opening
    $("#flowers-opening").unbind().change(requireIntensities);
    // Add event listener for #senescence
    $("#senescence").unbind().change(requireIntensities);
    // Add event listeners for #plant
    $("#plant").unbind().focus(
        async () => await checkDefault(id, false, true)
    ).change(async (e) => {
        await selectPlant(id, parseInt(e.target.selectedOptions[0].id));
        e.target.blur();
    });

    $("#copy-older").unbind().click(async function() {
        let collection = await getCollection(id);
        await fillInFields(
            id,
            document.getElementById("plant").selectedOptions[0].id,
            collection["last-collection-id"]
        );
    });
}
