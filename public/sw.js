const CACHE_NAME = 'waseet-plus-v4';
const IMAGE_CACHE = 'waseet-plus-images-v3';

const OFFLINE_URL = '/index.html';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      const urlsToCache = [
        '/',
        '/index.html',
        '/manifest.json'
      ];
      // Use fault-tolerant caching so that a single missing resource doesn't halt activation
      return Promise.allSettled(
        urlsToCache.map(url => {
          return cache.add(url).catch(err => {
            console.warn('Failed to cache during installation:', url, err);
          });
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys.map(key => {
        if (key !== CACHE_NAME && key !== IMAGE_CACHE) {
          return caches.delete(key);
        }
      }));
    }).then(() => {
      return self.clients.claim();
    }).then(() => {
      // Broadcast activation to all clients for auto-update force refresh
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'SW_ACTIVATED', version: CACHE_NAME });
        });
      });
    })
  );
});

self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // For images, prioritize cache but always try to update it (Stale-While-Revalidate)
  if (event.request.destination === 'image' || url.hostname.includes('unsplash.com') || url.hostname.includes('picsum.photos')) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(cache => {
        return cache.match(event.request).then(cachedResponse => {
          const fetchPromise = fetch(event.request, { mode: 'no-cors' }).then(networkResponse => {
            if (networkResponse.ok || networkResponse.type === 'opaque') {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(err => {
            console.warn('Network fetch failed for image:', url.href, err);
            return cachedResponse;
          });

          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // For everything else: Strict Network First
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache success responses for main assets to speed up online loading
        if (response.ok && (url.pathname.endsWith('.html') || url.pathname.endsWith('.css') || url.pathname.endsWith('.js'))) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Only fallback to index.html if it's a navigation request, 
        // but the React app will handle the "Offline" state.
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }
        // For data requests, just fail.
        return Promise.reject('Offline');
      })
  );
});
