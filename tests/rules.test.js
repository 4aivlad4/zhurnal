// Проверяет правила доступа firebase/firestore.rules: база открыта только своим, по списку UID.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const rules = await readFile(new URL('../firebase/firestore.rules', import.meta.url), 'utf8');

test('каждое разрешение — только через isFamily()', () => {
  const allows = rules.match(/^\s*allow .*$/gm) ?? [];
  assert.ok(allows.length > 0, 'нет ни одного allow');
  for (const line of allows) assert.match(line, /:\s*if isFamily\(\);\s*$/, line.trim());
});

test('isFamily() требует вход и UID из списка', () => {
  const body = rules.match(/function isFamily\(\) \{([\s\S]*?)\n    \}/)?.[1] ?? '';
  assert.match(body, /request\.auth != null/);
  const uids = body.match(/'([^']*)'/g) ?? [];
  assert.ok(uids.length > 0, 'список UID пуст');
  for (const uid of uids) assert.match(uid, /^'[A-Za-z0-9_]+'$/, `странный UID ${uid}`);
});
