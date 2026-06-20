import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import axiosInstance from "./axiosInstance";

const firebaseConfig = {
  apiKey: "AIzaSyCEbv5LomVtjBZeZzzVlls7NaccyAg-Bvg",
  authDomain: "flutter-chat-app-dc662.firebaseapp.com",
  projectId: "flutter-chat-app-dc662",
  storageBucket: "flutter-chat-app-dc662.firebasestorage.app",
  messagingSenderId: "920945271899",
  appId: "1:920945271899:web:82378b93d721ec39af0b7e",
  measurementId: "G-BPKBG116HD"
};

const vapidKey = "BDt18bgMqvUmuZHcphwqAOy6xqloRdFl-sFyvG8ODlk_dnziaOe_AIk7B4G-XZaoGXqFUeqLg3IhEmbWXYnaK60";
let foregroundListenerRegistered = false;

function hasFirebaseConfig() {
  return Object.values(firebaseConfig).every(Boolean) && Boolean(vapidKey);
}

async function ensureMessaging() {
  if (!hasFirebaseConfig()) {
    throw new Error("Firebase web push config is missing");
  }
  if (!(await isSupported())) {
    throw new Error("Firebase messaging is not supported in this browser");
  }
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  return getMessaging(app);
}

function devicePlatform() {
  if (window.electron) return "desktop";
  return "web";
}

export async function registerWebPushToken({ deviceId }) {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission was not granted");
  }

  let registration = null;
  if ("serviceWorker" in navigator) {
    // Explicitly scope the registration to ensure Firebase picks up your custom worker
    registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
      scope: "/"
    });
    console.log("Service Worker successfully registered with scope:", registration.scope);
  }

  const messaging = await ensureMessaging();
  
  // Pass the service worker registration explicitly to avoid hidden subscription errors
  const fcmToken = await getToken(messaging, { 
    vapidKey,
    serviceWorkerRegistration: registration 
  });
  
  if (!fcmToken) {
    throw new Error("No Firebase token returned");
  }

  console.log("FCM Registration Token Generated:", fcmToken);

  await axiosInstance.post("/devices/register", {
    deviceId,
    platform: devicePlatform(),
    fcmToken,
    appVersion: process.env.REACT_APP_VERSION || "web",
  });

  registerForegroundListener(messaging, registration);
  return fcmToken;
}

function registerForegroundListener(messaging, registration) {
  if (foregroundListenerRegistered) return;
  foregroundListenerRegistered = true;

  onMessage(messaging, (payload) => {
    const data = payload.data || {};
    if (data.type !== "chat_message" || document.visibilityState !== "hidden") {
      return;
    }

    const title = data.is_group === "true" && data.chat_name
      ? `${data.chat_name}: ${data.sender_name || "New message"}`
      : data.sender_name || "New message";

    const options = {
      body: data.preview || "New message",
      icon: "/chat.png",
      tag: `chat_${data.chat_id}`,
      renotify: true,
      data,
      actions: [
        {
          action: "reply",
          title: "Reply",
          type: "text",
          placeholder: "Type a reply...",
        }
      ]
    };

    // Use service worker registration to show interactive notifications even in foreground-hidden state
    if (registration) {
      registration.showNotification(title, options);
    } else {
      new Notification(title, options);
    }
  });
}

export default registerWebPushToken;
