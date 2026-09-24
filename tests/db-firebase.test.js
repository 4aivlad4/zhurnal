// Проверяет части db-firebase.js, которым не нужна сеть: логин ↔ почта и понятные сообщения об ошибках.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emailToLogin, humanError, loginToEmail } from '../app/js/db-firebase.js';

test('логин → почта: короткий логин получает @example.com, полная почта не меняется', () => {
  assert.equal(loginToEmail('mama'), 'mama@example.com');
  assert.equal(loginToEmail('  Papa '), 'papa@example.com');
  assert.equal(loginToEmail('Someone@Mail.ru'), 'someone@mail.ru');
});

test('почта → логин: @example.com убирается, другая почта остаётся целиком', () => {
  assert.equal(emailToLogin('doch@example.com'), 'doch');
  assert.equal(emailToLogin('someone@mail.ru'), 'someone@mail.ru');
  assert.equal(emailToLogin(''), '');
});

test('ошибки Firebase — понятными словами, код сохраняется', () => {
  const cases = {
    'auth/invalid-credential': 'Неверный пароль или логин.',
    'auth/too-many-requests': 'Слишком много попыток входа',
    'auth/network-request-failed': 'Нет связи с сервером входа',
    'auth/api-key-not-valid.-please-pass-a-valid-api-key.': 'Неверные настройки Firebase',
    'auth/requests-from-referer-http://localhost:8080-are-blocked.': 'Ключ Firebase не пускает',
    'permission-denied': 'база не пускает',
    unavailable: 'Нет связи с базой',
    timeout: 'Сервер не ответил за 15 секунд',
  };
  for (const [code, text] of Object.entries(cases)) {
    const error = humanError({ code, message: 'Firebase: Error' });
    assert.ok(error.message.includes(text), `${code}: «${error.message}»`);
    assert.equal(error.code, code);
  }
});

test('незнакомая ошибка показывается как есть — по ней видно, что случилось', () => {
  assert.equal(humanError({ code: 'internal', message: 'boom' }).message, 'Непонятная ошибка: boom');
  assert.equal(humanError(new Error('сломалось')).message, 'Непонятная ошибка: сломалось');
});
