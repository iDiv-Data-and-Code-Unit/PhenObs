import {
    emptyCollection
} from './collection.js';

import {
    fill
} from './edit.js';

// Set today on "#collection-date"
// Create an empty collection
// $(document).ready(async () => await emptyCollection());

$("#subgarden").change(
    async (e) => {
        if (e.target.selectedOptions[0].id.length === 0) {
            await emptyCollection($(e.target.selectedOptions[0]).attr("name"));
            e.target.selectedOptions[0].innerText =
                e.target.selectedOptions[0].innerText.replace("+", " ")
        } else
            await fill(parseInt(e.target.selectedOptions[0].id), false);

        $("#empty").remove();
    }
);
