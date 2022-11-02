import {
    emptyCollection
} from './collection.js';

import {
    fill
} from './edit.js';

const subgarden = $("#subgarden");

// Anytime a subgarden is selected, new or existing, fill in the records' data
subgarden.change(
    async (e) => {
        if (e.target.selectedOptions[0].id.length === 0) {
            // For a new collection send a request and get data for an empty, unfinished collection from backend
            await emptyCollection($(e.target.selectedOptions[0]).attr("name"));
            // Replace the plus sign "+" in the dropdown as this subgarden is now available
            e.target.selectedOptions[0].innerText =
                e.target.selectedOptions[0].innerText.replace("+", " ")
        } else
            // If the collection for the subgarden already exists, just fill in its records' data
            await fill(parseInt(e.target.selectedOptions[0].id), false);

        // Delete the empty subgardne choice from the list
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
