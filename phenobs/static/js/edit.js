import {
    fetchCollection,
    getCollection,
    updateCollection,
    uploadCollection,
    markEdited,
    setCollection
} from "./collection.js";
import {
    cacheRecord,
    checkDefault,
    fillInFields,
    getFields,
    markDone,
    noObservationPossible,
    requireIntensities, selectPlant,
    setupPlants
} from "./observation.js";
import {
    fillInButtons,
    fillInModalDates,
    fillInOldData,
    confirmModal
} from "./modals.js";

if (location.href.indexOf('edit') !== -1)
    await init();

async function init() {
    window.onbeforeunload = function(event) {
        return confirm("Do you want the page to be reloaded?");
    }

    const id = parseInt(getEditId());
    let collection = await getCollection(id);

    if (collection === undefined || collection == null || !("last-collection-id" in collection)) {
        collection = await fetchCollection(id);
        if (!"no-observation" in collection)
            $('#no-obs-div').addClass('d-none');
    }

    setDate(new Date(collection["date"]));
    $('#garden').text(collection['garden']);
    $('#creator').text(collection['creator']);
    await setupPlants(parseInt(collection["id"]));
    await selectPlant(parseInt(collection["id"]), Math.min.apply(null,Object.keys(collection["records"])));
    await changeListeners(getFields(), parseInt(collection["id"]), true);
    await markDone(parseInt(collection["id"]));

    if (collection["last-collection-id"] != null) {
        await oldClickListeners(parseInt(collection["last-collection-id"]));
    } else {
        console.log(collection);
    }

    await cachingListeners(parseInt(collection["id"]));
}

function getEditId() {
    const url = location.href;
    const split = url.split('/');
    return split[split.length - 1];
}

export async function changeListeners(fields, id, editFlag) {
    for (let key in fields) {
        for (let i = 0; i < fields[key].length; i++) {
            fields[key][i].addEventListener(
                "change", async function() {
                    let collection = await getCollection(id);
                    let plants = document.getElementById("plant");
                    let isDone = collection["records"][parseInt(plants.selectedOptions[0].id)]["done"];
                    await cacheRecord(id, parseInt(plants.selectedOptions[0].id), isDone);
                    if (editFlag)
                        await markEdited(id);
                }
            );
        }
    }
}

export async function oldClickListeners(id) {
    let saveButtons = $('[id*="-save"]');

    for (let i = 0; i < saveButtons.length; i++) {
        saveButtons[i].addEventListener('click', async function () {
            let order = parseInt(document.getElementById("plant").selectedOptions[0].id);

            await cacheRecord(id, order, true, true);
            let collection = await getCollection(id);

            fillInOldData(collection, order);
            fillInModalDates(collection);
            fillInButtons(collection, order);
        });
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
        .addEventListener("change", async () => await updateCollection(id));
    // Add event listener for next and previous buttons
    document.getElementById("next-btn")
        .addEventListener("click",
            async () => await checkDefault(id, true)
        );
    document.getElementById("prev-btn")
        .addEventListener("click",
            async () => await checkDefault(id, false)
        );

    // Add event listener for #no-observation
    document.getElementById("no-observation")
        .addEventListener("change",
            e => noObservationPossible(e.target.checked)
        );

    // Add event listener for done collection button
    document.getElementById("cancel-btn")
        .addEventListener("click", () => {
            // if (confirm("Are you sure you want to cancel and go back?"))
            //     location.href = "/observations/";
            confirmModal(
                "Are you sure you want to cancel and go back?", 
            );
            $('#confirm-yes').unbind().click(() => location.href = "/observations/");
            
        });

    // Add event listener for cancel collection button
    document.getElementById("done-btn")
        .addEventListener("click", async () => await uploadCollection(id));

    // Add event listener for #flowers-opening
    document.getElementById("flowers-opening")
        .addEventListener("change", () => requireIntensities());

    // Add event listener for #senescence
    document.getElementById("senescence")
        .addEventListener("change", () => requireIntensities());

    // Add event listeners for #plant
    document.getElementById("plant").addEventListener(
        "focus", async (e) => {
            await checkDefault(id, false, true);
        }
    );
    document.getElementById("plant").addEventListener(
        "change", async (e) => {
            await selectPlant(
                id,
                parseInt(e.target.selectedOptions[0].id)
            )
        }
    );
    
    document.getElementById("copy-older")
        .addEventListener("click", async function() { 
            let collection = await getCollection(id);
            await fillInFields(
                id, 
                document.getElementById("plant").selectedOptions[0].id, 
                collection["last-collection-id"]
            ); 
        });
}
