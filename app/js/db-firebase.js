// Работа с базой Firebase: вход и данные. ЕДИНСТВЕННОЕ место, где используется Firebase:
// если его придётся заменить (например, станет недоступен из России), меняется только этот файл.
import { initializeApp } from '../vendor/firebase/firebase-app.js';
import {
  browserLocalPersistence,
  indexedDBLocalPersistence,
  initializeAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from '../vendor/firebase/firebase-auth.js';
import {
  doc,
  getDocFromServer,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  serverTimestamp,
  setDoc,
} from '../vendor/firebase/firebase-firestore.js';
import { firebaseConfig } from './config.js';

// Почты для входа выдуманные, письма на них не приходят: «mama» → mama@example.com.
const LOGIN_DOMAIN = '@example.com';
// Дольше не ждём: человеку нужен понятный ответ, а не бесконечное «Проверяю…».
const TIMEOUT_MS = 15000;

let auth = null;
let db = null;

// Вписаны ли настройки Firebase в config.js.
export function isConfigured() {
  return Boolean(firebaseConfig);
}

// Подключение к Firebase — один раз, при первом обращении.
function connect() {
  if (db) return;
  if (!isConfigured()) throw new Error('База ещё не подключена: нет настроек Firebase.');
  const app = initializeApp(firebaseConfig);
  // Только логин и пароль, без окон входа через Google — они тянут лишнее с серверов Google.
  // Вход запоминается на устройстве.
  auth = initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence] });
  // Копия данных в устройстве: журнал работает без интернета, изменения уходят, когда связь появится.
  // Несколько открытых вкладок с журналом не мешают друг другу.
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
}

// «mama» → mama@example.com; полная почта остаётся как есть.
export function loginToEmail(login) {
  const clean = login.trim().toLowerCase();
  return clean.includes('@') ? clean : clean + LOGIN_DOMAIN;
}

// mama@example.com → «mama»; почта с другим доменом остаётся целиком.
export function emailToLogin(email) {
  return email.endsWith(LOGIN_DOMAIN) ? email.slice(0, -LOGIN_DOMAIN.length) : email;
}

// Следить, кто вошёл на этом устройстве: callback(логин) или callback(null).
// Возвращает функцию «перестать следить».
export function onUser(callback) {
  connect();
  return onAuthStateChanged(auth, (user) => callback(user ? emailToLogin(user.email ?? '') : null));
}

export async function signIn(login, password) {
  connect();
  try {
    await withTimeout(signInWithEmailAndPassword(auth, loginToEmail(login), password));
  } catch (error) {
    throw humanError(error);
  }
}

export async function signOut() {
  connect();
  await firebaseSignOut(auth);
}

// Проверка связи: записать служебный документ meta/ping и прочитать его с сервера, а не из копии
// в устройстве. Возвращает, сколько миллисекунд заняли запись и чтение.
export async function checkConnection() {
  connect();
  const ref = doc(db, 'meta', 'ping');
  const by = emailToLogin(auth.currentUser?.email ?? '');
  try {
    let start = performance.now();
    // Запись считается сделанной, когда её подтвердил сервер.
    await withTimeout(setDoc(ref, { by, at: serverTimestamp() }));
    const writeMs = performance.now() - start;
    start = performance.now();
    await withTimeout(getDocFromServer(ref));
    const readMs = performance.now() - start;
    return { writeMs, readMs };
  } catch (error) {
    throw humanError(error);
  }
}

function withTimeout(promise) {
  let timer;
  const timeout = new Promise((resolve, reject) => {
    timer = setTimeout(() => reject(Object.assign(new Error('timeout'), { code: 'timeout' })), TIMEOUT_MS);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

const WRONG_PASSWORD = 'Неверный пароль или логин.';
const MESSAGES = {
  'auth/invalid-credential': WRONG_PASSWORD,
  'auth/invalid-login-credentials': WRONG_PASSWORD,
  'auth/wrong-password': WRONG_PASSWORD,
  'auth/user-not-found': WRONG_PASSWORD,
  'auth/invalid-email': 'Логин записан неправильно.',
  'auth/missing-password': 'Введите пароль.',
  'auth/too-many-requests': 'Слишком много попыток входа. Подождите 10–15 минут и попробуйте снова.',
  'auth/user-disabled': 'Этот вход отключён — спросите владельца.',
  'auth/network-request-failed': 'Нет связи с сервером входа. Проверьте интернет.',
  'auth/operation-not-allowed': 'В Firebase не включён вход по паролю (карточка 0.2, шаг 3).',
  'auth/invalid-api-key': 'Неверные настройки Firebase (config.js).',
  'permission-denied': 'Вход есть, но база не пускает: правила доступа не опубликованы или этого входа в них нет.',
  unauthenticated: 'Вход устарел — выйдите и войдите снова.',
  unavailable: 'Нет связи с базой. Проверьте интернет.',
  'not-found': 'В проекте Firebase не создана база Firestore (карточка 0.2, шаг 2).',
  timeout: `Сервер не ответил за ${TIMEOUT_MS / 1000} секунд: интернет слишком медленный или сервер недоступен.`,
};

// Ошибку Firebase — в понятные слова. Незнакомая ошибка показывается как есть: по ней Claude поймёт,
// что случилось.
export function humanError(error) {
  const code = String(error?.code ?? '');
  let text = MESSAGES[code];
  if (!text && code.startsWith('auth/api-key-not-valid')) text = MESSAGES['auth/invalid-api-key'];
  if (!text && code.startsWith('auth/requests-from-referer')) {
    text = 'Ключ Firebase не пускает этот адрес сайта (карточка 0.2, шаг 6).';
  }
  const result = new Error(text ?? `Непонятная ошибка: ${error?.message ?? error}`);
  result.code = code;
  return result;
}
