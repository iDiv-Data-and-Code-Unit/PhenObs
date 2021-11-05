import { cacheCollection, cacheRecord } from "./caching.js";

let collectionId = null;

// Select today's date by default for Collection Date
let collectionDate = document.getElementById('collection-date');
let today = new Date();
const dd = String(today.getDate()).padStart(2, '0');
const mm = String(today.getMonth() + 1).padStart(2, '0');
const yyyy = today.getFullYear();
today = yyyy + '-' + mm + '-' + dd;

if (collectionDate)
    collectionDate.value = today;

// Get the form fields
const dropdowns = $('select').not('[id*="-old"]').not('[id*="plant"]');
const intensities = $('input[type="number"]').not('[id*="-old"]');
const checkboxes = $('input[type="checkbox"]').not('[id*="-old"]').not('[id*="no-observation"]');
const textarea = $('textarea').not('[id*="-old"]');
const pfe = $('#peak-flowering-estimation');

// Concatinate the form fields
let inputs = [
    ...dropdowns,
    ...intensities,
    ...checkboxes,
    ...textarea,
    ...pfe
];

// Checking internet connection
// $.ajax({
//     url: "/200",
//     timeout: 10000,
//     error: function(jqXHR) {
//         if(jqXHR.status==0) {
//             // form.children[4].addEventListener('click', cacheForm);
//         }
//     },
//     success: function() {
//         // form.children[4].classList.remove('btn-secondary')
//         // form.children[4].classList.add('btn-success');
//         // form.children[4].value = "Save";
//         // loadFromCache();
//     }
// });

// Create the object
if (collectionDate) {
    collectionId = cacheCollection();
    cacheRecord(collectionId);

    // Add a change listener to each field
    inputs.forEach(function (field) {
        field.addEventListener("change", function () {
            cacheRecord(collectionId);
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

function checkDefault(link) {
  const collection = JSON.parse(localStorage.getItem("collection-" + collectionId));
  const current = collection["records"][document.getElementById("plant").value];
  let defaultFlag = true;

  for (let i = 0; i < current.length; i++) {
      if (current[i] == 'y' || current[i] == 'u' || current[i] == 'm' || current[i] == true)
          defaultFlag = false;
  }

  if (defaultFlag) {
      if (confirm("You have not changed any default value. Are you sure you want to move on?"))
          location.href=link;
  }
}

document.getElementById('next-btn').addEventListener("click", () => {
    checkDefault(document.getElementById('next-page').value)
})
