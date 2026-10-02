# 📁 Campus 25 Navigator — File Responsibilities & Architecture Report

This report documents the architectural role, key exports, and responsibilities of every file in the **Campus 25 Navigator** codebase.

---

## 🗺️ High-Level System Overview

```mermaid
graph TD
    HTML[index.html] --> Main[js/main.js]
    CSS[css/style.css] --> HTML
    
    Main --> State[js/state.js]
    Main --> Graph[js/graph.js]
    Main --> Renderer[js/renderer.js]
    Main --> Viewport[js/viewport.js]
    Main --> Search[js/search.js]
    Main --> Steps[js/steps.js]
    
    Graph --> Data[js/data.js]
    Graph --> Constants[js/constants.js]
    
    Renderer --> Constants
    Renderer --> Graph
    Renderer --> State
    Renderer --> Viewport
    
    Search --> Constants
    Search --> Graph
    Search --> State
    
    Steps --> Constants
    Steps --> Graph
    Steps --> State
```

---

## 📂 File-by-File Breakdown

### 1. Core Logic & Routing (`js/`)

| File | Primary Responsibility | Key Functions / Exports |
| :--- | :--- | :--- |
| [`js/graph.js`](file:///c:/Users/KIIT/Projects/Dev/Campus_25_navigator/js/graph.js) | **Graph Topology & Pathfinding**<br>Constructs topological corridor graph per floor, calculates segment intersections, orthogonal room snapping, and executes Dijkstra shortest-path calculations. | • `PriorityQueue` (MinHeap)<br>• `buildFloorGraph(fl)`<br>• `dijkstra(graph, src)`<br>• `findFloorPath(floorGraph, startId, endId)`<br>• `findRouteLegs(startRef, endRef, preferredConn)`<br>• `FLOORS` |
| [`js/renderer.js`](file:///c:/Users/KIIT/Projects/Dev/Campus_25_navigator/js/renderer.js) | **SVG Canvas Rendering**<br>Renders corridor road networks, room nodes, icons, labels, animated route paths, directional chevrons, and active connector tags. | • `renderFloor(floorIdx, onSelect, onConnClick)`<br>• `drawActiveRoute()`<br>• `renderDirectionalArrows(points)`<br>• `updateGuidanceBanner()`<br>• `openNodeCard(node)` / `closeNodeCard()` |
| [`js/search.js`](file:///c:/Users/KIIT/Projects/Dev/Campus_25_navigator/js/search.js) | **Search & Guided Facility Picker**<br>Handles fuzzy search across all 4 floors, ranking, keyboard arrow navigation, debounced input, and interactive washroom selection chip flows. | • `searchLocations(query)`<br>• `renderSearchDropdown(...)`<br>• `setupSearchEvents(...)`<br>• `startWashroomFlow(...)`<br>• `debounce(fn, ms)` |
| [`js/steps.js`](file:///c:/Users/KIIT/Projects/Dev/Campus_25_navigator/js/steps.js) | **Turn-by-Turn Navigation**<br>Analyzes polyline vectors using 2D cross-products to generate turn directions (straight, left, right), distance estimates, walk time, and manages active step progression with auto-scrolling. | • `simplifyPathPolyline(points)`<br>• `generateStepList(routeResult, start, dest)`<br>• `navigateToStep(stepIdx, updateFloor, drawRoute)` |
| [`js/state.js`](file:///c:/Users/KIIT/Projects/Dev/Campus_25_navigator/js/state.js) | **Central State Store & URL Sync**<br>Maintains application state, recent destinations in `localStorage`, non-overlapping stacked toast notifications, and URL deep-link serialization/deserialization. | • `state` (reactive object)<br>• `showToast(message)`<br>• `saveRecent(ref)`<br>• `formatPointName(ref)`<br>• `generateShareUrl()` / `syncHistoryUrl()` |
| [`js/viewport.js`](file:///c:/Users/KIIT/Projects/Dev/Campus_25_navigator/js/viewport.js) | **Pan, Zoom & Viewport Gestures**<br>Controls SVG `viewBox`, multi-touch pinch-to-zoom, mouse wheel zooming, pan drag tolerances, and automatic camera fitting around calculated route bounds. | • `viewBox`<br>• `applyViewBox()`<br>• `fitViewport()`<br>• `zoomViewport(factor, cx, cy)`<br>• `zoomToRoute(points)`<br>• `setupViewportEvents()` |
| [`js/constants.js`](file:///c:/Users/KIIT/Projects/Dev/Campus_25_navigator/js/constants.js) | **Design Tokens & Lookup Dictionaries**<br>Defines DOM selector helper `$()`, room type descriptions, floor names/codes, SVG namespace, and color mapping tables. | • `$` (DOM helper)<br>• `COLORS`<br>• `ICONS`<br>• `ROOM_TYPES`<br>• `FLOOR_NAMES` / `FLOOR_CODES` |
| [`js/data.js`](file:///c:/Users/KIIT/Projects/Dev/Campus_25_navigator/js/data.js) | **Raw Coordinates & Geometry Dataset**<br>Stores base campus node coordinate data (`D`) and corridor polyline sequences (`L`). | • `D` (compact node CSV string)<br>• `L` (corridor polyline coordinate arrays) |
| [`js/main.js`](file:///c:/Users/KIIT/Projects/Dev/Campus_25_navigator/js/main.js) | **Application Entry & Event Orchestration**<br>Bootstraps the application, wires UI buttons, handles global keyboard shortcuts (`1-4`, `Enter`, `Escape`), manages QR share modal, and registers the service worker. | • `initializeApp()`<br>• `calculateRoute()`<br>• `setLocationReference(ref)`<br>• `refreshUI()` |

---

### 2. User Interface & Presentation

| File | Primary Responsibility |
| :--- | :--- |
| [`index.html`](file:///c:/Users/KIIT/Projects/Dev/Campus_25_navigator/index.html) | **HTML5 Semantic Shell & SVG Viewport**<br>Defines the DOM structure, SVG canvas elements (`#roads`, `#nodes`, `#route`, `#arrows`, `#cur`), side panel, search inputs, step card, node details card, floor dropdown menu, and modal dialogs. |
| [`css/style.css`](file:///c:/Users/KIIT/Projects/Dev/Campus_25_navigator/css/style.css) | **Stylesheet & Visual Design System**<br>Custom dark theme, CSS custom properties, glassmorphism panel styles, route polyline dash-offset animations, responsive mobile bottom-drawer styles, and interactive focus states. |

---

### 3. Progressive Web App (PWA) & Public Assets (`public/`)

| File | Primary Responsibility |
| :--- | :--- |
| [`public/sw.js`](file:///c:/Users/KIIT/Projects/Dev/Campus_25_navigator/public/sw.js) | **Service Worker**<br>Caches application shell, HTML, CSS, JavaScript chunks, and SVG assets for instant offline functionality. |
| [`public/qrcode.js`](file:///c:/Users/KIIT/Projects/Dev/Campus_25_navigator/public/qrcode.js) | **Offline QR Code Generator**<br>Standalone client-side library generating scalable SVG QR codes for instant route sharing without third-party network requests. |
| [`public/icon.svg`](file:///c:/Users/KIIT/Projects/Dev/Campus_25_navigator/public/icon.svg) | **App Icon**<br>Vector SVG icon used for browser tab favicon and mobile PWA home screen icon. |
| [`manifest.webmanifest`](file:///c:/Users/KIIT/Projects/Dev/Campus_25_navigator/manifest.webmanifest) | **Web App Manifest**<br>Configures PWA installation parameters (name, theme colors, display mode `standalone`, and icon sizes). |

---

### 4. Build, Configuration & Documentation

| File | Primary Responsibility |
| :--- | :--- |
| [`vite.config.js`](file:///c:/Users/KIIT/Projects/Dev/Campus_25_navigator/vite.config.js) | **Vite Bundler Configuration**<br>Configures build optimizations, base path, public directory serving, and development server. |
| [`vercel.json`](file:///c:/Users/KIIT/Projects/Dev/Campus_25_navigator/vercel.json) | **Deployment & CDN Caching Rules**<br>Configures Vercel routing rewrites for SPA history API, immutable static asset cache headers, and service worker no-cache policy. |
| [`package.json`](file:///c:/Users/KIIT/Projects/Dev/Campus_25_navigator/package.json) | **Project Manifest & Scripts**<br>Defines project dependencies (`vite`), scripts (`npm run dev`, `npm run build`, `npm run preview`). |
| [`README.md`](file:///c:/Users/KIIT/Projects/Dev/Campus_25_navigator/README.md) | **Project Documentation**<br>Comprehensive developer and user documentation including feature overview, keyboard shortcuts, installation, and deployment guides. |
| [`FILE_REPORT.md`](file:///c:/Users/KIIT/Projects/Dev/Campus_25_navigator/FILE_REPORT.md) | **Architecture & File Responsibility Reference**<br>This reference document detailing module relationships and file responsibilities. |

---

## 🔄 Interaction Data Flow

1. **User selects a start & destination**:
   - Via search ([`search.js`](file:///c:/Users/KIIT/Projects/Dev/Campus_25_navigator/js/search.js)), clicking canvas room nodes ([`renderer.js`](file:///c:/Users/KIIT/Projects/Dev/Campus_25_navigator/js/renderer.js)), or quick navigation amenity buttons ([`main.js`](file:///c:/Users/KIIT/Projects/Dev/Campus_25_navigator/js/main.js)).
2. **State updates & triggers route calculation**:
   - Stored in [`state.js`](file:///c:/Users/KIIT/Projects/Dev/Campus_25_navigator/js/state.js), URL updated, and [`calculateRoute()`](file:///c:/Users/KIIT/Projects/Dev/Campus_25_navigator/js/main.js#L91) called.
3. **Shortest path computed**:
   - [`graph.js`](file:///c:/Users/KIIT/Projects/Dev/Campus_25_navigator/js/graph.js) runs MinHeap Dijkstra (`dijkstra`) and multi-floor connector search (`findRouteLegs`).
4. **Directions & Canvas updated**:
   - [`steps.js`](file:///c:/Users/KIIT/Projects/Dev/Campus_25_navigator/js/steps.js) parses turn vectors into instructions.
   - [`renderer.js`](file:///c:/Users/KIIT/Projects/Dev/Campus_25_navigator/js/renderer.js) draws animated path polyline (`#route`) and directional chevrons (`#arrows`).
   - [`viewport.js`](file:///c:/Users/KIIT/Projects/Dev/Campus_25_navigator/js/viewport.js) auto-fits camera bounds (`zoomToRoute`).
