self.addEventListener('push', event => {
    if (!event.data) return;

    let data;
    try {
        data = event.data.json();
    } catch {
        data = { title: 'DiabeCare', body: event.data.text() };
    }

    const options = {
        body: data.body || '',
        icon: data.icon || '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        data: { url: data.url || '/' },
        actions: data.actions || []
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'DiabeCare', options)
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    const url = event.notification.data?.url || '/';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            for (const client of clientList) {
                if (client.url === url && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});