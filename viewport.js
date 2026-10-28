import { $ } from './constants.js';

const svg = $('map');
export let viewBox = { x: 100, y: 10, w: 1120, h: 920 };

export const applyViewBox = () => svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`);

// Pixels covered by the floating sidebar (0 when collapsed / on mobile)
const sidebarPadPx = () => {
  const side = $('side');
  if (!side || window.innerWidth <= 860 || side.classList.contains('min')) return 0;
  return side.offsetWidth + 28;
};

export const fitViewport = () => {
  const rect = svg.getBoundingClientRect();
  const aspect = rect.width / (rect.height || 1);
  viewBox.h = 920;
  viewBox.w = 920 * aspect;
  if (viewBox.w < 1120) {
    viewBox.w = 1120;
    viewBox.h = 1120 / aspect;
  }
  // Center the plan in the free area right of the sidebar
  const freeCxPx = (rect.width + sidebarPadPx()) / 2;
  viewBox.x = 650 - freeCxPx * (viewBox.w / rect.width);
  viewBox.y = 470 - viewBox.h / 2;
  applyViewBox();
};

export function zoomViewport(factor, clientX, clientY) {
  const rect = svg.getBoundingClientRect();
  const px = viewBox.x + (clientX - rect.left) / rect.width * viewBox.w;
  const py = viewBox.y + (clientY - rect.top) / rect.height * viewBox.h;
  viewBox.w *= factor;
  viewBox.h *= factor;
  viewBox.x = px - (clientX - rect.left) / rect.width * viewBox.w;
  viewBox.y = py - (clientY - rect.top) / rect.height * viewBox.h;
  applyViewBox();
}

export function zoomToRoute(points) {
  if (!points || points.length < 2) return;
  const xs = points.map(p => p[0]);
  const ys = points.map(p => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const padding = 100;
  const targetW = Math.max(maxX - minX + padding * 2, 400);
  const targetH = Math.max(maxY - minY + padding * 2, 350);
  const rect = svg.getBoundingClientRect();
  const aspect = rect.width / (rect.height || 1);

  let finalW = targetW;
  let finalH = targetH;
  if (finalW / finalH > aspect) {
    finalH = finalW / aspect;
  } else {
    finalW = finalH * aspect;
  }

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  viewBox.w = finalW;
  viewBox.h = finalH;
  viewBox.x = cx - finalW / 2;
  viewBox.y = cy - finalH / 2;
  applyViewBox();
}

// ---- Pointer & Gesture Tracking ----
const activePointers = new Map();
export let dragDistance = 0;
let pinchDistance = 0;

export function setupViewportEvents() {
  svg.addEventListener('wheel', e => {
    e.preventDefault();
    zoomViewport(e.deltaY > 0 ? 1.12 : 0.89, e.clientX, e.clientY);
  }, { passive: false });

  svg.addEventListener('pointerdown', e => {
    activePointers.set(e.pointerId, e);
    dragDistance = 0;
    pinchDistance = 0;
  });

  svg.addEventListener('pointermove', e => {
    const origin = activePointers.get(e.pointerId);
    if (!origin) return;
    const rect = svg.getBoundingClientRect();

    if (activePointers.size === 1) {
      const dx = e.clientX - origin.clientX;
      const dy = e.clientY - origin.clientY;
      const dist = Math.hypot(dx, dy);
      if (dist > 3) dragDistance += dist;
      viewBox.x -= dx / rect.width * viewBox.w;
      viewBox.y -= dy / rect.height * viewBox.h;
      applyViewBox();
    } else if (activePointers.size === 2) {
      activePointers.set(e.pointerId, e);
      const [p1, p2] = [...activePointers.values()];
      const dist = Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);
      if (pinchDistance) zoomViewport(pinchDistance / dist, (p1.clientX + p2.clientX) / 2, (p1.clientY + p2.clientY) / 2);
      pinchDistance = dist;
      dragDistance = 10;
    }
    activePointers.set(e.pointerId, e);
  });

  ['pointerup', 'pointercancel', 'pointerleave'].forEach(type => {
    svg.addEventListener(type, e => {
      activePointers.delete(e.pointerId);
      setTimeout(() => { dragDistance = 0; }, 50);
    });
  });

  $('btn-zin').addEventListener('click', () => {
    const rect = svg.getBoundingClientRect();
    zoomViewport(0.8, rect.left + rect.width / 2, rect.top + rect.height / 2);
  });

  $('btn-zout').addEventListener('click', () => {
    const rect = svg.getBoundingClientRect();
    zoomViewport(1.25, rect.left + rect.width / 2, rect.top + rect.height / 2);
  });

  $('btn-fit').addEventListener('click', () => fitViewport());
  window.addEventListener('resize', fitViewport);
}
