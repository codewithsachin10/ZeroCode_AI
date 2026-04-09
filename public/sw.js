// Service Worker for Vibecode Academy PWA
// Handles offline support and caching strategies

const CACHE_VERSION = 'v1';
const CACHE_NAMES = {
  STATIC: `vibecode-static-${CACHE_VERSION}`,
  DYNAMIC: `vibecode-dynamic-${CACHE_VERSION}`,
  API: `vibecode-api-${CACHE_VERSION}`,
};

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAMES.STATIC).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.log('Failed to cache static assets:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !Object.values(CACHE_NAMES).includes(name))
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Network first for API calls
  if (url.pathname.includes('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Cache first for static assets
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Network first for everything else
  event.respondWith(networkFirstStrategy(request));
});

async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request);

    // Cache successful responses
    if (response.ok && request.method === 'GET') {
      const cache = await caches.open(CACHE_NAMES.DYNAMIC);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // Fall back to cache
    const cached = await caches.match(request);

    if (cached) {
      return cached;
    }

    // Return offline page if available
    if (request.destination === 'document') {
      return new Response('You are offline', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({
          'Content-Type': 'text/plain',
        }),
      });
    }

    throw error;
  }
}

async function cacheFirstStrategy(request) {
  const cached = await caches.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);

    if (response.ok) {
      const cache = await caches.open(CACHE_NAMES.STATIC);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // Return a fallback response
    return new Response('Asset not available offline', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

function isStaticAsset(pathname) {
  const staticExtensions = ['.js', '.css', '.img', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf'];
  return staticExtensions.some((ext) => pathname.endsWith(ext));
}

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data?.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAMES.DYNAMIC);
    caches.delete(CACHE_NAMES.API);
  }
});