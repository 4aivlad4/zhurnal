// Запуск приложения: рисует экран и включает работу без интернета.
// Пока здесь временный экран «Проверка связи» с базой (задача 0.2).
import { html, render } from '../vendor/preact-htm.js';
import { ConnectionCheck } from './ui/connection-check.js';

render(html`<${ConnectionCheck} />`, document.getElementById('app'));

// Сервис-воркер (sw.js) хранит файлы сайта в телефоне. Если браузер его не умеет,
// журнал всё равно работает — только без интернета не откроется.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('sw.js', { type: 'module', updateViaCache: 'none' })
    .catch((error) => console.warn('Работа без интернета не включилась:', error));
}
