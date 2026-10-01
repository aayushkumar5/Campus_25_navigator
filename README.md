# 🗺️ KIIT Campus 25 Navigator

[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![CSS3](https://img.shields.io/badge/CSS3-Vanilla%20Glassmorphism-1572B6?logo=css3&logoColor=white)](https://www.w3.org/Style/CSS/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable%20%26%20Offline-5A0FC8?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)

An interactive, multi-floor indoor navigation and shortest-path pathfinding web application designed for **KIIT University Campus 25**.

---

## 🌟 Features

### 🏢 Multi-Floor & Inter-Floor Pathfinding
- **Seamless Cross-Floor Navigation**: Calculate continuous paths across levels (Ground Floor, 1st Floor, 2nd Floor, and 3rd Floor).
- **Stairs vs. Lift Preference**: Choose between taking the stairs or the elevator with dynamic path recalculation.
- **Interactive Floor Teleport**: Tapping an active staircase or elevator icon directly on the SVG map flips the view to the destination level with a smooth transition.
- **Auto-Switching Guidance**: Step-by-step navigation automatically transitions the floor view as you advance past floor connectors.

### 🔍 Universal Search & Quick Navigation
- **Cross-Floor Autocomplete**: Search classrooms (Blocks A, B, C), laboratories, offices, and facilities across all floors simultaneously with level badges (`GF`, `1F`, `2F`, `3F`).
- **Keyboard Navigation**: Full support for <kbd>↑</kbd>, <kbd>↓</kbd>, and <kbd>Enter</kbd> keyboard search.
- **Instant Shortcuts**: One-tap navigation to the nearest **Stairs**, **Lifts**, **Gents Washrooms**, **Ladies Washrooms**, **Water Coolers**, or **Building Exits**.
- **Interactive Washroom Wizard**: Quick modal to select floor & gender with blinking map highlights.

### 🎨 Modern Glassmorphic UI / UX
- **Vibrant Dark Mode**: Glassmorphic panels with backdrop blur (`backdrop-filter: blur(24px)`), neon cyan animated route paths, and directional chevrons.
- **Floating Map Controls**: Touch and pointer-friendly controls for Zoom In (`+`), Zoom Out (`−`), Fit Map (`⛶`), and Label Toggle (`🏷️`).
- **Turn-by-Turn Guidance**: Distance estimations in meters and walking time in minutes, maneuver badges (🚩 Start, ⬆️ Straight, ↱ Turn Right, ↰ Turn Left, 🎯 Arrive), and interactive progress bars.
- **Room Info Popups**: Tap any room or point of interest on the canvas to open a quick modal with "Set as Start" or "Set as Destination".
- **Progressive Web App (PWA)**: Offline caching with Service Workers and mobile home-screen installable.

---

## 🏗️ Architecture & How It Works

```
                     ┌──────────────────────────────┐
                     │   Raw Floor Plan Data (D)    │
                     │  Coordinates + Node Types    │
                     └──────────────┬───────────────┘
                                    │
                     ┌──────────────▼──────────────┐
                     │ Corridor Polyline Data (L)   │
                     │   Intersection Resolution    │
                     └──────────────┬───────────────┘
                                    │
        ┌───────────────────────────┴───────────────────────────┐
        ▼                                                       ▼
┌──────────────────────────────┐         ┌──────────────────────────────┐
│  Single-Floor Graph (0..3)   │         │    Multi-Floor Routing       │
│  Dijkstra's Shortest Path    │         │  Shared Stair / Lift Penalty │
└──────────────┬───────────────┘         └──────────────┬───────────────┘
               │                                        │
               └────────────────────┬───────────────────┘
                                    │
                     ┌──────────────▼──────────────┐
                     │  SVG Viewport & Interactive │
                     │  UI / Glassmorphic Panels   │
                     └─────────────────────────────┘
```

1. **Graph Construction (`js/main.js`)**: Corridors are defined as polyline segments, snapped at intersection points (`ix`). Room coordinates (`D`) snap to the closest corridor segment using orthogonal projection.
2. **Shortest Path Algorithm**: Dijkstra's algorithm computes single-floor routes and combines multi-floor legs (`legs()`) by minimizing walking distance plus vertical floor-change transition weights.
3. **Responsive SVG Canvas**: Vector rendering with dynamic viewBox manipulation, pinch-to-zoom, pan drag, and animated path overlays.

---

## 📁 Project Structure

```
Campus_25_navigator/
├── index.html            # Main HTML app shell and SVG map canvas
├── manifest.webmanifest  # PWA configuration and app icons
├── package.json          # Vite bundler dependencies & build scripts
├── sw.js                 # Service Worker for offline capability & caching
├── css/
│   └── style.css         # Glassmorphic design system, animations, and tokens
├── js/
│   ├── data.js           # Hand-mapped campus coordinates & corridor paths
│   └── main.js           # Graph builder, Dijkstra engine, and UI controller
└── public/
    └── icon.svg          # Application vector logo
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18+ recommended)
- [npm](https://www.npmjs.com/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/aayushkumar5/Campus_25_navigator.git
   cd Campus_25_navigator
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173/](http://localhost:5173/) in your browser.

4. **Build for production:**
   ```bash
   npm run build
   ```
   The compiled bundle will be generated in the `dist/` directory.

---

## 📱 Keyboard & Gesture Shortcuts

| Action | Shortcut / Gesture |
| :--- | :--- |
| **Pan Map** | Click & Drag / Single Touch Drag |
| **Zoom Map** | Mouse Wheel / Pinch Gesture / `+` and `−` Buttons |
| **Recenter Map** | `⛶` Button |
| **Toggle Room Labels** | `🏷️` Button |
| **Search Autocomplete** | Type room name, navigate with <kbd>↑</kbd> / <kbd>↓</kbd>, select with <kbd>Enter</kbd> |
| **Switch Floors on Route** | Tap glowing Stair/Lift node on canvas or tap top Banner |

---

## 📄 License
MIT License. Built for KIIT University Campus 25.
