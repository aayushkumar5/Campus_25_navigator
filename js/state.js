import { $, FLOOR_CODES, FLOOR_NAMES } from './constants.js';
import { getNodeByRef, getNodeLabel, FLOORS } from './graph.js';

// ---- Application Reactive State Store ----
export const state = {
  currentFloor: 0,
  activeSelectMode: 's', // 's' (start) or 'd' (destination)
  startPoint: null,      // { f: floorIndex, id: nodeId }
  destPoint: null,       // { f: floorIndex, id: nodeId } or { nearest: 'g'|'f' }
  connectorType: 'stairs', // 'stairs' | 'lift'
  currentRoute: null,    // { r: legsResult, A: startPoint, B: resolvedDestPoint }
  steps: [],             // Array of turn-by-turn step objects
  currentStepIndex: 0,
  washroomPickerMode: null, // { g: 'g'|'f' }
  stepFreeMode: false,
  recents: []
};

// ---- Recents Storage ----
try {
  state.recents = JSON.parse(localStorage.getItem('c25r') || '[]');
} catch (e) {
  state.recents = [];
}

export function saveRecent(ref) {
  if (!ref || ref.nearest) return;
  state.recents = [{ f: ref.f, id: ref.id }, ...state.recents.filter(x => !(x.f === ref.f && x.id === ref.id))].slice(0, 5);
  try {
    localStorage.setItem('c25r', JSON.stringify(state.recents));
  } catch (e) {}
}

// ---- Toast Notifications ----
let toastTimer = null;
export function showToast(message) {
  const toastEl = $('toast');
  if (!toastEl) return;
  if (toastTimer) clearTimeout(toastTimer);
  toastEl.textContent = message;
  toastEl.style.display = 'block';
  toastTimer = setTimeout(() => {
    toastEl.style.display = 'none';
    toastTimer = null;
  }, 2500);
}

// ---- Endpoint & Label Formatters ----
export function formatPointName(ref) {
  if (!ref) return 'Not set';
  if (ref.nearest) return 'Nearest ' + (ref.nearest === 'g' ? 'Gents' : 'Ladies') + ' Washroom';
  const node = getNodeByRef(ref);
  return (node ? getNodeLabel(node) : ref.id) + ' (' + FLOOR_CODES[ref.f] + ')';
}

// ---- Shareable URL Serialization ----
export const serializeRef = ref => ref.nearest ? 'wc-' + ref.nearest : ref.id + '@' + FLOOR_CODES[ref.f];

export function deserializeRef(str) {
  if (!str) return null;
  if (str.startsWith('wc-')) return { nearest: str.slice(3) };
  const [id, fCode] = str.split('@');
  const code = fCode === 'GF' ? 'G' : fCode; // accept legacy @GF links
  const floorIndex = code ? FLOOR_CODES.indexOf(code) : FLOORS.findIndex(fl => fl.N[id]);
  return floorIndex >= 0 && FLOORS[floorIndex] && FLOORS[floorIndex].N[id] ? { f: floorIndex, id } : null;
}

export function generateShareUrl() {
  const urlParams = new URLSearchParams();
  if (state.startPoint) urlParams.set('from', serializeRef(state.startPoint));
  if (state.destPoint) urlParams.set('to', serializeRef(state.destPoint));
  if (state.connectorType === 'lift') urlParams.set('via', 'lift');
  const paramStr = urlParams.toString();
  return location.href.split(/[?#]/)[0] + (paramStr ? '?' + paramStr : '');
}

export function syncHistoryUrl() {
  try {
    const searchPart = generateShareUrl().split('?')[1];
    history.replaceState(null, '', searchPart ? '?' + searchPart : location.pathname);
  } catch (e) {}
}
