import {setDate, changeListeners, cachingListeners} from './add.js';
import {getCollection} from "./collection.js";
import {getFields, setupPlants} from "./observation.js";

function getId() {
    const url = location.href;
    const split = url.split('/');
    return split[split.length - 1];
}

const id = getId();

setDate(new Date(getCollection(id)["date"]));
setupPlants(id);
changeListeners(getFields(), id);
cachingListeners(id);
