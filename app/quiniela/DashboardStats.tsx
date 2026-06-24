'use client'
import { useEffect, useState } from 'react'
import CountUp from '@/app/components/CountUp'

interface Props {
  pct: number
  exs: number
  pts: number
  miPos: number
  rankingLen: number
}

export default function DashboardStats({ pct, exs, pts, miPos, rankingLen }: Props) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { setTimeout(() => setVisible(true), 200) }, [])

  const items = [
    { icon: '⭐', v: exs,    l: 'Exactos',  c: 'var(--gold)',   type: 'number'  },
    { icon: '✅', v: pct,    l: 'Progreso', c: 'var(--turf)',   type: 'percent' },
    { icon: '🏆', v: pts,    l: 'Puntos',   c: 'var(--fire)',   type: 'number'  },
    ...(miPos > 0 ? [{ icon: '📍', v: miPos, l: 'Ranking', c: 'var(--text-2)', type: 'rank' }] : []),
  ]

  return (
    <div style={{ display: 'flex', gap: 16, marginTop: 20, flexWrap: 'wrap' }}>
      {items.map(({ icon, v, l, c, type }) => (
        <div key={l} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--ink-2)', border: '1px solid var(--stroke)',
          borderRadius: 8, padding: '8px 14px',
          transition: 'border-color 0.2s, transform 0.2s',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--stroke-fire)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--stroke)'; (e.currentTarget as HTMLElement).style.transform = 'none' }}
        >
          <span style={{ fontSize: 16 }}>{icon}</span>
          <div>
            {visible ? (
              type === 'rank'
                ? <CountUp value={v as number} duration={900} className="f-display" prefix="#" style={{ fontSize: 18, color: c, lineHeight: 1, display: 'block' }} />
                : type === 'percent'
                  ? <CountUp value={v as number} duration={1000} className="f-display" suffix="%" style={{ fontSize: 18, color: c, lineHeight: 1, display: 'block' }} />
                  : <CountUp value={v as number} duration={1100} className="f-display" style={{ fontSize: 18, color: c, lineHeight: 1, display: 'block' }} />
            ) : (
              <span className="f-display" style={{ fontSize: 18, color: c, lineHeight: 1, display: 'block' }}>0</span>
            )}
            <p style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{l}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
