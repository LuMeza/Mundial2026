'use client'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import CountUp from '@/app/components/CountUp'

interface StatItem {
  l: string
  v: number | string
  sub: string
  c: string
  type: string
}

interface Props {
  statItems: StatItem[]
  exactos: number
}

function Confetti({ count = 80 }: { count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let animId: number
    let cleanup: (() => void) | undefined

    const init = () => {
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false })
      renderer.setPixelRatio(1)
      renderer.setSize(window.innerWidth, window.innerHeight)

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100)
      camera.position.z = 6

      const colors = [0xFF4D00, 0xFFD60A, 0x00D46A, 0xFFFFFF, 0xFF3B30]
      const pieces: Array<{ mesh: THREE.Mesh; vx: number; vy: number; vr: number; rx: number; ry: number }> = []

      for (let i = 0; i < count; i++) {
        const geo = new THREE.PlaneGeometry(
          0.08 + Math.random() * 0.12,
          0.03 + Math.random() * 0.06
        )
        const mat = new THREE.MeshBasicMaterial({
          color: colors[Math.floor(Math.random() * colors.length)],
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9,
        })
        const mesh = new THREE.Mesh(geo, mat)
        mesh.position.set(
          (Math.random() - 0.5) * 12,
          4 + Math.random() * 6,
          (Math.random() - 0.5) * 2
        )
        mesh.rotation.set(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        )
        scene.add(mesh)
        pieces.push({
          mesh,
          vx: (Math.random() - 0.5) * 0.04,
          vy: -(0.03 + Math.random() * 0.06),
          vr: (Math.random() - 0.5) * 0.12,
          rx: (Math.random() - 0.5) * 0.08,
          ry: (Math.random() - 0.5) * 0.08,
        })
      }

      const animate = () => {
        animId = requestAnimationFrame(animate)
        for (const p of pieces) {
          p.mesh.position.x += p.vx
          p.mesh.position.y += p.vy
          p.mesh.rotation.z += p.vr
          p.mesh.rotation.x += p.rx
          p.mesh.rotation.y += p.ry
          // Fade out as they fall
          const matRef = p.mesh.material as THREE.MeshBasicMaterial
          if (p.mesh.position.y < -5) {
            matRef.opacity = Math.max(0, matRef.opacity - 0.02)
          }
          // Wrap
          if (p.mesh.position.y < -7) {
            p.mesh.position.y = 5
            p.mesh.position.x = (Math.random() - 0.5) * 12
            matRef.opacity = 0.9
          }
        }
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

    cleanup = init()
    return () => { cleanup?.() }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 0,
      }}
    />
  )
}

export default function ResultadosStats({ statItems, exactos }: Props) {
  const [visible, setVisible] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    setTimeout(() => setVisible(true), 150)
    // Confetti solo si tienes 5+ exactos — celebración merecida
    if (exactos >= 5) {
      setTimeout(() => setShowConfetti(true), 600)
    }
  }, [exactos])

  return (
    <>
      {showConfetti && <Confetti count={100} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 20 }} className="stats-grid">
        {statItems.map(({ l, v, sub, c, type }, i) => (
          <div
            key={l}
            className={`anim-count stat-card ${type}`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-3)', marginBottom: 10, textTransform: 'uppercase', fontFamily: 'var(--font-display)' }}>{l}</p>

            {visible ? (
              typeof v === 'number' ? (
                <CountUp
                  value={v}
                  duration={900 + i * 120}
                  className="f-display"
                  style={{ fontSize: 'clamp(36px,5vw,60px)', color: c, lineHeight: 1, marginBottom: 4, display: 'block' }}
                />
              ) : (
                // Strings como "#3" — count-up del número interno
                <CountUp
                  value={v}
                  duration={900 + i * 120}
                  className="f-display"
                  style={{ fontSize: 'clamp(36px,5vw,60px)', color: c, lineHeight: 1, marginBottom: 4, display: 'block' }}
                />
              )
            ) : (
              <p className="f-display" style={{ fontSize: 'clamp(36px,5vw,60px)', color: c, lineHeight: 1, marginBottom: 4 }}>0</p>
            )}

            {sub && <p style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}>{sub}</p>}

            {/* Banner celebración para exactos ≥ 5 */}
            {exactos >= 5 && l === 'EXACTOS ⭐' && visible && (
              <div style={{
                marginTop: 8, fontSize: 9, fontWeight: 800, letterSpacing: '0.1em',
                color: 'var(--gold)', fontFamily: 'var(--font-display)', textTransform: 'uppercase',
                animation: 'fade-up 0.5s 0.8s both',
              }}>
                🔥 TOP PRONOSTICADOR
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
