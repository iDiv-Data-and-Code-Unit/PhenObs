import {fill} from "./edit.js";
import {alertModal} from "./modals.js";

/**
 * Returns collections object from local storage
 * @return {Object} Collections object containing all the collections and records' info in local storage
 */
export async function getCollections() {
    return await JSON.parse(
        localStorage.getItem("collections")
    );
}

/**
 * Returns the collection object with the given id from local storage
 * @param {number} id - ID of the collection to be returned from the local storage
 * @return {Object} Collection object containing all the records' info for the collection with the given ID
 */
export async function getCollection(id) {
    let collections = await getCollections();
    if (collections != null)
        return collections[id];
    // Returns null if the collection does not exist in the local storage
    return null;
}

/**
 * Edits the collections object stored in local storage and inserts a new collection
 * if the collection is unfinished, assigns default values, else the saved values for fields
 * @param {Object} collections - Collections object in the local storage
 * @param {Object} collection - Collection to be inserted into the local storage
 * @return {Object} Collections object to be updated in the local storage
 */
function formatRecords(collections, collection) {
    for (let key in collection['records']) {
        const current = collection['records'][key];

        collections[collection['id']]['records'][current['order']] = {
            "id": current['id'],
            "name": current['name'],
            "order": current['order'],
            "plant": current['name'] + "-" + current['order'],
            "initial-vegetative-growth": (current['initial-vegetative-growth'] == null) ? "no" : current['initial-vegetative-growth'],
            "young-leaves-unfolding": (current['young-leaves-unfolding'] == null) ? "no" : current['young-leaves-unfolding'],
            "flowers-opening": (current['flowers-opening'] == null) ? "no" : current['flowers-opening'],
            "peak-flowering": (current['peak-flowering'] == null) ? "no" : current['peak-flowering'],
            "peak-flowering-estimation": (current['peak-flowering-estimation'] == null) ? "no" : current['peak-flowering-estimation'],
            "flowering-intensity": current['flowering-intensity'],
            "ripe-fruits": (current['ripe-fruits'] == null) ? "no" : current['ripe-fruits'],
            "senescence": (current['senescence'] == null) ? "no" : current['senescence'],
            "senescence-intensity": current['senescence-intensity'],
            "remarks": current['remarks'],
            "cut-partly": current['cut-partly'],
            "cut-total": current['cut-total'],
            "covered-natural": current['covered-natural'],
            "covered-artificial": current['covered-artificial'],
            "removed": current['removed'],
            "transplanted": current['transplanted'],
            "no-observation": current['no-observation'],
            "done": current['done']
        };
    }

    return collections;
}

/**
 * Inserts the collection into the collections object in local storage
 * @param {Object} collection - Collection to be imported into the local storage
 * @param {boolean} isOnline - Whether the collection is saved in the database (false for newly created unfinished collections)
 * @param {boolean} isOld - Whether the collection to be imported is a previous collection for another collection
 * @return {Object} Stored collection object
 */
export async function insertCollection(collection, isOnline, isOld=false) {
    let collections = await getCollections();
    let remaining = [];

    if (collections == null)
        collections = {};

    for (let record in collection["records"]) {
        if (!collection["records"][record]["done"])
            remaining.push(collection["records"][record]["order"]);
    }

    let lastCollectionId = null;
    if (collection['last-collection'] != null)
        lastCollectionId = collection['last-collection']['id'];
    else if (collection['last-collection-id'] != null)
        lastCollectionId = collection['last-collection-id'];

    collections[collection['id']] = {
        'id': collection['id'],
        'date': collection['date'],
        'creator': collection['creator'],
        'garden': collection['garden'],
        'garden-name': collection['garden-name'],
        'last-collection-id': lastCollectionId,
        'edited': false,
        'finished': collection["finished"],
        'uploaded': isOnline,
        'records': {},
        'remaining': remaining,
        "no-observation": collection["no-observation"]
    };

    // Add the last collection to the list
    if (!isOld && collection['last-collection'] != null) {
        collections[collection['last-collection']['id']] = collection['last-collection'];
        collections[collection['last-collection']['id']]['last-collection-id'] =
            collection['last-collection']['last-collection-id'];
        collections[collection['last-collection']['id']]['remaining'] = [];
        collections[collection['last-collection']['id']]['edited'] = false;
        collections[collection['last-collection']['id']]['finished'] = true;
        collections[collection['last-collection']['id']]['uploaded'] = true;
    }

    // Format records, import collection into the collections object then save it to local storage
    await setCollections(formatRecords(collections, collection));
    return collections[collection["id"]];
}

/**
 * Sets a single collection in local storage
 * @param {Object} collection - Collection to be updated in the local storage
 * @return {Object} Same collection object
 */
export async function setCollection(collection) {
    let collections = await getCollections();
    collections[collection["id"]] = collection;
    await setCollections(collections);
    return collection;
}

/**
 * Sets all collections in local storage
 * @param {Object} collections - Collections object to be updated in the local storage
 * @return {Object} Same collections object
 */
export async function setCollections(collections) {
    await localStorage.setItem(
        "collections", JSON.stringify(collections)
    );
    return collections;
}

/**
 * Get necessary information from the server and create an empty collection
 * @param {string, null} id - ID of the subgarden the new collection will be created for. null if the garden info is not available
 */
export async function emptyCollection(id=null) {
    // If no garden ID is provided, read from session storage
    if (id == null)
        id = sessionStorage.getItem("gardenId");
    await $.ajax({
        url: "/observations/new/" + id,
        method: "POST",
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
            // Add the id of the collection to the subgarden choice in the subgardens dropdown
            document.getElementById('subgarden').selectedOptions[0].id = data["id"];
            // Insert the new collection into the local storage
            await insertCollection(data, false);
            // Fill in the records' data for the chosen plant into the form fields
            await fill(parseInt(data["id"]), false);
        }
    });
}

/**
 * Update a collection if the date is changed
 * @param {number} id - ID of the collection to updated
 * @return {Object} Updated collection object with the new date
 */
export async function updateCollection(id) {
    await markEdited(id);
    let collection = await getCollection(id);
    collection["date"] = document.getElementById("collection-date").value;
    return await setCollection(collection);
}

/**
 * Delete a collection from local storage
 * @param {number} id - ID of the collection to be deleted
 * @return {Object} Collections object after deletion is completed
 */
export async function deleteCollection(id) {
    const collections = await getCollections();
    delete collections[id];
    return await setCollections(collections);
}

/**
 * Uploads a collection
 * @param {number} id - ID of the collection to be uploaded
 */
export async function uploadCollection(id) {
    if (!navigator.onLine) {
        alertModal("Saving is not available in offline mode");
        return;
    }
    const collection = await getCollection(id);
    await $.ajax({
        url: "/observations/upload/",
        data: JSON.stringify(collection),
        method: "POST",
        error: function (jqXHR) {
            alertModal(jqXHR.responseJSON);
        },
        beforeSend: function() {
            $("body").addClass("loading");
        },
        complete: function(){
            $("body").removeClass("loading");
        },
        success: async function () {
            collection['uploaded'] = true;
            collection['finished'] = true;
            collection['edited'] = false;

            await setCollection(collection);
            alertModal("Collection successfully saved to database!");
        }
    });
}

/**
 * Gets the collection with the given ID from the database
 * @param {number} id - ID of the collection to be fetched
 * @param {boolean} isOnline - Whether the collection is saved in the database
 */
export async function fetchCollection(id, isOnline) {
    try {
        await $.ajax({
            url: "/observations/get/" + id,
            error: function (jqXHR) {
                alertModal(jqXHR.responseJSON);
                return null;
            },
            beforeSend: function(){
                $("body").addClass("loading");
            },
            complete: function(){
                $("body").removeClass("loading");
            },
            success: async function (data) {
                if (data["id"] !== -1)
                    await insertCollection(data, isOnline, true);
            }
        });
    } catch (error) {
        console.error(error);
    }
}

/**
 * Updated edited field to true and marks the collection as edited
 * @param {number} id - ID of the collection to be marked as edited
 * @return {Object} Collection object after marked edited
 */
export async function markEdited(id) {
    let collection = await getCollection(id);
    collection['edited'] = true;
    collection['uploaded'] = false;
    await setCollection(collection);
}
