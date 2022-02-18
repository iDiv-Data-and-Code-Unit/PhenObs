import {
    emptyCollection
} from './collection.js';

import {
    init
} from './edit.js';

// Set today on "#collection-date"
// Create an empty collection
$(document).ready(async () => await emptyCollection());

// window.onbeforeunload = function(event) {
//     return confirm("Do you want the page to be reloaded?");
// }

$("#subgarden").change(
    async (e) => {
        if (e.target.selectedOptions[0].id.length === 0) {
            await emptyCollection($(e.target.selectedOptions[0]).attr("name"));
            e.target.selectedOptions[0].innerText =
                e.target.selectedOptions[0].innerText.replace("+", " ")
        } else
            await init(parseInt(e.target.selectedOptions[0].id), false);
    }
);
