export function formatDate(dateToFormat, includeYear=true) {
    let options = {
        month: 'short',
        day: 'numeric',
    };

    if (includeYear)
        options.year = 'numeric';

    return dateToFormat.toLocaleString('en-US', options);
}

export function fillInModalDates(lastCollection) {
    // Get all the spans with date values in the modal titles
    let modals = $('span[id*="-date"]');
    // Add the last collection dates
    // TODO: make the dates more human readable (LongDate)
    for (let j = 0; j < modals.length; j++) {
        modals[j].innerText = formatDate(new Date(lastCollection["date"])).toString();
    }
}

export function fillInOldData(lastCollection, plant) {
    let old_record = null;
    // Check if the record exists for the plant
    if (plant in lastCollection["records"]){
        toggleButtons(false);
        old_record = lastCollection["records"][plant];
    } else {
        toggleButtons(true);
        return;
    }

    // Get the elements to be filled in
    let old_dropdowns = $('select[id*="-old"]');
    let old_intensities = $('input[type="number"][id*="-old"]')
    let old_checkboxes = $('input[type="checkbox"][id*="-old"]');
    let old_textarea = $('textarea[id*="-old"]');

    // Dropdowns
    for (let j = 0; j < old_dropdowns.length; j++)
        for (let i = 0; i < old_dropdowns[j].children.length; i++)
            if (
                old_dropdowns[j].children[i].value ===
                old_record[old_dropdowns[j].id.slice(0, old_dropdowns[j].id.length - 4)]
            )
                old_dropdowns[j].children[i].selected = true;
    // Intensities
    for (let j = 0; j < old_intensities.length; j++)
        old_intensities[j].value =
            old_record[old_intensities[j].id.slice(0, old_intensities[j].id.length - 4)];
    // Checkboxes
    for (let j = 0; j < old_checkboxes.length; j++) {
        old_checkboxes[j].checked =
            old_record[old_checkboxes[j].id.slice(0, old_checkboxes[j].id.length - 4)];
    }
    // Textarea
    old_textarea[0].innerText = old_record["remarks"];
}

export function fillInButtons(lastCollection, plant) {
    let old_record = null;

    // Check if the record exists for the plant
    if (plant in lastCollection["records"]) {
        toggleButtons(false);
        old_record = lastCollection["records"][plant];
    }
    else{
        toggleButtons(true);
        return;
    }

    let old_checkboxes = $('input[type="checkbox"][id*="-old"]');
    let buttons = $('button[id*="-button"]');
    // For maintenance
    let oldCheckboxesText = "";
    let label = "";

    // Concat maintenance choices together
    for (let i = 0; i < old_checkboxes.length; i++) {
        label = $('#' + old_checkboxes[i].id + "-label").html();
        if (old_record[old_checkboxes[i].id.slice(0, old_checkboxes[i].id.length - 4)])
            oldCheckboxesText = (oldCheckboxesText.length)
                ? oldCheckboxesText + ", " + label.toLowerCase()
                : label;
    }

    for (let i = 0; i < buttons.length; i++) {
        // Remarks button on small screens
        if (buttons[i].id.includes("small"))
            buttons[i].innerHTML = old_record["remarks"];
        // Remarks button on large screens
        else if (buttons[i].id.includes("large"))
            buttons[i].innerHTML = old_record["remarks"];
        // Maintenance checkboxes
        else if (buttons[i].id === "maintenance-button")
            buttons[i].innerHTML = oldCheckboxesText;
        // Intensities, dropdowns, textareas
        else {
            let value = old_record[buttons[i].id.slice(0, buttons[i].id.length - 7)]
            if (value === "y")
                buttons[i].innerHTML = "yes";
            else if (value === "u")
                buttons[i].innerHTML = "unsure";
            else if (value === "m")
                buttons[i].innerHTML = "missed";
            else if (value === "no")
                buttons[i].innerHTML = "no";
            else
                buttons[i].innerHTML = value;
        }
    }
}

// Hide buttons if no last collection is available
// Show buttons if the last collection is available
export function toggleButtons(hideFlag) {
    let buttons = $('button[id*="-button"]');
    for (let i = 0; i < buttons.length; i++) {
        if (hideFlag)
            buttons[i].classList.add("d-none");
        else
            buttons[i].classList.remove("d-none");
    }
    if (hideFlag) {
        document.getElementById('last-obs-date').classList.add('d-none');
        document.getElementById('remarks-large-button').classList.remove('d-lg-block');
        document.getElementById('remarks-small-button').classList.remove('d-block');
    }
    else {
        document.getElementById('last-obs-date').classList.remove('d-none');
        document.getElementById('remarks-large-button').classList.add('d-lg-block');
        document.getElementById('remarks-large-button').classList.add('d-none');
        document.getElementById('remarks-small-button').classList.remove('d-block');
        document.getElementById('remarks-small-button').classList.remove('d-none');
    }
}

export function alertModal(message) {
    $('#alert-body').text(message);
    $('#alert').modal('show');
}

export function confirmModal(message) {
    $('#confirm-body').text(message);
    $('#confirm').modal('show');
}
