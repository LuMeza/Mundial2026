'use client'
import { useEffect, useState, useRef } from 'react'

export default function Countdown({ fechaCierre, large = false }: { fechaCierre: string; large?: boolean }) {
  const [t, setT]     = useState({ dd: '--', hh: '--', mm: '--', ss: '--' })
  const [urg, setUrg] = useState(false)
  const [rdy, setRdy] = useState(false)
  const iv = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setRdy(true)
    const dl = new Date(fechaCierre)
    const tick = () => {
      const d = dl.getTime() - Date.now()
      if (d <= 0) {
        setT({ dd:'00', hh:'00', mm:'00', ss:'00' }); setUrg(true)
        if (iv.current) { clearInterval(iv.current); iv.current = null }
        return
      }
      const p = (n: number) => String(n).padStart(2, '0')
      const days = Math.floor(d / 86400000)
      setUrg(days < 1)
      setT({ dd: p(days), hh: p(Math.floor((d%86400000)/3600000)), mm: p(Math.floor((d%3600000)/60000)), ss: p(Math.floor((d%60000)/1000)) })
    }
    tick(); iv.current = setInterval(tick, 1000)
    return () => { if (iv.current) clearInterval(iv.current) }
  }, [fechaCierre])

  const units: [keyof typeof t, string][] = [['dd','DÍAS'],['hh','HRS'],['mm','MIN'],['ss','SEG']]

  if (large) return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
      {units.map(([k, u], i) => (
        <div key={k} className={`anim-count d${i+1}`} style={{ textAlign: 'center', minWidth: 52 }}>
          <div style={{
            background: 'var(--ink-3)',
            border: `1px solid ${urg&&rdy?'rgba(255,59,48,0.3)':'var(--stroke-fire)'}`,
            borderRadius: 8,
            padding: '8px 10px',
            marginBottom: 6,
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Shimmer line */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: urg&&rdy?'var(--red-hot)':'var(--fire)', opacity: 0.5 }} />
            <div className="f-display" style={{
              fontSize: 44, lineHeight: 1, fontWeight: 900,
              color: urg && rdy ? 'var(--red-hot)' : 'var(--fire)',
              fontVariantNumeric: 'tabular-nums',
            }}>{t[k]}</div>
          </div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--text-3)', fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>{u}</div>
        </div>
      ))}
    </div>
  )

  return (
    <div style={{ display: 'flex', gap: 12 }}>
      {units.map(([k, u]) => (
        <div key={k} style={{ textAlign: 'center' }}>
          <div className="f-display" style={{ fontSize: 26, color: urg && rdy ? 'var(--red-hot)' : 'var(--fire)', lineHeight: 1 }}>{t[k]}</div>
          <div style={{ fontSize: 8, letterSpacing: '0.12em', color: 'var(--text-3)', fontWeight: 700, fontFamily: 'var(--font-display)', textTransform: 'uppercase', marginTop: 2 }}>{u}</div>
        </div>
      ))}
    </div>
  )
}
