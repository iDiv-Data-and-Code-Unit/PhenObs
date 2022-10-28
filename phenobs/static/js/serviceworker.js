var today = new Date();
const staticCacheName = "django-pwa-v122";
var filesToCache = [
    '/observations/',
    '/offline/',
    '/imprint/',
    '/help/',

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
    '/static/js/help.js',

    '/static/css/bootstrap-icons.scss',
    '/static/css/bootstrap-icons.css',
    '/static/fonts/bootstrap-icons.woff',
    '/static/fonts/bootstrap-icons.woff2',
    '/static/fonts/bootstrap-icons.woff?a74547b2f0863226942ff8ded57db345',
    '/static/fonts/bootstrap-icons.woff2?a74547b2f0863226942ff8ded57db345',

    '/static/css/help.css',
    '/static/css/project.css',
    '/static/sass/project.scss',

    '/static/CSV_template.csv',

    '/static/images/PhenObs_Logo.png',
    '/static/images/PhenObs_Splash.png',
    '/static/images/PhenObs_Logo_Rounded_512px.png',
    '/static/images/all_collections.png',
    '/static/images/add_collection.png',
    '/static/images/add_observation.png',
    '/static/images/loading.gif',

    '/static/images/save_db_primary.png',
    '/static/images/db_check_success.png',
    '/static/images/db_gray.png',
    '/static/images/db.png',

    '/static/images/help/add_calendar.png',
    '/static/images/help/add_home.png',
    '/static/images/help/add_local.png',
    '/static/images/help/add_overview.png',
    '/static/images/help/add_overview2.png',
    '/static/images/help/collections.png',
    '/static/images/help/collections_delete_multiple.png',
    '/static/images/help/collections_delete_multiple_verify.png',
    '/static/images/help/collections_delete_single.png',
    '/static/images/help/collections_delete_single_edit.png',
    '/static/images/help/collections_delete_single_verify.png',
    '/static/images/help/collections_table.png',
    '/static/images/help/edit_older.png',
    '/static/images/help/filling_values_overview.png',
    '/static/images/help/filling_values_overview_add.png',
    '/static/images/help/gardens.png',
    '/static/images/help/gardens_access_sub.png',
    '/static/images/help/gardens_add_main.png',
    '/static/images/help/gardens_add_sub.png',
    '/static/images/help/gardens_table.png',
    '/static/images/help/get_collections.png',
    '/static/images/help/get_names.py',
    '/static/images/help/import_plants_csv.png',
    '/static/images/help/import_plants_upload.png',
    '/static/images/help/import_records_csv.png',
    '/static/images/help/import_records_upload.png',
    '/static/images/help/output.txt',
    '/static/images/help/plants.png',
    '/static/images/help/plants_add.png',
    '/static/images/help/plants_table.png',
    '/static/images/help/selecting_collections_overview.png',
    '/static/images/help/select_gardens_overview.png',
    '/static/images/help/select_plant_ready.png',
    '/static/images/help/species.png',
    '/static/images/help/species_add.png',
    '/static/images/help/statuses.png',
    '/static/images/help/subgarden_selection.png',
    '/static/images/help/unfinished_finished.png',
    '/static/images/help/users.png',
    '/static/images/help/users_add.png',
    '/static/images/help/users_details.png',
    '/static/images/help/users_permissions.png',
    '/static/images/help/users_permissions_admin.png',
    '/static/images/help/users_table.png',
    '/static/images/help/value_fields.png',
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
