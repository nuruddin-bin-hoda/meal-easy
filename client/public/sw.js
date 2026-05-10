self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('meal-easy-shell-v1').then((cache) =>
      cache.addAll(['/', '/index.html']),
    ),
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request)),
  );
});

self.addEventListener('push', (e) => {
  const data = e.data?.json() || {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'Meal Easy', {
      body: data.body || '',
      icon: '/icons/icon-192.png',
    }),
  );
});
