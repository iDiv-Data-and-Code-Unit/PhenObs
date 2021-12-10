import {selectPlant, setupPlants} from './observation.js'

// Gets the locally stored collections
export function getCollections() {
    return JSON.parse(
        localStorage.getItem("collections")
    );
}

// Get collection from local storage
export function getCollection(id) {
    return getCollections()[id];
}

// Sets a single collection in local storage
export function setCollection(collection) {
    let collections = getCollections();
    collections[collection["id"]] = collection;
    setCollections(collections);
    return collection;
}

// Sets all collections in local storage
export function setCollections(collections) {
    localStorage.setItem(
        "collections", JSON.stringify(collections)
    );
    return collections;
}

// Get necessary information from the server and create an empty collection
export function emptyCollection(fields, change, caching) {
    $.ajax({
        url: "/observations/new",
        error: function (jqXHR) {
            alert(jqXHR.response);
            setCollections(createEmptyCollection(null, getCollections()));
        },
        beforeSend: function(){
            $("body").addClass("loading");
        },
        complete: function(){
            $("body").removeClass("loading");
            setupPlants(id);
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
// Create an empty collection with default observation values
function createEmptyCollection(data, collections) {
    // Check if the collections item has been initialized
    if (collections == null) {
        return createEmptyCollection(data, {});
    } else {
        collections[data['id']] = {
            'id': data['id'],
            'date': data['date'],
            'creator': data['creator'],
            'garden': data['garden'],
            'last-collection-id': data['last-collection']['id'],
            'edited': false,
            'finished': false,
            'uploaded': false,
            'remaining': [],
            'records': {}
        };

        // Add the last collection to the list
        collections[data['last-collection']['id']] = data['last-collection'];
        collections[data['last-collection']['id']]['edited'] = false;
        collections[data['last-collection']['id']]['finished'] = true;
        collections[data['last-collection']['id']]['uploaded'] = true;

        /*
        Add remaining indices
        Create default records
         */
        for (let i = 0; i < data["records"].length; i++) {
            const current = data['records'][i];

            // Create a new instance for the given plant in the local storage
            collections[data['id']]['records'][current['order']] = {
                "id": current['id'],
                "name": current['name'],
                "order": current['order'],
                "plant": current['name'] + "-" + current['order'],
                "initial-vegetative-growth": current['initial-vegetative-growth'],
                "young-leaves-unfolding": current['young-leaves-unfolding'],
                "flowers-opening": current['flowers-opening'],
                "peak-flowering": current['peak-flowering'],
                "peak-flowering-estimation": current['peak-flowering-estimation'],
                "flowering-intensity": current['flowering-intensity'],
                "ripe-fruits": current['ripe-fruits'],
                "senescence": current['senescence'],
                "senescence-intensity": current['senescence-intensity'],
                "remarks": current['remarks'],
                "cut-partly": current['cut-partly'],
                "cut-total": current['cut-total'],
                "covered-natural": current['covered-natural'],
                "covered-artificial": current['covered-artificial'],
                "removed": current['removed'],
                "transplanted": current['transplanted'],
                "no-observation": false,
                "done": false
            };
            // Add the order of the plant into remaining indices list
            collections[data['id']]["remaining"].push(current['order']);
        }

        // Update the collections in local storage
        return setCollections(collections);
    }
}

// Update a collection if the date (or any other value) is changed
export function updateCollection(id) {
    let collection = getCollection(id);
    collection["date"] = document.getElementById("collection-date").value;
    return setCollection(collection);
}
// Delete a collection from local storage
export function deleteCollection(id) {
    const collections = getCollections();
    delete collections[id];
    return setCollections(collections);
}
// Upload a collection
export function uploadCollection(id) {
    $.ajax({
        url: "/observations/upload/",
        data: JSON.stringify(getCollection(id)),
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
