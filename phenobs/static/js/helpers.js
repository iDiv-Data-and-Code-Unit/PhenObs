// Update everything if the plant is changed
export function selectPlant(order) {
    let collections = JSON.parse(
        localStorage.getItem("collections")
    );
    let doneCollections = Object.keys(collections["done"]);
    let lastCollection = collections["done"][doneCollections[doneCollections["length"] - 1]];
    let plants = document.getElementById('plant');
    let plant = plants.value;

    // Select in dropdown
    plants.children[order].selected = true;

    // Fill in the modals with the old data
    let old_record = lastCollection["records"][plant];
    let old_dropdowns = $('select[id*="-old"]');
    let old_intensities = $('input[type="number"][id*="-old"]')
    let old_checkboxes = $('input[type="checkbox"][id*="-old"]');
    let old_textarea = $('textarea[id*="-old"]');

    // Fill in the old data buttons with old data
    let buttons = $('button[id*="-button"]');
    let oldCheckboxesText = "";
    let label = "";
    // console.log(old_record)
    // if (old_record)

    if (old_record) {
        for (let i = 0; i < old_checkboxes.length; i++) {
            label = $('#' + old_checkboxes[i].id + "-label").html();
            if (old_record[old_checkboxes[i].id.slice(0, old_checkboxes[i].id.length - 4)])
                oldCheckboxesText = (oldCheckboxesText.length)
                    ? oldCheckboxesText + ", " + label.toLowerCase()
                    : label;
        }

        for (let i = 0; i < buttons.length; i++) {
            if (buttons[i].id.includes("small"))
                buttons[i].innerHTML = old_record["remarks"];
            else if (buttons[i].id.includes("large"))
                buttons[i].innerHTML = old_record["remarks"];
            else if (buttons[i].id == "maintenance-button")
                buttons[i].innerHTML = oldCheckboxesText;
            else {
                let value = old_record[buttons[i].id.slice(0, buttons[i].id.length - 7)]
                if (value == "y")
                    buttons[i].innerHTML = "yes";
                else if (value == "u")
                    buttons[i].innerHTML = "unsure";
                else if (value == "m")
                    buttons[i].innerHTML = "missed";
                else if (value == "no")
                    buttons[i].innerHTML = "no";
                else
                    buttons[i].innerHTML = value;
            }

            if (buttons[i].disabled)
                buttons[i].disabled = false;
        }

        // console.log(lastCollection["records"][plant][old_dropdowns[0].id.slice(0, old_dropdowns[0].id.length - 4)])

        // Dropdowns
        for (let j = 0; j < old_dropdowns.length; j++)
            for (let i = 0; i < old_dropdowns[j].children.length; i++)
                if (old_dropdowns[j].children[i].value ==
                    old_record[old_dropdowns[j].id.slice(0, old_dropdowns[j].id.length - 4)])
                    old_dropdowns[j].children[i].selected = true;

        // Intensities
        for (let j = 0; j < old_intensities.length; j++)
            old_intensities[j].value = old_record[old_intensities[j].id.slice(0, old_intensities[j].id.length - 4)];

        // Checkboxes
        for (let j = 0; j < old_checkboxes.length; j++)
            old_checkboxes[j].checked = old_record[old_checkboxes[j].id.slice(0, old_checkboxes[j].id.length - 4)];

        // Textarea
        old_textarea[0].innerText = old_record["remarks"];

        modalDate();
    } else {
        let buttons = $('button[id*="-button"]');

        for (let i = 0; i < buttons.length; i++) {
            buttons[i].innerHTML = "";
            buttons[i].disabled = true;
        }
    }
}

export function modalDate(id) {
    let collections = JSON.parse(
        localStorage.getItem("collections")
    );
    let lastCollection
    let modals = $('span[id*="-date"]');

    for (let j = 0; j < modals.length; j++) {
        modals[j].innerText = lastCollection["collection-date"];
    }


}

export function nextPlant(collectionId) {
    let collections = JSON.parse(
        localStorage.getItem("collections")
    );

    let plants = document.getElementById("plant");
    let order = null;

    for (let plant in plants) {
        if (plant.selected)
            order = plant.name;
    }

    let currentCollection = collections["unfinished"][collectionId];
    // let currentPlant =

    if (collections["unfinished"][collectionId]["remaining"].indexOf(order + 1) > -1)
        selectPlant(order + 1);
    else if (collections["unfinished"][collectionId]["remaining"].length > 0)
        selectPlant(collections["unfinished"][collectionId]["remaining"][0]);
}
