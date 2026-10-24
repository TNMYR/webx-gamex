# Лабораторная работа №2. Интерактивный Frontend и State-Driven SPA

**Студент:** Абдулхакимов Тимур  
**Группа:** ИВТ-ИСУ-302Б  
**Дисциплина:** Web-программирование  
**Тема проекта:** Gamex — каталог видеоигр с аудио-библиотекой  
**Репозиторий:** <https://github.com/<твой-username>/web-project>

---

## 1. Цель работы

Превратить статический HTML/CSS-макет из Лабораторной №1 в **динамическое
интерактивное приложение (SPA)** с архитектурой **State-Driven UI**
(`UI = render(State)`).

В ходе работы требовалось продемонстрировать:

1. Работу с DOM-деревом (поиск, создание, изменение, удаление элементов).
2. Обработку событий и **делегирование** (`Event Delegation`).
3. Клиентскую валидацию форм через **Constraint Validation API**.
4. Управление состоянием в архитектуре **State-Driven UI**.
5. Постоянство данных через **Web Storage API (`localStorage`)**.

---

## 2. Что было в Лабораторной №1 и что добавилось

### Было (Лаб1)

- Статические `index.html` и 4 страницы в `pages/`.
- Карточки игр с обложками-SVG.
- Сетка `.games-grid` на CSS Grid, навигация на Flexbox.
- Адаптив 360 / 768 / 1280 px.
- Никакого JavaScript, поиск и фильтры — заглушки.

### Стало (Лаб2)

| Область | Изменение |
|---|---|
| **Тема** | Светлая → тёмная (Newgrounds-style), переменные в `:root` |
| **Структура** | `index.html` стал **лендингом** (сводка о сайте), каталог игр переехал в `pages/Game.html` |
| **Навигация** | Из любой страницы есть переход на «Главную» (`../index.html`) |
| **Audio** | Стал **полноценным SPA-каталогом** треков: поиск, фильтр, сортировка, модалка, удаление, `localStorage` |
| **Game** | Поиск перенесён в тулбар над сеткой (менее навязчиво), тёмная тема |
| **JS** | Появился `js/audio.js` — вся интерактивная логика Audio |
| **CSS** | `main.css` переписан под тёмную палитру, `audio.css` — стили каталога треков |

---

## 3. Архитектура State-Driven UI

### 3.1. Единый объект состояния

```javascript
const state = {
  items: [],                 // массив треков
  searchQuery: '',           // строка поиска
  selectedCategory: 'all',   // выбранный фильтр
  sortBy: 'name-asc',        // режим сортировки
};
```

**Правило:** DOM — не источник правды. Источник — `state`.
Любое действие пользователя **меняет `state`** и вызывает `render()`.

### 3.2. Функция `render()` — единственный путь к DOM

```javascript
function render() {
  const visible = getVisibleItems();   // читает state, возвращает отфильтрованное
  grid.innerHTML = '';                 // очистка
  const frag = document.createDocumentFragment();
  visible.forEach(item => frag.append(buildCard(item)));
  grid.append(frag);                   // одна вставка — один reflow
  emptyState.hidden = visible.length !== 0;
  counter.textContent = `Показано ${visible.length} из ${state.items.length}`;
}
```

**Схема потока данных:**

```
Пользователь кликнул / ввёл текст
        │
        ▼
Обработчик события
        │
        ▼
Меняет state (иммутабельно)
        │
        ▼
render() читает state
        │
        ▼
DOM перестраивается из шаблона
        │
        ▼
Пользователь видит новое состояние
```

---

## 4. Реализация 8 обязательных фич

### 4.1. Динамический поиск (3.1)

**Где:** `audio.js`, `searchInput.addEventListener('input', ...)`.

```javascript
searchInput.addEventListener('input', (e) => {
  state.searchQuery = e.target.value;
  render();
});
```

**Механизм:**
- Событие `input` срабатывает **на каждый символ**.
- В `getVisibleItems()` применяется `.toLowerCase()` и `.trim()` —
  регистр и пробелы не важны.
- Поиск идёт по `title` и `artist`.

**Проверка:** ввести `neon` → остаётся 1 карточка.

---

### 4.2. Фильтрация (3.2)

**Где:** `categorySel.addEventListener('change', ...)` + опция `value="all"`.

```javascript
if (state.selectedCategory !== 'all') {
  result = result.filter(item => item.category === state.selectedCategory);
}
```

**Категории:** Музыка, Эффекты, Инструменты, Лицензия, Сэмплы.
**Сброс:** пункт «Все жанры» (`value="all"`).

**Проверка:** выбрать «Эффекты» → остаются только эффекты.

---

### 4.3. Сортировка (3.3)

**Где:** `sortSel.addEventListener('change', ...)` + объект-таблица `sorters`.

```javascript
const sorters = {
  'name-asc':      (a, b) => a.title.localeCompare(b.title, 'ru'),
  'name-desc':     (a, b) => b.title.localeCompare(a.title, 'ru'),
  'bpm-asc':       (a, b) => a.bpm - b.bpm,
  'bpm-desc':      (a, b) => b.bpm - a.bpm,
  'duration-asc':  (a, b) => a.duration - b.duration,
  'duration-desc': (a, b) => b.duration - a.duration,
};
result.sort(sorters[state.sortBy] || sorters['name-asc']);
```

**Иммутабельность:** в `getVisibleItems()` сначала `let result = [...state.items]`,
потом `.filter()` (возвращает новый массив) и `.sort()` на **копии**.

**Почему `.localeCompare(x, 'ru')`:** обычное `<` неправильно сортирует
русские буквы (ё, регистр). `localeCompare` учитывает язык.

**6 режимов:** имя ↑/↓, BPM ↑/↓, длительность ↑/↓.

---

### 4.4. Модальное окно (3.4)

**Где:** `openModal()`, `closeModal()`, слушатели на `openModalBtn`,
`modalClose`, `modalCancel`, `document.keydown`, `modal.click`.

```javascript
function openModal() {
  modal.hidden = false;
  form.reset();
  clearErrors();
  document.getElementById('f-title').focus();
}

function closeModal() {
  modal.hidden = true;
}

// закрытие по подложке
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

// закрытие по Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modal.hidden) closeModal();
});
```

**4 способа закрытия:**

1. Кнопка `×` (`modalClose`).
2. Кнопка «Отмена» (`modalCancel`).
3. Клавиша `Escape` (на `document`, работает даже если фокус вне модалки).
4. Клик по подложке (`e.target === modal` — именно по фону, не по форме).

**Особенность:** `.hidden` + CSS `.modal-backdrop[hidden] { display: none; }`
— булев атрибут, проще, чем `style.display`.

---

### 4.5. Валидация формы (3.5)

**HTML5-атрибуты:**

```html
<input type="text" id="f-title" required minlength="2" maxlength="60">
<input type="number" id="f-bpm" required min="40" max="300" step="1">
<select id="f-category" required>...</select>
```

**Перехват submit:**

```javascript
form.addEventListener('submit', (e) => {
  e.preventDefault();   // ⚠️ без этого страница перезагрузится
  clearErrors();
  // ...
});
```

**Проверка через `Constraint Validation API`:**

```javascript
function validateField(input) {
  if (input.validity.valid) return true;

  if (input.validity.valueMissing)      showError(input, 'Заполни это поле');
  else if (input.validity.tooShort)     showError(input, `Минимум ${input.minLength} символов`);
  else if (input.validity.rangeUnderflow) showError(input, `Минимум ${input.min}`);
  else if (input.validity.rangeOverflow)  showError(input, `Максимум ${input.max}`);
  else if (input.validity.badInput)     showError(input, 'Введи число');
  else                                   showError(input, 'Некорректное значение');

  return false;
}
```

**Сообщения под полями:** у каждого `<input>` есть `<p class="error"
data-error-for="f-title"></p>`. `showError` находит его по `data-error-for`
и пишет `.textContent`.

**Фокус на первое невалидное поле:** `firstInvalid.focus()` — пользователь
сразу видит, что не так.

---

### 4.6. Удаление через делегирование (3.6)

**Один слушатель на контейнер `#tracks-grid`:**

```javascript
grid.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action="delete"]');
  if (!btn) return;

  const card = btn.closest('.track-card');
  if (!card) return;

  state.items = state.items.filter(it => it.id !== card.dataset.id);
  saveToStorage();
  render();
});
```

**Почему `closest()`:** клик мог быть по `<span>` внутри кнопки или по SVG.
`e.target` — самый глубокий элемент. `closest('button')` поднимается до кнопки.

**Почему делегирование, а не `N` слушателей:**

| | `N` слушателей | Делегирование |
|---|---|---|
| Память | O(N) | O(1) |
| Работает для новых карточек | нет (нужно перепривязывать) | **да** |
| При перерисовке | теряются | живёт вечно |

**Важно:** удаление — через `.filter()` по `state.items`, а **не** `el.remove()`.
Это State-Driven UI: удалили данные → `render()` перестроил DOM.

---

### 4.7. `localStorage` (3.7)

**Ключ:** `gamex-audio-tracks`.

**Сохранение:**

```javascript
function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
}
```

**Загрузка с fallback:**

```javascript
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ITEMS.map(x => ({ ...x }));
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_ITEMS.map(x => ({ ...x }));
  } catch {
    return DEFAULT_ITEMS.map(x => ({ ...x }));
  }
}
```

**Почему `JSON.stringify` / `JSON.parse`:** `localStorage` хранит **только строки**.
Массив объектов → строка → обратно.

**Три уровня защиты от битых данных:**

1. `if (!raw)` — ключа нет → `DEFAULT_ITEMS`.
2. `Array.isArray(parsed)` — там `{}` или `"hello"` → `DEFAULT_ITEMS`.
3. `try/catch` — `JSON.parse` кинул `SyntaxError` → `DEFAULT_ITEMS`.

**Демо-данные:** 8 треков в `DEFAULT_ITEMS` (Neon Drift, Deep Focus, Impact Hit
и т.д.), загружаются при первом открытии, когда хранилище пустое.

---

### 4.8. State-Driven UI (3.8)

См. раздел 3 выше. Все обработчики **только** меняют `state` и вызывают
`render()`. Никаких прямых `querySelector().textContent = ...` в обработчиках
(кроме `counter`/`emptyState` внутри самого `render()`).

---

## 5. Требования к коду — как выполнены

| Требование | Где | Статус |
|---|---|---|
| `textContent` для пользовательских данных | `buildCard()` — `title`, `artist`, `description` | ✅ |
| `innerHTML` только для очистки | `render()` — `grid.innerHTML = ''` | ✅ |
| Только `const` / `let`, без `var` | весь `audio.js` | ✅ |
| Только `===`, без `==` | весь `audio.js` | ✅ |
| Vanilla JS, без jQuery/фреймворков | `audio.js` — 0 зависимостей | ✅ |
| Адаптив, без горизонтальной прокрутки | медиа-запросы, `flex-wrap` | ✅ |
| `'use strict'` | первая строка `audio.js` | ✅ |

**Про `textContent` vs `innerHTML` (XSS):**

`innerHTML` парсит строку как HTML → `<img src=x onerror=alert(1)>` **выполнится**.
`textContent` вставляет как **текст**, всё экранируется. В `buildCard()` все
пользовательские поля — через `textContent`.

---

## 6. Структура проекта

```text
.
├── .gitignore
├── README.md                 ← отчёт по Лабораторной №1 (не трогал)
├── lr2.md                    ← этот файл, отчёт по Лабораторной №2
└── front/
    ├── index.html            ← ЛЕНДИНГ (новый, сводка о сайте)
    ├── icon/
    │   ├── gamepad-svgrepo-com.svg
    │   ├── music-note-4-svgrepo-com.svg
    │   └── news-svgrepo-com.svg
    ├── js/
    │   ├── main.js           ← для лендинга (опционально)
    │   └── audio.js          ← вся интерактивная логика Audio SPA
    ├── pages/
    │   ├── Audio.html        ← SPA-каталог треков
    │   ├── Community.html
    │   ├── Game.html         ← бывший index.html (каталог игр)
    │   └── Portal.html
    └── styles/
        ├── audio.css         ← стили каталога треков
        └── main.css          ← общая тёмная тема
```

**Отличие от рекомендуемой структуры лабы** (`index.html` + `css/` + `js/`):
у меня сохранена структура Лаб1 (`front/` + `styles/` + `js/` + `pages/`),
чтобы не ломать навигацию и не переименовывать файлы. Логика та же:
`index.html` в корне `front/`, стили в `styles/`, JS в `js/`.

---

## 7. Как запустить

1. Склонировать репозиторий.
2. Открыть `front/index.html` в браузере.
3. Перейти в **Audio** → проверить интерактивность.

**Сервер не требуется** — всё работает на клиенте, `localStorage` привязан к origin.

---

## 8. Чек-лист проверки (демонстрация на защите)

### Поиск (3.1)
- [ ] Ввести `neon` в поиск → остаётся 1 карточка «Neon Drift».
- [ ] Ввести `NEON` → то же самое (регистр не важен).
- [ ] Очистить поле → все карточки вернулись.

### Фильтр (3.2)
- [ ] Выбрать «Эффекты» → только эффекты.
- [ ] Выбрать «Все жанры» → сброс.

### Сортировка (3.3)
- [ ] `BPM ↑` → 0, 0, 72, 95, ... (нули в начале).
- [ ] `BPM ↓` → 140, 128, ...
- [ ] Имя Я–А → обратный алфавит.

### Модалка (3.4)
- [ ] «+ Добавить трек» → открылась.
- [ ] `×` → закрылась.
- [ ] Открыть снова → «Отмена» → закрылась.
- [ ] Открыть → `Escape` → закрылась.
- [ ] Открыть → клик по тёмному фону → закрылась.
- [ ] Открыть → клик по полю формы → **не закрылась** (правильно).

### Валидация (3.5)
- [ ] Открыть модалку → «Сохранить» с пустыми полями → 4-6 красных ошибок.
- [ ] Ввести `a` в название → «Минимум 2 символов».
- [ ] BPM = 10 → «Минимум 40».
- [ ] BPM = 500 → «Максимум 300».
- [ ] Заполнить корректно → карточка добавилась.

### Удаление (3.6)
- [ ] «Удалить» на карточке → исчезла.
- [ ] Перезагрузить → не вернулась (значит, `localStorage` сохранил).
- [ ] F12 → Elements → проверить, что на `#tracks-grid` **один** `addEventListener` (через `getEventListeners(grid)` в Chrome DevTools).

### localStorage (3.7)
- [ ] Добавить трек → F5 → трек на месте.
- [ ] Удалить трек → F5 → не вернулся.
- [ ] F12 → Application → Local Storage → `gamex-audio-tracks` содержит JSON.
- [ ] Очистить `localStorage` вручную → F5 → вернулись 8 демо-треков.

### State-Driven UI (3.8)
- [ ] В консоли: `console.log(state)` → видны `items`, `searchQuery`, `selectedCategory`, `sortBy`.
- [ ] Изменить `state` вручную → `render()` → DOM перестроился.

---

## 9. Ответы на контрольные вопросы

### 9.1. `let` vs `const` vs `var`, TDZ

| | `var` | `let` | `const` |
|---|---|---|---|
| Область видимости | функция | блок `{}` | блок `{}` |
| Hoisting | да, → `undefined` | да, но TDZ | да, но TDZ |
| Переприсваивание | да | да | **нет** |
| Переобъявление | да | нет | нет |

**TDZ (Temporal Dead Zone)** — интервал между началом блока и объявлением
`let`/`const`, в котором переменная **поднята, но не инициализирована**.
Обращение в TDZ → `ReferenceError`.

```javascript
console.log(x); // ReferenceError: Cannot access 'x' before initialization
let x = 10;
```

`var` в этой ситуации дал бы `undefined` (молчаливая ошибка). TDZ
**ловит баги** на этапе выполнения.

### 9.2. `textContent` vs `innerHTML`

`innerHTML` **парсит** строку как HTML → `<img onerror=...>` выполнится
(**XSS**). `textContent` вставляет как **текст**, всё экранируется.
Для пользовательских данных — только `textContent`. В `buildCard()` все
поля (`title`, `artist`, `description`) — через `textContent`.

### 9.3. Event Bubbling и Event Delegation

**Bubbling:** событие идёт от `target` **вверх** до `document`. Обработчик
на родителе сработает при клике на ребёнка.

**Delegation:** вместо `N` слушателей на `N` кнопках — **один** слушатель
на общем родителе. При клике ловим всплывшее событие и через
`e.target.closest(selector)` находим нужную кнопку.

**В `audio.js`:** `grid.addEventListener('click', ...)` + `closest()` —
один слушатель работает и для новых карточек после `render()`.

### 9.4. `preventDefault` vs `stopPropagation`

- `preventDefault()` — отменяет **дефолтное действие** браузера
  (submit формы → перезагрузка, клик по `<a>` → переход).
- `stopPropagation()` — останавливает **всплытие** события вверх по дереву.

**В `audio.js`:** `e.preventDefault()` в `form.addEventListener('submit')` —
без него страница перезагрузилась бы и SPA-логика потерялась.

### 9.5. JSON и `localStorage`

`localStorage` хранит **только строки**. `JSON.stringify(obj)` → строка,
`JSON.parse(str)` → объект. Без этого массив треков не сохранится
(превратится в `"[object Object]"`).

**В `audio.js`:** `saveToStorage()` — `JSON.stringify`, `loadFromStorage()` —
`JSON.parse` в `try/catch` (защита от битого JSON).

### 9.6. State-Driven UI и `render()`

**UI = render(State)** — интерфейс выводится из состояния.

```
Действие → изменить state → render() → новый DOM
```

`render()` читает `state`, очищает контейнер, строит карточки из `<template>`
через `cloneNode`, вставляет одним `DocumentFragment`. DOM **не источник
правды** — источник `state`. Любое изменение `state` → вызов `render()` →
DOM соответствует `state`.

**Почему полная перерисовка, а не патч:** проще, нет багов «забыл обновить
счётчик», состояние и DOM не расходятся. Для 8-100 карточек — мгновенно.

---

## 10. Что не реализовано (сознательно)

- **Редактирование** карточки — не требуется лабой.
- **Play-кнопка** с `<audio>` — не требуется.
- **Drag-and-drop** сортировка — не требуется.
- **Пагинация** — не нужна при 8-100 треках.
- **Серверная часть** — следующая лаба, планируется на Rust + axum + tokio.
- **Регистрация/логин** — следующая лаба.

---

## 11. Планы на Лабораторную №3

- Бэкенд на **Rust + axum + tokio**.
- БД — **PostgreSQL** + `sqlx` (compile-time проверка SQL).
- Auth — **argon2** для паролей, **JWT** (HS256, `exp` 15 мин) для сессии.
- Заголовки безопасности — `tower-http` (`CSP`, `HSTS`, `nosniff`,
  `Referrer-Policy`, `X-Frame-Options`).
- Rate limit — `tower-governor` на `/login`.
- Валидация DTO — `validator` + `serde` с `deny_unknown_fields`.

---

## 12. Скриншоты (добавить при сдаче)

- [ ] `front/index.html` — лендинг, тёмная тема.
- [ ] `front/pages/Game.html` — каталог игр, поиск в тулбаре.
- [ ] `front/pages/Audio.html` — каталог треков, сетка.
- [ ] Модалка «Добавить трек» с валидацией (пустая форма + красные ошибки).
- [ ] DevTools → Application → Local Storage → `gamex-audio-tracks`.
- [ ] DevTools → Elements → `#tracks-grid` (одна карточка в шаблоне).
- [ ] Мобильный режим 360px — нет горизонтальной прокрутки.
- [ ] Мобильный режим 768px — две колонки.

---

## 13. Автор

- **Студент:** Абдулхакимов Тимур
- **Группа:** ИВТ-ИСУ-302Б
- **Дисциплина:** Web-программирование
- **Год:** 2025