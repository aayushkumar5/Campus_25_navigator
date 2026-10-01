import { $, SVG_NS, COLORS, ICONS, ROOM_TYPES, FLOOR_CODES, FLOOR_NAMES } from './constants.js';
import { calcDistance, getNodeByRef, getNodeLabel, FLOORS } from './graph.js';
import { state, showToast, saveRecent } from './state.js';
import { dragDistance } from './viewport.js';

const vp = $('vp');

// Helper to create SVG elements
export const createSvgElement = (tagName, attributes, parentElement) => {
  const el = document.createElementNS(SVG_NS, tagName);
  for (const attr in attributes) el.setAttribute(attr, attributes[attr]);
  (parentElement || vp).appendChild(el);
  return el;
};

// Directional Animated Chevrons along route
export function renderDirectionalArrows(points) {
  let carry = 30;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1];
    const length = calcDistance(a, b);
    const angleDeg = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
    let lastDist = carry;

    for (let d = carry; d < length; d += 46) {
      const x = a[0] + (b[0] - a[0]) * d / length;
      const y = a[1] + (b[1] - a[1]) * d / length;
      createSvgElement('path', {
        d: 'M-4 -3L4 0L-4 3Z',
        fill: '#38bdf8',
        transform: `translate(${x} ${y}) rotate(${angleDeg})`
      }, $('arrows'));
      lastDist = d;
    }
    carry = Math.max(lastDist + 46 - length, 8);
  }
}

// Render active floor route polyline & live location pin
export function drawActiveRoute() {
  const routePathEl = $('route');
  const currentPinEl = $('cur');
  $('arrows').innerHTML = '';
  routePathEl.removeAttribute('d');
  currentPinEl.style.display = 'none';

  if (!state.currentRoute) return;

  const activeLeg = state.currentRoute.r.legs.find(leg => leg.f === state.currentFloor);
  if (activeLeg) {
    const pathData = 'M' + activeLeg.pts.map(p => p.join(' ')).join('L');
    routePathEl.setAttribute('d', pathData);
    renderDirectionalArrows(activeLeg.pts);
  }

  const activeStep = state.steps[state.currentStepIndex];
  if (activeStep && activeStep.f === state.currentFloor) {
    currentPinEl.style.display = 'block';
    currentPinEl.setAttribute('cx', activeStep.p[0]);
    currentPinEl.setAttribute('cy', activeStep.p[1]);
  }
}

// Inter-floor guidance banner
export function updateGuidanceBanner() {
  let message = '';
  if (state.washroomPickerMode) {
    const gender = state.washroomPickerMode.g === 'g' ? 'Gents' : 'Ladies';
    message = `Select a ${gender} washroom on the ${FLOOR_NAMES[state.currentFloor]} to set start`;
  } else if (state.currentRoute && state.currentRoute.r.via) {
    const connectorName = state.currentRoute.r.usedConn === 'lift' ? 'LIFT' : 'STAIRS';
    if (state.currentFloor === state.currentRoute.A.f) {
      message = `Floor Change: Take ${connectorName} ${state.currentRoute.r.via} to ${FLOOR_NAMES[state.currentRoute.B.f]} (Click to switch)`;
    } else if (state.currentFloor === state.currentRoute.B.f) {
      message = `Floor Change: Continue from ${state.currentRoute.r.via} to destination`;
    }
  }
  $('bn').textContent = message;
  $('bn').style.display = message ? 'block' : 'none';
}

// Node popup card controls
let activePopupNode = null;
export function openNodeCard(node) {
  activePopupNode = node;
  const card = $('node-card');
  $('nc-title').textContent = getNodeLabel(node);
  $('nc-type').textContent = ROOM_TYPES[node.t] || 'ROOM';
  $('nc-floor').textContent = FLOOR_CODES[state.currentFloor];
  card.style.display = 'block';
}

export function closeNodeCard() {
  $('node-card').style.display = 'none';
  activePopupNode = null;
}

export function getActivePopupNode() {
  return activePopupNode;
}

// Render active floor on SVG canvas
export function renderFloor(floorIdx, onNodeSelectCallback, onConnectorClickCallback) {
  state.currentFloor = floorIdx;
  const floorGraph = FLOORS[floorIdx];
  $('roads').innerHTML = '';
  $('nodes').innerHTML = '';

  // 1. Draw Roads & Stubs
  floorGraph.segs.forEach(seg => {
    createSvgElement('line', {
      x1: seg.a[0], y1: seg.a[1], x2: seg.b[0], y2: seg.b[1],
      stroke: '#27272a',
      'stroke-width': 2.5,
      'stroke-linecap': 'round'
    }, $('roads'));
  });

  floorGraph.stubs.forEach(([node, pt]) => {
    createSvgElement('line', {
      x1: node.x, y1: node.y, x2: pt[0], y2: pt[1],
      stroke: '#27272a',
      'stroke-width': 1.5,
      'stroke-dasharray': '2 2'
    }, $('roads'));
  });

  const isInterFloor = state.currentRoute && state.currentRoute.r && state.currentRoute.r.via;

  // 2. Draw Nodes
  Object.values(floorGraph.N).forEach(node => {
    const isRoom = /[abtrc]/.test(node.t);
    const isConnector = isInterFloor && node.id === state.currentRoute.r.via;

    const group = createSvgElement('g', {
      class: 'nd' + (isConnector ? ' connector-active' : '') + (state.washroomPickerMode && node.t === state.washroomPickerMode.g ? ' blink' : ''),
      'data-id': node.id,
      role: 'button',
      tabindex: '0',
      'aria-label': `${getNodeLabel(node)}, ${ROOM_TYPES[node.t] || 'Room'}, ${FLOOR_NAMES[floorIdx]}`
    }, $('nodes'));

    if (isRoom) {
      createSvgElement('rect', {
        x: node.x - 12, y: node.y - 8, width: 24, height: 16,
        rx: 3, fill: COLORS[node.t] || '#64748b'
      }, group);
    } else {
      createSvgElement('circle', {
        cx: node.x, cy: node.y, r: 9,
        fill: '#18181b', stroke: COLORS[node.t] || '#fff', 'stroke-width': 1.5
      }, group);
      createSvgElement('text', {
        x: node.x, y: node.y + 3.5, 'text-anchor': 'middle', 'font-size': 9, 'font-weight': 'bold',
        fill: COLORS[node.t] || '#fff', style: 'pointer-events:none'
      }, group).textContent = ICONS[node.t] || 'o';
    }

    const labelGroup = createSvgElement('g', { class: 'nl' }, group);
    createSvgElement('text', { x: node.x, y: node.y + (isRoom ? 19 : 20) }, labelGroup).textContent = (node.id || '').toUpperCase();

    if (isConnector) {
      const targetFloor = (state.currentFloor === state.currentRoute.A.f ? state.currentRoute.B.f : state.currentRoute.A.f);
      const tagGroup = createSvgElement('g', { class: 'connector-tag' }, group);
      createSvgElement('rect', {
        x: node.x - 26, y: node.y - 22, width: 52, height: 11,
        rx: 3, fill: '#0284c7'
      }, tagGroup);
      createSvgElement('text', {
        x: node.x, y: node.y - 14, 'text-anchor': 'middle'
      }, tagGroup).textContent = 'GO TO ' + FLOOR_CODES[targetFloor];
    }

    const handleNodeAction = e => {
      e.stopPropagation();
      if (dragDistance > 6) return;

      if (isConnector) {
        onConnectorClickCallback(node);
        return;
      }

      onNodeSelectCallback(node);
    };

    group.onclick = handleNodeAction;
    group.onkeydown = e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleNodeAction(e);
      }
    };
    node.el = group;
  });

  // 3. Draw Start (Green) & Destination (Red) Target Rings
  [[state.startPoint, '#16a34a'], [state.destPoint, '#dc2626']].forEach(([ref, strokeColor]) => {
    if (ref && !ref.nearest && ref.f === floorIdx) {
      const node = getNodeByRef(ref);
      if (node) {
        createSvgElement('circle', {
          cx: node.x, cy: node.y, r: 16,
          fill: 'none', stroke: strokeColor, 'stroke-width': 2.5,
          style: 'pointer-events:none'
        }, $('nodes'));
      }
    }
  });

  // 4. Update Header Floor Badges & Dropdown
  $('sub').textContent = FLOOR_NAMES[floorIdx].toUpperCase();
  $('fl').textContent = FLOOR_CODES[floorIdx];

  $('fm').innerHTML = '';
  [3, 2, 1, 0].forEach(level => {
    const item = document.createElement('div');
    item.className = level === state.currentFloor ? 'on' : '';
    item.setAttribute('role', 'menuitem');
    item.setAttribute('tabindex', '0');
    item.innerHTML = `<b>${level ? FLOOR_CODES[level] : 'GF'}</b><span>${FLOOR_NAMES[level]}</span>`;
    
    const selectFloor = e => {
      e.preventDefault();
      $('fm').style.display = 'none';
      $('fb').setAttribute('aria-expanded', 'false');
      renderFloor(level, onNodeSelectCallback, onConnectorClickCallback);
    };
    item.onmousedown = selectFloor;
    item.onkeydown = e => {
      if (e.key === 'Enter' || e.key === ' ') selectFloor(e);
    };
    $('fm').appendChild(item);
  });

  drawActiveRoute();
  updateGuidanceBanner();
}
