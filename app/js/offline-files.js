// Файлы сайта, которые сервис-воркер (sw.js) хранит в телефоне, чтобы журнал открывался без интернета.
// Появился новый файл в app/ — добавить сюда; тест tests/pwa.test.js напомнит, если забыли.
export const OFFLINE_FILES = [
  'index.html',
  'manifest.webmanifest',
  'css/app.css',
  'js/main.js',
  'js/version.js',
  'js/config.js',
  'js/db-firebase.js',
  'js/ui/connection-check.js',
  'vendor/preact-htm.js',
  'vendor/firebase/firebase-app.js',
  'vendor/firebase/firebase-auth.js',
  'vendor/firebase/firebase-firestore.js',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
];
