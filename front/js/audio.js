'use strict';

const API_URL = "/api/tracks";
const CACHE_KEY = 'gamex-audio-tracks-cache';

const state = {
  items: [],
  searchQuery: '',
  selectedCategory: 'all',
  sortBy: 'name-asc',
};

// DOM элементы
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
const refreshBtn   = document.getElementById('refresh-btn'); // Добавим в HTML
const cardTemplate = document.getElementById('track-card-template');

// =========================================================
// 1. API + КЭШ
// =========================================================

async function fetchTracks() {
  if (refreshBtn) {
    refreshBtn.disabled = true;
    refreshBtn.textContent = 'Загрузка...';
  }

  try {
    const r = await fetch(API_URL);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    
    state.items = data;
    localStorage.setItem(CACHE_KEY, JSON.stringify(data)); // обновляем кэш
    render();
  } catch (e) {
    console.error('Ошибка загрузки треков:', e);
    // Если сервер лежит, показываем кэш (если он есть)
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      state.items = JSON.parse(cached);
      render();
      alert('Сервер недоступен. Показаны данные из кэша.');
    } else {
      grid.innerHTML = `<p style="color:red">Не удалось подключиться к серверу: ${e.message}</p>`;
    }
  } finally {
    if (refreshBtn) {
      refreshBtn.disabled = false;
      refreshBtn.textContent = 'Обновить';
    }
  }
}

async function createTrackOnServer(data) {
  const r = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.detail ? JSON.stringify(err.detail) : `Ошибка создания: ${r.status}`);
  }
  return await r.json();
}

async function deleteTrackOnServer(id) {
  const r = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  if (r.status !== 204) throw new Error(`Ошибка удаления: ${r.status}`);
}

// =========================================================
// 2. РЕНДЕР И ФИЛЬТРЫ
// =========================================================

function buildCard(item) {
  const node = cardTemplate.content.firstElementChild.cloneNode(true);
  node.dataset.id = item.id;

  node.querySelector('.track-title').textContent  = item.title;
  node.querySelector('.track-artist').textContent = item.artist;
  node.querySelector('.track-cat').textContent    = item.category;
  node.querySelector('.track-desc').textContent   = item.description || '—';

  node.querySelector('.meta-bpm').textContent = item.bpm > 0 ? item.bpm : '—';
  node.querySelector('.meta-dur').textContent = item.duration > 0 ? item.duration : '—';

  const coverImg = node.querySelector('.track-cover img');
  const iconMap = {
    'Музыка':      '../icon/music-note-4-svgrepo-com.svg',
    'Эффекты':     '../icon/news-svgrepo-com.svg',
    'Инструменты': '../icon/gamepad-svgrepo-com.svg',
    'Лицензия':    '../icon/news-svgrepo-com.svg',
    'Ресурсы':     '../icon/gamepad-svgrepo-com.svg',
  };
  coverImg.src = iconMap[item.category] || '../icon/music-note-4-svgrepo-com.svg';
  
  return node;
}

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

function render() {
  const visible = getVisibleItems();
  grid.innerHTML = '';
  
  if (visible.length === 0) {
    emptyState.hidden = false;
    counter.textContent = `Показано 0 из ${state.items.length}`;
    return;
  }

  emptyState.hidden = true;
  const frag = document.createDocumentFragment();
  visible.forEach(item => frag.append(buildCard(item)));
  grid.append(frag);
  counter.textContent = `Показано ${visible.length} из ${state.items.length}`;
}

// =========================================================
// 3. СОБЫТИЯ
// =========================================================

grid.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action="delete"]');
  if (!btn) return;

  const card = btn.closest('.track-card');
  if (!card) return;

  if (!confirm('Удалить этот трек из базы данных?')) return;

  try {
    btn.disabled = true;
    btn.textContent = 'Удаление...';
    await deleteTrackOnServer(card.dataset.id);
    state.items = state.items.filter(it => String(it.id) !== String(card.dataset.id));
    localStorage.setItem(CACHE_KEY, JSON.stringify(state.items));
    render();
  } catch (err) {
    alert('Не удалось удалить: ' + err.message);
    btn.disabled = false;
    btn.textContent = 'Удалить';
  }
});

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

// Модалка
function openModal() {
  modal.hidden = false;
  form.reset();
  clearErrors();
  document.getElementById('f-title').focus();
}
function closeModal() { modal.hidden = true; }

openModalBtn.addEventListener('click', openModal);
modalClose.addEventListener('click', closeModal);
modalCancel.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

if (refreshBtn) {
  refreshBtn.addEventListener('click', fetchTracks);
}

// Валидация и отправка формы
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

form.addEventListener('submit', async (e) => {
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
    title:       String(data.get('title')).trim(),
    artist:      String(data.get('artist')).trim(),
    category:    String(data.get('category')),
    bpm:         Number(data.get('bpm')),
    duration:    Number(data.get('duration')),
    description: String(data.get('description') || '').trim() || null,
  };

  const submitBtn = form.querySelector('.btn-submit');
  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Сохранение...';
    
    const created = await createTrackOnServer(newItem);
    state.items.push(created);
    localStorage.setItem(CACHE_KEY, JSON.stringify(state.items));
    
    closeModal();
    render();
  } catch (err) {
    alert('Ошибка при создании: ' + err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Сохранить';
  }
});

// =========================================================
// 4. ИНИЦИАЛИЗАЦИЯ
// =========================================================
function init() {
  // 1. Показываем кэш, если он есть (мгновенная отрисовка)
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      state.items = JSON.parse(cached);
      render();
    } catch(e) {}
  }
  
  // 2. Запрашиваем актуальные данные с сервера
  fetchTracks();
}

init();