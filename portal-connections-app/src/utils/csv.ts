import type { DeviceType, PortalConnection } from '../types'

function parseDevice(value: string): DeviceType {
  if (value === 'mobile' || value === 'tablet' || value === 'desktop') {
    return value
  }
  return 'desktop'
}

/**
 * Parse semicolon- or comma-delimited portal connection CSV into typed rows.
 */
export function parsePortalConnectionsCsv(csv: string): PortalConnection[] {
  const lines = csv.trim().split(/\r?\n/)
  if (lines.length < 2) return []

  const header = lines[0]
  const delimiter = header.includes(';') ? ';' : ','
  const rows: PortalConnection[] = []

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delimiter)
    if (cols.length < 10) continue

    rows.push({
      connectionId: cols[0],
      userId: cols[1],
      country: cols[2],
      countryName: cols[3],
      city: cols[4],
      timezone: cols[5],
      device: parseDevice(cols[6]),
      internetSpeedMbps: Number(cols[7]),
      connectedAt: cols[8],
      relatedCountry: cols[9],
    })
  }

  return rows
}
