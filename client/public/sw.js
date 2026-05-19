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
      data: data.data || {},
    }),
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = e.notification.data?.url || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    }),
  );
});
