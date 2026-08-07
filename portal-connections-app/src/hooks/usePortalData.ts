import { useMemo } from 'react'
import portalCsv from '../data/portal_connections.csv?raw'
import { parsePortalConnectionsCsv } from '../utils/csv'
import { buildGraphData } from '../utils/aggregate'
import type { GraphData, PortalConnection } from '../types'

export function usePortalData(): {
  connections: PortalConnection[]
  graph: GraphData
} {
  return useMemo(() => {
    const connections = parsePortalConnectionsCsv(portalCsv)
    const graph = buildGraphData(connections)
    return { connections, graph }
  }, [])
}
