import {
    emptyCollection
} from './collection.js';

import {
    getFields
} from './observation.js';

import {
    changeListeners,
    cachingListeners,
    setDate
} from './edit.js';

// Set today on "#collection-date"
setDate(new Date());
// Create an empty collection
await emptyCollection(getFields, changeListeners, cachingListeners);

window.onbeforeunload = function(event) {
    return confirm("Do you want the page to be reloaded?");
}