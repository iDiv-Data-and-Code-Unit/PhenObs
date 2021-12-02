import {
    cacheCollection,
    collectionDone,
    cancelCollection,
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

changeListeners(getFields());

function changeListeners(fields) {
    for (let key in fields) {
        for (let i = 0; i < fields[key].length; i++) {
            fields[key][i].addEventListener(
                "change", () => cacheRecord(getCollectionId(), true, getCollections())
            );
        }
    }
}

function setDate(date) {
    // Set #collection-date today
    document.getElementById('collection-date').value =
        `${date.getFullYear()}-` +
        `${String(date.getMonth() + 1).padStart(2, '0')}-` +
        `${String(date.getDate()).padStart(2, '0')}`;
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
        .addEventListener("click", () => cancelCollection(getCollectionId(), getCollections(), "edited"));

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
