
// Service Worker voor PWA functionaliteit
const CACHE_NAME = 'writgoai-v3';
const RUNTIME_CACHE = 'writgoai-runtime-v3';
const MAX_CACHE_SIZE = 50; // Maximum aantal items in runtime cache
const MAX_CACHE_AGE = 24 * 60 * 60 * 1000; // 24 uur in milliseconden

const STATIC_ASSETS = [
  '/',
  '/client-portal',
  '/icon-192.png',
  '/icon-512.png',
  '/logo.png'
];

// Helper functie om cache size te limiteren
async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxSize) {
    // Verwijder de oudste items
    const deletePromises = keys.slice(0, keys.length - maxSize).map(key => cache.delete(key));
    await Promise.all(deletePromises);
  }
}

// Helper functie om oude cache items te verwijderen
async function cleanExpiredCache(cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  const now = Date.now();
  
  for (const request of keys) {
    const response = await cache.match(request);
    if (response) {
      const dateHeader = response.headers.get('date');
      if (dateHeader) {
        const cacheTime = new Date(dateHeader).getTime();
        if (now - cacheTime > maxAge) {
          await cache.delete(request);
        }
      }
    }
  }
}

// Install event - cache statische bestanden
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('PWA: Caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
      })
      .catch((error) => {
        console.error('PWA: Failed to cache assets:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - verwijder oude caches
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => !currentCaches.includes(cacheName))
            .map((cacheName) => {
              console.log('PWA: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        // Clean expired items from runtime cache
        return cleanExpiredCache(RUNTIME_CACHE, MAX_CACHE_AGE);
      })
  );
  self.clients.claim();
});

// Fetch event - Network first, fallback naar cache
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests (vooral externe afbeeldingen)
  if (!event.request.url.startsWith(self.location.origin)) {
    // Laat externe requests (zoals aimlapi.com images) door zonder caching
    // Dit voorkomt memory issues met grote externe afbeeldingen
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Network first strategy voor API calls - GEEN caching
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return new Response(JSON.stringify({ error: 'Offline' }), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // Cache first voor LOKALE statische assets alleen
  if (event.request.url.match(/\.(png|jpg|jpeg|svg|gif|webp|ico)$/) && 
      event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          
          return fetch(event.request).then((fetchResponse) => {
            // Alleen cachen als het een succesvolle response is
            if (fetchResponse && fetchResponse.status === 200) {
              return caches.open(RUNTIME_CACHE).then(async (cache) => {
                // Limiteer cache size voordat we toevoegen
                await limitCacheSize(RUNTIME_CACHE, MAX_CACHE_SIZE);
                cache.put(event.request, fetchResponse.clone());
                return fetchResponse;
              });
            }
            return fetchResponse;
          }).catch(() => {
            // Fallback naar cached versie als fetch faalt
            return caches.match(event.request);
          });
        })
    );
    return;
  }

  // Voor CSS en JS bestanden - cache met size limit
  if (event.request.url.match(/\.(css|js)$/)) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          return response || fetch(event.request).then(async (fetchResponse) => {
            if (fetchResponse && fetchResponse.status === 200) {
              const cache = await caches.open(RUNTIME_CACHE);
              await limitCacheSize(RUNTIME_CACHE, MAX_CACHE_SIZE);
              cache.put(event.request, fetchResponse.clone());
            }
            return fetchResponse;
          });
        })
    );
    return;
  }

  // Network first voor pages
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and cache successful responses
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then(async (cache) => {
            await limitCacheSize(RUNTIME_CACHE, MAX_CACHE_SIZE);
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback naar cache
        return caches.match(event.request).then((response) => {
          return response || caches.match('/');
        });
      })
  );
});

// Push notification support
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'WritgoAI Notificatie';
  const options = {
    body: data.body || 'Je hebt een nieuwe update',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'writgoai-notification',
    requireInteraction: false,
    actions: [
      { action: 'open', title: 'Bekijk' },
      { action: 'close', title: 'Sluiten' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/client-portal')
    );
  }
});

// Background sync support (voor toekomstige offline functionaliteit)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-content') {
    event.waitUntil(
      // Hier kunnen we later offline content synchroniseren
      Promise.resolve()
    );
  }
});

console.log('PWA: Service Worker loaded successfully');
