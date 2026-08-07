import type {
  CountryNode,
  CountryRelation,
  DeviceType,
  GraphData,
  PortalConnection,
} from '../types'

function emptyDevices(): Record<DeviceType, number> {
  return { desktop: 0, mobile: 0, tablet: 0 }
}

/**
 * Aggregate portal rows into country nodes (sized by volume)
 * and bidirectional relation edges (related_country links).
 */
export function buildGraphData(connections: PortalConnection[]): GraphData {
  const nodeMap = new Map<string, CountryNode>()
  const relationMap = new Map<string, number>()
  const nameByCode = new Map<string, string>()

  for (const row of connections) {
    nameByCode.set(row.country, row.countryName)
  }

  const ensureNode = (code: string, name?: string) => {
    let node = nodeMap.get(code)
    if (!node) {
      node = {
        code,
        name: name ?? nameByCode.get(code) ?? code,
        connectionCount: 0,
        avgSpeedMbps: 0,
        deviceCounts: emptyDevices(),
        timezones: [],
      }
      nodeMap.set(code, node)
    }
    return node
  }

  const speedSum = new Map<string, number>()

  for (const row of connections) {
    const origin = ensureNode(row.country, row.countryName)
    origin.connectionCount += 1
    origin.deviceCounts[row.device] += 1
    speedSum.set(row.country, (speedSum.get(row.country) ?? 0) + row.internetSpeedMbps)
    if (!origin.timezones.includes(row.timezone)) {
      origin.timezones.push(row.timezone)
    }

    // Related country also participates in the graph (smaller bump)
    const related = ensureNode(row.relatedCountry)
    related.connectionCount += 1

    const [a, b] = [row.country, row.relatedCountry].sort()
    if (a === b) continue
    const key = `${a}|${b}`
    relationMap.set(key, (relationMap.get(key) ?? 0) + 1)
  }

  for (const node of nodeMap.values()) {
    const sum = speedSum.get(node.code) ?? 0
    const originCount = Object.values(node.deviceCounts).reduce((s, n) => s + n, 0)
    node.avgSpeedMbps =
      originCount > 0 ? Math.round((sum / originCount) * 10) / 10 : 0
  }

  const relations: CountryRelation[] = []
  for (const [key, weight] of relationMap.entries()) {
    const [from, to] = key.split('|')
    relations.push({ from, to, weight })
  }

  const nodes = Array.from(nodeMap.values()).sort(
    (a, b) => b.connectionCount - a.connectionCount,
  )

  return { nodes, relations }
}
