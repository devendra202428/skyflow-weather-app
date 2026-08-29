/* ==========================================================================
   SKYFLOW SERVICE WORKER (PWA OFFLINE CACHING ENGINE)
   ========================================================================== */

const CACHE_NAME = 'skyflow-cache-v4';
const STATIC_ASSETS = [
  'index.html',
  'style.css',
  'app.js',
  'manifest.json',
  'assets/icon.jpg',
  // Lucide CDNs
  'https://unpkg.com/lucide@latest',
  // Chart.js CDN
  'https://cdn.jsdelivr.net/npm/chart.js',
  // Fonts CSS
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap'
];

// 1. Install Event: Pre-cache static UI shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching application shell assets.');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate Event: Clean up outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Intercept network calls (Stale-While-Revalidate)
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // A. Check if the request is for a live Weather/Geocoding API
  const isApiRequest = 
    requestUrl.hostname.includes('open-meteo.com') || 
    requestUrl.hostname.includes('openstreetmap.org');

  if (isApiRequest) {
    // Network First strategy: fetch live data, do not cache (weather changes constantly)
    event.respondWith(
      fetch(event.request).catch(() => {
        // If offline and request fails, return a custom offline JSON status error
        return new Response(
          JSON.stringify({
            error: true,
            message: 'You are currently offline. Please restore your connection to fetch live weather details.'
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
  } else {
    // Stale-While-Revalidate strategy for static UI assets (HTML, CSS, JS, CDNs)
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => {
          // Fail silently on network errors, cached fallback handles it
        });

        return cachedResponse || fetchPromise;
      })
    );
  }
});
