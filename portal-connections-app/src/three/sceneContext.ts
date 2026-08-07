import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

export interface SceneContext {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  controls: OrbitControls
  resize: () => void
  dispose: () => void
}

/**
 * Core Three.js setup: scene, camera, renderer, lights, OrbitControls.
 */
export function createSceneContext(container: HTMLElement): SceneContext {
  const width = container.clientWidth || window.innerWidth
  const height = container.clientHeight || window.innerHeight

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0b1220)
  scene.fog = new THREE.Fog(0x0b1220, 40, 120)

  const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 500)
  camera.position.set(0, 18, 42)

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(width, height)
  container.appendChild(renderer.domElement)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.06
  controls.minDistance = 12
  controls.maxDistance = 90
  controls.target.set(0, 0, 0)
  controls.update()

  scene.add(new THREE.AmbientLight(0xffffff, 0.55))

  const key = new THREE.DirectionalLight(0xffffff, 1.05)
  key.position.set(20, 30, 15)
  scene.add(key)

  const fill = new THREE.DirectionalLight(0x60a5fa, 0.4)
  fill.position.set(-18, 10, -12)
  scene.add(fill)

  let animationId = 0
  const animate = () => {
    animationId = requestAnimationFrame(animate)
    controls.update()
    renderer.render(scene, camera)
  }
  animate()

  const resize = () => {
    const nextWidth = container.clientWidth || window.innerWidth
    const nextHeight = container.clientHeight || window.innerHeight
    camera.aspect = nextWidth / nextHeight
    camera.updateProjectionMatrix()
    renderer.setSize(nextWidth, nextHeight)
  }

  const dispose = () => {
    cancelAnimationFrame(animationId)
    controls.dispose()
    renderer.dispose()
    if (renderer.domElement.parentElement === container) {
      container.removeChild(renderer.domElement)
    }
  }

  return { scene, camera, renderer, controls, resize, dispose }
}
