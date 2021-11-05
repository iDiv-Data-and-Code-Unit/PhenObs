export function cacheCollection() {
    let id = JSON.parse(localStorage.getItem('last-id'));
    id = (typeof(id) == 'number') ? id + 1 : 0;
    // localStorage.setItem("last-id", JSON.stringify(id));        TODO: Do this when the collection is finished and uploaded

    // Create the collection in the object
    // TODO: add the orders into done-so-far
    const collection = {
        "collection-date": document.getElementById("collection-date").value,
        "garden": document.getElementById("garden").innerText,
        "creator": document.getElementById("creator").innerText,
        "done-so-far": [],
        "records": {}
    };

    localStorage.setItem("collection-" + id, JSON.stringify(collection));
    return id;
}

export function recordDone(collectionId) {

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
    let updatedCollection = JSON.parse(
        localStorage.getItem("collection-" + collectionId)
    );

    if (isDone && updatedCollection["done-so-far"].findIndex(val => val == record["plant"]) == -1)
        updatedCollection["done-so-far"].push(record["plant"]);
    // Update the cached object
    updatedCollection["records"][record["plant"]] = record;
    // Cache the updated object
    localStorage.setItem(
        "collection-" + collectionId, JSON.stringify(updatedCollection)
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
