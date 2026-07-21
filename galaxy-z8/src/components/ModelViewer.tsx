import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import modelUrl from '../assets/object_0.glb?url'
import './ModelViewer.css'

export default function ModelViewer() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current!
    const w = mount.clientWidth
    const h = mount.clientHeight

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a0a)

    // Camera
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 1000)
    camera.position.set(0, 2, 6)

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(w, h)
    renderer.shadowMap.enabled = true
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    mount.appendChild(renderer.domElement)

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 1.5)
    scene.add(ambient)

    const sun = new THREE.DirectionalLight(0xfff4e0, 2.5)
    sun.position.set(5, 10, 5)
    sun.castShadow = true
    scene.add(sun)

    const fill = new THREE.DirectionalLight(0xaaccff, 0.8)
    fill.position.set(-5, 3, -5)
    scene.add(fill)

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.enableZoom = true
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.8
    controls.minDistance = 2
    controls.maxDistance = 20

    // Load GLB
    const loader = new GLTFLoader()
    loader.load(modelUrl, (gltf) => {
      const model = gltf.scene

      // Center and scale
      const box = new THREE.Box3().setFromObject(model)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())
      const maxDim = Math.max(size.x, size.y, size.z)
      const scale = 4 / maxDim

      model.position.sub(center)
      model.scale.setScalar(scale)

      scene.add(model)

      // Aim camera at model
      controls.target.set(0, 0, 0)
      controls.update()
    })

    // Animation loop
    let animId: number
    const animate = () => {
      animId = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // Resize
    const onResize = () => {
      const w2 = mount.clientWidth
      const h2 = mount.clientHeight
      camera.aspect = w2 / h2
      camera.updateProjectionMatrix()
      renderer.setSize(w2, h2)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      controls.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <section className="model-section">
      <div className="model-section__header">
        <h2 className="model-section__title">תצוגת מודל 3D</h2>
        <p className="model-section__sub">גרור עם העכבר לסיבוב · גלגל לזום</p>
      </div>
      <div className="model-canvas" ref={mountRef} />
    </section>
  )
}
