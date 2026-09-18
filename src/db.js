// src/db.js
// Работа с Cloud Firestore. Вся база строится вокруг коллекции `accounts`:
// каждый пользователь хранит свои данные в документе accounts/{uid}.
//
// Структура документа accounts/{uid}:
// {
//   email: string,
//   displayName: string|null,
//   createdAt: serverTimestamp,
//   updatedAt: serverTimestamp,
//   settings: { timeDisplayMode: 'clock'|'digits', timeHourFormat: '24'|'12', theme: 'light'|'dark'|'system' },
//   progress: {
//     best: { [mode]: {score, total} },
//     passed: { [mode]: {n: bool, t: bool} },       // n = обычный режим, t = на время
//     attempted: { [mode]: {n: bool, t: bool} },
//     slangGroupsCompleted: number
//   }
// }

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase.js';

export function defaultSettings() {
  return { timeDisplayMode: 'clock', timeHourFormat: '24', theme: 'system' };
}

export function defaultProgress() {
  return {
    best: {},
    passed: {},
    attempted: {},
    slangGroupsCompleted: 0
  };
}

/**
 * Создаёт документ accounts/{uid} при регистрации нового пользователя.
 * @param {string} uid
 * @param {{email: string, displayName?: string|null}} info
 */
export async function createAccountDoc(uid, info) {
  const ref = doc(db, 'accounts', uid);
  await setDoc(ref, {
    email: info.email || null,
    displayName: info.displayName || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    settings: defaultSettings(),
    progress: defaultProgress()
  });
}

/**
 * Загружает документ accounts/{uid}. Если документа нет (например, аккаунт
 * был создан не через registerUser), создаёт его с настройками по умолчанию.
 * @param {string} uid
 * @param {string} [email]
 * @returns {Promise<{settings: object, progress: object}>}
 */
export async function loadAccount(uid, email) {
  const ref = doc(db, 'accounts', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await createAccountDoc(uid, { email: email || null });
    return { settings: defaultSettings(), progress: defaultProgress() };
  }
  const data = snap.data();
  return {
    settings: { ...defaultSettings(), ...(data.settings || {}) },
    progress: { ...defaultProgress(), ...(data.progress || {}) }
  };
}

/**
 * Сохраняет прогресс (рекорды, статусы прохождения, прогресс по сленгу)
 * в accounts/{uid}. Каждый вызов перезаписывает поле progress целиком —
 * приложение всегда хранит полное актуальное состояние в памяти, поэтому
 * это безопасно и проще, чем частичные обновления по путям.
 * @param {string} uid
 * @param {object} progress
 */
export async function saveProgress(uid, progress) {
  const ref = doc(db, 'accounts', uid);
  await setDoc(ref, { progress, updatedAt: serverTimestamp() }, { merge: true });
}

/**
 * Сохраняет настройки пользователя (формат времени, тема оформления).
 * @param {string} uid
 * @param {object} settings
 */
export async function saveSettings(uid, settings) {
  const ref = doc(db, 'accounts', uid);
  await setDoc(ref, { settings, updatedAt: serverTimestamp() }, { merge: true });
}
