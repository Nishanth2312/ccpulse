/**
 * CCPulse Service Worker - Offline App Shell & Static Asset Caching
 * Complies with W3C Service Worker standards for Progressive Web Apps (PWA)
 * and Google Play Store Trusted Web Activity (TWA) requirements.
 */

const CACHE_NAME = 'ccpulse-pwa-cache-v3.0.0';

const PRECACHE_ASSETS = [
    './',
    './index.html',
    './css/styles.css',
    './manifest.json',
    './assets/icons/icon-192.png',
    './assets/icons/icon-512.png',
    './assets/icons/icon.svg',
    './assets/coins/btc.svg',
    './assets/coins/eth.svg',
    './assets/coins/xmr.svg',
    './assets/coins/bdx.png',
    './assets/coins/sol.svg',
    './assets/coins/usdt.svg',
    './assets/coins/bnb.svg',
    './assets/coins/xrp.svg',
    './assets/coins/doge.svg',
    './assets/coins/ada.svg',
    './assets/coins/avax.svg',
    './assets/coins/link.svg',
    './assets/coins/dot.svg',
    './assets/coins/trx.svg',
    './assets/coins/shib.svg',
    './assets/coins/pepe.svg',
    './assets/coins/sui.svg',
    './assets/coins/near.svg',
    './assets/coins/ltc.svg',
    './assets/coins/uni.svg',
    './assets/coins/generic.svg',
    './js/state.js',
    './js/clientDatabase.js',
    './js/api.js',
    './js/currency.js',
    './js/theme.js',
    './js/views/authModals.js',
    './js/views/dashboard.js',
    './js/views/markets.js',
    './js/views/cryptoDetail.js',
    './js/views/simulator.js',
    './js/views/swap.js',
    './js/views/portfolio.js',
    './js/views/learning.js',
    './js/views/simulationLab.js',
    './js/views/safetyCenter.js',
    './js/views/admin.js',
    './js/views/notifications.js',
    './js/views/support.js',
    './js/views/achievements.js',
    './js/views/dcaSimulator.js',
    './js/views/priceAlerts.js',
    './js/views/tradeJournal.js',
    './js/views/leaderboard.js',
    './js/views/fearGreed.js',
    './js/views/compliance.js',
    './js/app.js'
];

// Install Event - Pre-cache core shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS).catch((err) => {
                console.warn('Service Worker: Some static assets failed to pre-cache:', err);
            });
        }).then(() => self.skipWaiting())
    );
});

// Activate Event - Clean up stale caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) {
                        return caches.delete(name);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event - Stale-While-Revalidate for app assets, Network-First for external feeds
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    // Bypass non-GET requests
    if (request.method !== 'GET') return;

    // For external APIs or live data: Network-First with cache fallback
    if (url.origin !== self.location.origin) {
        event.respondWith(
            fetch(request).catch(() => caches.match(request))
        );
        return;
    }

    // For local static assets: Stale-While-Revalidate
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            const fetchPromise = fetch(request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => cachedResponse);

            return cachedResponse || fetchPromise;
        })
    );
});
