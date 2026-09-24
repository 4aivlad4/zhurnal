// Проверяет номер версии: формат 0.<этап>.<номер> и дату ГГГГ-ММ-ДД (docs/code-rules.md, п. 7).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VERSION, VERSION_DATE } from '../app/js/version.js';

test('версия — в формате 0.<этап>.<номер>', () => {
  assert.match(VERSION, /^0\.\d+\.\d+$/);
});

test('дата версии — настоящая дата ГГГГ-ММ-ДД', () => {
  assert.match(VERSION_DATE, /^\d{4}-\d{2}-\d{2}$/);
  const date = new Date(`${VERSION_DATE}T00:00:00Z`);
  assert.ok(!Number.isNaN(date.getTime()), `нет такой даты: ${VERSION_DATE}`);
  assert.equal(date.toISOString().slice(0, 10), VERSION_DATE);
});
