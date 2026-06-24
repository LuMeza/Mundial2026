'use client'
import { useEffect, useRef } from 'react'

export default function RankingBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let animId: number
    let THREE: any

    const init = async () => {
      const mod = await import('three')
      THREE = mod

      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(window.innerWidth, window.innerHeight)

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100)
      camera.position.z = 5

      // Partículas flotantes — estilo confetti/estadio
      const COUNT = 180
      const geo = new THREE.BufferGeometry()
      const positions = new Float32Array(COUNT * 3)
      const colors = new Float32Array(COUNT * 3)
      const sizes = new Float32Array(COUNT)
      const speeds = new Float32Array(COUNT)
      const phases = new Float32Array(COUNT)

      const palette = [
        [1.0, 0.30, 0.0],   // fire
        [1.0, 0.84, 0.04],  // gold
        [0.0, 0.83, 0.42],  // turf
        [1.0, 1.0, 1.0],    // white
      ]

      for (let i = 0; i < COUNT; i++) {
        positions[i * 3]     = (Math.random() - 0.5) * 20
        positions[i * 3 + 1] = (Math.random() - 0.5) * 12
        positions[i * 3 + 2] = (Math.random() - 0.5) * 6 - 2

        const c = palette[Math.floor(Math.random() * palette.length)]
        colors[i * 3]     = c[0]
        colors[i * 3 + 1] = c[1]
        colors[i * 3 + 2] = c[2]

        sizes[i]  = Math.random() * 3 + 1
        speeds[i] = Math.random() * 0.3 + 0.1
        phases[i] = Math.random() * Math.PI * 2
      }

      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
      geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

      const mat = new THREE.PointsMaterial({
        vertexColors: true,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.35,
        size: 0.06,
      })

      const points = new THREE.Points(geo, mat)
      scene.add(points)

      // Líneas de cancha / grid sutil
      const lineMat = new THREE.LineBasicMaterial({ color: 0x00d46a, transparent: true, opacity: 0.04 })
      for (let i = -5; i <= 5; i++) {
        const lg = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(i * 1.5, -8, -3),
          new THREE.Vector3(i * 1.5,  8, -3),
        ])
        scene.add(new THREE.Line(lg, lineMat))
      }
      for (let i = -4; i <= 4; i++) {
        const lg = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-12, i * 1.5, -3),
          new THREE.Vector3( 12, i * 1.5, -3),
        ])
        scene.add(new THREE.Line(lg, lineMat))
      }

      let t = 0
      const pos = geo.attributes.position as THREE.BufferAttribute

      const animate = () => {
        animId = requestAnimationFrame(animate)
        t += 0.005

        for (let i = 0; i < COUNT; i++) {
          pos.array[i * 3 + 1] = (pos.array[i * 3 + 1] as number) + speeds[i] * 0.008
          pos.array[i * 3]     = (pos.array[i * 3] as number) + Math.sin(t + phases[i]) * 0.002
          // Wrap Y
          if (pos.array[i * 3 + 1] > 7) pos.array[i * 3 + 1] = -7
        }
        pos.needsUpdate = true

        points.rotation.z = Math.sin(t * 0.1) * 0.02
        renderer.render(scene, camera)
      }
      animate()

      const onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
      }
      window.addEventListener('resize', onResize)

      return () => {
        window.removeEventListener('resize', onResize)
        cancelAnimationFrame(animId)
        renderer.dispose()
      }
    }

    const cleanup = init()
    return () => { cleanup.then(fn => fn?.()) }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}
