var today = new Date();
const staticCacheName = "django-pwa-v106";
var filesToCache = [
    '/observations/',
    '/offline/',
    '/imprint/',
    '/help/',
    '/static/css/project.css',
    '/static/css/bootstrap.min.css',
    '/static/js/bootstrap.min.js',
    '/static/js/html5shiv.min.js',
    '/static/js/jquery-3.3.1.min.js',
    '/static/js/popper.min.js',
    '/static/js/project.js',
    '/static/js/add.js',
    '/static/js/edit.js',
    '/static/js/observation.js',
    '/static/js/observations.js',
    '/static/js/spreadsheet.js',
    '/static/js/collection.js',
    '/static/js/modals.js',
    '/static/images/PhenObs_Logo.png',
    '/static/images/PhenObs_Splash.png',
    '/static/images/PhenObs_Logo_Rounded_512px.png',
    '/static/images/all_collections.png',
    '/static/images/add_collection.png',
    '/static/images/add_observation.png',
    '/static/images/loading.gif',
    '/static/css/bootstrap-icons.scss',
    '/static/css/bootstrap-icons.css',
    '/static/fonts/bootstrap-icons.woff',
    '/static/fonts/bootstrap-icons.woff2',
    '/static/fonts/bootstrap-icons.woff?a74547b2f0863226942ff8ded57db345',
    '/static/fonts/bootstrap-icons.woff2?a74547b2f0863226942ff8ded57db345',

    '/static/images/bootstrap-icons/cloud-arrow-up-fill.svg',
    '/static/images/bootstrap-icons/cloud-check-fill.svg',
    '/static/images/bootstrap-icons/cloud-fill.svg',
    '/static/images/bootstrap-icons/exclamation-circle-fill.svg',
    '/static/images/bootstrap-icons/hdd-fill.svg',
    '/static/images/bootstrap-icons/pencil-fill.svg',
    '/static/images/bootstrap-icons/trash-fill.svg',
    '/static/images/bootstrap-icons/filetype-csv.svg',
    '/static/images/bootstrap-icons/plus-circle-fill.svg',

    '/static/images/save_db_primary.png',
    '/static/images/db_check_success.png',
    '/static/images/db_gray.png',
    '/static/images/db.png',
];

// Cache on install
self.addEventListener("install", event => {
    // this.skipWaiting();

    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(cacheName => (cacheName.startsWith("django-pwa")))
                    .map(cacheName => caches.delete(cacheName))
            );
        }).then(() => caches.open(staticCacheName)).then(cache => {
                return cache.addAll(filesToCache);
        })
    );
});

// Clear cache on activate
self.addEventListener('activate', event => {
    // Delete all Service Worker Caches
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(cacheName => (cacheName.startsWith("django-pwa")))
                    .filter(cacheName => (cacheName !== staticCacheName))
                    .map(cacheName => caches.delete(cacheName))
            );
        })
    );
});

// Serve from Cache
self.addEventListener('fetch', function(event) {
    event.respondWith(
        fetch(event.request).catch(function() {
            return caches.match(event.request);
        })
    );
});
