import { selectPlant } from './observation.js'

let collectionId = null;
let lastCollectionId = null;

export function getCollections() {
    return JSON.parse(
        localStorage.getItem("collections")
    );
}

function setCollections(collections) {
    localStorage.setItem(
        "collections", JSON.stringify(collections)
    );
    console.log(collections);
    return collections;
}

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
    return setCollections({
        'done': {},
        'unfinished': {}
    });
}

// get necessary information from the server and create an empty collection
export function emptyCollection(fields, change, caching) {
    $.ajax({
        url: "/observations/new",
        error: function (jqXHR) {
            alert()
        },
        beforeSend: function(){
            $("body").addClass("loading");
        },
        complete: function(){
            $("body").removeClass("loading");
            change(fields());
            caching();
            selectPlant(
                1,
                getLastCollectionId(),
                getCollectionId(),
                getCollections()
            );
        },
        success: function (data) {
            setCollections(createEmptyCollection(data, getCollections()));
        }
    });

}
// create an empty collection with default observation values
function createEmptyCollection(data, collections) {
    // Check if the collections item has been initialized
    if (collections == null) {
        createEmptyCollection(data, initCollections());
    } else {
        // todo: check if the data is null or not
        collections["unfinished"]["collection-" + data["collection-id"]] = {
            "collection-date": document.getElementById("collection-date").value,
            "collection-id": data["collection-id"],
            "creator": data["creator"],
            "garden": data["garden"],
            "remaining": [],
            "records": {}
        };

        // Store plantList in local storage
        localStorage.setItem(
            "plantList", JSON.stringify(data["plants"])
        );
        // Add the last collection to the "done" list
        collections["done"]["collection-" + data["last-collection"]["collection-id"]] = data["last-collection"];
        /*
        Add remaining indices
        Create default records
         */
        for (let i = 0; i < data["plants"].length; i++) {
            collections["unfinished"]["collection-" + data["collection-id"]]["remaining"].push(data["plants"][i].order);
            collections["unfinished"]["collection-" + data["collection-id"]]["records"][data["plants"][i].name + "-" + data["plants"][i].order] = {
                "name": data["plants"][i].name,
                "order": data["plants"][i].order,
                "plant": data["plants"][i].name + "-" + data["plants"][i].order,
                "initial-vegetative-growth": "no",
                "young-leaves-unfolding": "no",
                "flowers-opening": "no",
                "peak-flowering": "no",
                "peak-flowering-estimation": "no",
                "flowering-intensity": "",
                "ripe-fruits": "no",
                "senescence": "no",
                "senescence-intensity": "",
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
        // Set the collection ID for the current collection
        setCollectionId("collection-" + data["collection-id"]);
        // Set the collection ID for the last collection
        setLastCollectionId("collection-" + data["last-collection"]["collection-id"]);
        // Store the collection in the local storage
        return collections;
    }
}
// upload the cached collection if the date (or any other value) is changed
export function cacheCollection(id, collections) {
    collections["unfinished"][id]["collection-date"] = document.getElementById("collection-date").value;
    // get the garden ???
    return setCollections(collections);
}
// cancel the current collection
export function cancelCollection(id, collections) {
    delete collections["unfinished"][id];
}
// upload the collection
export function collectionDone(id, collections) {
    let collection = collections["unfinished"][id];
    // try pass and upload the collection
    // todo: add a new url for uploading the collection
}
