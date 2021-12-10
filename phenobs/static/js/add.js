import {
    emptyCollection,
    updateCollection,
    getCollection,
    deleteCollection,
    uploadCollection
} from './collection.js';

import {
    getFields,
    selectPlant,
    checkDefault,
    cacheRecord,
    noObservationPossible,
    requireIntensities
} from './observation.js';

// Set today on "#collection-date"
setDate(new Date());
// Create an empty collection
emptyCollection(getFields, changeListeners, cachingListeners);

export function changeListeners(fields, id) {
    for (let key in fields) {
        for (let i = 0; i < fields[key].length; i++) {
            fields[key][i].addEventListener(
                "change", () => {
                    const plants = document.getElementById("plant");
                    const isDone = getCollection(id)["records"][plants.children[plants.selectedIndex].id]["done"];
                    cacheRecord(id, isDone);
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
