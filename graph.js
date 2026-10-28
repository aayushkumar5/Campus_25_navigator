import { D, L } from './data.js';

export const toCoordKey = p => p[0].toFixed(1) + ',' + p[1].toFixed(1);
export const calcDistance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

export const getNodeLabel = node => {
  if (!node) return '';
  if (node.t === 'g') return 'Gents Washroom (' + node.id + ')';
  if (node.t === 'f') return 'Ladies Washroom (' + node.id + ')';
  if (node.t === 'w') return 'Water Cooler (' + node.id + ')';
  return node.id;
};

// Base Node Data parsed from raw dataset
const BASE_NODES = [];
D.split(';').map(s => s.trim()).filter(Boolean).forEach(s => {
  const [id, t, x, y] = s.split(',');
  BASE_NODES.push({ id, t, x: +x, y: +y });
});

// Line-segment intersection calculation
export function getIntersection(s, t) {
  const [x1, y1] = s.a, [x2, y2] = s.b, [x3, y3] = t.a, [x4, y4] = t.b;
  const d = (x2 - x1) * (y4 - y3) - (y2 - y1) * (x4 - x3);
  if (!d) return null;
  const u = ((x3 - x1) * (y4 - y3) - (y3 - y1) * (x4 - x3)) / d;
  const v = ((x3 - x1) * (y2 - y1) - (y3 - y1) * (x2 - x1)) / d;
  return u >= 0 && u <= 1 && v >= 0 && v <= 1 ? [x1 + u * (x2 - x1), y1 + u * (y2 - y1)] : null;
}

// Build topological graph structure for a specific floor
export function buildFloorGraph(fl) {
  const N = {};
  const gone = fl === 1 
    ? ['LOBBY', 'FACULTY LOUNGE', 'KIIT CAFE', 'STAIRS-7', 'LIFT-13', 'LIFT-14'] 
    : fl > 1 
    ? ['FACULTY LOUNGE', 'KIIT CAFE', 'STAIRS-12'] 
    : [];

  BASE_NODES.forEach(o => {
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
      const p = getIntersection(segs[i], segs[j]);
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
      const d = calcDistance(p, [n.x, n.y]);
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
    const q = s.p.map(p => ({ p, d: calcDistance(p, s.a) })).sort((a, b) => a.d - b.d);
    for (let i = 0; i < q.length - 1; i++) {
      const a = toCoordKey(q[i].p), b = toCoordKey(q[i + 1].p);
      V[a] = q[i].p;
      V[b] = q[i + 1].p;
      if (a !== b) link(a, b, q[i + 1].d - q[i].d);
    }
  });

  stubs.forEach(([n, p]) => {
    link(n.id, toCoordKey(p), calcDistance(p, [n.x, n.y]) + 1);
    V[n.id] = [n.x, n.y];
  });

  return { N, G, V, segs, stubs };
}

export const FLOORS = [0, 1, 2, 3].map(buildFloorGraph);
export const getNodeByRef = ref => ref && FLOORS[ref.f] && FLOORS[ref.f].N[ref.id];

// Min-Priority Queue for O((V + E) log V) Dijkstra
class PriorityQueue {
  constructor() {
    this.heap = [];
  }
  push(node, priority) {
    this.heap.push({ node, priority });
    let idx = this.heap.length - 1;
    while (idx > 0) {
      const parentIdx = (idx - 1) >> 1;
      if (this.heap[idx].priority >= this.heap[parentIdx].priority) break;
      [this.heap[idx], this.heap[parentIdx]] = [this.heap[parentIdx], this.heap[idx]];
      idx = parentIdx;
    }
  }
  pop() {
    if (!this.heap.length) return null;
    const top = this.heap[0];
    const end = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = end;
      let idx = 0;
      const len = this.heap.length;
      while (true) {
        const left = (idx << 1) + 1;
        const right = left + 1;
        let smallest = idx;
        if (left < len && this.heap[left].priority < this.heap[smallest].priority) smallest = left;
        if (right < len && this.heap[right].priority < this.heap[smallest].priority) smallest = right;
        if (smallest === idx) break;
        [this.heap[idx], this.heap[smallest]] = [this.heap[smallest], this.heap[idx]];
        idx = smallest;
      }
    }
    return top;
  }
  isEmpty() {
    return this.heap.length === 0;
  }
}

// Dijkstra shortest path on single floor with Min-Priority Queue
export function dijkstra(graph, src) {
  const distMap = { [src]: 0 };
  const prev = {};
  const visited = new Set();
  const pq = new PriorityQueue();

  pq.push(src, 0);

  while (!pq.isEmpty()) {
    const { node: u, priority: d } = pq.pop();
    if (visited.has(u)) continue;
    visited.add(u);

    if (d > distMap[u]) continue;

    (graph[u] || []).forEach(edge => {
      const newDist = distMap[u] + edge.w;
      if (newDist < (distMap[edge.k] ?? Infinity)) {
        distMap[edge.k] = newDist;
        prev[edge.k] = u;
        pq.push(edge.k, newDist);
      }
    });
  }
  return { distMap, prev };
}

// Single floor pathfinding with infinite-loop guard
export function findFloorPath(floorGraph, startId, endId) {
  const { prev, distMap } = dijkstra(floorGraph.G, startId);
  if (distMap[endId] == null) return null;
  
  let curr = endId;
  const ids = [curr];
  const visited = new Set([curr]);

  while (curr !== startId) {
    curr = prev[curr];
    // Guard against undefined or cyclic reference
    if (!curr || visited.has(curr)) break;
    visited.add(curr);
    ids.unshift(curr);
  }

  if (ids[0] !== startId) return null;

  return {
    cost: distMap[endId],
    pts: ids.map(i => floorGraph.V[i]).filter((p, i, x) => !i || toCoordKey(p) !== toCoordKey(x[i - 1]))
  };
}

// Multi-Floor routing with connector search
function calculateMultiFloorLegs(startRef, endRef, connType) {
  if (startRef.f === endRef.f) {
    const route = findFloorPath(FLOORS[startRef.f], startRef.id, endRef.id);
    return route ? { cost: route.cost, via: null, usedConn: null, legs: [{ f: startRef.f, pts: route.pts }] } : null;
  }

  let best = null;
  const targetType = connType === 'lift' ? 'l' : 's';

  Object.values(FLOORS[startRef.f].N).filter(n => n.t === targetType && FLOORS[endRef.f].N[n.id]).forEach(connector => {
    const leg1 = findFloorPath(FLOORS[startRef.f], startRef.id, connector.id);
    const leg2 = findFloorPath(FLOORS[endRef.f], connector.id, endRef.id);
    if (leg1 && leg2) {
      const cost = leg1.cost + leg2.cost + 90 * Math.abs(startRef.f - endRef.f);
      if (!best || cost < best.cost) {
        best = {
          cost,
          via: connector.id,
          usedConn: connType,
          legs: [
            { f: startRef.f, pts: leg1.pts },
            { f: endRef.f, pts: leg2.pts }
          ]
        };
      }
    }
  });

  return best;
}

// High-level legs routing with fallback support
export function findRouteLegs(startRef, endRef, preferredConn) {
  let result = calculateMultiFloorLegs(startRef, endRef, preferredConn);
  if (!result && startRef.f !== endRef.f) {
    // Fallback to alternate connector (e.g. lift if stairs unavailable)
    const fallbackConn = preferredConn === 'lift' ? 'stairs' : 'lift';
    result = calculateMultiFloorLegs(startRef, endRef, fallbackConn);
    if (result) {
      result.isFallback = true;
    }
  }
  return result;
}
