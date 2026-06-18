/* global firebase */
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

const config = {
  apiKey: "AIzaSyCEbv5LomVtjBZeZzzVlls7NaccyAg-Bvg",
  authDomain: "flutter-chat-app-dc662.firebaseapp.com",
  projectId: "flutter-chat-app-dc662",
  storageBucket: "flutter-chat-app-dc662.firebasestorage.app",
  messagingSenderId: "920945271899",
  appId: "1:920945271899:web:82378b93d721ec39af0b7e",
  measurementId: "G-BPKBG116HD",
};

const hasConfig = Object.values(config).every(Boolean);

if (hasConfig) {
  firebase.initializeApp(config);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const data = payload.data || {};
    if (data.type !== "chat_message") return;

    const title = data.is_group === "true" && data.chat_name
      ? `${data.chat_name}: ${data.sender_name || "New message"}`
      : data.sender_name || "New message";

    self.registration.showNotification(title, {
      body: data.preview || "New message",
      icon: "/chat.png",
      tag: `chat_${data.chat_id}`,
      data,
    });
  });
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const targetUrl = `/chat?chatId=${encodeURIComponent(data.chat_id || "")}`;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.postMessage({
            type: "chat_notification_click",
            payload: data,
          });
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
      return null;
    })
  );
});

