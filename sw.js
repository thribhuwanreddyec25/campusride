// CampusRide v2 — service worker
// Offline shell: precache core assets, network-first navigations,
// stale-while-revalidate for same-origin statics.
// Bump CACHE version on every deploy to invalidate old assets.

var CACHE = 'campusride-v3.1.3';

var CORE = [
  './',
  'index.html',
  'rides.html',
  'profile.html',
  'login.html',
  'otp.html',
  'set-password.html',
  'style.css',
  'firebase-init.js',
  'ui.js',
  'auth.js',
  'rides.js',
  'places.js',
  'theme.js',
  'manifest.webmanifest',
  'favicon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/maskable-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return Promise.all(CORE.map(function (url) {
        return cache.add(url).catch(function () { /* skip missing */ });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var url = new URL(req.url);
  if (url.origin !== location.origin) return;   // Firebase/fonts: network

  // Navigations: network-first, fall back to cache, then home shell
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () {
        return caches.match(req).then(function (hit) {
          return hit || caches.match('index.html');
        });
      })
    );
    return;
  }

  // Statics: stale-while-revalidate
  e.respondWith(
    caches.match(req).then(function (hit) {
      var refresh = fetch(req).then(function (res) {
        if (res && res.status === 200) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return hit; });
      return hit || refresh;
    })
  );
});
