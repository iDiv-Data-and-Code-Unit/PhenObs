import {
    deleteCollection,
    fetchCollection,
    getCollection,
    updateCollection,
    uploadCollection,
    markEdited
} from "./collection.js";
import {
    cacheRecord,
    checkDefault,
    getFields,
    noObservationPossible,
    requireIntensities, selectPlant,
    setupPlants
} from "./observation.js";

if (location.href.indexOf('edit') !== -1) {
    const id = parseInt(getId());
    let collection = await getCollection(id);

    if (collection === undefined || collection == null || !("last-collection-id" in collection)) {
        collection = await fetchCollection(id);
        if (!"no-observation" in collection)
            $('#no-obs-div').addClass('d-none');
    }

    setDate(new Date(collection["date"]));
    await setupPlants(parseInt(collection["id"]))
        .finally(() => selectPlant(parseInt(collection["id"]), 1))
        .finally(changeListeners(getFields(), parseInt(collection["id"]), true))
        .then(() => cachingListeners(parseInt(collection["id"])));

    // await changeListeners(getFields(), parseInt(collection["id"]), true);
    // cachingListeners(parseInt(collection["id"]));
}

function getId() {
    const url = location.href;
    const split = url.split('/');
    return split[split.length - 1];
}

export async function changeListeners(fields, id, editFlag) {
    for (let key in fields) {
        for (let i = 0; i < fields[key].length; i++) {
            fields[key][i].addEventListener(
                "change", async function() {
                    const collection = await getCollection(id);
                    const plants = document.getElementById("plant");
                    const isDone = collection["records"][plants.children[plants.selectedIndex].id]["done"];
                    await cacheRecord(id, isDone);
                    if (editFlag)
                        await markEdited(id);
                }
            );
        }
    }
}

export function setDate(dateToSet) {
    // Set #collection-date today
    document.getElementById('collection-date').value =
        `${dateToSet.getFullYear()}-` +
        `${String(dateToSet.getMonth() + 1).padStart(2, '0')}-` +
        `${String(dateToSet.getDate()).padStart(2, '0')}`;
}

// Add event listeners
export function cachingListeners(id) {
    document.getElementById('collection-date')
        .addEventListener("change", () => updateCollection(id));
    // Add event listener for next and previous buttons
    document.getElementById("next-btn")
        .addEventListener("click",
            () => checkDefault(id, true)
        );
    document.getElementById("prev-btn")
        .addEventListener("click",
            () => checkDefault(id, false)
        );

    // Add event listener for #no-observation
    document.getElementById("no-observation")
        .addEventListener("change",
            e => noObservationPossible(e.target.checked)
        );

    // Add event listener for done collection button
    document.getElementById("cancel-btn")
        .addEventListener("click", () => deleteCollection(id));

    // Add event listener for cancel collection button
    document.getElementById("done-btn")
        .addEventListener("click", () => uploadCollection(id));

    // Add event listener for #flowers-opening
    document.getElementById("flowers-opening")
        .addEventListener("change", () => requireIntensities());

    // Add event listener for #senescence
    document.getElementById("senescence")
        .addEventListener("change", () => requireIntensities());

    // Add event listener for #plant
    document.getElementById("plant")
        .addEventListener("change",
            () => selectPlant(
                id,
                document.getElementById("plant").selectedIndex + 1
            )
        );
}
