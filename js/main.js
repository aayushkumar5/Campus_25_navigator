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

// Base Node Data
const B0 = [];
D.split(';').map(s => s.trim()).filter(Boolean).forEach(s => {
  const [id, t, x, y] = s.split(',');
  B0.push({ id, t, x: +x, y: +y });
});

let N = {}, segs = [], G = {}, V = {}, stubs = [], FL = 0;
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

// ---- Graph Builder ----
function build(fl) {
  N = {};
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

  $('roads').innerHTML = '';
  $('nodes').innerHTML = '';
  segs = [];
  G = {};
  V = {};
  stubs = [];

  L.filter((_, i) => !(fl === 1 ? [1, 17, 18, 19, 20] : fl > 1 ? [1, 19] : []).includes(i))
    .map(p => fl > 1 && p.length === 3 && p[2][0] === 747 && p[2][1] === 820 ? [p[0], p[1], [719, 820]] : p)
    .forEach(p => {
      for (let i = 0; i < p.length - 1; i++) {
        segs.push({ a: p[i], b: p[i + 1], p: [p[i], p[i + 1]] });
      }
    });

  // Intersect segments
  function ix(s, t) {
    const [x1, y1] = s.a, [x2, y2] = s.b, [x3, y3] = t.a, [x4, y4] = t.b;
    const d = (x2 - x1) * (y4 - y3) - (y2 - y1) * (x4 - x3);
    if (!d) return null;
    const u = ((x3 - x1) * (y4 - y3) - (y3 - y1) * (x4 - x3)) / d;
    const v = ((x3 - x1) * (y2 - y1) - (y3 - y1) * (x2 - x1)) / d;
    return u >= 0 && u <= 1 && v >= 0 && v <= 1 ? [x1 + u * (x2 - x1), y1 + u * (y2 - y1)] : null;
  }

  for (let i = 0; i < segs.length; i++) {
    for (let j = i + 1; j < segs.length; j++) {
      const p = ix(segs[i], segs[j]);
      if (p) {
        segs[i].p.push(p);
        segs[j].p.push(p);
      }
    }
  }

  const link = (a, b, w) => {
    (G[a] = G[a] || []).push({ k: b, w });
    (G[b] = G[b] || []).push({ k: a, w });
  };

  // Snap nodes to nearest path
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
      n.proj = bp;
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

  // Render Map Paths & Nodes
  segs.forEach(s => {
    mk('line', {
      x1: s.a[0], y1: s.a[1], x2: s.b[0], y2: s.b[1],
      stroke: 'rgba(255, 255, 255, 0.12)',
      'stroke-width': 3,
      'stroke-linecap': 'round'
    }, $('roads'));
  });

  stubs.forEach(([n, p]) => {
    mk('line', {
      x1: n.x, y1: n.y, x2: p[0], y2: p[1],
      stroke: 'rgba(255, 255, 255, 0.08)',
      'stroke-width': 2,
      'stroke-dasharray': '3 3'
    }, $('roads'));
  });

  Object.values(N).forEach(n => {
    const g = mk('g', { class: 'nd', 'data-id': n.id }, $('nodes'));
    if (n.t.match(/[abtrc]/)) {
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
    mk('text', { x: n.x, y: n.y + (n.t.match(/[abtrc]/) ? 21 : 22) }, gl).textContent = (n.id || '').toUpperCase();

    g.onclick = e => {
      e.stopPropagation();
      if (moved) return;
      openNodeCard(n);
    };
    n.el = g;
  });
}

// ---- Dijkstra Shortest Path ----
function dij(src) {
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

// Zoom & View Buttons
$('btn-zin').onclick = () => {
  const r = svg.getBoundingClientRect();
  zoom(0.8, r.left + r.width / 2, r.top + r.height / 2);
};
$('btn-zout').onclick = () => {
  const r = svg.getBoundingClientRect();
  zoom(1.25, r.left + r.width / 2, r.top + r.height / 2);
};
$('btn-fit').onclick = () => fit();

// ---- Search & Autocomplete ----
const sel = { s: null, e: null };

function field(f, inp, dd, x) {
  const i = $(inp), d = $(dd);
  let activeIndex = -1;

  const show = () => {
    const q = i.value.trim().toLowerCase();
    d.innerHTML = '';
    activeIndex = -1;

    const matches = Object.values(N).filter(n => {
      const fullText = (n.id + ' ' + lab(n) + ' ' + (KIND[n.t] || '')).toLowerCase();
      return fullText.includes(q);
    }).sort((a, b) => {
      const aExact = a.id.toLowerCase() === q;
      const bExact = b.id.toLowerCase() === q;
      return (bExact ? 1 : 0) - (aExact ? 1 : 0);
    }).slice(0, 30);

    matches.forEach((n, idx) => {
      const o = document.createElement('div');
      const isExact = q && n.id.toLowerCase() === q;
      const isType = q && !isExact && (KIND[n.t] || '').toLowerCase().includes(q) && !n.id.toLowerCase().includes(q);

      o.innerHTML = `
        <span>${lab(n)}</span>
        <span>
          ${isExact ? '<span class="bd ex">EXACT</span>' : ''}
          ${isType ? '<span class="bd">TYPE</span>' : ''}
          <span class="bd">${KIND[n.t] || 'ROOM'}</span>
        </span>
      `;

      o.onmousedown = ev => {
        ev.preventDefault();
        pick(f, n.id);
      };
      d.appendChild(o);
    });

    d.style.display = d.children.length ? 'block' : 'none';
  };

  i.oninput = () => {
    sel[f] = null;
    show();
    ui();
  };

  i.onfocus = show;
  i.onblur = () => {
    setTimeout(() => { d.style.display = 'none'; }, 150);
  };

  i.onkeydown = e => {
    const items = d.children;
    if (!items.length || d.style.display === 'none') return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % items.length;
      updateActive(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + items.length) % items.length;
      updateActive(items);
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      items[activeIndex].dispatchEvent(new MouseEvent('mousedown'));
    }
  };

  function updateActive(items) {
    [...items].forEach((el, idx) => {
      el.classList.toggle('selected', idx === activeIndex);
      if (idx === activeIndex) el.scrollIntoView({ block: 'nearest' });
    });
  }

  $(x).onclick = () => {
    i.value = '';
    sel[f] = null;
    route();
    ui();
  };
}

function pick(f, id) {
  if (!N[id]) return;
  sel[f] = id;
  $(f).value = lab(N[id]);
  $(f === 's' ? 'sd' : 'ed').style.display = 'none';
  route();
  ui();
  closeNodeCard();
}

field('s', 's', 'sd', 'sx');
field('e', 'e', 'ed', 'ex');

const ui = () => {
  $('sx').hidden = !$('s').value;
  $('ex').hidden = !$('e').value;
  $('clr').style.display = ($('s').value || $('e').value) ? 'block' : 'none';
  document.querySelectorAll('.qn button').forEach(b => {
    b.disabled = !sel.s;
  });
};

$('sw').onclick = () => {
  const [a, b] = [sel.s, sel.e];
  sel.s = b;
  sel.e = a;
  $('s').value = b && N[b] ? lab(N[b]) : '';
  $('e').value = a && N[a] ? lab(N[a]) : '';
  route();
  ui();
};

$('clr').onclick = () => {
  sel.s = null;
  sel.e = null;
  $('s').value = '';
  $('e').value = '';
  route();
  ui();
  closeNodeCard();
};

// Quick Navigation buttons
document.querySelectorAll('.qn button').forEach(b => {
  b.onclick = () => {
    if (!sel.s) return;
    const { d } = dij(sel.s);
    const t = b.dataset.q;
    let best = null;

    Object.values(N).forEach(n => {
      if (n.id !== sel.s && n.t === t && (t !== 'x' || n.id !== 'FACULTY LOUNGE') && d[n.id] != null) {
        if (!best || d[n.id] < d[best]) best = n.id;
      }
    });

    if (best) {
      pick('e', best);
    } else {
      toast(t === 'w' ? 'No water coolers found nearby on this floor' : 'No destination found');
    }
  };
});

function toast(m) {
  const t = $('toast');
  t.textContent = m;
  t.style.display = 'block';
  setTimeout(() => { t.style.display = 'none'; }, 2200);
}

// ---- Route & Step-by-Step Navigation ----
let P = [], S = [], si = 0;

function route() {
  const R = $('route');
  const RGlow = $('route-glow');
  const c = $('cur');
  $('arrows').innerHTML = '';
  P = [];
  S = [];

  if (!sel.s || !sel.e || sel.s === sel.e) {
    R.removeAttribute('d');
    RGlow.removeAttribute('d');
    c.style.display = 'none';
    $('steps').style.display = 'none';
    return;
  }

  const { pr, d } = dij(sel.s);
  if (d[sel.e] == null) {
    toast('No path found between selected rooms');
    return;
  }

  let u = sel.e;
  const ids = [u];
  while (u !== sel.s) {
    u = pr[u];
    ids.unshift(u);
  }

  P = ids.map(i => V[i]).filter((p, i, a) => !i || k(p) !== k(a[i - 1]));
  const pathD = 'M' + P.map(p => p.join(' ')).join('L');
  R.setAttribute('d', pathD);
  RGlow.setAttribute('d', pathD);
  arrows(P);

  // Collinear points compression and instructions
  const M = [P[0]];
  for (let i = 1; i < P.length - 1; i++) {
    const a = M[M.length - 1], b = P[i], c2 = P[i + 1];
    if (Math.abs((b[0] - a[0]) * (c2[1] - b[1]) - (b[1] - a[1]) * (c2[0] - b[0])) > 1) {
      M.push(b);
    }
  }
  M.push(P[P.length - 1]);

  let totalDist = 0;
  S = [{ t: 'Start at ' + lab(N[sel.s]), p: P[0], icon: '🚩' }];

  for (let i = 0; i < M.length - 1; i++) {
    const a = M[i], b = M[i + 1];
    const m = Math.round(dist(a, b) * 0.15);
    totalDist += m;
    let tx = `Walk straight for ~${m} m`;
    let icon = '⬆️';

    if (i < M.length - 2) {
      const c2 = M[i + 2];
      const cr = (b[0] - a[0]) * (c2[1] - b[1]) - (b[1] - a[1]) * (c2[0] - b[0]);
      if (Math.abs(cr) > 1) {
        tx += cr > 0 ? ', then turn right' : ', then turn left';
        icon = cr > 0 ? '↱' : '↰';
      }
    }
    if (m > 0) S.push({ t: tx, p: b, icon });
  }

  S.push({ t: 'Arrive at ' + lab(N[sel.e]), p: P[P.length - 1], icon: '🎯' });

  $('route-dist').textContent = `~${totalDist} m • ${Math.ceil(totalDist / 1.2)}s`;
  go(0);
  $('steps').style.display = 'block';
  place();
}

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

function go(i) {
  si = Math.max(0, Math.min(S.length - 1, i));
  const s = S[si];

  $('sn').textContent = `STEP ${si + 1} OF ${S.length}`;
  $('stx').textContent = s.t;
  $('step-icon').textContent = s.icon || '📍';
  $('pv').disabled = !si;
  $('nx').disabled = si === S.length - 1;

  // Progress Bar
  const pct = S.length > 1 ? (si / (S.length - 1)) * 100 : 100;
  $('step-progress').style.width = `${pct}%`;

  // Step List
  $('sl').innerHTML = S.map((x, j) => `
    <li class="${j === si ? 'on' : ''}" data-idx="${j}">
      ${x.icon || '•'} <b>Step ${j + 1}:</b> ${x.t}
    </li>
  `).join('');

  document.querySelectorAll('#sl li').forEach(li => {
    li.onclick = () => go(+li.dataset.idx);
  });

  // Highlight Current Marker on Map
  const c = $('cur');
  c.style.display = 'block';
  c.setAttribute('cx', s.p[0]);
  c.setAttribute('cy', s.p[1]);
}

$('pv').onclick = () => go(si - 1);
$('nx').onclick = () => go(si + 1);
$('ex2').onclick = () => {
  const l = $('sl');
  l.style.display = l.style.display === 'block' ? 'none' : 'block';
};

const place = () => {
  if (window.innerWidth > 768) {
    $('steps').style.top = ($('side').offsetHeight + 32) + 'px';
  }
};

$('col').onclick = () => {
  const h = $('sb').style.display === 'none';
  $('sb').style.display = h ? 'block' : 'none';
  $('col').textContent = h ? '‹' : '›';
  place();
};

$('gear').onclick = () => svg.classList.toggle('nolab');
addEventListener('resize', () => { fit(); place(); });

// ---- Node Quick Card Popup ----
let activeNode = null;
function openNodeCard(n) {
  activeNode = n;
  const card = $('node-card');
  $('nc-title').textContent = lab(n);
  $('nc-type').textContent = KIND[n.t] || 'ROOM';
  $('nc-icon').textContent = ICO[n.t] || '📍';
  card.style.display = 'block';
}

function closeNodeCard() {
  $('node-card').style.display = 'none';
  activeNode = null;
}

$('nc-close').onclick = closeNodeCard;
$('nc-set-start').onclick = () => {
  if (activeNode) pick('s', activeNode.id);
};
$('nc-set-dest').onclick = () => {
  if (activeNode) pick('e', activeNode.id);
};

// Dismiss popups and dropdowns on SVG click
svg.addEventListener('click', () => {
  if (!moved) {
    closeNodeCard();
    $('fm').style.display = 'none';
    $('sd').style.display = 'none';
    $('ed').style.display = 'none';
  }
});

// ---- Floor Switcher ----
const FLS = [
  ['3F', '3rd Floor', 3, false],
  ['2F', '2nd Floor', 2, false],
  ['1F', '1st Floor', 1, false],
  ['GF', 'Ground Floor', 0, false]
];

$('fm').innerHTML = '';
FLS.forEach(([c, n, v, off]) => {
  const d = document.createElement('div');
  d.className = (v === FL ? 'on ' : '') + (off ? 'off' : '');
  d.innerHTML = `<b>${c}</b><span>${n}${off ? ' (soon)' : ''}</span>`;

  d.onmousedown = e => {
    e.preventDefault();
    if (off) return;
    FL = v;
    $('fl').textContent = c;
    sel.s = null;
    sel.e = null;
    $('s').value = '';
    $('e').value = '';
    build(v);
    route();
    ui();
    [...$('fm').children].forEach(x => x.classList.remove('on'));
    d.classList.add('on');
    $('fm').style.display = 'none';
    closeNodeCard();
  };
  $('fm').appendChild(d);
});

$('fb').onclick = e => {
  e.stopPropagation();
  const m = $('fm');
  m.style.display = m.style.display === 'block' ? 'none' : 'block';
};

// Initial Setup
build(0);
fit();
ui();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
