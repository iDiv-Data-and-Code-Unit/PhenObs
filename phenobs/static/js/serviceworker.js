var staticCacheName = "django-pwa-v" + new Date().getTime();
var filesToCache = [
    '/',
    '/observations/',
    '/offline/',
    '/static/css/project.css',
    '/static/css/bootstrap.min.css',
    '/static/js/bootstrap.min.js',
    '/static/js/html5shiv.min.js',
    '/static/js/jquery-3.3.1.min.js',
    '/static/js/popper.min.js',
    '/static/js/project.js',
    '/static/images/PhenObs_Logo.png',
    '/static/images/PhenObs_Splash.png',
    '/static/images/all_collections.png',
    '/static/images/add_collection.png'
];

// Cache on install
self.addEventListener("install", event => {
    this.skipWaiting();
    event.waitUntil(
        caches.open(staticCacheName)
            .then(cache => {
                return cache.addAll(filesToCache);
            })
    )
});

// Clear cache on activate
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(cacheName => (cacheName.startsWith("django-pwa-")))
                    .filter(cacheName => (cacheName !== staticCacheName))
                    .map(cacheName => caches.delete(cacheName))
            );
        })
    );
});

// Serve from Cache
self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
            .catch(() => {
                return caches.match('offline');
            })
    )
});
