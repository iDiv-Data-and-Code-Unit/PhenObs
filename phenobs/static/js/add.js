import {
    emptyCollection,
    cacheCollection,
    cancelCollection,
    collectionDone,
    getCollections,
    getCollection,
    getCollectionId,
    getLastCollectionId
} from './collection.js';

import {
    getFields,
    selectPlant,
    checkDefault,
    cacheRecord,
    noObservationPossible,
    requireIntensities, setupPlants
} from './observation.js';

// Set today on "#collection-date"
setDate(new Date());
// Create an empty collection
emptyCollection(getFields, changeListeners, cachingListeners);

export function changeListeners(fields, collectionType, collectionId) {
    for (let key in fields) {
        for (let i = 0; i < fields[key].length; i++) {
            fields[key][i].addEventListener(
                "change", () => {
                    const plants = document.getElementById("plant");
                    const isDone = getCollection(collectionType, collectionId)
                        ["records"]
                        [plants.children[plants.selectedIndex].value]["done"];
                    cacheRecord(collectionType, collectionId, isDone);
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
export function cachingListeners(collectionType, collectionId) {
    document.getElementById('collection-date')
        .addEventListener("change", () => cacheCollection(collectionType, collectionId));
    // Add event listener for next and previous buttons
    document.getElementById("next-btn")
        .addEventListener("click",
            () => checkDefault(collectionType, collectionId, true)
        );
    document.getElementById("prev-btn")
        .addEventListener("click",
            () => checkDefault(collectionType, collectionId, false)
        );

    // Add event listener for #no-observation
    document.getElementById("no-observation")
        .addEventListener("change",
            e => noObservationPossible(e.target.checked)
        );

    // Add event listener for done collection button
    document.getElementById("cancel-btn")
        .addEventListener("click", () => cancelCollection(collectionType, collectionId));

    // Add event listener for cancel collection button
    document.getElementById("done-btn")
        .addEventListener("click", () => collectionDone(collectionType, collectionId));

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
                collectionType,
                collectionId,
                document.getElementById("plant").selectedIndex + 1
            )
        );
}
