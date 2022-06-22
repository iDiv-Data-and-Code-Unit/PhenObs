import {
    fetchCollection,
    getCollection,
    setCollection,
    updateCollection,
    uploadCollection,
    markEdited,
    insertCollection
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
    confirmModal,
    alertModal,
    formatDate
} from "./modals.js";

if (location.href.indexOf('edit') !== -1 && location.href.indexOf('not found') === -1) {
    (async () => {
        const id = parseInt(getEditId());
        await fill(id, true);
    })();
}

export async function fill(id, isOnline, isOrdered=false, orderedListCall=false) {
    window.onbeforeunload = function() {
        return confirm("Do you want the page to be reloaded?");
    }

    let collection = await getCollection(id);

    if (isOnline && (collection === undefined || collection == null || !("last-collection-id" in collection))) {
        await fetchCollection(id, isOnline);
        collection = await getCollection(id);
        if (!"no-observation" in collection)
            $('#no-obs-div').addClass('d-none');
    }

    setDate(new Date(collection["date"]));
    $('#garden').text(collection['garden-name']);
    $('#creator').text(collection['creator']);
    $('#orderedList').unbind().click(async function() {
        if ($(this).attr("name") === "alpha")
            await fill(id, isOnline, true, true)
        else
            await fill(id, isOnline, false, true);
    })
    await setupPlants(parseInt(collection["id"]), isOrdered, !orderedListCall);
    // await selectPlant(parseInt(collection["id"]), Math.min.apply(null,Object.keys(collection["records"])));
    await changeListeners(getFields(), parseInt(collection["id"]), isOnline);
    await markDone(parseInt(collection["id"]));

    if (collection["last-collection-id"] == null) {
        await getLast(parseInt(collection["id"]));
        collection = await getCollection(id);
    }

    if (collection["last-collection-id"] != null) {
        await oldClickListeners(parseInt(collection["last-collection-id"]));
    }

    await cachingListeners(parseInt(collection["id"]));
}

function getEditId() {
    const url = location.href;
    const split = url.split('/');
    return split[split.length - 1];
}

export async function changeListeners(fields, id, editFlag) {
    // console.log(id);
    for (let key in fields) {
        for (let i = 0; i < fields[key].length; i++) {
            $(fields[key][i]).unbind().change(async function() {
                let collection = await getCollection(id);
                // console.log(collection);
                let plants = document.getElementById("plant");
                let isDone = collection["records"][parseInt(plants.selectedOptions[0].id)]["done"];
                await cacheRecord(id, parseInt(plants.selectedOptions[0].id), isDone);
                if (editFlag)
                    await markEdited(id);
            });
        }
    }
}

export async function oldClickListeners(id) {
    let saveButtons = $('[id*="-save"]');

    for (let i = 0; i < saveButtons.length; i++) {
        $(saveButtons[i]).unbind().click(async function () {
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
    const collectionDate = document.getElementById('collection-date');
    collectionDate.value =
        `${dateToSet.getFullYear()}-` +
        `${String(dateToSet.getMonth() + 1).padStart(2, '0')}-` +
        `${String(dateToSet.getDate()).padStart(2, '0')}`;
}

async function getLast(id) {
    let collection = await getCollection(id);
    await $.ajax({
        url: "/observations/last/",
        data: JSON.stringify(collection),
        method: "POST",
        error: function (jqXHR) {
            // alert("Could not establish a connection with database.");
            alertModal(jqXHR.responseJSON);
        },
        beforeSend: function(){
            $("body").addClass("loading");
        },
        complete: function(){
            $("body").removeClass("loading");
        },
        success: async function (lastCollection) {
            collection['last-collection-id'] = lastCollection["id"]
            await insertCollection(lastCollection, true)
            await setCollection(collection);
            await fillInFields(
                id,
                document.getElementById("plant").selectedOptions[0].id,
                collection["last-collection-id"]
            );
            let lastCollectionDate = document.getElementById('last-obs-date');
            lastCollectionDate.innerText = formatDate(new Date(lastCollection["date"]), false).toString();
        }
    });
}

// Add event listeners
// Unbind first to remove event listeners if we change subgardens
export function cachingListeners(id) {
    $("#collection-date").unbind().change(async (e) => {
        if (e.target.value.length > 0) {
            await updateCollection(id);
            await getLast(id);
        } else {
            alertModal("Please choose a valid date");
        }
    });

    // Add event listener for next and previous buttons
    // $("#next-btn").unbind().click(async () => await checkDefault(id, true));
    // $("#prev-btn").unbind().click(async () => await checkDefault(id, false));
    $("#finish-btn").unbind().click(async () => await checkDefault(id, null, true));

    // Add event listener for #no-observation
    $("#no-observation").unbind().change((e) => noObservationPossible(e.target.checked));

    // Add event listener for done collection button
    $("#done-btn").unbind().click(
        async () => {
            const isReady = await checkDefault(id, null, true);
            if (isReady)
                await uploadCollection(id);
        }
    );

    // Add event listener for cancel collection button
    $("#cancel-btn").unbind().click(() => {
        confirmModal("Are you sure you want to cancel and go back?");
        $('#confirm-yes').unbind().click(() => location.href = "/observations/");
    });

    // Add event listener for #flowers-opening
    $("#flowers-opening").unbind().change(requireIntensities);
    // Add event listener for #senescence
    $("#senescence").unbind().change(requireIntensities);
    // Add event listeners for #plant
    $("#plant").unbind().focus(
        async () => await checkDefault(id, false, true)
    ).change(async (e) => {
        await selectPlant(id, parseInt(e.target.selectedOptions[0].id));
        e.target.blur();
    });

    $("#copy-older").unbind().click(async function() {
        let collection = await getCollection(id);
        await fillInFields(
            id,
            document.getElementById("plant").selectedOptions[0].id,
            collection["last-collection-id"]
        );
    });
}
