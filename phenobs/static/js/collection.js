import {selectPlant, setupPlants} from './observation.js'

let collectionId = null;
let lastCollectionId = null;

export function getCollections() {
    return JSON.parse(
        localStorage.getItem("collections")
    );
}

// Get collection from either local storage or DB
export function getCollection(collectionType, collectionId) {
    console.log(collectionType)
    console.log(collectionId)
    console.log('-------------------')
    // Check if it is an online collection and try retrieving
    const collection = getCollections()[collectionType]["collections"][collectionId];

    if (collectionType === "online")
        if (collection == null)
            $.ajax({
                url: "/observations/get/" + collectionId.toString(),
                error: function (jqXHR) {
                    alert("Collection retrieval failed.\nError: " + jqXHR.toString());
                    return null;
                },
                beforeSend: function(){
                    $("body").addClass("loading");
                },
                complete: function(){
                    $("body").removeClass("loading");
                },
                success: function (data) {
                    return setCollection("online", data);
                }
            });

    return collection;
}

export function setCollection(collectionType, collection) {
    let collections = getCollections();

    collections[collectionType]["collections"][collection["collection-id"]] = collection;

    setCollections(collections);
    return collection;
}

export function setCollections(collections) {
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

function getNextId(collectionType) {
    return getCollections()[collectionType]["next_id"];
}

function setNextId(collectionType) {
    let collections = getCollections();
    collections[collectionType]["next_id"]++;
    return setCollections(collections);
}

// Initializes collections item in the local storage
function initCollections() {
    return setCollections({
        'local': {
            'collections': {},
            'next_id': 1
        },
        'online': {
            'collections': {},
        },
        'unfinished': {
            'collections': {},
            'next_id': 1
        },
        'edited': {
            'collections': {}
        }
    });
}

// get necessary information from the server and create an empty collection
export function emptyCollection(fields, change, caching) {
    $.ajax({
        url: "/observations/new",
        error: function (jqXHR) {
            alert(jqXHR.responseText);
            setCollections(createEmptyCollection(null, getCollections()));
        },
        beforeSend: function(){
            $("body").addClass("loading");
        },
        complete: function(){
            $("body").removeClass("loading");
            const collectionId = getNextId("unfinished");

            setupPlants("unfinished", collectionId);
            change(fields(), "unfinished", collectionId);
            caching("unfinished", collectionId);
            selectPlant(
                "unfinished",
                collectionId,
                1
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
        return createEmptyCollection(data, initCollections());
    } else {
        const collectionId = getNextId("unfinished");

        if (data == null) {
            data = {
                "last-collection": null,
                "plants": null,
            };
        }

        collections["unfinished"]["collections"][collectionId] = {
            "collection-date": document.getElementById("collection-date").value,
            "collection-id": collectionId,
            "creator": ("creator" in data)
                ? data["creator"]
                : null,
            "garden": ("garden" in data)
                ? data["garden"]
                : null,
            // TODO: increase next_id after uploading collection
            "last-collection-id": (data["last-collection"] == null)
                ? null
                : data['last-collection']["collection-id"],
            "remaining": [],
            "records": {}
        };

        // Store plantList in local storage
        if (data["plants"] == null) {
            alert("Plant list could not be retrieved");
        } else {
            localStorage.setItem(
                "plantList", JSON.stringify(data["plants"])
            );
        }
        // Add the last collection to the "done" list
        collections["online"]["collections"][data["last-collection"]["collection-id"]] = data["last-collection"];
        /*
        Add remaining indices
        Create default records
         */
        for (let i = 0; i < data["plants"].length; i++) {
            collections["unfinished"]
            ["collections"]
            [collectionId]
            ["remaining"].push(data["plants"][i].order);

            collections["unfinished"]
            ["collections"]
            [collectionId]
            ["records"]
            [data["plants"][i].name + "-" + data["plants"][i].order] = {
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
        setCollectionId(collectionId);
        // Set the collection ID for the last collection
        setLastCollectionId("collection-" + data["last-collection"]["collection-id"]);
        // Store the collection in the local storage
        return setCollections(collections);
    }
}
// upload the cached collection if the date (or any other value) is changed
export function cacheCollection(collectionType, collectionId) {
    let collection = getCollection(collectionType, collectionId);
    collection["collection-date"] = document.getElementById("collection-date").value;
    return setCollection(collectionType, collection);
}
// cancel the current collection
export function cancelCollection(collectionType, collectionId) {
    const collections = getCollections();
    delete collections[collectionType][collectionId];
    setCollections(collections);
}
// upload the collection
export function collectionDone(collectionType, collectionId) {
    $.ajax({
        url: "/observations/upload/",
        data: JSON.stringify(getCollection(collectionType, collectionId)),
        method: "POST",
        error: function (jqXHR) {
            alert("Could not establish a connection with database.");
        },
        beforeSend: function(){
            $("body").addClass("loading");
        },
        complete: function(){
            $("body").removeClass("loading");
        },
        success: function () {
            alert("Collection successfully uploaded!");
        }
    });
}
