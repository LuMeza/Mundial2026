'use client'
import { useState } from 'react'

interface Props {
  j: { uid: string; nombre: string; avatar: string | null; total: number; exactos: number; ganadores: number }
  mi: number   // 0=oro, 1=plata, 2=bronce
  esYo: boolean
  medallas: string[]
}

const COLORES = [
  { ring: '#FFD60A', glow: 'rgba(255,214,10,0.3)',  text: '#FFD60A', badge: 'rgba(255,214,10,0.15)', label: 'LÍDER' },
  { ring: '#C0C0C0', glow: 'rgba(192,192,192,0.2)', text: '#C0C0C0', badge: 'rgba(192,192,192,0.1)', label: '2°' },
  { ring: '#CD7F32', glow: 'rgba(205,127,50,0.2)',  text: '#CD7F32', badge: 'rgba(205,127,50,0.1)', label: '3°' },
]

export default function PodioCard({ j, mi, esYo, medallas }: Props) {
  const [hov, setHov] = useState(false)
  const c = COLORES[mi]
  const isOro = mi === 0

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        padding: isOro ? '28px 16px 20px' : '20px 12px 16px',
        borderRadius: 14,
        background: isOro
          ? `linear-gradient(160deg, rgba(255,214,10,0.08) 0%, rgba(255,214,10,0.02) 100%)`
          : `rgba(255,255,255,0.02)`,
        border: `1px solid ${esYo ? 'var(--stroke-fire)' : c.ring + '55'}`,
        boxShadow: isOro ? `0 0 40px ${c.glow}, inset 0 1px 0 rgba(255,214,10,0.15)` : 'none',
        transform: hov ? 'translateY(-6px)' : isOro ? 'translateY(-4px)' : 'none',
        transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s',
        position: 'relative', overflow: 'hidden', cursor: 'default',
      }}
    >
      {/* Shimmer top */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: isOro ? 3 : 2, background: `linear-gradient(90deg, transparent, ${c.ring}, transparent)` }} />

      {/* Medalla */}
      <span style={{ fontSize: isOro ? 44 : 32, lineHeight: 1, filter: hov ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' : 'none', transition: 'filter 0.2s' }}>
        {medallas[mi]}
      </span>

      {/* Avatar */}
      {j.avatar
        ? <img src={j.avatar} alt={j.nombre}
            style={{ width: isOro ? 60 : 44, height: isOro ? 60 : 44, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${c.ring}`, boxShadow: `0 0 16px ${c.glow}` }} />
        : <div style={{
            width: isOro ? 60 : 44, height: isOro ? 60 : 44, borderRadius: '50%',
            background: `linear-gradient(135deg, ${c.badge}, rgba(0,0,0,0.3))`,
            border: `2px solid ${c.ring}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: isOro ? 22 : 16, fontWeight: 900, color: c.text,
            fontFamily: 'var(--font-display)',
            boxShadow: `0 0 16px ${c.glow}`,
          }}>{j.nombre[0]}</div>
      }

      {/* Nombre */}
      <p style={{
        fontSize: isOro ? 13 : 12, fontWeight: 700,
        color: esYo ? 'var(--fire)' : c.text,
        fontFamily: 'var(--font-body)', textAlign: 'center',
        maxWidth: isOro ? 120 : 90,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        lineHeight: 1.2,
      }}>{j.nombre}</p>

      {/* Puntos */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: isOro ? 36 : 26,
          color: c.text, lineHeight: 1, fontWeight: 900,
          textShadow: `0 0 20px ${c.glow}`,
        }}>{j.total}</span>
        <span style={{ fontSize: 9, color: 'var(--text-3)', fontFamily: 'var(--font-display)', letterSpacing: '0.12em' }}>PTS</span>
      </div>

      {/* Stats mini */}
      <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
        {j.exactos > 0 && (
          <span style={{ fontSize: 10, color: 'var(--gold)', background: 'rgba(255,214,10,0.1)', borderRadius: 4, padding: '2px 6px', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
            {j.exactos}⭐
          </span>
        )}
        {j.ganadores > 0 && (
          <span style={{ fontSize: 10, color: 'var(--turf)', background: 'rgba(0,212,106,0.1)', borderRadius: 4, padding: '2px 6px', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
            {j.ganadores}✓
          </span>
        )}
      </div>

      {esYo && (
        <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 8, fontWeight: 800, color: 'var(--fire)', background: 'var(--fire-dim)', border: '1px solid var(--stroke-fire)', padding: '2px 5px', borderRadius: 3, fontFamily: 'var(--font-display)', letterSpacing: '0.1em' }}>TÚ</span>
      )}
    </div>
  )
}
