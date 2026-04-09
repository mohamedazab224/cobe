/**
 * Branch Locations Utility
 *
 * Parses branch_locations.csv data and converts it to COBE globe markers.
 *
 * CSV columns:
 *   id        - Unique branch identifier
 *   branch    - Branch name (Arabic)
 *   address   - Branch address (Arabic)
 *   link      - Google Maps link
 *   icon      - Icon type identifier
 *   longitude - Geographic longitude (WGS84)
 *   latitude  - Geographic latitude (WGS84)
 *
 * Usage (browser — fetch the CSV from /data/branch_locations.csv):
 *   import { parseBranchCSV, branchesToMarkers } from './branches.js'
 *
 *   const response = await fetch('/data/branch_locations.csv')
 *   const csvText = await response.text()
 *   const branches = parseBranchCSV(csvText)
 *   const markers  = branchesToMarkers(branches, { size: 0.04 })
 *
 * Usage (Node.js — read the CSV from disk):
 *   import { readFileSync } from 'fs'
 *   import { parseBranchCSV, branchesToMarkers } from './branches.js'
 *
 *   const csvText = readFileSync('data/branch_locations.csv', 'utf-8')
 *   const branches = parseBranchCSV(csvText)
 *   const markers  = branchesToMarkers(branches, { size: 0.04 })
 *   console.log(markers)
 */

/**
 * Split a single CSV line into fields, respecting double-quoted fields that may
 * contain commas or newlines (RFC 4180).
 *
 * @param {string} line
 * @returns {string[]}
 */
function splitCSVLine(line) {
  const fields = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        // Escaped quote ("")  →  literal "
        if (line[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      fields.push(field)
      field = ''
    } else {
      field += ch
    }
  }
  fields.push(field)
  return fields
}

/**
 * Parse a CSV string produced by branch_locations.csv into an array of branch objects.
 *
 * @param {string} csvText - Raw CSV text (UTF-8, with header row).
 * @returns {{ id: string, branch: string, address: string, link: string, icon: string, longitude: number, latitude: number }[]}
 */
export function parseBranchCSV(csvText) {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) return []

  const header = splitCSVLine(lines[0]).map((h) => h.trim())
  const idIdx        = header.indexOf('id')
  const branchIdx    = header.indexOf('branch')
  const addressIdx   = header.indexOf('address')
  const linkIdx      = header.indexOf('link')
  const iconIdx      = header.indexOf('icon')
  const longitudeIdx = header.indexOf('longitude')
  const latitudeIdx  = header.indexOf('latitude')

  return lines.slice(1).reduce((acc, line) => {
    line = line.trim()
    if (!line) return acc

    const cols = splitCSVLine(line)
    const lon = parseFloat(cols[longitudeIdx])
    const lat = parseFloat(cols[latitudeIdx])

    if (isNaN(lon) || isNaN(lat)) return acc

    acc.push({
      id:        cols[idIdx]?.trim()      ?? '',
      branch:    cols[branchIdx]?.trim()  ?? '',
      address:   cols[addressIdx]?.trim() ?? '',
      link:      cols[linkIdx]?.trim()    ?? '',
      icon:      cols[iconIdx]?.trim()    ?? '',
      longitude: lon,
      latitude:  lat,
    })
    return acc
  }, [])
}

/**
 * Convert an array of branch objects into COBE marker descriptors.
 *
 * Each returned marker has:
 *   location - [latitude, longitude]  (COBE expects lat/lon order)
 *   size     - dot size (default 0.04)
 *   id       - CSS-safe anchor id derived from the branch id
 *
 * @param {ReturnType<typeof parseBranchCSV>} branches
 * @param {{ size?: number, color?: [number, number, number] }} [opts]
 * @returns {{ location: [number, number], size: number, id: string, color?: [number, number, number] }[]}
 */
export function branchesToMarkers(branches, opts = {}) {
  const { size = 0.04, color } = opts
  return branches.map((b) => {
    const marker = {
      location: [b.latitude, b.longitude],
      size,
      id: `branch-${b.id}`,
    }
    if (color) marker.color = color
    return marker
  })
}

/**
 * Convert an array of branch objects into a GeoJSON FeatureCollection.
 *
 * The resulting object can be serialised with JSON.stringify() and written to
 * data/branches_consolidated.geojson.
 *
 * @param {ReturnType<typeof parseBranchCSV>} branches
 * @returns {object} GeoJSON FeatureCollection
 */
export function branchesToGeoJSON(branches) {
  return {
    type: 'FeatureCollection',
    features: branches.map((b) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [b.longitude, b.latitude],
      },
      properties: {
        id:      b.id,
        branch:  b.branch,
        address: b.address,
        link:    b.link,
        icon:    b.icon,
      },
    })),
  }
}
