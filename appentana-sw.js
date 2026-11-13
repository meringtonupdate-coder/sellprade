/* Appentana notification worker.
   Mobile browsers (Chrome Android, iOS Safari) do not allow the page-level
   Notification constructor, so the client shows system notifications through
   this worker. Keep the file next to appentana-cloud.html.
   Real push with the site fully closed still needs a VAPID server sender. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if ('focus' in client) {
        await client.focus();
        return;
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow('./');
  })());
});
