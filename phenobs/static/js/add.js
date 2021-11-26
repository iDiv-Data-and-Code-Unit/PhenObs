import {
    emptyCollection,
    cacheCollection,
    cancelCollection,
    collectionDone,
    getCollections,
    getCollectionId,
    getLastCollectionId
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
setToday(new Date());
// Create an empty collection
emptyCollection(getFields, changeListeners, cachingListeners);

function changeListeners(fields) {
    for (let key in fields) {
        for (let i = 0; i < fields[key].length; i++) {
            fields[key][i].addEventListener(
                "change", () => cacheRecord(getCollectionId(), false, getCollections())
            );
        }
    }
}

function setToday(today) {
    // Set #collection-date today
    document.getElementById('collection-date').value =
        `${today.getFullYear()}-` +
        `${String(today.getMonth() + 1).padStart(2, '0')}-` +
        `${String(today.getDate()).padStart(2, '0')}`;
}

// Add event listeners
function cachingListeners() {
    document.getElementById('collection-date')
        .addEventListener("change", () => cacheCollection(getCollectionId(), getCollections()));
    // Add event listener for next and previous buttons
    document.getElementById("next-btn")
        .addEventListener("click",
            () => checkDefault(getLastCollectionId(), getCollectionId(), true, getCollections())
        );
    document.getElementById("prev-btn")
        .addEventListener("click",
            () => checkDefault(getLastCollectionId(), getCollectionId(), false, getCollections())
        );

    // Add event listener for #no-observation
    document.getElementById("no-observation")
        .addEventListener("change",
            e => noObservationPossible(e.target.checked)
        );

    // Add event listener for done collection button
    document.getElementById("cancel-btn")
        .addEventListener("click", () => cancelCollection(getCollectionId(), getCollections()));

    // Add event listener for cancel collection button
    document.getElementById("done-btn")
        .addEventListener("click", () => collectionDone(getCollectionId(), getCollections()));

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
                document.getElementById("plant").selectedIndex + 1,
                getLastCollectionId(),
                getCollectionId(),
                getCollections()
            )
        );
}
