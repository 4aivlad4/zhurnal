// Смоук-проверка в настоящем браузере (Playwright, экран телефона 390×844): журнал открывается
// без ошибок в консоли, открывается без интернета, новая версия видна со второго открытия.
// Скриншот — в screenshots/ (в git не попадает). Запуск: npm run smoke.
import { chromium } from 'playwright';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from './server.js';
import { VERSION } from '../app/js/version.js';

const SCREENSHOTS = fileURLToPath(new URL('../screenshots/', import.meta.url));
const errors = [];

// Копия сайта во временной папке: в ней «выпускаем» новую версию, не трогая app/.
const tmp = await mkdtemp(path.join(tmpdir(), 'zhurnal-smoke-'));
const root = path.join(tmp, 'app');
await cp(fileURLToPath(new URL('../app/', import.meta.url)), root, { recursive: true });
let server = await startServer(root);
const port = server.address().port;
const url = `http://127.0.0.1:${port}/`;
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  locale: 'ru-RU',
});

try {
  // 1. Первое открытие: заголовок и версия; файлы сохраняются в «телефоне».
  let page = await open();
  await expectText(page, '.version', `Версия ${VERSION}`);
  await mkdir(SCREENSHOTS, { recursive: true });
  await page.screenshot({ path: path.join(SCREENSHOTS, 'start.png') });
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));

  // 2. Без интернета журнал всё равно открывается. Сервер выключаем совсем:
  // режим «офлайн» в Playwright не действует на запросы сервис-воркера.
  stop(server);
  await page.reload();
  await expectText(page, 'h1', 'Журнал центра');
  server = await startServer(root, port);

  // 3. Выпуск новой версии: при первом открытии она скачивается в фоне, со второго — видна.
  const next = `${VERSION}-smoke`;
  const versionFile = path.join(root, 'js/version.js');
  const source = await readFile(versionFile, 'utf8');
  await writeFile(versionFile, source.replace(`'${VERSION}'`, `'${next}'`));
  await page.close();
  page = await open();
  await expectText(page, '.version', `Версия ${VERSION}`);
  await waitFor('новая версия скачалась', async () => {
    const keys = await page.evaluate(() => caches.keys());
    return keys.includes(`zhurnal-${next}`) && !keys.includes(`zhurnal-${VERSION}`);
  });
  await page.close();
  page = await open();
  await expectText(page, '.version', `Версия ${next}`);
} catch (error) {
  errors.push(error.message);
} finally {
  await browser.close();
  stop(server);
  await rm(tmp, { recursive: true, force: true });
}

if (errors.length > 0) {
  console.error(`Смоук: ПРОВАЛ\n${errors.map((error) => ` - ${error}`).join('\n')}`);
  process.exit(1);
}
console.log(`Смоук: всё в порядке (версия ${VERSION}). Скриншот: screenshots/start.png`);

// Открыть журнал в новой вкладке; ошибки из консоли — в общий список.
async function open() {
  const page = await context.newPage();
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`консоль: ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`ошибка на странице: ${error.message}`));
  await page.goto(url);
  await expectText(page, 'h1', 'Журнал центра');
  return page;
}

function stop(httpServer) {
  httpServer.close();
  httpServer.closeAllConnections();
}

async function expectText(page, selector, expected) {
  const actual = (await page.locator(selector).textContent({ timeout: 5000 }))?.trim();
  if (actual !== expected) throw new Error(`${selector}: ждали «${expected}», на экране «${actual}»`);
}

async function waitFor(what, check, timeout = 15000) {
  for (const start = Date.now(); Date.now() - start < timeout; ) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`не дождались: ${what}`);
}
