self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// Focus a window and send a message
function sendWindowMessage(windowMessage) {
  return self.clients
    .matchAll({
      type: "window",
      includeUncontrolled: true,
    })
    .then((windowClients) => {
      if (windowClients.length) {
        if ("focus" in windowClients[0]) {
          return windowClients[0].focus();
        }
        windowClients[0].postMessage(windowMessage);
      }
    });
}

function getNotificationMessage(notif) {
  return JSON.stringify({
    type: notif.data.event_type,
    tag: notif.tag,
    timestamp: notif.timestamp || Date.now(),
  });
}

self.addEventListener("notificationclick", (event) => {
  console.log("SW", "notificationclick", event.action);

  // Android doesn't close the notification when you click on it
  // See: http://crbug.com/463146
  event.notification.close();

  let data = getNotificationMessage(event.notification);
  let windowMessage = {
    action: "serviceworker-notification",
    data: data,
  };

  // KaiOS 2.5
  if (clients && "openApp" in clients) {
    event.waitUntil(
      Promise.all([
        sendWindowMessage(windowMessage), // Focus existing window
        clients.openApp({ msg: data }), // Open app
      ])
    );
  }
});
