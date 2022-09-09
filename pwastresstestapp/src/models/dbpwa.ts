import {openDB} from "idb";

export const dbPWA = openDB('pwastresstest', 2, {
    upgrade(db) {
        if (!db.objectStoreNames.contains("settings")) db.createObjectStore('settings');
        if (!db.objectStoreNames.contains("imagerecords")) db.createObjectStore('imagerecords');
    },
});
