// src/auth.js
// Логика Firebase Auth: регистрация, вход, выход, отслеживание состояния.

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth } from './firebase.js';
import { createAccountDoc } from './db.js';

/**
 * Регистрирует нового пользователя по email/паролю и создаёт для него
 * документ accounts/{uid} в Firestore с прогрессом по умолчанию.
 * @param {string} email
 * @param {string} password
 * @param {string} [displayName]
 * @returns {Promise<import('firebase/auth').User>}
 */
export async function registerUser(email, password, displayName) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    try {
      await updateProfile(cred.user, { displayName });
    } catch (e) {
      console.warn('Не удалось задать displayName:', e);
    }
  }
  await createAccountDoc(cred.user.uid, {
    email: cred.user.email,
    displayName: displayName || null
  });
  return cred.user;
}

/**
 * Входит существующим пользователем по email/паролю.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import('firebase/auth').User>}
 */
export async function loginUser(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

/**
 * Выходит из текущей учётной записи.
 */
export function logoutUser() {
  return signOut(auth);
}

/**
 * Подписывается на изменение состояния авторизации.
 * @param {(user: import('firebase/auth').User|null) => void} callback
 * @returns {() => void} функция отписки
 */
export function watchAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Переводит коды ошибок Firebase Auth в понятные русскоязычные сообщения.
 * @param {any} error
 * @returns {string}
 */
export function friendlyAuthError(error) {
  const code = error && error.code ? error.code : '';
  const map = {
    'auth/email-already-in-use': 'Этот email уже зарегистрирован. Попробуй войти.',
    'auth/invalid-email': 'Некорректный email.',
    'auth/weak-password': 'Пароль слишком простой — нужно минимум 6 символов.',
    'auth/user-not-found': 'Пользователь с таким email не найден.',
    'auth/wrong-password': 'Неверный пароль.',
    'auth/invalid-credential': 'Неверный email или пароль.',
    'auth/too-many-requests': 'Слишком много попыток. Подожди немного и попробуй снова.',
    'auth/network-request-failed': 'Проблема с сетью. Проверь подключение к интернету.'
  };
  return map[code] || (error && error.message) || 'Что-то пошло не так. Попробуй ещё раз.';
}
