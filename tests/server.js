// Простой локальный сервер для папки app/ — для смоук-проверки и `npm run serve`. Без зависимостей.
// Запуск: npm run serve → http://localhost:8080/ (порт можно сменить: PORT=3000 npm run serve).
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.md': 'text/plain; charset=utf-8',
};

// Отдаёт файлы из папки root. port 0 — любой свободный (его покажет server.address().port).
export function startServer(root, port = 0) {
  const base = path.resolve(root);
  const server = http.createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      let file = path.join(base, urlPath);
      if (urlPath.endsWith('/')) file = path.join(file, 'index.html');
      // Только файлы внутри root — ничего лишнего с диска.
      if (!file.startsWith(base + path.sep)) throw new Error('вне папки');
      const body = await readFile(file);
      const type = TYPES[path.extname(file)] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' }).end(body);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Не найдено');
    }
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
}

// Запущен напрямую (npm run serve) — отдаём app/.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL('../app/', import.meta.url));
  const server = await startServer(root, Number(process.env.PORT) || 8080);
  console.log(`Журнал: http://localhost:${server.address().port}/ (остановить — Ctrl+C)`);
}
