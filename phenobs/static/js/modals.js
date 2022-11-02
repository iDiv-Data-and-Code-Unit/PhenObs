/**
 * Returns a human readable date string
 * @param {Date} dateToFormat - Date object to be formatted
 * @param {boolean} includeYear - Whether to include year in the string
 * @return {string} Generated string
 */
export function formatDate(dateToFormat, includeYear=true) {
    let options = {
        month: 'short',
        day: 'numeric',
    };

    if (includeYear)
        options.year = 'numeric';

    return dateToFormat.toLocaleString('en-US', options);
}

/**
 * Fills in date of the last collection into modals
 * @param {Object} lastCollection - Collection object
 */
export function fillInModalDates(lastCollection) {
    // Get all the spans with date values in the modal titles
    let modals = $('span[id*="-date"]');
    // Add the last collection dates
    for (let j = 0; j < modals.length; j++) {
        modals[j].innerText = formatDate(new Date(lastCollection["date"])).toString();
    }
}

/**
 * Fills in text for the previous collection dropdowns, textareas and requires intensities, if necessary
 * @param {Object} lastCollection - Previous collection object
 * @param {number} plant - Order of the plant
 */
export function fillInOldData(lastCollection, plant) {
    let old_record = null;
    // Check if the record exists for the plant
    if (plant in lastCollection["records"]) {
        toggleButtons(false);
        old_record = lastCollection["records"][plant];
    } else {
        toggleButtons(true);
        return;
    }

    // Get the elements to be filled in
    let old_dropdowns = $('select[id*="-old"]');
    let old_checkboxes = $('input[type="checkbox"][id*="-old"]');
    let old_textarea = $('textarea[id*="-old"]');

    // Dropdowns and intensities
    for (let j = 0; j < old_dropdowns.length; j++)
        for (let i = 0; i < old_dropdowns[j].children.length; i++) {
            // console.log(old_dropdowns[j].id)
            // console.log(old_dropdowns[j].children[i].value + " " + old_record[old_dropdowns[j].id.slice(0, old_dropdowns[j].id.length - 4)])
            if (
                (old_dropdowns[j].children[i].value ===
                old_record[old_dropdowns[j].id.slice(0, old_dropdowns[j].id.length - 4)]) ||
                (parseInt(old_dropdowns[j].children[i].value) ===
                old_record[old_dropdowns[j].id.slice(0, old_dropdowns[j].id.length - 4)]) ||
                (old_record[old_dropdowns[j].id.slice(0, old_dropdowns[j].id.length - 4)] == null &&
                old_dropdowns[j].children[i].value === "")
            )
                old_dropdowns[j].children[i].selected = true;
        }

    // Disabling/Enabling intensities if the respective fields are not set "yes"
    const senescenceIntensityBtn = $("#senescence-intensity-button");
    const floweringIntensityBtn = $("#flowering-intensity-button");
    const peakFloweringBtn = $("#peak-flowering-button");

    if (old_record["senescence"] !== "y") {
        senescenceIntensityBtn.prop("disabled", true);
        $("#senescence-intensity-old").prop("required", false);
        senescenceIntensityBtn.addClass("disabled-old");
        $("#senescence-intensity-button").removeClass("required-field");
    } else {
        if (old_record["senescence-intensity"] == null || old_record["senescence-intensity"].length === 0)
            senescenceIntensityBtn.addClass("required-field");
        else
            senescenceIntensityBtn.removeClass("required-field");

        senescenceIntensityBtn.prop("disabled", false);
        $("#senescence-intensity-old").prop("required", true);
        senescenceIntensityBtn.removeClass("disabled-old");
    }

    if (old_record["flowers-opening"] !== "y") {
        floweringIntensityBtn.prop("disabled", true);
        $("#flowering-intensity-old").prop("required", false);
        floweringIntensityBtn.addClass("disabled-old");
        floweringIntensityBtn.removeClass("required-field");

        peakFloweringBtn.prop("disabled", true);
        $("#peak-flowering-old").prop("required", false);
        peakFloweringBtn.addClass("disabled-old");
        peakFloweringBtn.removeClass("required-field");
    } else {
        if (old_record["flowering-intensity"] == null || old_record["flowering-intensity"].length === 0) {
            floweringIntensityBtn.addClass("required-field");
        } else {
            floweringIntensityBtn.removeClass("required-field");
        }
        floweringIntensityBtn.prop("disabled", false);
        $("#flowering-intensity-old").prop("required", true);
        floweringIntensityBtn.removeClass("disabled-old");

        peakFloweringBtn.prop("disabled", false);
        peakFloweringBtn.removeClass("disabled-old");
    }

    // Checkboxes
    for (let j = 0; j < old_checkboxes.length; j++) {
        old_checkboxes[j].checked =
            old_record[old_checkboxes[j].id.slice(0, old_checkboxes[j].id.length - 4)];
    }
    // Textarea
    old_textarea[0].innerText = old_record["remarks"];
}

/**
 * Fills in text for the previous collection buttons
 * @param {Object} lastCollection - Previous collection object
 * @param {number} plant - Order of the plant
 */
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
        $(buttons[i]).unbind().click(function() {
            const elementId = buttons[i].id.slice(0, buttons[i].id.length - 7);
            if (elementId.includes("remarks")) {
                $(`#remarks-old`).val(old_record["remarks"]);
            } else if (elementId === "maintenance") {
                for (let j = 0; j < old_checkboxes.length; j++) {
                    const checkboxId = old_checkboxes[j].id.slice(0, old_checkboxes[j].id.length - 4);
                    document.getElementById(old_checkboxes[j].id).checked = old_record[checkboxId];
                }
            } else {
                document.getElementById(elementId + '-old').value = old_record[elementId];
            }
        });
        // Remarks button on small screens
        if (buttons[i].id.includes("small")) {
            buttons[i].innerHTML = old_record["remarks"];
            continue;
        }
        // Remarks button on large screens
        else if (buttons[i].id.includes("large")) {
            buttons[i].innerHTML = old_record["remarks"];
            continue;
        }
        // Maintenance checkboxes
        else if (buttons[i].id === "maintenance-button")
            buttons[i].innerHTML = oldCheckboxesText;
        // Intensities, dropdowns, textareas
        else {
            let value = old_record[buttons[i].id.slice(0, buttons[i].id.length - 7)];

            if (value === "y")
                buttons[i].innerHTML = "yes";
            else if (value === "u")
                buttons[i].innerHTML = "unsure";
            else if (value === "m")
                buttons[i].innerHTML = "missed";
            else if (value === "no")
                buttons[i].innerHTML = "no";
            else if (buttons[i].id.includes("intensity") && value != null && value.toString().length > 0)
                buttons[i].innerHTML = value + "%";
            else
                buttons[i].innerHTML = value;
        }

        // Checking no observation case and disabling/enabling buttons
        if (lastCollection["records"][plant]["no-observation"]) {
            buttons[i].disabled = true;
            $("#copy-older").prop("disabled", true);
        } else if (!buttons[i].id.includes("intensity") && !buttons[i].id.includes("peak")) {
            buttons[i].disabled = false;
            $("#copy-older").prop("disabled", false);
        }
        // Checking for intensity values and disabling them no matter no-observation value
        else if ((buttons[i].id.includes("senescence-intensity") && old_record["senescence"] !== "y") ||
            (buttons[i].id.includes("flowering-intensity") && old_record["flowers-opening"] !== "y") ||
            (buttons[i].id.includes("peak") && old_record["flowers-opening"] !== "y")) {
            buttons[i].disabled = true;
        }
    }
}

/**
 * Hides the previous collection buttons if no previous collection exists
 * @param {boolean} hideFlag - Hide flag, if true means the buttons should not be displayed
 */
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
        document.getElementById('copy-older').classList.remove('d-flex');
        document.getElementById('copy-older').classList.add('d-none');
        document.getElementById('remarks-large-button').classList.remove('d-lg-block');
        document.getElementById('remarks-small-button').classList.remove('d-block');
    }
    else {
        document.getElementById('last-obs-date').classList.remove('d-none');
        document.getElementById('copy-older').classList.add('d-flex');
        document.getElementById('copy-older').classList.remove('d-none');
        document.getElementById('remarks-large-button').classList.add('d-lg-block');
        document.getElementById('remarks-large-button').classList.add('d-none');
        document.getElementById('remarks-small-button').classList.remove('d-block');
        document.getElementById('remarks-small-button').classList.remove('d-none');
    }
}

/**
 * Creates an alert modal with the given message to warn the user or display an error message
 * @param {string} message - The message to be displayed
 */
export function alertModal(message) {
    $('#alert-body').text(message);
    $('#alert').modal('show');
}

/**
 * Creates a confirm modal with the given message to verify user's action
 * @param {string} message - The message to be displayed
 */
export function confirmModal(message) {
    $('#confirm-body').text(message);
    $('#confirm').modal('show');
}
