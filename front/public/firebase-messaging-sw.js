/* global firebase, clients */
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
    console.log("[SW] Background message received payload: ", payload);
    
    const data = payload.data || {};
    const notification = payload.notification || {};
    
    // Set up the notification Title
    const title = data.is_group === "true" && data.chat_name
      ? `${data.chat_name}: ${data.sender_name || notification.title || "New message"}`
      : data.sender_name || notification.title || "New message";

    // --- DECRYPTION ENGINE ---
    let decryptedBody = data.preview || notification.body || "New message received";

    if (typeof decryptedBody === "string" && decryptedBody.startsWith("data:")) {
      try {
        const key = "chat";
        // Isolate the base64 encoded text block
        const encodedText = decryptedBody.split("data:")[1];
        // Decode base64 string natively inside the browser context
        const decodedText = atob(encodedText);
        let result = "";
        
        // Loop and decrypt using your exact XOR logic
        for (let i = 0; i < decodedText.length; i++) {
          result += String.fromCharCode(
            decodedText.charCodeAt(i) ^ key.charCodeAt(i % key.length)
          );
        }
        decryptedBody = result;
      } catch (error) {
        console.error("[SW] Decryption engine failure: ", error);
        decryptedBody = "🔒 Encrypted Message"; // Fallback text if format is invalid
      }
    }

    const notificationOptions = {
      body: decryptedBody, // Shows the clean text now
      icon: "/chat.png",
      tag: data.chat_id ? `chat_${data.chat_id}` : "chat_generic",
      renotify: true,
      data: data,
      actions: [
        {
          action: "reply",
          title: "Reply",
          type: "text",
          placeholder: "Type a reply...",
        }
      ]
    };

    return self.registration.showNotification(title, notificationOptions);
  });
} else {
  console.error("[SW] Firebase config is missing valid keys.");
}

// Background handler for clicking the notification or replying
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  
  // CRITICAL: Update this domain to point to your real backend server address
  const BACKEND_BASE_URL = "https://your-api-domain.com"; 
  const targetUrl = `/chat?chatId=${encodeURIComponent(data.chat_id || "")}`;

  // 1. Interactive Text Reply Action
  if (event.action === "reply" && event.reply) {
    const replyText = event.reply;
    console.log("[SW] User typed inline reply: ", replyText);

    event.waitUntil(
      fetch(`${BACKEND_BASE_URL}/api/devices/reply`, { 
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          chatId: data.chat_id,
          message: replyText,
        }),
      })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP Error Status: ${res.status}`);
        console.log("[SW] Background reply delivered successfully.");
      })
      .catch((err) => console.error("[SW] Notification reply sync failed:", err))
    );
    return;
  }

  // 2. Standard Click (User clicked the notification banner body)
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
