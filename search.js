import { $, FLOOR_CODES, ROOM_TYPES } from './constants.js';
import { getNodeByRef, getNodeLabel, FLOORS } from './graph.js';
import { state } from './state.js';

// Search filter with clear documented rules
export function searchLocations(query) {
  const normalized = query.trim().toLowerCase();
  const results = [];
  const alreadyInResults = (f, id) => results.some(x => x.f === f && x.id === id);

  // 1. If empty query, show recent locations
  if (!normalized) {
    state.recents.filter(r => FLOORS[r.f] && FLOORS[r.f].N[r.id]).forEach(r => {
      results.push({ ...r, rc: 1 });
    });
  }

  // 2. Washroom quick access
  if (!normalized || 'washroom'.includes(normalized) || 'toilet'.includes(normalized)) {
    results.push({ wc: 1 });
  }

  // 3. Search across all floors
  FLOORS.forEach((floorGraph, floorIdx) => {
    Object.values(floorGraph.N).forEach(node => {
      // Filter Rule 1: Washrooms are handled by dedicated washroom flow
      if (node.t === 'g' || node.t === 'f') return;
      // Filter Rule 2: Stairs and Lifts only show for current floor
      if ((node.t === 's' || node.t === 'l') && floorIdx !== state.currentFloor) return;
      // Filter Rule 3: Without a query, restrict suggestions to active floor
      if (!normalized && floorIdx !== state.currentFloor) return;
      // Filter Rule 4: Do not include duplicates
      if (alreadyInResults(floorIdx, node.id)) return;

      const searchableText = (node.id + ' ' + getNodeLabel(node) + ' ' + (ROOM_TYPES[node.t] || '')).toLowerCase();
      if (searchableText.includes(normalized)) {
        results.push({ f: floorIdx, id: node.id });
      }
    });
  });

  // Rank matches: Recents (0) > Washroom (1) > Exact ID match (2) > Active Floor (3) > Other Floors (4)
  const rank = item => item.rc ? 0 : item.wc ? 1 : (item.id || '').toLowerCase() === normalized ? 2 : item.f === state.currentFloor ? 3 : 4;
  return results.sort((a, b) => rank(a) - rank(b)).slice(0, 30);
}

let activeDropdownIdx = -1;

export function renderSearchDropdown(onSelectCallback, onWashroomFlowCallback) {
  const query = $('q').value.trim().toLowerCase();
  const dropdownEl = $('dd');
  dropdownEl.innerHTML = '';
  $('qx').hidden = !query;
  activeDropdownIdx = -1;

  const results = searchLocations(query);
  results.forEach(item => {
    const itemEl = document.createElement('div');
    if (item.wc) {
      itemEl.innerHTML = `
        <span>Washroom <small>${state.activeSelectMode === 's' ? 'choose floor & type' : 'nearest'}</small></span>
        <span class="bd">WASHROOM</span>
      `;
    } else {
      const node = getNodeByRef(item);
      if (!node) return;
      const isExact = query && node.id.toLowerCase() === query;
      const isType = query && !isExact && (ROOM_TYPES[node.t] || '').toLowerCase().includes(query) && !node.id.toLowerCase().includes(query);

      itemEl.innerHTML = `
        <span>${getNodeLabel(node)}</span>
        <span>
          ${item.rc ? '<span class="bd rc">RECENT</span>' : ''}
          ${isExact ? '<span class="bd ex">EXACT</span>' : ''}
          ${isType ? '<span class="bd">TYPE</span>' : ''}
          <span class="bd">${ROOM_TYPES[node.t] || 'ROOM'}</span>
          <span class="bd ex">${FLOOR_CODES[item.f]}</span>
        </span>
      `;
    }

    itemEl.onmousedown = e => {
      e.preventDefault();
      if (item.wc) onWashroomFlowCallback();
      else onSelectCallback(item);
    };
    dropdownEl.appendChild(itemEl);
  });

  dropdownEl.style.display = dropdownEl.children.length ? 'block' : 'none';
}

export function updateActiveDropdownItem(itemsEl) {
  [...itemsEl].forEach((el, idx) => {
    el.classList.toggle('selected', idx === activeDropdownIdx);
    if (idx === activeDropdownIdx) el.scrollIntoView({ block: 'nearest' });
  });
}

// Debounce helper
export function debounce(func, waitMs = 50) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), waitMs);
  };
}

// Setup search input listeners & keyboard navigation
export function setupSearchEvents(onSelectCallback, onWashroomFlowCallback) {
  const debouncedRender = debounce(() => renderSearchDropdown(onSelectCallback, onWashroomFlowCallback), 50);

  $('q').addEventListener('input', debouncedRender);
  $('q').addEventListener('focus', () => renderSearchDropdown(onSelectCallback, onWashroomFlowCallback));
  $('q').addEventListener('blur', () => {
    setTimeout(() => { $('dd').style.display = 'none'; }, 180);
  });

  $('qx').addEventListener('click', () => {
    $('q').value = '';
    renderSearchDropdown(onSelectCallback, onWashroomFlowCallback);
  });

  $('q').addEventListener('keydown', e => {
    const dropdownEl = $('dd');
    const itemsEl = dropdownEl.children;
    if (!itemsEl.length || dropdownEl.style.display === 'none') return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeDropdownIdx = (activeDropdownIdx + 1) % itemsEl.length;
      updateActiveDropdownItem(itemsEl);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeDropdownIdx = (activeDropdownIdx - 1 + itemsEl.length) % itemsEl.length;
      updateActiveDropdownItem(itemsEl);
    } else if (e.key === 'Enter' && activeDropdownIdx >= 0) {
      e.preventDefault();
      itemsEl[activeDropdownIdx].dispatchEvent(new MouseEvent('mousedown'));
    }
  });
}

// Guided washroom selection chip flow
export function startWashroomFlow(onFloorChangeCallback, onCompleteCallback) {
  const container = $('wc');
  $('dd').style.display = 'none';
  $('q').value = '';

  const renderChips = (heading, options, onPick) => {
    container.innerHTML = `<div class="chips"><small>${heading}</small></div>`;
    options.forEach(([label, value]) => {
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.onclick = () => onPick(value);
      container.firstChild.appendChild(btn);
    });
  };

  const askGender = onGenderPick => renderChips('Gents or Ladies?', [['Gents', 'g'], ['Ladies', 'f']], onGenderPick);

  if (state.activeSelectMode === 'd') {
    askGender(gender => {
      state.destPoint = { nearest: gender };
      container.innerHTML = '';
      onCompleteCallback();
    });
  } else {
    renderChips('Select Floor', FLOOR_CODES.map((code, idx) => [code, idx]), floorIdx => {
      onFloorChangeCallback(floorIdx);
      askGender(gender => {
        state.washroomPickerMode = { g: gender };
        container.innerHTML = '';
        onFloorChangeCallback(state.currentFloor);
      });
    });
  }
}
