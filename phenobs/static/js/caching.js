let previousCollection = null;

function setPreviousCollection(data) {
    previousCollection = data;
}
function getPreviousCollection() {
    return previousCollection;
}

function cacheFirstTime() {
    let collections = {
        'done': {},
        'unfinished': {}
    };

    localStorage.setItem(
        "collections",
        JSON.stringify(collections)
    );

    return collections;
}

export function cacheCollection() {
    if (previousCollection == null)
        tryOnline(lastCollectionOnline, lastCollectionOffline);
    else {
        let collections = JSON.parse(
            localStorage.getItem("collections")
        );

        if (collections == null)
            collections = cacheFirstTime();

        // Create the collection in the object
        // TODO: add the orders into done-so-far

        const newID = previousCollection["collection-id"] + 1;
        const newCollectionID = "collection-" + newID.toString();

        const oldID = previousCollection["collection-id"];
        const oldCollectionID = "collection-" + oldID.toString();

        let collection = {
            "collection-id": newID,
            "collection-date": document.getElementById("collection-date").value,
            "garden": document.getElementById("garden").innerText,
            "creator": document.getElementById("creator").innerText,
            "remaining": [],
            "records": {}
        };

        let plants = JSON.parse(
            localStorage.getItem("plantList")
        );

        for (let i = 0; i < plants.length; i++) {
            collection["remaining"].push(plants[i].order);
        }

        collections["unfinished"][newCollectionID] = collection;

        localStorage.setItem("collections", JSON.stringify(collections));

        cacheRecord(newCollectionID, false);
    }
}

export function cacheRecord(collectionId, isDone) {
    // Current record to be cached
    let record = {}
    // IDs of the elements to be cached
    const ids = {
        "values": [
            "plant",
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
            "removed"
        ]
    };

    // Cache the values
    ids['values'].forEach(function(id) {
       record[id] = document.getElementById(id).value
    });
    ids['checked'].forEach(function(id) {
       record[id] = document.getElementById(id).checked
    });
    record['done'] = isDone;

    // Get the old cached object
    let collections = JSON.parse(
        localStorage.getItem("collections")
    );

    let updatedCollection = collections["unfinished"][collectionId];
    let remaining = updatedCollection["remaining"];

    if (isDone) {
        let plants = document.getElementById("plant");
        let order = null;

        for (let plant in plants) {
            if (plant.selected)
                order = plant.name;
        }

        let index = remaining.indexOf(parseInt(order));
        remaining.splice(index, 1);
    }

    // Update the cached object
    updatedCollection["records"][record["plant"]] = record;
    // Cache the updated object

    collections["unfinished"][collectionId] = updatedCollection;

    localStorage.setItem(
        "collections", JSON.stringify(collections)
    );
}

export function loadFromCache() {
    const data = JSON.parse(localStorage.getItem('form'));
    console.log(data);

    let multiselect = document.getElementById('multiselect');

    document.getElementById('name').value = data.name;
    document.getElementById('select').selectedIndex = data.select;
    document.getElementById('textarea').value = data.textarea;

    for (let i = 0; i < data.multiselect.length; i++) {
        multiselect.children[i].selected = data.multiselect[i];
    }
}


export function updatePlantList() {
    tryOnline(updatePlantListOnline, updatePlantListOffline);
}


export function updatePlantListOnline() {
    $.ajax({
        type: "GET",
        url: '/observations/plant_list',
        dataType: "json",
        success: function(data) {
            localStorage.setItem(
                "plantList", JSON.stringify(data["plants"])
            );
            cacheCollection();
        },
        error: function() {
            alert('Error occurred');
        }
    });
}


export function updatePlantListOffline() {
    cacheCollection();
}


export function lastCollectionOnline() {
    $.ajax({
        type: "GET",
        url: '/observations/last-collection',
        dataType: "json",
        success: function(data) {
            let collections = JSON.parse(
                localStorage.getItem("collections")
            );
            collections["done"]["collection-" + data["collection-id"].toString()] = data;
            localStorage.setItem(
                "collections", JSON.stringify(collections)
            );

            setPreviousCollection(data);
            cacheCollection();
        },
        error: function() {
            alert('Error occurred');
        }
    });
}


export function lastCollectionOffline() {
    let collections = JSON.parse(
        localStorage.getItem("collections")
    );
    let doneCollections = Object.keys(collections["done"]);
    setPreviousCollection(collections["done"][doneCollections[doneCollections["length"] - 1]]);

    cacheCollection();
}

// Checking internet connection
function tryOnline(online, offline) {
    $.ajax({
        url: "/200",
        timeout: 10000,
        error: function (jqXHR) {
            if (jqXHR.status == 0) {
                console.log(jqXHR.statusMessage)
                offline();
            }
        },
        success: function () {
            online();
        }
    });
}
