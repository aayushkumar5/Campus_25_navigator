import { D, L } from './data.js';

const $ = id => document.getElementById(id);
const NS = 'http://www.w3.org/2000/svg';

// Color & Icon Maps
const COL = {
  a: '#6366f1',
  b: '#f97316',
  t: '#14b8a6',
  r: '#f43f5e',
  c: '#8b5cf6',
  s: '#22c55e',
  l: '#a855f7',
  g: '#0ea5e9',
  f: '#ec4899',
  e: '#eab308',
  x: '#06b6d4',
  w: '#38bdf8'
};

const ICO = {
  s: '🪜',
  l: '🛗',
  g: '🚹',
  f: '🚺',
  e: '🚪',
  x: '🏛️',
  w: '💧'
};

const KIND = {
  a: 'BLOCK A CLASS',
  b: 'BLOCK B CLASS',
  t: 'THEORY ROOM',
  r: 'LAB / OFFICE',
  c: 'BLOCK C CLASS',
  s: 'STAIRS',
  l: 'ELEVATOR',
  g: 'GENTS WASHROOM',
  f: 'LADIES WASHROOM',
  e: 'ENTRANCE',
  x: 'FACILITY',
  w: 'WATER COOLER'
};

const FN = ['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor'];
const FC = ['GF', '1F', '2F', '3F'];

// Base Node Data
const B0 = [];
D.split(';').map(s => s.trim()).filter(Boolean).forEach(s => {
  const [id, t, x, y] = s.split(',');
  B0.push({ id, t, x: +x, y: +y });
});

const k = p => p[0].toFixed(1) + ',' + p[1].toFixed(1);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

const svg = $('map');
const vp = $('vp');
const mk = (t, a, p) => {
  const e = document.createElementNS(NS, t);
  for (const x in a) e.setAttribute(x, a[x]);
  (p || vp).appendChild(e);
  return e;
};

const lab = n => {
  if (!n) return '';
  if (n.t === 'g') return 'Gents Washroom (' + n.id + ')';
  if (n.t === 'f') return 'Ladies Washroom (' + n.id + ')';
  if (n.t === 'w') return 'Water Cooler (' + n.id + ')';
  return n.id;
};

function ix(s, t) {
  const [x1, y1] = s.a, [x2, y2] = s.b, [x3, y3] = t.a, [x4, y4] = t.b;
  const d = (x2 - x1) * (y4 - y3) - (y2 - y1) * (x4 - x3);
  if (!d) return null;
  const u = ((x3 - x1) * (y4 - y3) - (y3 - y1) * (x4 - x3)) / d;
  const v = ((x3 - x1) * (y2 - y1) - (y3 - y1) * (x2 - x1)) / d;
  return u >= 0 && u <= 1 && v >= 0 && v <= 1 ? [x1 + u * (x2 - x1), y1 + u * (y2 - y1)] : null;
}

// Build pure graph structure for a specific floor
function make(fl) {
  const N = {};
  const gone = fl === 1 
    ? ['LOBBY', 'FACULTY LOUNGE', 'KIIT CAFE', 'STAIRS-7', 'LIFT-13', 'LIFT-14'] 
    : fl > 1 
    ? ['FACULTY LOUNGE', 'KIIT CAFE', 'STAIRS-12'] 
    : [];

  B0.forEach(o => {
    if (fl && (o.t === 'e' || gone.includes(o.id))) return;
    const id = fl > 1 && o.id === 'LOBBY' 
      ? 'LIBRARY' 
      : fl && /^[ABC]-0\d\d$/.test(o.id) 
      ? o.id.slice(0, 2) + fl + o.id.slice(3) 
      : o.id;
    N[id] = { ...o, id };
  });

  const segs = [], G = {}, V = {}, stubs = [];
  const link = (a, b, w) => {
    (G[a] = G[a] || []).push({ k: b, w });
    (G[b] = G[b] || []).push({ k: a, w });
  };

  L.filter((_, i) => !(fl === 1 ? [1, 17, 18, 19, 20] : fl > 1 ? [1, 19] : []).includes(i))
    .map(p => fl > 1 && p.length === 3 && p[2][0] === 747 && p[2][1] === 820 ? [p[0], p[1], [719, 820]] : p)
    .forEach(p => {
      for (let i = 0; i < p.length - 1; i++) {
        segs.push({ a: p[i], b: p[i + 1], p: [p[i], p[i + 1]] });
      }
    });

  for (let i = 0; i < segs.length; i++) {
    for (let j = i + 1; j < segs.length; j++) {
      const p = ix(segs[i], segs[j]);
      if (p) {
        segs[i].p.push(p);
        segs[j].p.push(p);
      }
    }
  }

  Object.values(N).forEach(n => {
    let best = 1e9, bp, bs;
    segs.forEach(s => {
      const dx = s.b[0] - s.a[0], dy = s.b[1] - s.a[1];
      const u = Math.max(0, Math.min(1, ((n.x - s.a[0]) * dx + (n.y - s.a[1]) * dy) / (dx * dx + dy * dy)));
      const p = [s.a[0] + u * dx, s.a[1] + u * dy];
      const d = dist(p, [n.x, n.y]);
      if (d < best) {
        best = d;
        bp = p;
        bs = s;
      }
    });
    if (bs) {
      bs.p.push(bp);
      stubs.push([n, bp]);
    }
  });

  segs.forEach(s => {
    const q = s.p.map(p => ({ p, d: dist(p, s.a) })).sort((a, b) => a.d - b.d);
    for (let i = 0; i < q.length - 1; i++) {
      const a = k(q[i].p), b = k(q[i + 1].p);
      V[a] = q[i].p;
      V[b] = q[i + 1].p;
      if (a !== b) link(a, b, q[i + 1].d - q[i].d);
    }
  });

  stubs.forEach(([n, p]) => {
    link(n.id, k(p), dist(p, [n.x, n.y]) + 1);
    V[n.id] = [n.x, n.y];
  });

  return { N, G, V, segs, stubs };
}

const F = [0, 1, 2, 3].map(make);
const nd = r => r && F[r.f] && F[r.f].N[r.id];

// Dijkstra shortest path on single floor
function dij(G, src) {
  const d = { [src]: 0 }, pr = {}, done = new Set();
  while (true) {
    let u = null;
    for (const x in d) {
      if (!done.has(x) && (u === null || d[x] < d[u])) u = x;
    }
    if (u === null) break;
    done.add(u);
    (G[u] || []).forEach(e => {
      if (d[u] + e.w < (d[e.k] ?? 1e12)) {
        d[e.k] = d[u] + e.w;
        pr[e.k] = u;
      }
    });
  }
  return { d, pr };
}

function path(X, a, b) {
  const { pr, d } = dij(X.G, a);
  if (d[b] == null) return null;
  let u = b;
  const ids = [u];
  while (u !== a) {
    u = pr[u];
    ids.unshift(u);
  }
  return {
    cost: d[b],
    pts: ids.map(i => X.V[i]).filter((p, i, x) => !i || k(p) !== k(x[i - 1]))
  };
}

// Multi-Floor routing: connects across floors using closest shared stairs or lift
function legs(a, b, connType) {
  if (a.f === b.f) {
    const r = path(F[a.f], a.id, b.id);
    return r ? { cost: r.cost, via: null, legs: [{ f: a.f, pts: r.pts }] } : null;
  }

  let best = null;
  const targetType = connType === 'lift' ? 'l' : 's';

  Object.values(F[a.f].N).filter(n => n.t === targetType && F[b.f].N[n.id]).forEach(c => {
    const r1 = path(F[a.f], a.id, c.id);
    const r2 = path(F[b.f], c.id, b.id);
    if (r1 && r2) {
      const cost = r1.cost + r2.cost + 90 * Math.abs(a.f - b.f);
      if (!best || cost < best.cost) {
        best = {
          cost,
          via: c.id,
          legs: [
            { f: a.f, pts: r1.pts },
            { f: b.f, pts: r2.pts }
          ]
        };
      }
    }
  });

  return best;
}

// ---- Application State ----
let FL = 0;
let active = 's'; // 's' (start) or 'd' (destination)
let from = null;  // { f, id }
let to = null;    // { f, id } or { nearest: 'g'|'f' }
let conn = 'stairs'; // 'stairs' or 'lift'
let R = null;     // Current calculated route object
let S = [];       // Step-by-step instructions
let si = 0;       // Current active step index
let wcm = null;   // Washroom selection mode state

const nm = r => {
  if (!r) return 'Not set';
  if (r.nearest) return 'Nearest ' + (r.nearest === 'g' ? 'Gents' : 'Ladies') + ' Washroom';
  const node = nd(r);
  return (node ? lab(node) : r.id) + ' · ' + FC[r.f];
};

function toast(m) {
  const t = $('toast');
  t.textContent = m;
  t.style.display = 'block';
  setTimeout(() => { t.style.display = 'none'; }, 2200);
}

// Render active floor on SVG canvas with smooth transition
function show(fl) {
  FL = fl;
  const X = F[fl];
  $('roads').innerHTML = '';
  $('nodes').innerHTML = '';

  // Trigger smooth visual transition animation on SVG viewport
  vp.classList.remove('floor-fade');
  void vp.offsetWidth;
  vp.classList.add('floor-fade');

  // Draw Roads & Stubs
  X.segs.forEach(s => {
    mk('line', {
      x1: s.a[0], y1: s.a[1], x2: s.b[0], y2: s.b[1],
      stroke: 'rgba(255, 255, 255, 0.12)',
      'stroke-width': 3,
      'stroke-linecap': 'round'
    }, $('roads'));
  });

  X.stubs.forEach(([n, p]) => {
    mk('line', {
      x1: n.x, y1: n.y, x2: p[0], y2: p[1],
      stroke: 'rgba(255, 255, 255, 0.08)',
      'stroke-width': 2,
      'stroke-dasharray': '3 3'
    }, $('roads'));
  });

  // Check if active inter-floor connection exists
  const isInterFloor = R && R.r && R.r.via;

  // Draw Nodes
  Object.values(X.N).forEach(n => {
    const isRoom = /[abtrc]/.test(n.t);
    const isBlinking = wcm && n.t === wcm.g;
    const isConnector = isInterFloor && n.id === R.r.via;

    const g = mk('g', {
      class: 'nd' + (isBlinking ? ' blink' : '') + (isConnector ? ' connector-active' : ''),
      'data-id': n.id
    }, $('nodes'));

    if (isRoom) {
      mk('rect', {
        x: n.x - 13, y: n.y - 9, width: 26, height: 18,
        rx: 5, fill: COL[n.t] || '#64748b'
      }, g);
    } else {
      mk('circle', {
        cx: n.x, cy: n.y, r: 10,
        fill: '#121217', stroke: COL[n.t] || '#fff', 'stroke-width': 1.8
      }, g);
      mk('text', {
        x: n.x, y: n.y + 4.5, 'text-anchor': 'middle', 'font-size': 11,
        fill: COL[n.t] || '#fff', style: 'pointer-events:none'
      }, g).textContent = ICO[n.t] || '•';
    }

    const gl = mk('g', { class: 'nl' }, g);
    mk('text', { x: n.x, y: n.y + (isRoom ? 21 : 22) }, gl).textContent = (n.id || '').toUpperCase();

    // If active transition stair/lift, render interactive guidance badge above it
    if (isConnector) {
      const targetFloor = (FL === R.A.f ? R.B.f : R.A.f);
      const tag = mk('g', { class: 'connector-tag' }, g);
      mk('rect', {
        x: n.x - 30, y: n.y - 25, width: 60, height: 13,
        rx: 4, fill: '#0284c7', stroke: '#38bdf8', 'stroke-width': 1
      }, tag);
      mk('text', {
        x: n.x, y: n.y - 16, 'text-anchor': 'middle'
      }, tag).textContent = '⚡ TAP TO ' + FC[targetFloor];
    }

    g.onclick = e => {
      e.stopPropagation();
      if (moved) return;

      // If clicking the active stair/lift connector, flip to destination floor immediately!
      if (isConnector) {
        const targetFloor = (FL === R.A.f ? R.B.f : R.A.f);
        const stepIdx = S.findIndex(s => s.f === targetFloor);
        if (stepIdx >= 0) {
          go(stepIdx);
        } else {
          show(targetFloor);
        }
        toast(`Switched to ${FN[targetFloor]} via ${n.id}`);
        return;
      }

      onNode(n);
    };
    n.el = g;
  });

  // Draw Start (Green) and Destination (Red) Target Rings
  [[from, '#22c55e'], [to, '#f43f5e']].forEach(([r, c]) => {
    if (r && !r.nearest && r.f === fl) {
      const n = nd(r);
      if (n) {
        mk('circle', {
          cx: n.x, cy: n.y, r: 18,
          fill: 'none', stroke: c, 'stroke-width': 3,
          style: 'pointer-events:none;filter:drop-shadow(0 0 6px ' + c + ')'
        }, $('nodes'));
      }
    }
  });

  // Update In-Map Subtitle & Top Dropdown
  $('sub').textContent = FN[fl].toUpperCase();
  $('fl').textContent = FC[fl];

  // Update Floor Dropdown Menu
  $('fm').innerHTML = '';
  [3, 2, 1, 0].forEach(v => {
    const d = document.createElement('div');
    d.className = v === FL ? 'on' : '';
    d.innerHTML = `<b>${v ? FC[v] : 'GF'}</b><span>${FN[v]}</span>`;
    d.onmousedown = e => {
      e.preventDefault();
      $('fm').style.display = 'none';
      show(v);
    };
    $('fm').appendChild(d);
  });

  drawRoute();
  banner();
}

function drawRoute() {
  const Rt = $('route');
  const RGlow = $('route-glow');
  const c = $('cur');
  $('arrows').innerHTML = '';
  Rt.removeAttribute('d');
  RGlow.removeAttribute('d');
  c.style.display = 'none';

  if (!R) return;

  const lg = R.r.legs.find(l => l.f === FL);
  if (lg) {
    const pathD = 'M' + lg.pts.map(p => p.join(' ')).join('L');
    Rt.setAttribute('d', pathD);
    RGlow.setAttribute('d', pathD);
    arrows(lg.pts);
  }

  const s = S[si];
  if (s && s.f === FL) {
    c.style.display = 'block';
    c.setAttribute('cx', s.p[0]);
    c.setAttribute('cy', s.p[1]);
  }
}

function banner() {
  let t = '';
  if (wcm) {
    t = `Tap a blinking ${wcm.g === 'g' ? 'Gents' : 'Ladies'} washroom on the ${FN[FL]} to set your start`;
  } else if (R && R.r.via) {
    const cName = conn === 'lift' ? 'LIFT' : 'STAIRS';
    if (FL === R.A.f) {
      t = `INTER-FLOOR · TAKE ${cName} ${R.r.via} → ${FN[R.B.f].toUpperCase()} (TAP TO SWITCH)`;
    } else if (FL === R.B.f) {
      t = `INTER-FLOOR · CONTINUE FROM ${R.r.via} → DESTINATION`;
    }
  }
  $('bn').textContent = t;
  $('bn').style.display = t ? 'block' : 'none';
}

// Banner click handler: instantly flip floors
$('bn').onclick = () => {
  if (R && R.r && R.r.via) {
    const targetFloor = (FL === R.A.f ? R.B.f : R.A.f);
    const stepIdx = S.findIndex(s => s.f === targetFloor);
    if (stepIdx >= 0) go(stepIdx);
    else show(targetFloor);
    toast(`Switched to ${FN[targetFloor]} via ${R.r.via}`);
  }
};

// ---- Directional Chevrons along Route ----
function arrows(P) {
  let carry = 30;
  for (let i = 0; i < P.length - 1; i++) {
    const a = P[i], b = P[i + 1];
    const len = dist(a, b);
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;

    for (let d = carry; d < len; d += 46) {
      const x = a[0] + (b[0] - a[0]) * d / len;
      const y = a[1] + (b[1] - a[1]) * d / len;
      mk('path', {
        d: 'M-5 -4L5 0L-5 4Z',
        fill: '#00f2fe',
        filter: 'drop-shadow(0 0 3px rgba(0, 242, 254, 0.8))',
        transform: `translate(${x} ${y}) rotate(${ang})`
      }, $('arrows'));
      carry = d + 46 - len;
    }
    carry = Math.max(carry, 8);
  }
}

// ---- Viewport Pan & Zoom ----
let vb = { x: 100, y: 10, w: 1120, h: 920 };
const fit = () => {
  const r = svg.getBoundingClientRect();
  const a = r.width / (r.height || 1);
  vb.h = 920;
  vb.w = 920 * a;
  if (vb.w < 1120) {
    vb.w = 1120;
    vb.h = 1120 / a;
  }
  vb.x = 650 - vb.w / 2;
  vb.y = 470 - vb.h / 2;
  set();
};

const set = () => svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);

const pts = new Map();
let moved = 0, pd = 0;

function zoom(f, cx, cy) {
  const r = svg.getBoundingClientRect();
  const px = vb.x + (cx - r.left) / r.width * vb.w;
  const py = vb.y + (cy - r.top) / r.height * vb.h;
  vb.w *= f;
  vb.h *= f;
  vb.x = px - (cx - r.left) / r.width * vb.w;
  vb.y = py - (cy - r.top) / r.height * vb.h;
  set();
}

svg.addEventListener('wheel', e => {
  e.preventDefault();
  zoom(e.deltaY > 0 ? 1.12 : 0.89, e.clientX, e.clientY);
}, { passive: false });

svg.addEventListener('pointerdown', e => {
  pts.set(e.pointerId, e);
  moved = 0;
  pd = 0;
});

svg.addEventListener('pointermove', e => {
  const o = pts.get(e.pointerId);
  if (!o) return;
  const r = svg.getBoundingClientRect();
  if (pts.size === 1) {
    const dx = e.clientX - o.clientX;
    const dy = e.clientY - o.clientY;
    if (Math.abs(dx) + Math.abs(dy) > 0) moved += Math.abs(dx) + Math.abs(dy);
    vb.x -= dx / r.width * vb.w;
    vb.y -= dy / r.height * vb.h;
    set();
  } else if (pts.size === 2) {
    pts.set(e.pointerId, e);
    const [a, b] = [...pts.values()];
    const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    if (pd) zoom(pd / d, (a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2);
    pd = d;
    moved = 10;
  }
  pts.set(e.pointerId, e);
});

['pointerup', 'pointercancel', 'pointerleave'].forEach(t => {
  svg.addEventListener(t, e => {
    pts.delete(e.pointerId);
    setTimeout(() => { moved = 0; }, 50);
  });
});

// Zoom and reset buttons
$('btn-zin').onclick = () => {
  const r = svg.getBoundingClientRect();
  zoom(0.8, r.left + r.width / 2, r.top + r.height / 2);
};
$('btn-zout').onclick = () => {
  const r = svg.getBoundingClientRect();
  zoom(1.25, r.left + r.width / 2, r.top + r.height / 2);
};
$('btn-fit').onclick = () => fit();

// ---- UI Interaction Logic ----
function refresh() {
  $('vf').textContent = nm(from);
  $('vt').textContent = nm(to);
  $('cf').classList.toggle('on', active === 's');
  $('ct').classList.toggle('on', active === 'd');

  // Show stairs/lift connector preference chips if crossing floors
  $('cn').style.display = from && to && !to.nearest && from.f !== to.f ? 'flex' : 'none';
  $('clr').style.display = from || to ? 'block' : 'none';
  document.querySelectorAll('.qn button').forEach(b => {
    b.disabled = !from;
  });
}

function setActive(a) {
  active = a;
  $('ts').classList.toggle('on', a === 's');
  $('td').classList.toggle('on', a === 'd');
  $('q').placeholder = a === 's' 
    ? 'Search starting point (e.g. A-001, B-205, Lift)...' 
    : 'Search destination room, facility, exit...';
  refresh();
}

function clearRoute() {
  R = null;
  S = [];
  $('sum').style.display = 'none';
  $('steps').style.display = 'none';
  drawRoute();
  banner();
}

function setRef(r) {
  if (active === 's') {
    from = r;
    setActive('d');
  } else {
    to = r;
  }
  wcm = null;
  $('wc').innerHTML = '';
  $('q').value = '';
  $('dd').style.display = 'none';
  closeNodeCard();
  clearRoute();
  show(r.f != null ? r.f : FL);
  refresh();

  // If both endpoints are set, calculate automatically
  if (from && to) calc();
}

function onNode(n) {
  if (wcm) {
    if (n.t === wcm.g) {
      setRef({ f: FL, id: n.id });
    } else {
      toast('Tap a blinking icon on the map');
    }
    return;
  }
  openNodeCard(n);
}

// Universal search across all floors
function items(q) {
  const o = [];
  if (!q || 'washroom'.includes(q) || 'toilet'.includes(q)) {
    o.push({ wc: 1 });
  }

  F.forEach((X, f) => {
    Object.values(X.N).forEach(n => {
      if (/[gf]/.test(n.t) || (/[sl]/.test(n.t) && f !== FL) || (!q && f !== FL)) return;
      const fullText = (n.id + ' ' + lab(n) + ' ' + (KIND[n.t] || '')).toLowerCase();
      if (fullText.includes(q)) {
        o.push({ f, id: n.id });
      }
    });
  });

  return o.sort((a, b) => {
    const aExact = (a.id || '').toLowerCase() === q;
    const bExact = (b.id || '').toLowerCase() === q;
    if (aExact !== bExact) return bExact ? 1 : -1;
    return (a.f === FL ? 0 : 1) - (b.f === FL ? 0 : 1);
  }).slice(0, 30);
}

let activeDropdownIdx = -1;
function renderDD() {
  const q = $('q').value.trim().toLowerCase();
  const dd = $('dd');
  dd.innerHTML = '';
  $('qx').hidden = !q;
  activeDropdownIdx = -1;

  const list = items(q);
  list.forEach((it, idx) => {
    const d = document.createElement('div');
    if (it.wc) {
      d.innerHTML = `
        <span>Washroom <small>${active === 's' ? 'choose floor & type' : 'nearest to you'}</small></span>
        <span class="bd">WASHROOM</span>
      `;
    } else {
      const n = nd(it);
      const isExact = q && n.id.toLowerCase() === q;
      const isType = q && !isExact && (KIND[n.t] || '').toLowerCase().includes(q) && !n.id.toLowerCase().includes(q);

      d.innerHTML = `
        <span>${lab(n)}</span>
        <span>
          ${isExact ? '<span class="bd ex">EXACT</span>' : ''}
          ${isType ? '<span class="bd">TYPE</span>' : ''}
          <span class="bd">${KIND[n.t] || 'ROOM'}</span>
          <span class="bd ex">${FC[it.f]}</span>
        </span>
      `;
    }

    d.onmousedown = e => {
      e.preventDefault();
      if (it.wc) wcFlow();
      else setRef(it);
    };
    dd.appendChild(d);
  });

  dd.style.display = dd.children.length ? 'block' : 'none';
}

$('q').oninput = renderDD;
$('q').onfocus = renderDD;
$('q').onblur = () => {
  setTimeout(() => { $('dd').style.display = 'none'; }, 180);
};
$('qx').onclick = () => {
  $('q').value = '';
  renderDD();
};

$('q').onkeydown = e => {
  const dd = $('dd');
  const itemsEl = dd.children;
  if (!itemsEl.length || dd.style.display === 'none') return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    activeDropdownIdx = (activeDropdownIdx + 1) % itemsEl.length;
    updateActive(itemsEl);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    activeDropdownIdx = (activeDropdownIdx - 1 + itemsEl.length) % itemsEl.length;
    updateActive(itemsEl);
  } else if (e.key === 'Enter' && activeDropdownIdx >= 0) {
    e.preventDefault();
    itemsEl[activeDropdownIdx].dispatchEvent(new MouseEvent('mousedown'));
  }
};

function updateActive(itemsEl) {
  [...itemsEl].forEach((el, idx) => {
    el.classList.toggle('selected', idx === activeDropdownIdx);
    if (idx === activeDropdownIdx) el.scrollIntoView({ block: 'nearest' });
  });
}

// Washroom Flow Helper
function wcFlow() {
  const w = $('wc');
  $('dd').style.display = 'none';
  $('q').value = '';

  const chips = (h, arr, cb) => {
    w.innerHTML = `<div class="chips"><small>${h}</small></div>`;
    arr.forEach(([t, v]) => {
      const b = document.createElement('button');
      b.textContent = t;
      b.onclick = () => cb(v);
      w.firstChild.appendChild(b);
    });
  };

  const gender = cb => chips('Gents or Ladies?', [['♂ Gents', 'g'], ['♀ Ladies', 'f']], cb);

  if (active === 'd') {
    gender(g => {
      to = { nearest: g };
      w.innerHTML = '';
      clearRoute();
      refresh();
      if (from) calc();
    });
  } else {
    chips('Which floor are you on?', FC.map((c, i) => [c, i]), f => {
      show(f);
      gender(g => {
        wcm = { g };
        w.innerHTML = '';
        show(FL);
      });
    });
  }
}

// Generate Turn-by-Turn Leg Descriptions
function walk(P) {
  const M = [P[0]];
  for (let i = 1; i < P.length - 1; i++) {
    const a = M[M.length - 1], b = P[i], c2 = P[i + 1];
    if (Math.abs((b[0] - a[0]) * (c2[1] - b[1]) - (b[1] - a[1]) * (c2[0] - b[0])) > 1) {
      M.push(b);
    }
  }
  M.push(P[P.length - 1]);

  const o = [];
  for (let i = 0; i < M.length - 1; i++) {
    const a = M[i], b = M[i + 1];
    const m = Math.round(dist(a, b) * 0.15);
    let t = `Walk straight for ~${m} m`;
    let icon = '⬆️';

    if (i < M.length - 2) {
      const c2 = M[i + 2];
      const cr = (b[0] - a[0]) * (c2[1] - b[1]) - (b[1] - a[1]) * (c2[0] - b[0]);
      if (Math.abs(cr) > 1) {
        t += cr > 0 ? ', then turn right' : ', then turn left';
        icon = cr > 0 ? '↱' : '↰';
      }
    }
    if (m > 0) o.push({ t, p: b, icon });
  }
  return o;
}

function mkSteps(r, A, B) {
  const o = [{ f: A.f, t: 'Start at ' + lab(nd(A)), p: r.legs[0].pts[0], icon: '🚩' }];
  const cName = conn === 'lift' ? 'lift' : 'stairs';

  r.legs.forEach((lg, i) => {
    walk(lg.pts).forEach(s => o.push({ f: lg.f, ...s }));
    if (i === 0 && r.legs.length > 1) {
      const direction = B.f > A.f ? 'up' : 'down';
      o.push({
        f: lg.f,
        t: `Take the ${cName} (${r.via}) ${direction} to the ${FN[B.f]}`,
        p: lg.pts[lg.pts.length - 1],
        icon: conn === 'lift' ? '🛗' : '🪜'
      });
      o.push({
        f: B.f,
        t: `Exit ${r.via} on the ${FN[B.f]}`,
        p: r.legs[1].pts[0],
        icon: '🚪'
      });
    }
  });

  const lp = r.legs[r.legs.length - 1].pts;
  o.push({ f: B.f, t: 'Arrive at ' + lab(nd(B)), p: lp[lp.length - 1], icon: '🎯' });
  return o;
}

// Calculate Route Path
function calc() {
  if (!from || !to) {
    toast('Set both a start and a destination');
    return;
  }

  let B = to;
  if (to.nearest) {
    let best = null;
    Object.values(F[from.f].N).forEach(n => {
      if (n.t === to.nearest) {
        const r = legs(from, { f: from.f, id: n.id }, conn);
        if (r && (!best || r.cost < best.r.cost)) {
          best = { r, B: { f: from.f, id: n.id } };
        }
      }
    });
    if (!best) {
      toast('No washroom found on this floor');
      return;
    }
    B = best.B;
  }

  if (from.f === B.f && from.id === B.id) {
    toast('Start and destination are the same');
    return;
  }

  const r = legs(from, B, conn);
  if (!r) {
    toast(`No ${conn} connection available between these floors`);
    return;
  }

  R = { r, A: from, B };
  S = mkSteps(r, from, B);
  si = 0;
  const m = Math.round(r.cost * 0.15);
  const timeMin = Math.max(1, Math.round(m / 70));

  $('sum').innerHTML = `
    <b>✓ Route Found</b>
    <span>${lab(nd(from))} → ${lab(nd(B))}</span>
    <span>${m} m · ~${timeMin} min walk${r.via ? ' · via ' + (conn === 'lift' ? 'Lift ' : 'Stairs ') + r.via : ''}</span>
  `;
  $('sum').style.display = 'flex';
  $('steps').style.display = 'block';

  if (from.f !== FL) {
    show(from.f);
  } else {
    drawRoute();
    banner();
  }

  go(0);
}

function go(i) {
  si = Math.max(0, Math.min(S.length - 1, i));
  const s = S[si];

  $('sn').textContent = `STEP ${si + 1} OF ${S.length} · ${FC[s.f]}`;
  $('stx').textContent = s.t;
  $('step-icon').textContent = s.icon || '📍';
  $('pv').disabled = !si;
  $('nx').disabled = si === S.length - 1;

  const pct = S.length > 1 ? (si / (S.length - 1)) * 100 : 100;
  $('step-progress').style.width = `${pct}%`;

  $('sl').innerHTML = S.map((x, j) => `
    <li class="${j === si ? 'on' : ''}" data-idx="${j}">
      ${x.icon || '•'} <b>Step ${j + 1} (${FC[x.f]}):</b> ${x.t}
    </li>
  `).join('');

  document.querySelectorAll('#sl li').forEach(li => {
    li.onclick = () => go(+li.dataset.idx);
  });

  // Automatically switch floor map if step is on another floor
  if (s.f !== FL) {
    show(s.f);
  } else {
    drawRoute();
  }
}

$('pv').onclick = () => go(si - 1);
$('nx').onclick = () => go(si + 1);
$('ex2').onclick = () => {
  const l = $('sl');
  l.style.display = l.style.display === 'block' ? 'none' : 'block';
};

$('calc').onclick = calc;
$('ts').onclick = () => setActive('s');
$('td').onclick = () => setActive('d');
$('cf').onclick = () => setActive('s');
$('ct').onclick = () => setActive('d');

$('clr').onclick = () => {
  from = null;
  to = null;
  wcm = null;
  $('wc').innerHTML = '';
  clearRoute();
  setActive('s');
  show(FL);
  refresh();
};

$('sw').onclick = () => {
  if (to && to.nearest) {
    toast("Can't swap with a nearest-washroom target");
    return;
  }
  const temp = from;
  from = to;
  to = temp;
  clearRoute();
  show(FL);
  refresh();
  if (from && to) calc();
};

// Stairs / Lift preference chips
document.querySelectorAll('#cn button').forEach(b => {
  b.onclick = () => {
    conn = b.dataset.c;
    document.querySelectorAll('#cn button').forEach(x => x.classList.toggle('on', x === b));
    if (R) calc();
  };
});

// Quick Navigation shortcuts
document.querySelectorAll('.qn button').forEach(b => {
  b.onclick = () => {
    const t = b.dataset.q;
    if (!from) {
      toast('Please set a start point first');
      return;
    }

    if (t === 'g' || t === 'f') {
      to = { nearest: t };
    } else {
      let best = null;
      const searchFloors = t === 'e' ? [0] : [from.f];

      searchFloors.forEach(f => {
        Object.values(F[f].N).forEach(n => {
          if (n.t === t && !(f === from.f && n.id === from.id)) {
            const r = legs(from, { f, id: n.id }, conn);
            if (r && (!best || r.cost < best.c)) {
              best = { c: r.cost, ref: { f, id: n.id } };
            }
          }
        });
      });

      if (!best) {
        toast('None found nearby on this floor');
        return;
      }
      to = best.ref;
    }

    refresh();
    show(FL);
    calc();
  };
});

// Node Quick Action Card
let activeNode = null;
function openNodeCard(n) {
  activeNode = n;
  const card = $('node-card');
  $('nc-title').textContent = lab(n);
  $('nc-type').textContent = KIND[n.t] || 'ROOM';
  $('nc-floor').textContent = FC[FL];
  $('nc-icon').textContent = ICO[n.t] || '📍';
  card.style.display = 'block';
}

function closeNodeCard() {
  $('node-card').style.display = 'none';
  activeNode = null;
}

$('nc-close').onclick = closeNodeCard;
$('nc-set-start').onclick = () => {
  if (activeNode) {
    setRef({ f: FL, id: activeNode.id });
  }
};
$('nc-set-dest').onclick = () => {
  if (activeNode) {
    setRef({ f: FL, id: activeNode.id });
  }
};

// Dismiss modals on outside canvas tap
svg.addEventListener('click', () => {
  if (!moved) {
    closeNodeCard();
    $('fm').style.display = 'none';
    $('dd').style.display = 'none';
  }
});

// Floor Selector Toggle
$('fb').onclick = e => {
  e.stopPropagation();
  const m = $('fm');
  m.style.display = m.style.display === 'block' ? 'none' : 'block';
};

$('col').onclick = () => {
  const h = $('sb').style.display === 'none';
  $('sb').style.display = h ? 'block' : 'none';
  $('col').textContent = h ? '‹' : '›';
};

$('gear').onclick = () => svg.classList.toggle('nolab');

addEventListener('resize', fit);

// Initial Load
show(0);
fit();
setActive('s');

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
