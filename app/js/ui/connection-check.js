// Временный экран «Проверка связи» (задача 0.2): войти и убедиться, что база Firebase отвечает.
// В задаче 1.1 его сменит настоящий экран входа.
import { html, useEffect, useState } from '../../vendor/preact-htm.js';
import { checkConnection, isConfigured, onUser, signIn, signOut } from '../db-firebase.js';
import { VERSION } from '../version.js';

const OTHER = 'other';
const PEOPLE = [
  { login: 'mama', name: 'Мама' },
  { login: 'papa', name: 'Папа' },
  { login: 'doch', name: 'Дочь' },
];
const BUTTONS = [...PEOPLE, { login: OTHER, name: 'Другой' }];
// Тип сети знает Chrome на Android (navigator.connection.type); на компьютере его обычно нет.
const NETWORKS = { wifi: 'Wi-Fi', cellular: 'мобильный интернет', ethernet: 'кабель' };

export function ConnectionCheck() {
  // undefined — ещё не известно, кто вошёл; null — никто.
  const [user, setUser] = useState(isConfigured() ? undefined : null);
  const [who, setWho] = useState(null);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => (isConfigured() ? onUser(setUser) : undefined), []);

  async function check(event) {
    event.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      if (!navigator.onLine) throw new Error('Нет интернета на этом устройстве.');
      const times = [];
      if (!user) {
        const start = performance.now();
        await signIn(who === OTHER ? login : who, password);
        times.push(measure('вход', performance.now() - start));
        setPassword('');
      }
      const { writeMs, readMs } = await checkConnection();
      times.push(measure('запись', writeMs), measure('чтение', readMs));
      const network = NETWORKS[navigator.connection?.type];
      setResult({ ok: true, lines: [times.join(' · '), network && `Сеть: ${network}`] });
    } catch (error) {
      setResult({ ok: false, lines: [error.message] });
    } finally {
      setBusy(false);
    }
  }

  async function switchUser() {
    setResult(null);
    setWho(null);
    await signOut();
  }

  return html`
    <main class="screen">
      <h1>Журнал центра</h1>
      <h2>Проверка связи с базой</h2>
      ${!isConfigured() && html`
        <p class="note">База ещё не подключена: ждём настройки Firebase от владельца.</p>`}
      ${user === undefined ? null : user ? html`
        <p>Вы вошли: <b>${nameOf(user)}</b></p>
        <form onSubmit=${check}>
          <button class="primary" type="submit" disabled=${busy}>Проверить</button>
        </form>
        <button class="plain" type="button" onClick=${switchUser} disabled=${busy}>
          Войти другим человеком
        </button>` : html`
        <form onSubmit=${check}>
          <p class="label" id="who">Кто вы?</p>
          <div class="people" role="group" aria-labelledby="who">
            ${BUTTONS.map((person) => html`
              <button type="button" class="choice" aria-pressed=${who === person.login}
                onClick=${() => setWho(person.login)}>${person.name}</button>`)}
          </div>
          ${who === OTHER && html`
            <label class="field">Логин
              <input value=${login} onInput=${(event) => setLogin(event.currentTarget.value)}
                autocomplete="username" autocapitalize="none" spellcheck="false" required />
            </label>`}
          ${who && html`
            <label class="field">Пароль
              <input type="password" value=${password}
                onInput=${(event) => setPassword(event.currentTarget.value)}
                autocomplete="current-password" required />
            </label>
            <button class="primary" type="submit" disabled=${busy || !isConfigured()}>Проверить</button>`}
        </form>`}
      ${busy && html`<p class="busy">Проверяю…</p>`}
      ${result && html`
        <div class=${result.ok ? 'result ok' : 'result error'} role="status">
          <p class="result-title">${result.ok ? 'Связь есть' : 'Не получилось'}</p>
          ${result.lines.filter(Boolean).map((line) => html`<p>${line}</p>`)}
        </div>`}
      <p class="version">Версия ${VERSION}</p>
    </main>
  `;
}

function nameOf(login) {
  return PEOPLE.find((person) => person.login === login)?.name ?? login;
}

// «запись», 412 мс → «запись 0,4 с»: до десятых секунды, без переноса строки внутри.
function measure(label, ms) {
  const value = Math.max(ms / 1000, 0.1);
  const text = value.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return `${label}\u00a0${text}\u00a0с`;
}
