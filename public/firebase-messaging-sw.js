importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCHjPoDI0YC0WC4gMcY8WmctNjWQFDpk3E",
  authDomain: "nexlify-e2a62.firebaseapp.com",
  projectId: "nexlify-e2a62",
  storageBucket: "nexlify-e2a62.firebasestorage.app",
  messagingSenderId: "606392385233",
  appId: "1:606392385233:web:66f4f68ce76cf0d3a60ff0",
  measurementId: "G-V2G3L6TGNW"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.data.title || 'Nexlify';
  const notificationOptions = {
    body: payload.data.body || '',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    image: payload.data.image && payload.data.image !== 'undefined' ? payload.data.image : '/default-notification-image.png',
    actions: [
      {
        action: 'open_app',
        title: 'Open Nexlify',
        icon: '/icon-192x192.png'
      },
    ],
    vibrate: [200, 100, 200],
    data: {
      url: payload.data && payload.data.url ? payload.data.url : '/',
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  let url = event.notification.data && event.notification.data.url ? event.notification.data.url : '/';
  if (event.action === 'open_app') {
    url = event.notification.data && event.notification.data.url ? event.notification.data.url : '/';
  }
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
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