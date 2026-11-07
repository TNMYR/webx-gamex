'use strict';

/* =========================================================
   1. STATE
   ========================================================= */
const STORAGE_KEY = 'gamex-audio-tracks';

const DEFAULT_ITEMS = [
  { id: 'a1', title: 'Neon Drift',      artist: 'SynthWave',   category: 'Музыка',      bpm: 128, duration: 214, description: 'Синтвейв для ночных поездок' },
  { id: 'a2', title: 'Deep Focus',      artist: 'Ambient Lab', category: 'Музыка',      bpm: 72,  duration: 305, description: 'Спокойный эмбиент для работы' },
  { id: 'a3', title: 'Impact Hit',      artist: 'SFX Studio',  category: 'Эффекты',     bpm: 0,   duration: 3,   description: 'Мощный удар для трейлеров' },
  { id: 'a4', title: 'Vinyl Crackle',   artist: 'LoFi Co',     category: 'Эффекты',     bpm: 0,   duration: 42,  description: 'Шум винила, лёгкий фоновый' },
  { id: 'a5', title: 'Acoustic Guitar', artist: 'Studio One',  category: 'Инструменты', bpm: 95,  duration: 128, description: 'Семпл акустической гитары' },
  { id: 'a6', title: 'Royalty Pack',    artist: 'Gamex Team',  category: 'Лицензия',    bpm: 0,   duration: 0,   description: 'Пакет лицензий для проектов' },
  { id: 'a7', title: 'Drum Kit 808',    artist: 'BeatSupply',  category: 'Ресурсы',     bpm: 140, duration: 90,  description: 'Набор ударных 808' },
  { id: 'a8', title: 'Cyber Pulse',     artist: 'SynthWave',   category: 'Музыка',      bpm: 112, duration: 198, description: 'Энергичный киберпанк-трек' },
];

const state = {
  items: [],
  searchQuery: '',
  selectedCategory: 'all',
  sortBy: 'name-asc',
};

/* =========================================================
   2. STORAGE
   ========================================================= */
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ITEMS.map(x => ({ ...x }));
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length >= 0
      ? parsed
      : DEFAULT_ITEMS.map(x => ({ ...x }));
  } catch {
    return DEFAULT_ITEMS.map(x => ({ ...x }));
  }
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
}

/* =========================================================
   3. DOM
   ========================================================= */
const grid         = document.getElementById('tracks-grid');
const emptyState   = document.getElementById('empty-state');
const counter      = document.getElementById('audio-counter');
const searchInput  = document.getElementById('audio-search');
const categorySel  = document.getElementById('filter-category');
const sortSel      = document.getElementById('sort-by');

const modal        = document.getElementById('modal-backdrop');
const modalClose   = document.getElementById('modal-close');
const modalCancel  = document.getElementById('modal-cancel');
const openModalBtn = document.getElementById('open-add-modal');
const form         = document.getElementById('add-track-form');

const cardTemplate = document.getElementById('track-card-template');

/* =========================================================
   4. РЕНДЕР КАРТОЧКИ ИЗ <template>
   ========================================================= */
function buildCard(item) {
  // Клонируем содержимое шаблона
  const node = cardTemplate.content.firstElementChild.cloneNode(true);

  node.dataset.id = item.id;

  // Заполняем через textContent (безопасно)
  node.querySelector('.track-title').textContent  = item.title;
  node.querySelector('.track-artist').textContent = item.artist;
  node.querySelector('.track-cat').textContent    = item.category;
  node.querySelector('.track-desc').textContent   = item.description || '—';

  node.querySelector('.meta-bpm').textContent = item.bpm > 0 ? item.bpm : '—';
  node.querySelector('.meta-dur').textContent = item.duration > 0 ? item.duration : '—';

  // Иконка по категории — подставляем svg из icon/
  const coverImg = node.querySelector('.track-cover img');
  const iconMap = {
    'Музыка':      '../icon/music-note-4-svgrepo-com.svg',
    'Эффекты':     '../icon/news-svgrepo-com.svg',
    'Инструменты': '../icon/gamepad-svgrepo-com.svg',
    'Лицензия':    '../icon/news-svgrepo-com.svg',
    'Ресурсы':     '../icon/gamepad-svgrepo-com.svg',
  };
  coverImg.src = iconMap[item.category] || '../icon/music-note-4-svgrepo-com.svg';
  coverImg.alt = item.category;

  return node;
}

/* =========================================================
   5. ФИЛЬТР + СОРТИРОВКА
   ========================================================= */
function getVisibleItems() {
  let result = [...state.items];

  const q = state.searchQuery.trim().toLowerCase();
  if (q) {
    result = result.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.artist.toLowerCase().includes(q)
    );
  }

  if (state.selectedCategory !== 'all') {
    result = result.filter(item => item.category === state.selectedCategory);
  }

  const sorters = {
    'name-asc':      (a, b) => a.title.localeCompare(b.title, 'ru'),
    'name-desc':     (a, b) => b.title.localeCompare(a.title, 'ru'),
    'bpm-asc':       (a, b) => a.bpm - b.bpm,
    'bpm-desc':      (a, b) => b.bpm - a.bpm,
    'duration-asc':  (a, b) => a.duration - b.duration,
    'duration-desc': (a, b) => b.duration - a.duration,
  };
  result.sort(sorters[state.sortBy] || sorters['name-asc']);

  return result;
}

/* =========================================================
   6. RENDER
   ========================================================= */
function render() {
  const visible = getVisibleItems();

  grid.innerHTML = '';
  const frag = document.createDocumentFragment();
  visible.forEach(item => frag.append(buildCard(item)));
  grid.append(frag);

  emptyState.hidden = visible.length !== 0;
  counter.textContent = `Показано ${visible.length} из ${state.items.length}`;
}

/* =========================================================
   7. УДАЛЕНИЕ — делегирование
   ========================================================= */
grid.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action="delete"]');
  if (!btn) return;

  const card = btn.closest('.track-card');
  if (!card) return;

  state.items = state.items.filter(it => it.id !== card.dataset.id);
  saveToStorage();
  render();
});

/* =========================================================
   8. ФИЛЬТРЫ
   ========================================================= */
searchInput.addEventListener('input', (e) => {
  state.searchQuery = e.target.value;
  render();
});

document.getElementById('audio-search-form').addEventListener('submit', (e) => {
  e.preventDefault();
  state.searchQuery = searchInput.value;
  render();
});

categorySel.addEventListener('change', (e) => {
  state.selectedCategory = e.target.value;
  render();
});

sortSel.addEventListener('change', (e) => {
  state.sortBy = e.target.value;
  render();
});

/* =========================================================
   9. МОДАЛКА
   ========================================================= */
function openModal() {
  modal.hidden = false;
  form.reset();
  clearErrors();
  document.getElementById('f-title').focus();
}

function closeModal() {
  modal.hidden = true;
}

openModalBtn.addEventListener('click', openModal);
modalClose.addEventListener('click', closeModal);
modalCancel.addEventListener('click', closeModal);

modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modal.hidden) closeModal();
});

/* =========================================================
   10. ВАЛИДАЦИЯ
   ========================================================= */
function clearErrors() {
  form.querySelectorAll('.error').forEach(el => (el.textContent = ''));
  form.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
}

function showError(input, msg) {
  input.classList.add('invalid');
  const errEl = form.querySelector(`[data-error-for="${input.id}"]`);
  if (errEl) errEl.textContent = msg;
}

function validateField(input) {
  if (input.validity.valid) return true;

  if (input.validity.valueMissing)      showError(input, 'Заполни это поле');
  else if (input.validity.tooShort)     showError(input, `Минимум ${input.minLength} символов`);
  else if (input.validity.tooLong)      showError(input, `Максимум ${input.maxLength} символов`);
  else if (input.validity.rangeUnderflow) showError(input, `Минимум ${input.min}`);
  else if (input.validity.rangeOverflow)  showError(input, `Максимум ${input.max}`);
  else if (input.validity.badInput)     showError(input, 'Введи число');
  else                                   showError(input, 'Некорректное значение');

  return false;
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  clearErrors();

  const fields = Array.from(form.querySelectorAll('input, select, textarea'));
  let firstInvalid = null;

  for (const f of fields) {
    if (!validateField(f) && !firstInvalid) firstInvalid = f;
  }

  if (firstInvalid) {
    firstInvalid.focus();
    return;
  }

  const data = new FormData(form);
  const newItem = {
    id:          't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    title:       String(data.get('title')).trim(),
    artist:      String(data.get('artist')).trim(),
    category:    String(data.get('category')),
    bpm:         Number(data.get('bpm')),
    duration:    Number(data.get('duration')),
    description: String(data.get('description') || '').trim(),
  };

  state.items.push(newItem);
  saveToStorage();
  closeModal();
  render();
});

const API = "http://127.0.0.1:8000/api/tracks";
const LS_KEY = "gamex_tracks_cache";

async function loadTracks() {
  // 1. Мгновенно показать кэш (из ЛР2)
  const cached = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  if (cached.length) renderTracks(cached);

  // 2. Подтянуть актуальное из БД (требование ЛР3)
  try {
    const r = await fetch(API);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const fresh = await r.json();
    renderTracks(fresh);
    localStorage.setItem(LS_KEY, JSON.stringify(fresh)); // обновляем кэш
  } catch (e) {
    console.warn("Backend недоступен, показываем кэш:", e.message);
  }
}


async function createTrack(data) {
  const r = await fetch(API, { method: "POST", headers: {...}, body: JSON.stringify(data) });
  if (!r.ok) throw new Error(`Ошибка создания: ${r.status}`);
  const created = await r.json();
  await loadTracks(); // перезапишет кэш из БД
  return created;
}

async function deleteTrack(id) {
  const r = await fetch(`${API}/${id}`, { method: "DELETE" });
  if (r.status !== 204) throw new Error(`Ошибка удаления: ${r.status}`);
  await loadTracks();
}


/* =========================================================
   11. INIT
   ========================================================= */
function init() {
  state.items = loadFromStorage();
  render();
}



init();