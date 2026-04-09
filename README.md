[![COBE](card.png)](https://cobe.vercel.app)

<p align="center">Use any DOM element as bindable markers.<br/>CSS transitions, animations, filters, interactivity, all just work.</p>

<p align="center">High perf, zero deps, ~5KB.</p>

<p align="center">
  <video src="ideas-1_4x.mp4" poster="card.png" autoplay loop muted playsinline width="600"></video>
</p>

---

- [**Demo** and configurations](https://cobe.vercel.app)

## Quick Start

```html
<canvas
  id="cobe"
  style="width: 500px; height: 500px;"
  width="1000"
  height="1000"
></canvas>
```

```js
import createGlobe from 'cobe'

let phi = 0
let canvas = document.getElementById("cobe")

const globe = createGlobe(canvas, {
  devicePixelRatio: 2,
  width: 1000,
  height: 1000,
  phi: 0,
  theta: 0,
  dark: 0,
  diffuse: 1.2,
  scale: 1,
  mapSamples: 16000,
  mapBrightness: 6,
  baseColor: [0.3, 0.3, 0.3],
  markerColor: [1, 0.5, 1],
  glowColor: [1, 1, 1],
  offset: [0, 0],
  markers: [
    { location: [37.7595, -122.4367], size: 0.03 },
    { location: [40.7128, -74.006], size: 0.1, color: [1, 0, 0] }, // custom color
  ],
  arcs: [
    {
      from: [37.7595, -122.4367],
      to: [40.7128, -74.006],
      color: [1, 0.5, 0.5], // custom color (optional)
    },
  ],
  arcColor: [1, 0.5, 1],
  arcWidth: 0.5,
  arcHeight: 0.3,
  markerElevation: 0.02,
  onRender: (state) => {
    // Called on every animation frame.
    // `state` will be an empty object, return updated params.
    state.phi = phi
    phi += 0.01
  },
})

// To destroy the instance and bindings:
// `globe.destroy()`
```

## Arcs

Arcs connect two locations on the globe:

```js
arcs: [
  {
    from: [37.7595, -122.4367],
    to: [35.6762, 139.6503],
    color: [1, 0.5, 0.5], // optional, uses arcColor if not set
  },
]
```

## Bindable Markers & Arcs

Markers and arcs can have an `id` property for [CSS Anchor Positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning):

```js
markers: [
  { location: [37.7595, -122.4367], size: 0.03, id: 'sf' },
],
arcs: [
  { from: [37.7595, -122.4367], to: [35.6762, 139.6503], id: 'sf-tokyo' },
]
```

```css
.marker-label {
  position: absolute;
  position-anchor: --cobe-sf;
  bottom: anchor(top);
  left: anchor(center);
  opacity: var(--cobe-visible-sf, 0);
  filter: blur(calc((1 - var(--cobe-visible-sf, 0)) * 8px));
  transition: opacity 0.3s, filter 0.3s;
}

.arc-label {
  position: absolute;
  position-anchor: --cobe-arc-sf-tokyo;
  bottom: anchor(top);
  left: anchor(center);
  opacity: var(--cobe-visible-arc-sf-tokyo, 0);
}
```

The globe exposes:
- `--cobe-{id}` / `--cobe-arc-{id}` — CSS anchor names for positioning
- `--cobe-visible-{id}` / `--cobe-visible-arc-{id}` — visibility variable (0 when behind globe, 1 when visible)

Use the visibility variable to drive opacity, blur, scale, or any CSS property for smooth transitions.

## Branch Locations

The `data/` directory contains geographic coordinates for branch locations that can be used directly as COBE markers.

### Files

| File | Description |
|------|-------------|
| `data/branch_locations.csv` | Branch data in CSV format |
| `data/branches_consolidated.geojson` | Same data as a GeoJSON `FeatureCollection` |

### CSV columns

| Column | Type | Description |
|--------|------|-------------|
| `id` | number | Unique branch identifier |
| `branch` | string | Branch name |
| `address` | string | Branch street address |
| `link` | string | Google Maps link |
| `icon` | string | Icon type identifier |
| `longitude` | number | Geographic longitude (WGS84) |
| `latitude` | number | Geographic latitude (WGS84) |

### Using branch locations with COBE (JavaScript / browser)

```js
import createGlobe from 'cobe'
import { parseBranchCSV, branchesToMarkers } from './src/branches.js'

const response = await fetch('/data/branch_locations.csv')
const csvText  = await response.text()
const branches = parseBranchCSV(csvText)
const markers  = branchesToMarkers(branches, { size: 0.04, color: [1, 0.5, 0] })

const globe = createGlobe(canvas, {
  devicePixelRatio: 2,
  width: 600,
  height: 600,
  phi: 0.5,
  theta: 0.3,
  dark: 0,
  diffuse: 1.2,
  mapSamples: 16000,
  mapBrightness: 6,
  baseColor: [1, 1, 1],
  markerColor: [1, 0.5, 0],
  glowColor: [1, 1, 1],
  markers,
})
```

### Using branch locations with COBE (Node.js)

```js
import { readFileSync } from 'fs'
import { parseBranchCSV, branchesToMarkers, branchesToGeoJSON } from './src/branches.js'

const csvText  = readFileSync('data/branch_locations.csv', 'utf-8')
const branches = parseBranchCSV(csvText)

// Convert to COBE markers
const markers = branchesToMarkers(branches, { size: 0.04 })
console.log(markers)

// Or regenerate the GeoJSON file
const geojson = branchesToGeoJSON(branches)
console.log(JSON.stringify(geojson, null, 2))
```

### Reading branch locations in Python

```python
import csv
import json

# Read CSV
branches = []
with open('data/branch_locations.csv', encoding='utf-8') as f:
    for row in csv.DictReader(f):
        branches.append({
            'id':        row['id'],
            'branch':    row['branch'],
            'address':   row['address'],
            'link':      row['link'],
            'icon':      row['icon'],
            'longitude': float(row['longitude']),
            'latitude':  float(row['latitude']),
        })

# Print first 3 branches
for b in branches[:3]:
    print(b)

# Convert to GeoJSON and write to file
features = [
    {
        'type': 'Feature',
        'geometry': {'type': 'Point', 'coordinates': [b['longitude'], b['latitude']]},
        'properties': {k: v for k, v in b.items() if k not in ('longitude', 'latitude')},
    }
    for b in branches
]
geojson = {'type': 'FeatureCollection', 'features': features}
with open('data/branches_consolidated.geojson', 'w', encoding='utf-8') as f:
    json.dump(geojson, f, ensure_ascii=False, indent=2)
```

## Acknowledgment

This project is inspired & based on the great work of:

- [Spherical Fibonacci Mapping](https://dl.acm.org/doi/10.1145/2816795.2818131), Benjamin Keinert et al.
- https://www.shadertoy.com/view/lllXz4, Inigo Quilez
- https://github.blog/2020-12-21-how-we-built-the-github-globe
- https://github.com/vaneenige/phenomenon
- https://github.com/evanw/glslx

World map asset from:

- https://de.wikipedia.org/wiki/Datei:World_map_blank_without_borders.svg

## License

The MIT License.
