import {
    emptyCollection,
    cacheCollection,
    cancelCollection,
    collectionDone,
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

// Set #collection-date today
let collectionDate = document.getElementById('collection-date');
const today = new Date();
const dd = String(today.getDate()).padStart(2, '0');
const mm = String(today.getMonth() + 1).padStart(2, '0');
const yyyy = today.getFullYear();

collectionDate.value = `${yyyy}-${mm}-${dd}`;

// Get form elements/input fields
let fields = getFields();

// Create an empty collection and get the ID for it
emptyCollection();
let collectionId = getCollectionId();

// Add event listener to every field
for (let key in fields) {
    for (let i = 0; i < fields[key]; i++) {
        fields[key].children[i].addEventListener(
            "change", () => cacheRecord(collectionId, false)
        );
    }
}
// Add event listener for #collection-date
collectionDate
    .addEventListener("change", () => cacheCollection(getCollectionId()));

// Add event listener for next and previous buttons
document.getElementById("next-btn")
    .addEventListener("click",
        () => checkDefault(getLastCollectionId(), getCollectionId(), true)
    );
document.getElementById("prev-btn")
    .addEventListener("click",
        () => checkDefault(getLastCollectionId(), getCollectionId(), false)
    );

// Add event listener for #no-observation
document.getElementById("no-observation")
    .addEventListener("change",
        e => noObservationPossible(e.target.checked)
    );

// Add event listener for done collection button
document.getElementById("cancel-btn")
    .addEventListener("click", () => collectionDone(getCollectionId()));

// Add event listener for cancel collection button
document.getElementById("done-btn")
    .addEventListener("click", () => cancelCollection(getCollectionId()));

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
            getCollectionId()
        )
    );
