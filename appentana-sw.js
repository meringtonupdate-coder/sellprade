/* Appentana notification worker.
   Mobile browsers (Chrome Android, iOS Safari) do not allow the page-level
   Notification constructor, so the client shows system notifications through
   this worker. The push handler below delivers server-sent messages while the
   site is closed. Keep the file next to appentana-cloud.html. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; }
  catch (e) { data = { body: event.data ? event.data.text() : '' }; }
  const title = String(data.title || 'Appentana').slice(0, 80);
  const body = String(data.body || '').slice(0, 300);
  const tag = String(data.tag || ('appentana-' + (data.id || Date.now())));
  event.waitUntil(self.registration.showNotification(title, {
    body,
    tag,
    renotify: false,
    data: { url: data.url || './' }
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || './';
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      try { if ('navigate' in client) await client.navigate(target); } catch (e) {}
      if ('focus' in client) {
        await client.focus();
        return;
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(target);
  })());
});

/* A browser may rotate the push endpoint. Re-subscribe and ask an open tab to
   save the new endpoint; closed tabs will save it on next login. */
self.addEventListener('pushsubscriptionchange', event => {
  event.waitUntil((async () => {
    try {
      const old = event.oldSubscription;
      const options = old && old.options ? old.options : { userVisibleOnly: true };
      const sub = await self.registration.pushManager.subscribe(options);
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of windows) client.postMessage({ type: 'push-subscription-change', subscription: sub.toJSON() });
    } catch (e) {}
  })());
});
