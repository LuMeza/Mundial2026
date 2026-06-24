'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function LoginBall() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let animId: number
    let cleanup: (() => void) | undefined

    const init = () => {
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.shadowMap.enabled = true

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100)
      camera.position.set(0, 0, 7)

      // Iluminación dramática
      const ambient = new THREE.AmbientLight(0xffffff, 0.3)
      scene.add(ambient)

      const keyLight = new THREE.DirectionalLight(0xFF4D00, 2.2)
      keyLight.position.set(3, 4, 5)
      scene.add(keyLight)

      const fillLight = new THREE.DirectionalLight(0x00D46A, 0.8)
      fillLight.position.set(-4, -2, 3)
      scene.add(fillLight)

      const rimLight = new THREE.DirectionalLight(0xFFD60A, 0.5)
      rimLight.position.set(0, -5, -3)
      scene.add(rimLight)

      // Balón low-poly: icosaedro subdividido
      const ballGeo = new THREE.IcosahedronGeometry(1.4, 1)

      // Material base — negro mate con shine naranja
      const ballMat = new THREE.MeshStandardMaterial({
        color: 0x0a0d11,
        metalness: 0.15,
        roughness: 0.6,
        envMapIntensity: 0.8,
      })
      const ball = new THREE.Mesh(ballGeo, ballMat)
      scene.add(ball)

      // Wireframe encima — las "costuras" del balón
      const wireMat = new THREE.MeshBasicMaterial({
        color: 0xFF4D00,
        wireframe: true,
        transparent: true,
        opacity: 0.18,
      })
      const wire = new THREE.Mesh(ballGeo.clone(), wireMat)
      wire.scale.setScalar(1.01)
      scene.add(wire)

      // Segunda capa wireframe más sutil en verde
      const wireMat2 = new THREE.MeshBasicMaterial({
        color: 0x00D46A,
        wireframe: true,
        transparent: true,
        opacity: 0.06,
      })
      const wire2 = new THREE.Mesh(ballGeo.clone(), wireMat2)
      wire2.scale.setScalar(1.025)
      scene.add(wire2)

      // Halo glow detrás del balón
      const glowGeo = new THREE.SphereGeometry(1.85, 32, 32)
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xFF4D00,
        transparent: true,
        opacity: 0.04,
        side: THREE.BackSide,
      })
      const glow = new THREE.Mesh(glowGeo, glowMat)
      scene.add(glow)

      // Partículas orbitando
      const partCount = 60
      const partGeo = new THREE.BufferGeometry()
      const pPos = new Float32Array(partCount * 3)
      const pAngles = new Float32Array(partCount)
      const pRadii = new Float32Array(partCount)
      const pSpeeds = new Float32Array(partCount)
      const pInclinations = new Float32Array(partCount)

      for (let i = 0; i < partCount; i++) {
        pAngles[i] = Math.random() * Math.PI * 2
        pRadii[i] = 2.2 + Math.random() * 1.8
        pSpeeds[i] = (0.003 + Math.random() * 0.008) * (Math.random() > 0.5 ? 1 : -1)
        pInclinations[i] = (Math.random() - 0.5) * Math.PI * 0.7
        pPos[i * 3]     = 0
        pPos[i * 3 + 1] = 0
        pPos[i * 3 + 2] = 0
      }
      partGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3))

      const partMat = new THREE.PointsMaterial({
        color: 0xFF4D00,
        size: 0.035,
        transparent: true,
        opacity: 0.6,
        sizeAttenuation: true,
      })
      const particles = new THREE.Points(partGeo, partMat)
      scene.add(particles)

      // Posicionar balón: esquina derecha superior en desktop, centrado en mobile
      const isMobile = window.innerWidth < 768
      ball.position.set(isMobile ? 0 : 2.2, isMobile ? 0.5 : 1.2, 0)
      wire.position.copy(ball.position)
      wire2.position.copy(ball.position)
      glow.position.copy(ball.position)
      particles.position.copy(ball.position)

      // Mouse parallax
      let mx = 0, my = 0
      const onMouse = (e: MouseEvent) => {
        mx = (e.clientX / window.innerWidth - 0.5) * 2
        my = (e.clientY / window.innerHeight - 0.5) * 2
      }
      window.addEventListener('mousemove', onMouse)

      let t = 0
      const posArr = partGeo.attributes.position as THREE.BufferAttribute

      const animate = () => {
        animId = requestAnimationFrame(animate)
        t += 0.01

        // Rotación del balón — suave, con leve wobble
        ball.rotation.y = t * 0.18 + mx * 0.3
        ball.rotation.x = Math.sin(t * 0.12) * 0.15 + my * 0.2
        wire.rotation.copy(ball.rotation)
        wire2.rotation.y = -t * 0.09
        wire2.rotation.x = ball.rotation.x

        // Flotar
        const floatY = Math.sin(t * 0.5) * 0.08
        const baseY = isMobile ? 0.5 : 1.2
        ball.position.y = baseY + floatY
        wire.position.y = ball.position.y
        wire2.position.y = ball.position.y
        glow.position.y = ball.position.y
        particles.position.copy(ball.position)

        // Pulso del glow
        glowMat.opacity = 0.03 + Math.sin(t * 0.8) * 0.015

        // Partículas orbitando
        for (let i = 0; i < partCount; i++) {
          pAngles[i] += pSpeeds[i]
          const r = pRadii[i]
          const inc = pInclinations[i]
          posArr.array[i * 3]     = Math.cos(pAngles[i]) * r * Math.cos(inc)
          posArr.array[i * 3 + 1] = Math.sin(inc) * r * 0.5
          posArr.array[i * 3 + 2] = Math.sin(pAngles[i]) * r * Math.cos(inc) * 0.4
        }
        posArr.needsUpdate = true

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
        window.removeEventListener('mousemove', onMouse)
        window.removeEventListener('resize', onResize)
        cancelAnimationFrame(animId)
        renderer.dispose()
      }
    }

    cleanup = init()
    return () => { cleanup?.() }
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
