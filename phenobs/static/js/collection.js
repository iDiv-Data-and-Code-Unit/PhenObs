import { selectPlant } from './observation.js'

let collectionId = null;
let lastCollectionId = null;

function setCollectionId(id) {
    collectionId = id;
}

export function getCollectionId() {
    return collectionId;
}

function setLastCollectionId(id) {
    lastCollectionId = id;
}

export function getLastCollectionId() {
    return lastCollectionId;
}

// Initializes collections item in the local storage
function initCollections() {
    let collections = {
        'done': {},
        'unfinished': {}
    };

    localStorage.setItem(
        "collections", JSON.stringify(collections)
    );

    return collections;
}

// get necessary information from the server and create an empty collection
export function emptyCollection() {
    $.ajax({
        url: "/observations/new",
        error: function (jqXHR) {
            alert()
        },
        success: function (data) {
            createEmptyCollection(data);
            selectPlant(
                1,
                getLastCollectionId(),
                getCollectionId()
            );
        }
    });
}
// create an empty collection with default observation values
function createEmptyCollection(data) {
    // todo: check if the data is null or not
    let lastCollection = data["last-collection"];
    let plants = data["plants"];

    let newCollection = {
        "collection-date": document.getElementById("collection-date").value,
        // todo: set this up for today by default and add change listener
        "collection-id": data["collection-id"],
        "creator": data["creator"],
        "garden": data["garden"],
        "remaining": [],
        "records": {}
    };

    // Store plantList in local storage
    localStorage.setItem(
        "plantList", JSON.stringify(plants)
    );
    /*
    Add remaining indices
    Create default records
     */
    for (let i = 0; i < plants.length; i++) {
        newCollection["remaining"].push(plants[i].order);
        newCollection["records"][plants[i].name + "-" + plants[i].order] = {
            "name": plants[i].name,
            "order": plants[i].order,
            "plant": plants[i].name + "-" + plants[i].order,
            "initial-vegetative-growth": "no",
            "young-leaves-unfolding": "no",
            "flowers-opening": "no",
            "peak-flowering": "no",
            "peak-flowering-estimation": "no",
            "flowering-intensity": null,
            "ripe-fruits": "no",
            "senescence": "no",
            "senescence-intensity": null,
            "remarks": "",
            "cut-partly": false,
            "cut-total": false,
            "covered-natural": false,
            "covered-artificial": false,
            "removed": false,
            "transplanted": false,
            "no-observation": false,
            "done": false
        };
    }

    // Get the collections from the local storage
    let collections = JSON.parse(
        localStorage.getItem("collections")
    );
    // Check if the collections item has been initialized
    if (collections == null)
        collections = initCollections();
    // Add the last collection to the "done" list
    collections["done"]["collection-" + lastCollection["collection-id"]] = lastCollection;
    // Add the new collection to the "unfinished" list
    collections["unfinished"]["collection-" + data["collection-id"]] = newCollection;
    // Set the collections in the local storage
    localStorage.setItem(
        "collections", JSON.stringify(collections)
    );
    // Set the collection ID for the current collection
    setCollectionId("collection-" + data["collection-id"]);
    // Set the collection ID for the last collection
    setLastCollectionId("collection-" + data["last-collection"]["collection-id"]);
}
// upload the cached collection if the date (or any other value) is changed
export function cacheCollection(id) {
    // get the collection from the local storage
    let collections = JSON.parse(
        localStorage.getItem("collections")
    );
    let collection = collections["unfinished"][id];
    // get the date from document
    collection["collection-date"] = document.getElementById("collection-date").value;
    collections["unfinished"][id] = collection;
    // get the garden ???
    localStorage.setItem(
        "collections", JSON.stringify(collections)
    );
}
// cancel the current collection
export function cancelCollection(id) {
    let collections = JSON.parse(
        localStorage.getItem("collections")
    );
    delete collections["unfinished"][id];
}
// upload the collection
export function collectionDone(id) {
    let collections = JSON.parse(
        localStorage.getItem("collections")
    );
    let collection = collections["unfinished"][id];
    // try pass and upload the collection
    // todo: add a new url for uploading the collection
}
