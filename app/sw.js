// Сервис-воркер: хранит файлы сайта в телефоне, чтобы журнал открывался и без интернета.
// Новая версия (VERSION в js/version.js) скачивается в фоне и включается при следующем открытии.
import { VERSION } from './js/version.js';
import { OFFLINE_FILES } from './js/offline-files.js';

// На адресе 4aivlad4.github.io могут жить и другие сайты — трогаем только свои хранилища.
const PREFIX = 'zhurnal-';
const CACHE = PREFIX + VERSION;

self.addEventListener('install', (event) => {
  // cache: 'reload' — брать файлы с сервера, а не из памяти браузера:
  // иначе в новую версию могут попасть старые файлы.
  const requests = OFFLINE_FILES.map((file) => new Request(file, { cache: 'reload' }));
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(requests))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  // Прошлые версии больше не нужны — освобождаем место.
  event.waitUntil(
    caches.keys()
      .then((keys) => keys.filter((key) => key.startsWith(PREFIX) && key !== CACHE))
      .then((old) => Promise.all(old.map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Чужие адреса (позже — база данных) и запись идут мимо: с ними браузер работает сам.
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(fromCache(request));
});

// Сначала из телефона, иначе — из интернета. Страница всегда одна — index.html,
// с любыми параметрами в адресе (например, ?demo).
async function fromCache(request) {
  const cache = await caches.open(CACHE);
  const key = request.mode === 'navigate' ? 'index.html' : request;
  const cached = await cache.match(key, { ignoreSearch: true, ignoreVary: true });
  return cached || fetch(request);
}
