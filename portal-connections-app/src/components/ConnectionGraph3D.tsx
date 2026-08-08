import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { DragControls } from 'three/addons/controls/DragControls.js'
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
    const graphHandle = buildRelationGraph(graph)
    context.scene.add(graphHandle.group)

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    let isDragging = false
    const dragPrevious = new THREE.Vector3()

    const dragControls = new DragControls(
      graphHandle.countryMeshes,
      context.camera,
      context.renderer.domElement,
    )
    dragControls.transformGroup = false

    dragControls.addEventListener('dragstart', (event) => {
      isDragging = true
      context.controls.enabled = false
      const mesh = event.object as THREE.Mesh
      dragPrevious.copy(mesh.position)
      if (mesh.userData.kind === 'country') {
        const code = mesh.userData.code as string
        const linked = graphHandle.neighborsByCode.get(code)?.length ?? 0
        const devices = mesh.userData.deviceCounts as Record<string, number>
        setHover({
          title: `${mesh.userData.name} (${code})`,
          lines: [
            `Connections: ${mesh.userData.connectionCount}`,
            `Avg speed: ${mesh.userData.avgSpeedMbps} Mbps`,
            `Devices: ${devices.desktop} desktop · ${devices.mobile} mobile · ${devices.tablet} tablet`,
            `Timezone: ${(mesh.userData.timezones as string[]).join(', ') || '—'}`,
            `Dragging with ${linked} linked ${linked === 1 ? 'country' : 'countries'}`,
          ],
        })
      }
      context.renderer.domElement.style.cursor = 'grabbing'
    })

    dragControls.addEventListener('drag', (event) => {
      const mesh = event.object as THREE.Mesh
      if (mesh.userData.kind !== 'country') return
      graphHandle.moveCountryCluster(
        mesh.userData.code as string,
        mesh.position,
        dragPrevious,
      )
      dragPrevious.copy(mesh.position)
    })

    dragControls.addEventListener('dragend', () => {
      isDragging = false
      context.controls.enabled = true
      context.renderer.domElement.style.cursor = 'grab'
    })

    const onPointerMove = (event: PointerEvent) => {
      if (isDragging) return

      const rect = context.renderer.domElement.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, context.camera)
      const hit = raycaster.intersectObjects(graphHandle.countryMeshes, false)[0]?.object

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
        context.renderer.domElement.style.cursor = 'grab'
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
      dragControls.dispose()
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
        <span>Drag a country — linked countries move with it</span>
        <span>Empty space: rotate · Scroll: zoom</span>
      </div>
    </div>
  )
}
