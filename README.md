# EasyEnglish — тренажёр английского с облачным прогрессом

Одностраничный тренажёр (притяжательные, национальности, время, порядковые
числительные, сленг) с авторизацией через Firebase Auth и хранением прогресса
в Cloud Firestore.

## Структура проекта

```
index.html          — разметка страницы (экраны квиза + формы входа/регистрации)
styles.css           — все стили приложения
src/firebase.js      — инициализация Firebase (ключи из import.meta.env)
src/auth.js          — регистрация / вход / выход / onAuthStateChanged
src/db.js            — чтение и запись accounts/{uid} в Firestore
src/app.js           — вся логика тренажёра + связка с auth/db
firestore.rules      — правила безопасности Firestore
.env.example         — какие переменные окружения нужны
vercel.json          — конфигурация сборки для Vercel
```

## 1. Настройка Firebase

1. Открой [Firebase Console](https://console.firebase.google.com/) → выбери
   свой проект (`kryptonixmoderation`, судя по конфигурации) или создай новый.
2. **Authentication** → Sign-in method → включи провайдер **Email/Password**.
3. **Firestore Database** → создай базу (если ещё не создана), режим
   Production.
4. **Firestore Database → Rules** → вставь содержимое `firestore.rules` из
   этого репозитория и опубликуй.
5. Project settings → General → в блоке "Your apps" найди свой веб-конфиг
   (apiKey, authDomain и т.д.) — эти значения понадобятся для `.env`.

## 2. Локальный запуск

```bash
npm install
cp .env.example .env
# отредактируй .env своими значениями из Firebase Console
npm run dev
```

Приложение поднимется на `http://localhost:5173`.

## 3. Заливка на GitHub

```bash
git init
git add .
git commit -m "Initial commit: EasyEnglish + Firebase Auth/Firestore"
git branch -M main
git remote add origin https://github.com/<твой-логин>/<репозиторий>.git
git push -u origin main
```

`.env` в git не попадёт — он в `.gitignore`. В репозитории останется только
`.env.example` как образец.

## 4. Деплой на Vercel

1. Зайди на [vercel.com](https://vercel.com) → **Add New… → Project** →
   импортируй только что запушенный GitHub-репозиторий.
2. Vercel сам определит фреймворк как Vite (Build Command `npm run build`,
   Output Directory `dist` — это же прописано в `vercel.json`).
3. В разделе **Environment Variables** добавь те же переменные, что и в
   `.env.example` (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN` и
   т.д.) для окружений Production, Preview и Development.
4. Нажми **Deploy**.

После первого деплоя добавь домен Vercel (например
`your-app.vercel.app`) в Firebase Console → Authentication → Settings →
**Authorized domains**, иначе вход/регистрация будут блокироваться Firebase
как запрос с неавторизованного домена.

## Как это работает

- **Гость (не вошёл в аккаунт).** Прогресс и настройки хранятся в
  `localStorage` браузера. Если localStorage недоступен (приватный режим,
  ограничения браузера), наверху показывается предупреждение.
- **Вошёл в аккаунт.** При входе `onAuthStateChanged` (в `src/app.js`)
  подтягивает документ `accounts/{uid}` из Firestore через `loadAccount()` —
  рекорды, статусы прохождения и настройки подставляются в интерфейс.
  Дальше при каждом изменении (новый рекорд, пройден раздел, смена настроек
  времени/темы) вызывается `saveProgress()` / `saveSettings()` из `src/db.js`,
  которые перезаписывают поля `progress` / `settings` в том же документе.
- **Регистрация.** `registerUser()` в `src/auth.js` создаёт пользователя в
  Firebase Auth и сразу создаёт документ `accounts/{uid}` с прогрессом по
  умолчанию (`createAccountDoc()` в `src/db.js`).
- Гостевой прогресс из localStorage сейчас не переносится автоматически в
  аккаунт при регистрации/входе — это осознанное упрощение. При желании
  можно добавить шаг "перенести прогресс" в `watchAuthState()`.

## Модель данных Firestore

```
accounts/{uid}
├─ email: string
├─ displayName: string | null
├─ createdAt / updatedAt: Timestamp
├─ settings: { timeDisplayMode: "clock"|"digits", timeHourFormat: "24"|"12", theme: "light"|"dark"|"system" }
└─ progress:
   ├─ best: { [mode]: { score, total } }
   ├─ passed: { [mode]: { n: bool, t: bool } }      // n = обычный режим, t = на время
   ├─ attempted: { [mode]: { n: bool, t: bool } }
   └─ slangGroupsCompleted: number
```

Правила `firestore.rules` разрешают чтение и запись только владельцу
документа (`request.auth.uid == userId`), включая любые вложенные
подколлекции под `accounts/{userId}`.
