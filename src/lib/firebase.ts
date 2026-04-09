import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const getEnv = (key: string) => {
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key];
  }
  // @ts-ignore
  try {
     return import.meta.env[key];
  } catch (e) {
     return "";
  }
};

const firebaseConfig = {
  apiKey: getEnv("VITE_FIREBASE_API_KEY") || "dummy-api-key",
  authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN") || "dummy-auth-domain",
  projectId: getEnv("VITE_FIREBASE_PROJECT_ID") || "dummy-project-id",
  storageBucket: getEnv("VITE_FIREBASE_STORAGE_BUCKET") || "dummy-storage-bucket",
  messagingSenderId: getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID") || "dummy-messaging-sender-id",
  appId: getEnv("VITE_FIREBASE_APP_ID") || "dummy-app-id",
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
