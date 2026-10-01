# Campus 25 Navigator 🗺️

A modern, high-performance indoor navigation and shortest-path routing web application designed for **KIIT University Campus 25**.

Built with modular ES modules, animated SVG canvas rendering, Dijkstra pathfinding with a Min-Priority Queue, and Progressive Web App (PWA) offline capabilities.

---

## ✨ Features

- 🏢 **Multi-Floor Topological Routing**: Computes optimal shortest paths across Ground (GF), 1st (1F), 2nd (2F), and 3rd (3F) floors.
- ⚡ **Optimized Dijkstra with Min-Priority Queue**: Fast $O((V+E)\log V)$ shortest-path calculations across complex corridor networks.
- 🛗 **Connector Preferences & Step-Free Mode**: Choose between Stairs and Lifts, or toggle Step-Free accessibility mode (routes exclusively via elevators).
- 🔄 **Smart Alternate Fallback**: Automatically falls back to an alternate connector if the selected mode (e.g. stairs) is unavailable between specific floors.
- 🔍 **Fuzzy Multi-Floor Search**: Real-time debounced search indexing classrooms, labs, faculty offices, theory rooms, washrooms, and amenities.
- 🚻 **Guided Washroom & Amenity Flow**: Fast-route to the nearest Gents / Ladies washrooms, water coolers, stairs, elevators, or exits.
- 🚶 **Turn-by-Turn Navigation & Auto-Scroll**: Step-by-step walking directions with turn detection (left/right/straight), distance in meters, estimated walk time, and smooth step list auto-scrolling.
- 📱 **Responsive & Mobile-First**: Touch gesture support (multi-touch pinch-to-zoom, pan drag tolerance) and collapsible mobile drawer.
- 🔗 **Deep-Linking & QR Code Sharing**: Share active routes or locations via parameterized URLs (`?from=...&to=...&via=...`) with instant in-app QR code generation.
- 🎨 **Rich UI / Dark Glassmorphic Theme**: Animated route flow polyline, directional chevrons, live step location markers, and custom UI design tokens.
- 📲 **Installable PWA**: Service Worker caching for instant offline navigation.

---

## 🏗️ Architecture & Module Structure

The application is structured into clean, decoupled ES modules:

```
Campus_25_navigator/
├── css/
│   └── style.css            # Dark mode tokens, responsive layout, animations
├── js/
│   ├── constants.js         # Color tokens, room types, floor maps & selectors
│   ├── data.js              # Campus coordinate nodes & corridor polyline data
│   ├── graph.js             # Graph topology, MinHeap Priority Queue & Dijkstra routing
│   ├── main.js              # Application boot, deep-link sync & global event orchestration
│   ├── renderer.js          # SVG canvas rendering, directional chevrons & floor views
│   ├── search.js            # Debounced search, keyboard nav & washroom chip flows
│   ├── state.js             # Central reactive state store, toast manager & URL serialization
│   ├── steps.js             # Turn-by-turn simplification & step list controller
│   └── viewport.js          # Pan, pinch-to-zoom, zoom-to-route & pointer tracking
├── public/
│   ├── icon.svg             # Application SVG icon
│   ├── qrcode.js            # Offline QR code SVG generator
│   └── sw.js                # Service Worker for offline PWA caching
├── index.html               # Semantic HTML5 shell & SVG viewport
├── manifest.webmanifest     # PWA Web App Manifest
├── vercel.json              # Production headers, caching rules & rewrites
└── vite.config.js           # Vite build pipeline & asset bundling
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- `npm`

### Installation & Local Development

```bash
# Clone the repository
git clone https://github.com/aayushkumar5/Campus_25_navigator.git
cd Campus_25_navigator

# Install dependencies
npm install

# Start local dev server
npm run dev
```

### Production Build

```bash
# Build optimized production bundle to /dist
npm run build

# Preview production build locally
npm run preview
```

---

## ⌨️ Shortcuts & Gestures

| Action | Shortcut / Control |
|---|---|
| **Switch Floors** | `1`, `2`, `3`, `4` keys or Floor dropdown button |
| **Calculate Route** | `Enter` (when start & dest are set) or "Find Route" button |
| **Close Menus / Modals** | `Escape` key |
| **Search Autocomplete** | `Arrow Up` / `Arrow Down` to navigate, `Enter` to select |
| **Pan Canvas** | Click & drag or Single-finger swipe |
| **Zoom Canvas** | Mouse scroll wheel, `+` / `-` buttons, or Two-finger pinch |
| **Auto-Fit Viewport** | `Fit` button |
| **Toggle Room Labels** | `Labels` (gear) button |
| **Switch Floor on Route** | Click active connector tag (`GO TO 2F`) or top guidance banner |

---

## 🌐 Deployment

The project is pre-configured for instant zero-config deployment on **Vercel**, **Netlify**, or **Cloudflare Pages**:

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
