// Service Worker for offline functionality
const CACHE_NAME = 'cefr-reading-test-v2025-01-29-fix4';
const STATIC_CACHE = 'static-v2025-01-29-fix4';
const DYNAMIC_CACHE = 'dynamic-v2025-01-29-fix4';

// Files to cache for offline use
const STATIC_FILES = [
    '/',
    '/index.html',
    '/src/css/styles.css',
    '/src/js/app.js?v=2025-01-29-fix3',
    '/src/js/audioRecorder.js',
    '/src/js/apiClient.js',
    '/src/js/scoring.js',
    '/src/js/storage.js',
    '/src/js/cefrData.js',
    '/src/js/utils.js',
    '/src/js/adaptiveTesting.js?v=2025-01-29-fix3'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('Static files cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Failed to cache static files:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve cached files and handle network requests
self.addEventListener('fetch', (event) => {
    const { request } = event;
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip chrome extension requests
    if (request.url.startsWith('chrome-extension://')) {
        return;
    }
    
    // Skip cross-origin requests that we can't cache
    if (!request.url.startsWith(self.location.origin) && !request.url.includes('cefr-speech-backend')) {
        return;
    }
    
    // Handle API requests with network-first strategy
    if (request.url.includes('/transcribe') || request.url.includes('cefr-speech-backend')) {
        event.respondWith(networkFirstStrategy(request));
        return;
    }
    
    // Handle static files with cache-first strategy
    if (STATIC_FILES.some(file => request.url.endsWith(file))) {
        event.respondWith(cacheFirstStrategy(request));
        return;
    }
    
    // Handle other requests with stale-while-revalidate strategy
    event.respondWith(staleWhileRevalidateStrategy(request));
});

// Cache-first strategy for static files
async function cacheFirstStrategy(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Cache-first strategy failed:', error);
        
        // Return offline fallback for HTML requests
        if (request.headers.get('accept') && request.headers.get('accept').includes('text/html')) {
            return caches.match('/index.html');
        }
        
        throw error;
    }
}

// Network-first strategy for API requests
async function networkFirstStrategy(request) {
    try {
        const networkResponse = await fetch(request.clone(), {
            mode: 'cors',
            // Add timeout for API requests - use setTimeout instead of AbortSignal.timeout for compatibility
            signal: createTimeoutSignal(10000) // 10 seconds
        });
        
        // Cache successful API responses for offline fallback
        if (networkResponse.ok && request.method === 'POST') {
            const cache = await caches.open(DYNAMIC_CACHE);
            // Store a simplified offline response
            const offlineResponse = new Response(JSON.stringify({
                accuracy: 0.75,
                isOffline: true,
                message: 'Offline analysis - limited accuracy'
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
            cache.put(request.url + '_offline', offlineResponse);
        }
        
        return networkResponse;
    } catch (error) {
        console.log('Network request failed, trying cache:', error);
        
        // Try to get offline fallback for API requests
        const cachedResponse = await caches.match(request.url + '_offline');
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return mock response for transcription requests
        if (request.url.includes('/transcribe') || request.url.includes('/health')) {
            return new Response(JSON.stringify({
                accuracy: Math.random() * 0.3 + 0.6, // 60-90% random
                transcription: 'Offline analysis unavailable',
                isOffline: true,
                error: 'Network unavailable'
            }), {
                headers: { 'Content-Type': 'application/json' },
                status: 200
            });
        }
        
        throw error;
    }
}

// Create timeout signal for older browsers
function createTimeoutSignal(ms) {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
}

// Stale-while-revalidate strategy for other resources
async function staleWhileRevalidateStrategy(request) {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        const cachedResponse = await cache.match(request);
        
        // Fetch fresh version in background
        const fetchPromise = fetch(request)
            .then((networkResponse) => {
                if (networkResponse.ok && request.url.startsWith(self.location.origin)) {
                    cache.put(request, networkResponse.clone());
                }
                return networkResponse;
            })
            .catch((error) => {
                console.log('Background fetch failed:', error);
                return cachedResponse;
            });
        
        // Return cached version immediately if available
        return cachedResponse || fetchPromise;
    } catch (error) {
        console.log('Cache strategy failed:', error);
        return fetch(request);
    }
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'GET_VERSION':
            event.ports[0].postMessage({ version: CACHE_NAME });
            break;
            
        case 'CLEAR_CACHE':
            clearAllCaches()
                .then(() => event.ports[0].postMessage({ success: true }))
                .catch((error) => event.ports[0].postMessage({ success: false, error }));
            break;
            
        case 'CACHE_URLS':
            if (data && data.urls) {
                cacheUrls(data.urls)
                    .then(() => event.ports[0].postMessage({ success: true }))
                    .catch((error) => event.ports[0].postMessage({ success: false, error }));
            }
            break;
    }
});

// Clear all caches
async function clearAllCaches() {
    const cacheNames = await caches.keys();
    return Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
    );
}

// Cache specific URLs
async function cacheUrls(urls) {
    const cache = await caches.open(DYNAMIC_CACHE);
    return Promise.all(
        urls.map(async (url) => {
            try {
                const response = await fetch(url);
                if (response.ok) {
                    await cache.put(url, response);
                }
            } catch (error) {
                console.warn(`Failed to cache ${url}:`, error);
            }
        })
    );
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        event.waitUntil(handleBackgroundSync());
    }
});

async function handleBackgroundSync() {
    console.log('Background sync triggered');
    
    // Retry failed API requests stored in IndexedDB
    // This would be implemented based on your specific needs
    try {
        // Example: retry queued pronunciation analysis requests
        const failedRequests = await getFailedRequests();
        
        for (const request of failedRequests) {
            try {
                await fetch(request.url, request.options);
                await removeFailedRequest(request.id);
            } catch (error) {
                console.log('Retry failed for request:', request.id, error);
            }
        }
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

// Placeholder functions for IndexedDB operations
async function getFailedRequests() {
    // Implement IndexedDB retrieval of failed requests
    return [];
}

async function removeFailedRequest(id) {
    // Implement IndexedDB removal of successful retry
    return true;
}

// Error handling
self.addEventListener('error', (event) => {
    console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('Service Worker unhandled rejection:', event.reason);
    event.preventDefault(); // Prevent the default behavior
});

console.log('Service Worker script loaded');