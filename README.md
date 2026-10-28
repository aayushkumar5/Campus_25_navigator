# Campus 25 Navigator

Indoor navigation and shortest-path routing application for KIIT University Campus 25.

Built with vanilla ES modules, custom SVG vector rendering, Min-Priority Queue Dijkstra pathfinding, and an offline-first PWA architecture. Zero UI framework dependencies.

---

## Overview

Campus 25 Navigator provides topological indoor routing across four levels (Ground, 1st, 2nd, and 3rd floors). The application maps multi-building corridor graphs, models vertical connectors (stairs and elevators), and delivers turn-by-turn walking guidance with real-world distance and step estimations.

---

## Technical Highlights

### Pathfinding & Graph Modeling
- **Graph Topology**: Corridors are modeled as planar line segments with automatic orthogonal room snapping and intersection detection.
- **Priority Queue Dijkstra**: Shortest paths computed in $O((V + E) \log V)$ time using a custom MinHeap implementation.
- **Multi-Floor Routing**: Computes compound routes across floors using vertical connector nodes (stairs and elevators).
- **Accessibility / Step-Free Mode**: Constrains vertical pathfinding strictly to elevator shafts for wheelchair accessibility.
- **Connector Fallback**: Automatically re-routes via alternate vertical connectors if the preferred connector is unavailable between selected floors.

### SVG Canvas & Viewport Engine
- **Vector Rendering**: Direct DOM SVG rendering with hardware-accelerated transforms for zero-dependency pan, scroll, and pinch-to-zoom.
- **Architectural Floor Plan**: Multi-layered corridor stroke styling, visual wing watermarks (Blocks A, B, C), in-tile room labeling, and dynamic destination markers.
- **Camera Tracking**: Viewport automatically offsets to accommodate floating sidebar panels on desktop and dynamically pans (`centerOnStep`) to track active navigation steps.
- **Animated Route Polylines**: CSS stroke-dashoffset animations indicate travel direction along the calculated path.

### Search & Discovery
- **Fuzzy Search Index**: Debounced client-side index covering classrooms, lecture theatres, computer labs, faculty offices, and common amenities.
- **Quick-Find Amenities**: Direct heuristic routing to the nearest restrooms (Gents/Ladies), water coolers, elevators, stairs, or building exits from the user's current origin.
- **Deep-Linking**: Full route and location state serialization via URL search parameters (`?from=...&to=...&via=...`) with backward compatibility for legacy floor codes.

### Offline & PWA Architecture
- **Service Worker Cache**: Cache-first strategy for app shell, scripts, styles, and static assets via CacheStorage API.
- **Client-Side QR Code Generation**: Pure JavaScript vector QR code rendering for offline route transfer without third-party network requests.
- **Web Share Integration**: Uses native system share sheet where available with automatic fallback to QR display.

---

## Architecture & Project Structure

```
Campus_25_navigator/
├── css/
│   └── style.css            # Custom CSS variables, responsive layout, animations
├── js/
│   ├── constants.js         # Design tokens, scale factors, floor metadata
│   ├── data.js              # Raw node coordinate matrix and corridor geometries
│   ├── graph.js             # MinHeap PriorityQueue, graph builder, Dijkstra solver
│   ├── main.js              # App lifecycle, event orchestration, deep-link handling
│   ├── renderer.js          # SVG canvas rendering, corridor paths, facility glyphs
│   ├── search.js            # Debounced search, keyboard navigation, amenity flows
│   ├── state.js             # Reactive application state, local storage, URL sync
│   ├── steps.js             # Vector-based turn simplification and step generation
│   └── viewport.js          # Pointer gesture tracking, pan/zoom transforms, camera centering
├── public/
│   ├── icon.svg             # Application SVG icon
│   ├── qrcode.js            # Standalone vector QR code engine
│   └── sw.js                # Offline caching service worker (v3)
├── index.html               # Semantic HTML shell and SVG canvas container
├── manifest.webmanifest     # PWA manifest
├── vercel.json              # Deployment caching rules and SPA rewrites
└── vite.config.js           # Vite development and build configuration
```

---

## Calibration Constants

Scale and walking metrics are configured in `js/constants.js`:

```javascript
// Map scale: ~44px between adjacent rooms ≈ 10 meters
export const M_PER_PX = 0.22;

// Average adult stride length in meters
export const STEP_LEN_M = 0.75;

// Average walking speed (meters per minute)
export const WALK_M_PER_MIN = 70;
```

---

## Keyboard Controls & Gestures

| Key / Gesture | Action |
|---|---|
| `1`, `2`, `3`, `4` | Switch to Ground, 1st, 2nd, or 3rd floor |
| `/` or `F` | Focus search input |
| `Enter` | Execute route search (when endpoints are set) or select search item |
| `Escape` | Dismiss active dialogs, search dropdowns, or node details |
| `←` / `→` | Step backward / forward through navigation directions |
| `L` | Toggle room labels on canvas |
| `+` / `-` | Zoom canvas in / out |
| `0` | Fit floor plan to viewport |
| `Click + Drag` | Pan canvas (mouse) or single-finger drag (touch) |
| `Pinch` | Two-finger pinch-to-zoom |

---

## Campus Directory

- **Block A**: School of Computer Engineering, computing laboratories, classrooms.
- **Block B**: Engineering laboratories, core lecture theatres, central corridor junction.
- **Block C**: Faculty offices, administrative cabins, seminar halls, examination halls.

---

## Development

### Prerequisites
- Node.js 18+
- npm

### Local Setup

```bash
git clone https://github.com/aayushkumar5/Campus_25_navigator.git
cd Campus_25_navigator
npm install
npm run dev
```

The development server runs at `http://localhost:5173`. Service Worker caching is automatically disabled on `localhost` and `127.0.0.1` to prevent stale module caching during development.

### Production Build

```bash
npm run build
npm run preview
```

Static assets are compiled to `dist/`.

---

## Deployment

The application is statically deployable to any CDN or hosting provider (Vercel, Cloudflare Pages, Netlify, GitHub Pages).

Configuration file `vercel.json` provides:
- Immutable cache headers (`max-age=31536000, immutable`) for static assets in `dist/assets/`.
- No-cache headers (`max-age=0, must-revalidate`) for `sw.js` and `manifest.webmanifest`.
- Clean single-page application URL rewrites.

---

## License

This project is licensed under the [MIT License](LICENSE).
