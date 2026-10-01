# Campus 25 Navigator

Indoor navigation and shortest-path pathfinding web application for KIIT University Campus 25.

## Features

- **Multi-Floor Routing**: Computes shortest path between rooms across Ground, 1st, 2nd, and 3rd floors using shared stairs or lifts.
- **Stairs vs. Lift Selection**: Toggle between stairs and elevators for inter-floor routes.
- **Interactive Floor Transition**: Click the active stairs or elevator marker on the canvas or the top guidance banner to switch the floor view.
- **Cross-Floor Search**: Index and autocomplete search for classrooms, labs, offices, and facilities across all floors with keyboard navigation support.
- **Quick Navigation**: Fast destination routing to the nearest stairs, lifts, washrooms, water coolers, and building exits.
- **Step-by-Step Directions**: Turn-by-turn instruction list with distance estimations.
- **PWA Support**: Offline asset caching using Service Worker.

## Architecture

Corridors are modeled as polyline segments, split at intersection points. Room coordinates snap to the closest corridor segment using orthogonal projection. Dijkstra's algorithm computes single-floor paths, and inter-floor connections are resolved by finding the minimal combined walking and vertical transition cost.

## Project Structure

- `index.html`: Main HTML shell and SVG map canvas
- `css/style.css`: Layout, theme styles, and controls
- `js/data.js`: Campus coordinate nodes and corridor paths
- `js/main.js`: Graph construction, Dijkstra routing, and UI interactions
- `manifest.webmanifest`: Progressive Web App configuration
- `sw.js`: Service Worker for offline asset caching
- `public/icon.svg`: Application icon

## Getting Started

### Prerequisites
- Node.js (version 18+)
- npm

### Installation and Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build production bundle
npm run build
```

## Shortcuts and Navigation

- **Pan**: Click and drag on map
- **Zoom**: Mouse wheel or `+` / `-` buttons
- **Fit View**: `Fit` button
- **Toggle Labels**: `Labels` button
- **Search Selection**: Up / Down arrow keys and Enter
- **Floor Switch**: Click active connector node or top banner during multi-floor routing

## License
MIT
