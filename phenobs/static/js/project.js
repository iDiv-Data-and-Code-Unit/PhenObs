// TODO: restructure everything, import new functions and get rid of redundant lines

import { cacheCollection, cacheRecord, updatePlantList } from "./caching.js";
import { selectPlant, nextPlant } from "./helpers.js";

let collectionId = null;
let allPlants = null;

if (document.getElementById('all-plants'))
    allPlants = parseInt(document.getElementById('all-plants').innerText);

// Select today's date by default for Collection Date
if (collectionDate)
    setToday();

// Get the form fields
const dropdowns = $('select').not('[id*="-old"]').not('[id*="plant"]');
const intensities = $('input[type="number"]').not('[id*="-old"]');
const checkboxes = $('input[type="checkbox"]').not('[id*="-old"]').not('[id*="no-observation"]');
const textarea = $('textarea').not('[id*="-old"]');

// Concatinate the form fields
let inputs = [
    ...dropdowns,
    ...intensities,
    ...checkboxes,
    ...textarea
];

// Change page with the chosen plant
const plants = document.getElementById('plant');

if (plants)
    plants.addEventListener('change', function () {
        let selected = null;
        for (let i = 0; i < plants.children.length; i++)
            if (plants.children[i].selected) {
                selectPlant(i);
            }
    });

let currentPlant = null;

// Create the object
if (collectionDate) {
    collectionId = 'collection-' + $('#collection-id').val();

    updatePlantList();
    selectPlant(0);

    // Add a change listener to each field
    inputs.forEach(function (field) {
        field.addEventListener("change", function () {
            cacheRecord(collectionId, false);
            let intensity = null;

            // Require intensity values to be entered if the respective field value is yes
            if (field.id == 'flowers-opening' || field.id == 'senescence') {
                intensity = document.getElementById(
                    (field.id == 'flowers-opening')
                        ? 'flowering-intensity'
                        : 'senescence-intensity'
                );

                intensity.disabled = (field.value == 'y') ? false : true;
                intensity.required = (field.value == 'y') ? true : false;
                (field.value == 'y')
                    ? intensity.classList.remove('disabled-btn')
                    : intensity.classList.add('disabled-btn');
            }
        });
    })
}

// Disabled all the fields if no observation was possible
let noObservationPossible = document.getElementById('no-observation');
if (noObservationPossible) {
    let remarks = document.getElementById('remarks');
    noObservationPossible.addEventListener("change", function() {
        inputs.forEach(function (field) {
            if (
                (field.id == 'senescence-intensity' && document.getElementById('senescence').value == 'y') ||
                (field.id == 'flowering-intensity' && document.getElementById('flowers-opening').value == 'y') ||
                (field.id != 'senescence-intensity' && field.id != 'flowering-intensity')
            ) {
                field.disabled = !field.disabled;
                field.classList.toggle('disabled-btn');
                field.required = !field.required;
            } else {
                field.disabled = true;
                field.classList.add('disabled-btn');
                field.required = false;
            }
        })
        remarks.required = !remarks.required;
        remarks.disabled = false;
        remarks.classList.remove('disabled-btn')
    });
}

function checkDefault(collection, collectionId) {
    const current = collection["records"][document.getElementById("plant").value];
    let defaultFlag = true;

    for (let i = 0; i < current.length; i++) {
        if (current[i] == 'y' || current[i] == 'u' || current[i] == 'm' || current[i] == true)
            defaultFlag = false;
    }

    if (defaultFlag) {
        if (confirm("You have not changed any default value. Are you sure you want to move on?"))
            nextPlant(collectionId);
    } else {
        nextPlant(collectionId);
    }
}

let nextBtn = document.getElementById('next-btn');
// let doneSoFar = document.getElementById('done-so-far');
const collections = JSON.parse(localStorage.getItem("collections"));
let collection = collections["unfinished"][collectionId];
// doneSoFar.innerText = collection["done-so-far"].length;

if (nextBtn)
    nextBtn.addEventListener("click", () => {
        cacheRecord(collectionId, true);
        checkDefault(collection, collectionId);
    })

// if (collection["done-so-far"].length == parseInt(allPlants) - 1)
//     nextBtn.value = "Save";
function setToday() {
    let collectionDate = document.getElementById('collection-date');

    let today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    today = yyyy + '-' + mm + '-' + dd;

    if (collectionDate)
        collectionDate.value = today;
}
