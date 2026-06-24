'use client'
import { useEffect, useState } from 'react'
import CountUp from '@/app/components/CountUp'

interface Props {
  pct: number
  hechos: number
  total: number
  exs: number
  pts: number
  miPos: number
  rankingLen: number
}

export default function ProgresoBars({ pct, hechos, total, exs, pts, miPos, rankingLen }: Props) {
  const [filled, setFilled] = useState(false)
  useEffect(() => { setTimeout(() => setFilled(true), 300) }, [])

  const items = [
    { v: pct,  l: 'Completado', c: 'var(--text-2)', type: 'percent', colType: 'white' },
    { v: exs,  l: 'Exactos ⭐', c: 'var(--gold)',   type: 'number',  colType: 'gold'  },
    { v: pts,  l: 'Puntos',     c: 'var(--fire)',   type: 'number',  colType: 'fire'  },
  ]

  return (
    <>
      {/* Número grande + barra */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
        <span style={{ fontSize: 13, color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}>{hechos}/{total} partidos</span>
        <CountUp
          value={pct}
          duration={1200}
          suffix="%"
          className="f-display"
          style={{ fontSize: 32, color: 'var(--text)', lineHeight: 1 }}
        />
      </div>

      {/* Barra de progreso animada */}
      <div className="prog-track" style={{ marginBottom: 26 }}>
        <div
          className="prog-fill"
          style={{
            width: filled ? `${pct}%` : '0%',
            transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: pct === 100 ? '0 0 16px rgba(0,212,106,0.7), 0 0 32px rgba(0,212,106,0.3)' : '0 0 8px rgba(255,77,0,0.35)',
          }}
        />
      </div>

      {/* Celebración si 100% */}
      {pct === 100 && filled && (
        <div style={{
          background: 'rgba(0,212,106,0.08)', border: '1px solid rgba(0,212,106,0.25)',
          borderRadius: 8, padding: '10px 16px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 10,
          animation: 'fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both',
        }}>
          <span style={{ fontSize: 20 }}>🎉</span>
          <p style={{ fontSize: 13, color: 'var(--turf)', fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>
            ¡TODOS LOS PRONÓSTICOS COMPLETOS!
          </p>
        </div>
      )}

      {/* Mini stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 22 }}>
        {items.map(({ v, l, c, type, colType }) => (
          <div key={l} className={`stat-card ${colType}`}>
            <CountUp
              value={v}
              duration={1000}
              suffix={type === 'percent' ? '%' : ''}
              className="f-display anim-count"
              style={{ fontSize: 30, color: c, lineHeight: 1, marginBottom: 4, display: 'block' }}
            />
            <p style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-display)' }}>{l}</p>
          </div>
        ))}
      </div>

      {miPos > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '1px solid var(--stroke-2)', marginBottom: 18 }}>
          <span style={{ fontSize: 13, color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}>Mi posición en el ranking</span>
          <span className="f-display" style={{ fontSize: 24, color: 'var(--fire)' }}>
            #<CountUp value={miPos} duration={900} style={{ display: 'inline' }} />
            {' '}<span style={{ fontSize: 14, color: 'var(--text-3)', fontWeight: 400 }}>de {rankingLen}</span>
          </span>
        </div>
      )}
    </>
  )
}
