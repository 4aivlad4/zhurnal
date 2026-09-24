# Сторонние библиотеки

Лежат в репозитории, чтобы сайт работал без интернета и не зависел от чужих серверов (CDN).
Новые библиотеки — только с согласия владельца.

| Файл | Что это | Версия | Источник |
|---|---|---|---|
| `preact-htm.js` | Preact (рисует экраны) + хуки + htm (разметка в шаблонах) — одним файлом | htm 3.1.1, внутри Preact 10 | npm-пакет [`htm@3.1.1`](https://www.npmjs.com/package/htm), файл `preact/standalone.module.js` без изменений |
| `firebase/firebase-app.js` | Firebase: основа | 12.19.0 | npm-пакет [`firebase@12.19.0`](https://www.npmjs.com/package/firebase), файл из корня пакета без изменений |
| `firebase/firebase-auth.js` | Firebase: вход | 12.19.0 | там же; ссылка импорта на `firebase-app.js` — относительная (`./`) |
| `firebase/firebase-firestore.js` | Firebase: база Firestore | 12.19.0 | там же; ссылка импорта на `firebase-app.js` — относительная (`./`) |

Файлы Firebase из npm-пакета совпадают с файлами на сервере Firebase
(`https://www.gstatic.com/firebasejs/12.19.0/…`). Там `firebase-auth.js` и `firebase-firestore.js`
берут основу по полному адресу этого сервера; у нас — соседний файл, чтобы всё работало без интернета.
Больше изменений нет.

SHA-256:
- `preact-htm.js`: `72284e8e9079c87817145df1110f74e8a2aa040b2fc384922e18dfcb46fc1fd7`
- `firebase/firebase-app.js`: `39a50952b5def557337b2290069c7d7371f3515ad46c44a43b9c520f734d8d14`
- `firebase/firebase-auth.js`: `0f99fc82c189cc62a37ef58558bbe91a54b83d47a8592b03144e3dc15c678b5c`
- `firebase/firebase-firestore.js`: `99eba6da29790362cbdb78b2fb69cd1c3d109ebbbc7260157a522cc89a2df7ba`

Обновить Preact + htm: `npm pack htm@<версия>`, из архива взять `package/preact/standalone.module.js`,
положить сюда под тем же именем, обновить таблицу и SHA-256.

Обновить Firebase: `npm pack firebase@<версия>`, из архива взять `package/firebase-app.js`,
`firebase-auth.js`, `firebase-firestore.js`; в двух последних заменить
`https://www.gstatic.com/firebasejs/<версия>/firebase-app.js` на `./firebase-app.js`
(тест `tests/vendor.test.js` проверит, что чужих адресов в импортах не осталось);
обновить таблицу и SHA-256.
