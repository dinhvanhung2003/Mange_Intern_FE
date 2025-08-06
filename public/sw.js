self.addEventListener('install', () => {
  console.log('[SW] Installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activated');
  event.waitUntil(clients.claim());
});

self.addEventListener('push', function(event) {
  console.log('[SW] Push Received:', event);

  let data = {};
  try {
    data = event.data?.json() || {};
  } catch (err) {
    console.error('[SW] Push parse error:', err);
  }
  console.log('[SW] Push data:', data);
  const options = {
    body: data.body || 'Bạn có một nhiệm vụ mới!',
    icon: '/icons/task-icon.png',
    badge: '/icons/badge.png',
    data: {
      url: '/dashboard/interns/my-tasks'
    },
    requireInteraction: true 
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Task mới được giao', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

if (event.data?.type === 'UNSUBSCRIBE_PUSH') {
  console.log('[SW] Unsubscribing from push...');
  const subscription = await self.registration.pushManager.getSubscription();
  if (subscription) {
    const success = await subscription.unsubscribe();
    console.log('[SW] Unsubscribe result:', success);
    if (success) {
      console.log('[SW] Push subscription cancelled');
      await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
    }
  }
}


