import * as THREE from 'three'
import type { GraphData } from '../types'

const MIN_RADIUS = 0.45
const MAX_RADIUS = 2.8
const LAYOUT_RADIUS = 16

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
      const mesh = child as THREE.Mesh | THREE.Line
      mesh.geometry.dispose()
      const material = mesh.material
      if (Array.isArray(material)) {
        material.forEach((m) => m.dispose())
      } else {
        material.dispose()
      }
    }
    if (child instanceof THREE.Sprite) {
      const map = child.material.map
      map?.dispose()
      child.material.dispose()
    }
  })
}

function fibonacciSphere(count: number, radius: number): THREE.Vector3[] {
  const points: THREE.Vector3[] = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / Math.max(count - 1, 1)) * 2
    const r = Math.sqrt(1 - y * y)
    const theta = golden * i
    points.push(new THREE.Vector3(Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius))
  }
  return points
}

function createLabel(text: string): THREE.Sprite {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 96
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)'
    ctx.fillRect(16, 24, 224, 48)
    ctx.fillStyle = '#e2e8f0'
    ctx.font = 'bold 36px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, canvas.width / 2, canvas.height / 2)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(3.2, 1.2, 1)
  return sprite
}

function scaleRadius(count: number, minCount: number, maxCount: number): number {
  if (maxCount <= minCount) return (MIN_RADIUS + MAX_RADIUS) / 2
  const t = (count - minCount) / (maxCount - minCount)
  return MIN_RADIUS + Math.sqrt(t) * (MAX_RADIUS - MIN_RADIUS)
}

/**
 * Builds a relational 3D graph: country spheres sized by connection volume,
 * with lines for related-country links.
 */
export function buildRelationGraph(graph: GraphData): THREE.Group {
  const group = new THREE.Group()
  group.name = 'relation-graph'

  const counts = graph.nodes.map((n) => n.connectionCount)
  const minCount = Math.min(...counts)
  const maxCount = Math.max(...counts)
  const positions = fibonacciSphere(graph.nodes.length, LAYOUT_RADIUS)
  const positionByCode = new Map<string, THREE.Vector3>()

  const hub = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 24, 24),
    new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.55,
      metalness: 0.2,
      roughness: 0.35,
    }),
  )
  hub.name = 'portal-hub'
  group.add(hub)

  graph.nodes.forEach((node, index) => {
    const radius = scaleRadius(node.connectionCount, minCount, maxCount)
    const position = positions[index] ?? new THREE.Vector3()
    positionByCode.set(node.code, position.clone())

    const color = new THREE.Color().setHSL(0.55 - (radius / MAX_RADIUS) * 0.35, 0.75, 0.52)
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 32, 32),
      new THREE.MeshStandardMaterial({
        color,
        metalness: 0.15,
        roughness: 0.4,
        emissive: color.clone().multiplyScalar(0.15),
      }),
    )
    mesh.position.copy(position)
    mesh.userData = {
      kind: 'country',
      code: node.code,
      name: node.name,
      connectionCount: node.connectionCount,
      avgSpeedMbps: node.avgSpeedMbps,
      deviceCounts: node.deviceCounts,
      timezones: node.timezones,
    }
    group.add(mesh)

    const label = createLabel(node.code)
    label.position.copy(position).add(new THREE.Vector3(0, radius + 0.9, 0))
    group.add(label)

    // Soft link toward the portal hub
    const hubPoints = [new THREE.Vector3(0, 0, 0), position]
    const hubGeom = new THREE.BufferGeometry().setFromPoints(hubPoints)
    const hubLine = new THREE.Line(
      hubGeom,
      new THREE.LineBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.25 }),
    )
    group.add(hubLine)
  })

  const maxWeight = Math.max(...graph.relations.map((r) => r.weight), 1)
  for (const relation of graph.relations) {
    const from = positionByCode.get(relation.from)
    const to = positionByCode.get(relation.to)
    if (!from || !to) continue
    if (relation.weight < 3) continue

    const geom = new THREE.BufferGeometry().setFromPoints([from, to])
    const opacity = 0.15 + (relation.weight / maxWeight) * 0.55
    const line = new THREE.Line(
      geom,
      new THREE.LineBasicMaterial({
        color: 0x7dd3fc,
        transparent: true,
        opacity,
      }),
    )
    line.userData = {
      kind: 'relation',
      from: relation.from,
      to: relation.to,
      weight: relation.weight,
    }
    group.add(line)
  }

  return group
}

export function removeRelationGraph(scene: THREE.Scene) {
  const existing = scene.getObjectByName('relation-graph')
  if (existing) {
    scene.remove(existing)
    disposeObject(existing)
  }
}
