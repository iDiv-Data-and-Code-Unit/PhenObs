import {selectPlant, setupPlants} from './observation.js'
import {oldClickListeners} from "./edit.js";
import {alertModal} from "./modals.js";

let collectionId = null;

export function getCollectionId() {
    return collectionId;
}

function setCollectionId(id) {
    collectionId = id;
}

// Gets the locally stored collections
export async function getCollections() {
    return await JSON.parse(
        localStorage.getItem("collections")
    );
}

// Get collection from local storage
export async function getCollection(id) {
    let collections = await getCollections();
    if (collections != null)
        return collections[id];
    return null;
}

function formatRecords(collections, collection, isOnline) {
    for (let key in collection['records']) {
        const current = collection['records'][key];

        // Create a new instance for the given plant in the local storage
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
            "no-observation": false,
            "done": current['done']
        };
    }

    return collections;
}

export async function insertCollection(collection, isOnline) {
    let collections = await getCollections();
    let remaining = [];

    if (collections == null)
        collections = {};

    for (let record in collection["records"]) {
        if (!collection["records"][record]["done"])
            remaining.push(collection["records"][record]["order"]);
    }

    collections[collection['id']] = {
        'id': collection['id'],
        'date': collection['date'],
        'creator': collection['creator'],
        'garden': collection['garden'],
        'last-collection-id': (collection['last-collection'] != null) ?
            collection['last-collection']['id'] :
            null,
        'edited': false,
        'finished': collection["finished"],
        'uploaded': isOnline,
        'records': {},
        'remaining': remaining
    };

    // Add the last collection to the list
    if (collection['last-collection'] != null) {
        collections[collection['last-collection']['id']] = collection['last-collection'];
        collections[collection['last-collection']['id']]['last-collection-id'] =
            collection['last-collection']['last-collection-id'];
        collections[collection['last-collection']['id']]['remaining'] = [];
        collections[collection['last-collection']['id']]['edited'] = false;
        collections[collection['last-collection']['id']]['finished'] = true;
        collections[collection['last-collection']['id']]['uploaded'] = true;
    }

    /*
    Add remaining indices
    Create default records
     */
    collections = formatRecords(collections, collection, isOnline);
    // collections = formatRecords(collections, collections[collection['last-collection']['id']], isOnline);
    await setCollections(collections);
    return collections[collection['id']];
}

// Sets a single collection in local storage
export async function setCollection(collection) {
    let collections = await getCollections();
    collections[collection["id"]] = collection;
    await setCollections(collections);
    return collection;
}

// Sets all collections in local storage
export async function setCollections(collections) {
    await localStorage.setItem(
        "collections", JSON.stringify(collections)
    );
    return collections;
}

// Get necessary information from the server and create an empty collection
export async function emptyCollection(fields, change, caching) {
    await $.ajax({
        url: "/observations/new/",
        method: "POST",
        error: function (jqXHR) {
            // alert(jqXHR.responseText);
            alertModal(jqXHR.responseText);
            setCollections(createEmptyCollection(null, getCollections()));
        },
        beforeSend: function(){
            $("body").addClass("loading");
        },
        complete: function(data){
            console.log(getCollectionId());
            $("body").removeClass("loading");
        },
        success: async function (data) {
            await setCollections(createEmptyCollection(data, await getCollections()));
        }
    });

    const collection = await getCollection(getCollectionId());
    await setupPlants(getCollectionId())
        .finally(() => selectPlant(parseInt(getCollectionId()), 1))
        .finally(change(fields(), parseInt(getCollectionId()), false))
    await oldClickListeners(parseInt(collection["last-collection-id"]))
        .then(() => caching(parseInt(getCollectionId())));
}
// Create an empty collection with default observation values
async function createEmptyCollection(data, collections) {
    // Check if the collections item has been initialized
    if (collections == null) {
        return createEmptyCollection(data, {});
    } else {
        setCollectionId(data['id']);
        await insertCollection(data, false);
        let collection = await getCollection(data['id']);
        // for (let key in collection['records'])
        //     collection["remaining"].push(collection['records'][key]['order']);

        $('#garden').text(data['garden']);
        $('#creator').text(data['creator']);

        await setCollection(collection);
    }
}

// Update a collection if the date (or any other value) is changed
export async function updateCollection(id) {
    let collection = await getCollection(id);
    collection["date"] = document.getElementById("collection-date").value;
    return await setCollection(collection);
}
// Delete a collection from local storage
export async function deleteCollection(id) {
    const collections = await getCollections();
    delete collections[id];
    return await setCollections(collections);
}
// Upload a collection
export async function uploadCollection(id) {
    const collection = await getCollection(id);
    await $.ajax({
        url: "/observations/upload/",
        data: JSON.stringify(collection),
        method: "POST",
        error: function (jqXHR) {
            // alert("Could not establish a connection with database.");
            alertModal("Could not establish a connection with database.");
        },
        beforeSend: function(){
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
            // alert("Collection successfully uploaded!");
            alertModal("Collection successfully uploaded!");
        }
    });
}

// export function fetchCollection(id) {
//     $.ajax({
//         url: "/observations/get/" + id,
//         error: function (jqXHR) {
//             alert("Could not establish a connection with database.");
//             return null;
//         },
//         beforeSend: function(){
//             $("body").addClass("loading");
//         },
//         complete: function(){
//             $("body").removeClass("loading");
//         },
//         success: function (data) {
//             console.log(data);
//             return insertCollection(data, true);
//         }
//     });
// }

export async function fetchCollection(id) {
    let result;

    try {
        result = await $.ajax({
            url: "/observations/get/" + id,
            error: function (jqXHR) {
                // alert("Could not establish a connection with database.");
                alertModal("Could not establish a connection with database.");
                return null;
            },
            beforeSend: function(){
                $("body").addClass("loading");
            },
            complete: function(){
                $("body").removeClass("loading");
            },
            success: function (data) {
                console.log(data);
                return insertCollection(data, true);
            }
        });

        return result;
    } catch (error) {
        console.error(error);
    }
}

export async function markEdited(id) {
    let collection = await getCollection(id);
    collection['edited'] = true;
    collection['uploaded'] = false;
    await setCollection(collection);
}
