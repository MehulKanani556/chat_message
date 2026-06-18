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

const vapidKey = process.env.REACT_APP_FIREBASE_VAPID_KEY;
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

  if ("serviceWorker" in navigator) {
    await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  }

  const messaging = await ensureMessaging();
  const fcmToken = await getToken(messaging, { vapidKey });
  if (!fcmToken) {
    throw new Error("No Firebase token returned");
  }

  await axiosInstance.post("/devices/register", {
    deviceId,
    platform: devicePlatform(),
    fcmToken,
    appVersion: process.env.REACT_APP_VERSION || "web",
  });

  registerForegroundListener(messaging);
  return fcmToken;
}

function registerForegroundListener(messaging) {
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

    new Notification(title, {
      body: data.preview || "New message",
      icon: "/chat.png",
      tag: `chat_${data.chat_id}`,
      data,
    });
  });
}

export default registerWebPushToken;
