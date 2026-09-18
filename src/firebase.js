// src/firebase.js
// Инициализация Firebase через npm-пакет "firebase" (ES-модули), ключи берутся
// из переменных окружения Vite (import.meta.env), которые задаются в .env
// локально и в Environment Variables на Vercel.

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics работает только в браузере и только если measurementId задан —
// подключаем его лениво и не роняем приложение, если он недоступен
// (например, в SSR или при заблокированных трекерах).
export async function initAnalyticsIfAvailable() {
  try {
    if (!firebaseConfig.measurementId) return null;
    const { getAnalytics, isSupported } = await import('firebase/analytics');
    const supported = await isSupported();
    if (!supported) return null;
    return getAnalytics(app);
  } catch (e) {
    console.warn('Firebase Analytics не инициализирован:', e);
    return null;
  }
}
