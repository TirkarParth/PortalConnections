import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import type { GraphData } from '../types'
import { createSceneContext } from '../three/sceneContext'
import { buildRelationGraph, removeRelationGraph } from '../three/relationGraph'

interface ConnectionGraph3DProps {
  graph: GraphData
  totalConnections: number
}

interface HoverInfo {
  title: string
  lines: string[]
}

export function ConnectionGraph3D({ graph, totalConnections }: ConnectionGraph3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<HoverInfo | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const context = createSceneContext(container)
    const chart = buildRelationGraph(graph)
    context.scene.add(chart)

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const countryMeshes: THREE.Mesh[] = []
    chart.traverse((child) => {
      if (child instanceof THREE.Mesh && child.userData.kind === 'country') {
        countryMeshes.push(child)
      }
    })

    const onPointerMove = (event: PointerEvent) => {
      const rect = context.renderer.domElement.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, context.camera)
      const hit = raycaster.intersectObjects(countryMeshes, false)[0]?.object

      if (hit instanceof THREE.Mesh && hit.userData.kind === 'country') {
        const devices = hit.userData.deviceCounts as Record<string, number>
        setHover({
          title: `${hit.userData.name} (${hit.userData.code})`,
          lines: [
            `Connections: ${hit.userData.connectionCount}`,
            `Avg speed: ${hit.userData.avgSpeedMbps} Mbps`,
            `Devices: ${devices.desktop} desktop · ${devices.mobile} mobile · ${devices.tablet} tablet`,
            `Timezone: ${(hit.userData.timezones as string[]).join(', ') || '—'}`,
          ],
        })
        context.renderer.domElement.style.cursor = 'pointer'
      } else {
        setHover(null)
        context.renderer.domElement.style.cursor = 'grab'
      }
    }

    const onResize = () => context.resize()
    window.addEventListener('resize', onResize)
    context.renderer.domElement.addEventListener('pointermove', onPointerMove)

    return () => {
      window.removeEventListener('resize', onResize)
      context.renderer.domElement.removeEventListener('pointermove', onPointerMove)
      removeRelationGraph(context.scene)
      context.dispose()
    }
  }, [graph])

  return (
    <div className="graph-shell">
      <div className="hud">
        <div>
          <h1>Portal Connections</h1>
          <p>Relational 3D graph of online portal traffic by country, device, timezone, and speed</p>
        </div>
        <div className="hud-stats">
          <div>
            <span className="stat-label">Connections</span>
            <span className="stat-value">{totalConnections.toLocaleString()}</span>
          </div>
          <div>
            <span className="stat-label">Countries</span>
            <span className="stat-value">{graph.nodes.length}</span>
          </div>
          <div>
            <span className="stat-label">Relations</span>
            <span className="stat-value">{graph.relations.length}</span>
          </div>
        </div>
      </div>

      <div className="canvas-wrap" ref={containerRef}>
        {hover && (
          <div className="hover-card">
            <strong>{hover.title}</strong>
            {hover.lines.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </div>
        )}
      </div>

      <div className="hint-bar">
        <span>Sphere size = connection volume</span>
        <span>Lines = related-country links</span>
        <span>Drag to rotate · Scroll to zoom</span>
      </div>
    </div>
  )
}
