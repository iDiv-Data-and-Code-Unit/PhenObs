import {setDate, changeListeners, cachingListeners} from './add.js';
import {getCollection, getCollections, setCollections} from "./collection.js";
import {getFields, setupPlants} from "./observation.js";

function getTypeAndId() {
    const url = location.href;
    const fullId = url.split('/');
    const split = fullId[fullId.length - 1].split('-');
    // Return collectionType and collectionId
    return [split[0], split[1]];
}

const typeAndId = getTypeAndId();
let collectionType = typeAndId[0];
const collectionId = parseInt(typeAndId[1]);

if (collectionType === "online") {
    let collection = getCollection("online", collectionId);
    let collections = getCollections();

    collections["edited"]["collections"][collectionId] = collection;
    setCollections(collections);

    collectionType = "edited";
}

setDate(new Date(getCollection(collectionType, collectionId)["collection-date"]));
setupPlants(collectionType, collectionId);
changeListeners(getFields(), collectionType, collectionId);
cachingListeners(collectionType, collectionId);
