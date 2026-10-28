# Campus 25 Navigator 🗺️

A modern, high-performance indoor navigation, shortest-path routing, and architectural wayfinding web application designed for **KIIT University Campus 25**.

Built with modular ES modules, animated SVG canvas rendering, Dijkstra pathfinding with a Min-Priority Queue, high-resolution architectural blueprint aesthetics, and Progressive Web App (PWA) offline capabilities.

---

## ✨ Key Features

### 🧭 Wayfinding & Pathfinding
- 🏢 **Multi-Floor Topological Routing**: Computes optimal shortest paths across Ground (G), 1st (1F), 2nd (2F), and 3rd (3F) floors.
- ⚡ **Optimized Dijkstra with Min-Priority Queue**: $O((V+E)\log V)$ shortest-path calculations across dense corridor graphs.
- 🛗 **Connector Preferences & Step-Free Mode**: Choose between Stairs and Lifts, or toggle Step-Free accessibility mode (routes exclusively via elevators).
- 🔄 **Smart Alternate Fallback**: Automatically falls back to an alternate connector if the selected mode (e.g. stairs) is unavailable between specific floors.
- 🚶 **Turn-by-Turn Navigation & Camera Tracking**: Step-by-step walking instructions with 2D cross-product turn detection (left/right/straight), distance in meters, walk time, step counts, and **automatic camera panning (`centerOnStep`)** to keep the user focused on their current leg.
- 👣 **Human Stride / Footstep Estimation**: Calibrated stride length calculation (`STEP_LEN_M = 0.75m`, `M_PER_PX = 0.22`), displaying real-world walk stats: e.g. `45 m · ~1 min · ~60 steps`.

### 🎨 Architectural Blueprint UI / UX
- 🌌 **Midnight Blueprint Design System**: High-contrast dark theme (`#050c18` background, `#0a1526` glass panels, electric cyan `#22d3ee`, and KIIT neon green `#22c55e`).
- 🏛️ **Realistic Corridor Bands**: Double-layered hallway geometry with physical thickness (`11px` dark navy path + dashed center guideline).
- 🏷️ **Wing Watermarks**: Subtle architectural watermarks (`A`, `B`, `C`) for instant campus orientation.
- 📍 **3D Teardrop Pins & Target Rings**: Elevated destination pins and glowing target rings.
- 🏷️ **Embedded In-Tile Labels**: Centered room numbers inside room tiles, with one-click room label toggling (`L`).
- ⚡ **Animated Marching-Ants Route**: Continuous directional flow animation (`@keyframes route-flow`) showing the walking path.
- 🚨 **Pulsing Amenity Beacons**: Alternating breathing glow animation (`@keyframes blink-wr`) highlights matching washrooms, stairs, and water points.
- 📱 **Mobile Bottom Sheet**: On mobile devices ($\le$ 860px), the sidebar transforms into an ergonomic bottom sheet leaving the map touch-friendly.

### 🔍 Search & Interactive Controls
- 🔎 **Fuzzy Multi-Floor Search**: Real-time debounced search indexing classrooms, computer labs, faculty cabins, seminar halls, washrooms, and amenities.
- ❌ **1-Click Endpoint Clear & Re-Arm**: Individual clear (`✕`) buttons on "From" and "To" inputs that reset the slot and immediately re-activate map selection mode.
- 🚻 **Guided Washroom & Amenity Flows**: Fast-route to the nearest Gents / Ladies washrooms, water coolers, stairs, elevators, or exits.
- 🏷️ **Interactive Breadcrumbs**: Live breadcrumb (`Campus 25 > Ground Floor`) with direct one-click floor switching and home reset.
- ℹ️ **Campus 25 Guide Modal**: Quick-reference guide featuring campus wing directories, keyboard shortcuts, and accessibility info.

### 📲 Sharing & PWA Offline Capabilities
- 🔗 **Deep-Linking & Parameter Sync**: Full state preservation via URLs (`?from=...&to=...&via=...`) with automatic URL query preservation.
- 📱 **Native Web Share API + Offline QR Codes**: Invokes native mobile sharing (`navigator.share`) on mobile devices, falling back to scalable vector QR codes on desktop.
- 📦 **Offline PWA**: Service Worker caching with automatic localhost bypass to ensure development updates are never cached.

---

## 🏗️ Architecture & Module Structure

```
Campus_25_navigator/
├── css/
│   └── style.css            # Midnight blueprint design system, animations, responsive layout
├── js/
│   ├── constants.js         # Color tokens, scale factors (M_PER_PX, STEP_LEN_M), floor maps
│   ├── data.js              # Campus coordinate nodes & corridor polyline sequences
│   ├── graph.js             # Graph topology, MinHeap Priority Queue & Dijkstra routing
│   ├── main.js              # Application boot, deep-link sync, event orchestration & shortcuts
│   ├── renderer.js          # SVG canvas rendering, corridor bands, glyph chips & pins
│   ├── search.js            # Debounced search, keyboard nav & washroom chip flows
│   ├── state.js             # Central reactive state store, toast manager & URL serialization
│   ├── steps.js             # Turn-by-turn simplification, step progress & camera tracking
│   └── viewport.js          # Pan, pinch-to-zoom, sidebar-aware auto-centering & camera tracking
├── public/
│   ├── icon.svg             # High-resolution 512x512 application icon
│   ├── qrcode.js            # Offline vector QR code generator
│   └── sw.js                # Service Worker for offline PWA caching
├── index.html               # Semantic HTML5 shell, top header & SVG viewport
├── manifest.webmanifest     # PWA Web App Manifest
├── vercel.json              # Production headers, caching rules & SPA rewrites
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
| **Switch Floors** | `1`, `2`, `3`, `4` keys or Floor dropdown / Breadcrumb |
| **Search Locations** | `/` or `F` key (focuses search bar) |
| **Calculate Route** | `Enter` (when endpoints are set) or "Find route" button |
| **Clear / Dismiss** | `Escape` key (closes popups, search dropdown, modals) |
| **Navigate Directions** | `←` (Prev step) / `→` (Next step) or On-screen arrows |
| **Toggle Room Labels** | `L` key or "Labels" button |
| **Zoom Canvas** | Mouse scroll, `+` / `-` keys, or Two-finger pinch |
| **Auto-Fit Viewport** | `0` key or "Fit" button |
| **Pan Canvas** | Click & drag or Single-finger swipe |
| **Open Campus Guide** | Click student avatar icon |
| **Share Route** | "Share" button (Native OS share sheet or SVG QR code) |

---

## 🏢 Campus 25 Directory

- **Block A**: School of Computer Engineering, advanced computing laboratories, theory classrooms.
- **Block B**: Core engineering laboratories, large lecture theatres, central corridors.
- **Block C**: Faculty cabins, administrative offices, seminar halls, examination centers.

---

## 🌐 Deployment

The project is pre-configured for instant zero-config deployment on **Vercel**, **Netlify**, or **Cloudflare Pages**:

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
