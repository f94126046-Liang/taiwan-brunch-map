const state = { places: [], selectedId: null };
const elements = {
  search: document.querySelector('#search-input'), city: document.querySelector('#city-filter'),
  category: document.querySelector('#category-filter'), reset: document.querySelector('#reset-filters'),
  count: document.querySelector('#result-count'), list: document.querySelector('#places-list'),
  markers: document.querySelector('#map-markers'), empty: document.querySelector('#empty-state'),
  emptyReset: document.querySelector('#empty-reset'), hint: document.querySelector('#list-hint')
};

function text(tag, className, value) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = value;
  return node;
}

function fillOptions(select, values) {
  [...new Set(values)].sort((a, b) => a.localeCompare(b, 'zh-Hant')).forEach(value => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.append(option);
  });
}

function visiblePlaces() {
  const query = elements.search.value.trim().toLocaleLowerCase('zh-Hant');
  return state.places.filter(place => {
    const matchesCity = !elements.city.value || place.city === elements.city.value;
    const matchesCategory = !elements.category.value || place.category === elements.category.value;
    const haystack = [place.name, place.city, place.district, place.category, place.signature, place.description].join(' ').toLocaleLowerCase('zh-Hant');
    return matchesCity && matchesCategory && (!query || haystack.includes(query));
  });
}

function sourceLink(place) {
  const link = text('a', 'source-link', `資料來源：${place.source.label} ↗`);
  link.href = place.source.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.setAttribute('aria-label', `${place.name}資料來源：${place.source.label}，在新分頁開啟`);
  return link;
}

function selectPlace(id, scroll = false) {
  state.selectedId = id;
  document.querySelectorAll('.place-card,.marker').forEach(node => node.classList.toggle('active', node.dataset.id === id));
  elements.hint.textContent = id ? '已在地圖標示位置' : '點卡片看地圖位置';
  if (scroll && window.matchMedia('(max-width: 680px)').matches) {
    document.querySelector('#map-canvas').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function render() {
  const places = visiblePlaces();
  elements.count.textContent = String(places.length).padStart(2, '0');
  elements.list.replaceChildren();
  elements.markers.replaceChildren();
  elements.empty.hidden = places.length !== 0;
  elements.list.hidden = places.length === 0;

  places.forEach(place => {
    const card = document.createElement('article');
    card.className = 'place-card';
    card.tabIndex = 0;
    card.dataset.id = place.id;
    card.setAttribute('aria-label', `${place.name}，${place.city}${place.district}，${place.category}`);
    card.addEventListener('click', event => {
      if (event.target.closest('a')) return;
      selectPlace(place.id);
    });
    card.addEventListener('keydown', event => {
      if ((event.key === 'Enter' || event.key === ' ') && event.target === card) {
        event.preventDefault();
        selectPlace(place.id);
      }
    });
    const top = document.createElement('div'); top.className = 'card-top';
    top.append(text('span', 'card-meta', `${place.city}　${place.district}`), text('span', 'card-category', place.category));
    card.append(top, text('h3', '', place.name), text('p', '', place.description));
    const details = document.createElement('div'); details.className = 'card-details';
    details.append(text('span', 'dish', place.signature), text('span', 'price', place.price), text('span', 'hours', place.hours));
    card.append(details, sourceLink(place));
    elements.list.append(card);

    const marker = document.createElement('button');
    marker.type = 'button'; marker.className = 'marker'; marker.dataset.id = place.id;
    marker.style.left = `${place.coordinates.x}%`; marker.style.top = `${place.coordinates.y}%`;
    marker.setAttribute('aria-label', `在地圖標示：${place.name}，${place.city}${place.district}`);
    marker.append(text('span', '', place.name));
    marker.addEventListener('click', () => selectPlace(place.id, true));
    elements.markers.append(marker);
  });

  if (!places.some(place => place.id === state.selectedId)) selectPlace(null);
  else selectPlace(state.selectedId);
}

function clearFilters() {
  elements.search.value = '';
  elements.city.value = '';
  elements.category.value = '';
  selectPlace(null);
  render();
  elements.search.focus();
}

async function init() {
  try {
    const response = await fetch('data/places.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.places = await response.json();
    fillOptions(elements.city, state.places.map(place => place.city));
    fillOptions(elements.category, state.places.map(place => place.category));
    render();
  } catch (error) {
    elements.list.replaceChildren(text('p', 'load-error', '店家資料暫時無法載入。請使用本機伺服器開啟網站，或稍後再試。'));
    elements.count.textContent = '—';
    console.error('無法載入 data/places.json', error);
  }
}

elements.search.addEventListener('input', render);
elements.city.addEventListener('change', render);
elements.category.addEventListener('change', render);
elements.reset.addEventListener('click', clearFilters);
elements.emptyReset.addEventListener('click', clearFilters);
init();
