import {
    emptyCollection
} from './collection.js';

// Set today on "#collection-date"
// Create an empty collection
$(document).ready(async () => await emptyCollection());

// window.onbeforeunload = function(event) {
//     return confirm("Do you want the page to be reloaded?");
// }