# Campus 25 Navigator

Indoor campus navigation for Campus 25: pick a start and destination, get the shortest path and step-by-step directions, or jump to the nearest stairs, lift, washroom or exit. Covers Ground, 1st, 2nd and 3rd floors.

## Run
```bash
npm install
npm run dev      # or: npx serve .
```

## Structure
- `index.html` - app shell
- `css/style.css` - styles
- `js/data.js` - hand-entered node coordinates (`D`) and corridor polylines (`L`)
- `js/main.js` - graph building, Dijkstra routing, map pan/zoom, UI
- `manifest.webmanifest`, `sw.js` - installable PWA / offline cache

## How routing works
Corridors are polylines; they are split at intersections, rooms and facilities snap to the nearest corridor, and Dijkstra runs over the resulting graph. Floors share one layout; `build(floor)` renames rooms (A-001 -> A-101) and removes floor-specific places.

## Ideas
Cross-floor routing via lifts/stairs, water cooler locations, per-floor JSON data.
