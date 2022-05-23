import {
    emptyCollection
} from './collection.js';

import {
    fill
} from './edit.js';

// Set today on "#collection-date"
// Create an empty collection
// $(document).ready(async () => await emptyCollection());

const subgarden = $("#subgarden");

subgarden.change(
    async (e) => {
        if (e.target.selectedOptions[0].id.length === 0) {
            await emptyCollection($(e.target.selectedOptions[0]).attr("name"));
            e.target.selectedOptions[0].innerText =
                e.target.selectedOptions[0].innerText.replace("+", " ")
        } else
            await fill(parseInt(e.target.selectedOptions[0].id), false);

        $("#empty").remove();

        // Check if there is any unselected garden option left
        for (let i = 0; i < subgarden.children().length; i++)
            if (subgarden.children()[i].id.length === 0)
                return;
        // If all the possible choices are selected, then label this feature as offline
        subgarden.parent().removeClass("online-feature");
        subgarden.parent().addClass("offline-feature");
    }
);
