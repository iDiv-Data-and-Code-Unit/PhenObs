var today = new Date();
const staticCacheName = "django-pwa-v119";
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

    '/static/images/screenshots/add_col_home.png',
    '/static/images/screenshots/add_col_local_cols.png',
    '/static/images/screenshots/add_garden.png',
    '/static/images/screenshots/add_garden_all.png',
    '/static/images/screenshots/add_garden_new.png',
    '/static/images/screenshots/add_user.png',
    '/static/images/screenshots/add_userdetails.png',
    '/static/images/screenshots/check_date.png',
    '/static/images/screenshots/collections.png',
    '/static/images/screenshots/collection_table.png',
    '/static/images/screenshots/delete_col.png',
    '/static/images/screenshots/delete_collections.png',
    '/static/images/screenshots/delete_single.png',
    '/static/images/screenshots/delete_single_go.png',
    '/static/images/screenshots/delete_single_verify.png',
    '/static/images/screenshots/delete_verify.png',
    '/static/images/screenshots/download_as_csv.png',
    '/static/images/screenshots/download_as_xlsx.png',
    '/static/images/screenshots/edit_older.png',
    '/static/images/screenshots/edit_view_overview.png',
    '/static/images/screenshots/filling_values_overview.png',
    '/static/images/screenshots/finished.png',
    '/static/images/screenshots/gardens.png',
    '/static/images/screenshots/gardens_table.png',
    '/static/images/screenshots/import_csv.png',
    '/static/images/screenshots/main_garden_add.png',
    '/static/images/screenshots/main_garden_permissions.png',
    '/static/images/screenshots/not_finished.png',
    '/static/images/screenshots/offline_status.png',
    '/static/images/screenshots/online_status.png',
    '/static/images/screenshots/overview_page.png',
    '/static/images/screenshots/overview_save_all.png',
    '/static/images/screenshots/plants.png',
    '/static/images/screenshots/plants_add.png',
    '/static/images/screenshots/plant_deactivate.png',
    '/static/images/screenshots/plant_select.png',
    '/static/images/screenshots/prev_invalid.png',
    '/static/images/screenshots/selecting_collections_overview.png',
    '/static/images/screenshots/select_gardens_overview.png',
    '/static/images/screenshots/select_plant.png',
    '/static/images/screenshots/select_plant_ready.png',
    '/static/images/screenshots/species.png',
    '/static/images/screenshots/species_add.png',
    '/static/images/screenshots/statuses.png',
    '/static/images/screenshots/subgarden_add.png',
    '/static/images/screenshots/subgarden_permissions.png',
    '/static/images/screenshots/subgarden_selection.png',
    '/static/images/screenshots/unfinished_finished.png',
    '/static/images/screenshots/update_all.png',
    '/static/images/screenshots/upload_csv.png',
    '/static/images/screenshots/users.png',
    '/static/images/screenshots/users_add.png',
    '/static/images/screenshots/users_table.png',
    '/static/images/screenshots/user_details.png',
    '/static/images/screenshots/user_details_admin.png',
    '/static/images/screenshots/user_details_default.png',
    '/static/images/screenshots/value_fields.png'
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
