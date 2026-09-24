// Проверяет, что код сайта не тянет файлы с чужих серверов (CDN): иначе без интернета журнал не откроется.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = fileURLToPath(new URL('../app/', import.meta.url));

// import … from "https://…", import "https://…", import("https://…"), export … from "https://…"
const REMOTE_IMPORT = /(?:\bfrom|\bimport)\s*\(?\s*["'](?:https?:)?\/\//;

test('все импорты в app/ — свои файлы, без адресов в интернете', async () => {
  const entries = await readdir(APP, { recursive: true, withFileTypes: true });
  const scripts = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.js'));
  assert.ok(scripts.length > 0);
  for (const entry of scripts) {
    const file = path.join(entry.parentPath, entry.name);
    const source = await readFile(file, 'utf8');
    assert.doesNotMatch(source, REMOTE_IMPORT, path.relative(APP, file));
  }
});

test('файлы Firebase берут основу из соседнего файла', async () => {
  for (const name of ['firebase-auth.js', 'firebase-firestore.js']) {
    const source = await readFile(path.join(APP, 'vendor/firebase', name), 'utf8');
    assert.match(source, /from\s*"\.\/firebase-app\.js"/, name);
  }
});
