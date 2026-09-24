// Проверяет PWA: все файлы сайта сохраняются для работы без интернета, иконки из манифеста на месте.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { OFFLINE_FILES } from '../app/js/offline-files.js';

const APP = fileURLToPath(new URL('../app/', import.meta.url));

// Сервис-воркер и его список браузер хранит сам; .md — описания, телефону не нужны.
const NOT_OFFLINE = ['sw.js', 'js/offline-files.js'];

async function siteFiles() {
  const entries = await readdir(APP, { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(APP, path.join(entry.parentPath, entry.name)).split(path.sep).join('/'))
    .filter((file) => !file.endsWith('.md') && !NOT_OFFLINE.includes(file))
    .sort();
}

test('для работы без интернета сохраняются все файлы сайта, и только они', async () => {
  assert.deepEqual([...OFFLINE_FILES].sort(), await siteFiles());
});

test('манифест: иконка «Журнал», картинки 192, 512 и маскируемая — на месте и нужного размера', async () => {
  const manifest = JSON.parse(await readFile(path.join(APP, 'manifest.webmanifest'), 'utf8'));
  assert.equal(manifest.short_name, 'Журнал');
  for (const icon of manifest.icons) {
    const png = await readFile(path.join(APP, icon.src));
    // Ширина и высота PNG записаны в байтах 16–23 файла.
    assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, icon.sizes, icon.src);
  }
  const sizes = manifest.icons.map((icon) => `${icon.sizes} ${icon.purpose ?? 'any'}`);
  assert.deepEqual(sizes.sort(), ['192x192 any', '512x512 any', '512x512 maskable']);
});
