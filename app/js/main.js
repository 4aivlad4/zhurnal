// Запуск приложения: рисует экран и включает работу без интернета.
// Пока это заглушка — проверка, что Preact работает и сайт ставится иконкой.
import { html, render } from '../vendor/preact-htm.js';
import { VERSION } from './version.js';

function StartScreen() {
  return html`
    <main class="start">
      <h1>Журнал центра</h1>
      <p>Скоро здесь будет журнал записи.</p>
      <p class="version">Версия ${VERSION}</p>
    </main>
  `;
}

render(html`<${StartScreen} />`, document.getElementById('app'));

// Сервис-воркер (sw.js) хранит файлы сайта в телефоне. Если браузер его не умеет,
// журнал всё равно работает — только без интернета не откроется.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('sw.js', { type: 'module', updateViaCache: 'none' })
    .catch((error) => console.warn('Работа без интернета не включилась:', error));
}
