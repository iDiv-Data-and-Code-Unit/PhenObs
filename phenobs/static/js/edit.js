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
import {
    fillInButtons,
    fillInModalDates,
    fillInOldData
} from "./modals.js";

if (location.href.indexOf('edit') !== -1) {
    const id = parseInt(getId());
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
    await selectPlant(parseInt(collection["id"]), 1);
    await changeListeners(getFields(), parseInt(collection["id"]), true);

    if (collection["last-collection-id"] != null)
        await oldClickListeners(parseInt(collection["last-collection-id"]));

    await cachingListeners(parseInt(collection["id"]));

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

export async function oldClickListeners(id) {
    let saveButtons = $('[id*="-save"]');

    for (let i = 0; i < saveButtons.length; i++) {
        saveButtons[i].addEventListener('click', async function () {
            await cacheRecord(id, true, true);

            const collection = await getCollection(id);
            const plants = document.getElementById("plant");
            const order = collection["records"][plants.children[plants.selectedIndex].id]["order"];

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
            if (confirm("Are you sure you want to cancel and go back?"))
                location.href = "/observations";
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

    // Add event listener for #plant
    document.getElementById("plant")
        .addEventListener("change",
            async () => await selectPlant(
                id,
                document.getElementById("plant").selectedIndex + 1
            )
        );
}
