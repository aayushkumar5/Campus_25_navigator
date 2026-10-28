import { $, SVG_NS, COLORS, ROOM_TYPES, FLOOR_CODES, FLOOR_NAMES } from './constants.js';
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

// Facility glyph icons drawn inside marker chips (designed on a -6..6 grid)
const FAC_GLYPHS = {
  s: { d: 'M-4.5 4.5h1.9V2.7h1.9V.9h1.9v-1.8h1.9v-1.8h1.8v-1.8', stroke: true },
  l: { d: 'M-3.4-1.1L-.6-3.9 2.2-1.1M-3.4 1.1L-.6 3.9 2.2 1.1', stroke: true },
  g: { d: 'M0-4.3m-1.4 0a1.4 1.4 0 1 0 2.8 0 1.4 1.4 0 1 0-2.8 0M-2.5 4.6v-5Q-2.5-2-1-2h2Q2.5-2 2.5-.4v5H1.1V1h-2.2v3.6z', fill: true },
  f: { d: 'M0-4.3m-1.4 0a1.4 1.4 0 1 0 2.8 0 1.4 1.4 0 1 0-2.8 0M-2.4 3.2L-.9-2Q-.7-2.4-.3-2.4h.6Q.7-2.4.9-2l1.5 5.2H.9l-.4 1.4h-1L-.9 3.2z', fill: true },
  e: { d: 'M-4.6 0H1.6M-.7-2.2L1.9 0-.7 2.2M3.8-3.8v7.6', stroke: true },
  w: { d: 'M0-4.7C2.4-1.5 3.4.5 3.4 2.3a3.4 3.4 0 1 1-6.8 0C-3.4.5-2.4-1.5 0-4.7z', fill: true }
};

const PIN_PATH = 'M0 1c-4.2-4.8-6.2-7.4-6.2-10.6a6.2 6.2 0 1 1 12.4 0C6.2-6.4 4.2-3.8 0 1z';

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

  // 1. Draw Corridors — wide floor band, then a bright center line
  floorGraph.segs.forEach(seg => {
    createSvgElement('line', {
      x1: seg.a[0], y1: seg.a[1], x2: seg.b[0], y2: seg.b[1],
      stroke: '#16263f',
      'stroke-width': 11,
      'stroke-linecap': 'round'
    }, $('roads'));
  });
  floorGraph.segs.forEach(seg => {
    createSvgElement('line', {
      x1: seg.a[0], y1: seg.a[1], x2: seg.b[0], y2: seg.b[1],
      stroke: '#33507c',
      'stroke-width': 1.2,
      'stroke-linecap': 'round'
    }, $('roads'));
  });

  floorGraph.stubs.forEach(([node, pt]) => {
    createSvgElement('line', {
      x1: node.x, y1: node.y, x2: pt[0], y2: pt[1],
      stroke: '#33507c',
      'stroke-width': 1.1,
      'stroke-dasharray': '2.5 2.5'
    }, $('roads'));
  });

  // Faint block letter watermarks, like an architectural plan
  [['A', 390, 280], ['B', 920, 530], ['C', 470, 790]].forEach(([letter, x, y]) => {
    createSvgElement('text', {
      x, y,
      'text-anchor': 'middle',
      'font-size': 110,
      'font-weight': 800,
      fill: 'rgba(120, 160, 220, 0.05)',
      style: 'pointer-events:none'
    }, $('roads')).textContent = letter;
  });

  const isInterFloor = state.currentRoute && state.currentRoute.r && state.currentRoute.r.via;
  const effectiveDest = state.currentRoute ? state.currentRoute.B : state.destPoint;

  // 2. Draw Nodes
  Object.values(floorGraph.N).forEach(node => {
    const isRoom = /[abtrc]/.test(node.t);
    const isHub = node.t === 'x';
    const isConnector = isInterFloor && node.id === state.currentRoute.r.via;
    const isStart = state.startPoint && !state.startPoint.nearest && state.startPoint.f === floorIdx && state.startPoint.id === node.id;
    const isDest = effectiveDest && !effectiveDest.nearest && effectiveDest.f === floorIdx && effectiveDest.id === node.id;

    const group = createSvgElement('g', {
      class: 'nd' + (isConnector ? ' connector-active' : '') + (isStart ? ' mk-start' : '') + (isDest ? ' mk-dest' : '') + (state.washroomPickerMode && node.t === state.washroomPickerMode.g ? ' blink' : ''),
      'data-id': node.id,
      role: 'button',
      tabindex: '0',
      'aria-label': `${getNodeLabel(node)}, ${ROOM_TYPES[node.t] || 'Room'}, ${FLOOR_NAMES[floorIdx]}`
    }, $('nodes'));

    if (isRoom || isHub) {
      // Room tile — label sits inside when the id is short enough
      const shortId = (node.id || '').length <= 8;
      createSvgElement('rect', {
        x: node.x - 23,
        y: node.y - 15,
        width: 46,
        height: 30,
        rx: 4,
        fill: isHub ? '#1a1c38' : '#12203a',
        stroke: isHub ? '#6d5bd0' : '#3b5380',
        'stroke-width': 1.1,
        'stroke-dasharray': isHub ? '3 2' : 'none',
        'vector-effect': 'non-scaling-stroke'
      }, group);
      const labelGroup = createSvgElement('g', { class: 'nl' }, group);
      createSvgElement('text', {
        x: node.x,
        y: shortId ? node.y + 2.4 : node.y + 26,
        class: shortId ? 'room-label' : ''
      }, labelGroup).textContent = (node.id || '').toUpperCase();
    } else {
      // Facility marker — colored chip with a glyph icon
      const c = COLORS[node.t] || '#94a3b8';
      createSvgElement('rect', {
        x: node.x - 10,
        y: node.y - 10,
        width: 20,
        height: 20,
        rx: 6.5,
        class: 'marker-chip',
        fill: c,
        'fill-opacity': 0.14,
        stroke: c,
        'stroke-width': 1.3,
        'vector-effect': 'non-scaling-stroke'
      }, group);
      const glyph = FAC_GLYPHS[node.t];
      if (glyph) {
        createSvgElement('path', {
          d: glyph.d,
          transform: `translate(${node.x} ${node.y})`,
          fill: glyph.fill ? c : 'none',
          stroke: glyph.stroke ? c : 'none',
          'stroke-width': 1.4,
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          style: 'pointer-events:none'
        }, group);
      }
      const labelGroup = createSvgElement('g', { class: 'nl' }, group);
      createSvgElement('text', { x: node.x, y: node.y + 21 }, labelGroup).textContent = (node.id || '').toUpperCase();
    }

    if (isDest) {
      // Destination teardrop pin above the marker
      createSvgElement('path', {
        d: PIN_PATH,
        transform: `translate(${node.x} ${node.y - 16})`,
        fill: '#22d3ee',
        style: 'pointer-events:none'
      }, group);
      createSvgElement('circle', {
        cx: node.x,
        cy: node.y - 16 - 9.6,
        r: 2.3,
        fill: '#06202c',
        style: 'pointer-events:none'
      }, group);
    }

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

  // 3. Draw Start (Green) & Destination (Cyan) Target Rings
  [[state.startPoint, '#22c55e'], [effectiveDest, '#22d3ee']].forEach(([ref, strokeColor]) => {
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
  $('bc-floor').textContent = FLOOR_NAMES[floorIdx];
  $('fl').textContent = FLOOR_NAMES[floorIdx];

  $('fm').innerHTML = '';
  [3, 2, 1, 0].forEach(level => {
    const item = document.createElement('div');
    item.className = level === state.currentFloor ? 'on' : '';
    item.setAttribute('role', 'menuitem');
    item.setAttribute('tabindex', '0');
    item.innerHTML = `<b>${FLOOR_CODES[level]}</b><span>${FLOOR_NAMES[level]}</span>`;
    
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
