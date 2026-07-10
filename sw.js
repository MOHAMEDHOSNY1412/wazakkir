// ===============================================
// Service Worker — وَذَكِّر
// Network-First لصفحة التطبيق (لضمان وصول آخر تحديث فورًا)
// Cache-First للأيقونات والخطوط (أداء أسرع + عمل بدون إنترنت)
// ===============================================
const CACHE_NAME = 'wazakkir-v1.2.0';
const STATIC_ASSETS = [
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/favicon.png',
  'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Tajawal:wght@300;400;500;700;900&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS).catch(()=>{}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Allow page to force-activate a waiting worker immediately
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = event.request.url;
  const isHTML = event.request.mode === 'navigate' || url.endsWith('.html') || url.endsWith('/');
  const isManifest = url.endsWith('manifest.json');

  if (isHTML || isManifest) {
    // Network-first: always try to get the freshest version first
    event.respondWith(
      fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match(event.request).then(c => c || caches.match('index.html')))
    );
    return;
  }

  // Cache-first for static assets (icons, fonts, etc.)
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
    })
  );
});

// إشعارات الأذكار (يُفعَّل من التطبيق)
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  self.registration.showNotification(data.title || 'وَذَكِّر', {
    body: data.body || 'حان وقت أذكارك 🌿',
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-72.png',
    dir: 'rtl',
    lang: 'ar',
    vibrate: [200, 100, 200],
    data: { url: data.url || 'index.html' }
  });
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
