// ===============================================
// Service Worker — حصن المسلم
// يضمن عمل التطبيق بدون إنترنت (Offline First)
// ===============================================
const CACHE_NAME = 'azkar-v1.0.0';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Tajawal:wght@300;400;500;700;900&display=swap'
];

// تثبيت السيرفس وركر وتخزين الملفات
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

// تنظيف الكاش القديم عند التحديث
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// استراتيجية: Cache First ثم الشبكة كاحتياط
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match('/index.html'));
    })
  );
});

// إشعارات الأذكار (يُفعَّل من التطبيق)
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  self.registration.showNotification(data.title || 'حصن المسلم', {
    body: data.body || 'حان وقت أذكارك 🌿',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    dir: 'rtl',
    lang: 'ar',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/index.html' }
  });
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
