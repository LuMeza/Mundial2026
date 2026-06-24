'use client'
import { useState } from 'react'

interface Jugador {
  uid: string
  nombre: string
  avatar: string | null
  total: number
  exactos: number
  ganadores: number
  totalPronos: number
}

interface Props {
  j: Jugador
  pos: number        // 0-based index
  esYo: boolean
  lidPts: number
  medallas: string[]
}

export default function RankingFila({ j, pos, esYo, lidPts, medallas }: Props) {
  const [hov, setHov] = useState(false)

  const isTop3   = pos < 3
  const medColor = pos === 0 ? '#FFD60A' : pos === 1 ? '#C0C0C0' : '#CD7F32'
  const barPct   = lidPts > 0 ? Math.round((j.total / lidPts) * 100) : 0

  const bg = hov && !esYo
    ? 'var(--ink-3)'
    : esYo
      ? 'var(--fire-glow)'
      : isTop3
        ? `${medColor}06`
        : 'transparent'

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '11px 20px',
        borderBottom: '1px solid var(--stroke-2)',
        borderLeft: esYo
          ? '3px solid var(--fire)'
          : isTop3
            ? `3px solid ${medColor}44`
            : '3px solid transparent',
        background: bg,
        transition: 'background 0.1s',
        position: 'relative',
        cursor: 'default',
      }}
    >
      {/* Posición */}
      <div style={{ width: 40, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isTop3
          ? <span style={{ fontSize: 20 }}>{medallas[pos]}</span>
          : <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--text-3)', fontWeight: 700 }}>{pos + 1}</span>
        }
      </div>

      {/* Avatar */}
      {j.avatar
        ? <img src={j.avatar} alt={j.nombre}
            style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--stroke)', flexShrink: 0 }} />
        : <div style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
            background: esYo ? 'var(--fire-dim)' : isTop3 ? `${medColor}22` : 'var(--ink-3)',
            border: `1px solid ${esYo ? 'var(--stroke-fire)' : isTop3 ? medColor + '55' : 'var(--stroke)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 900,
            color: esYo ? 'var(--fire)' : isTop3 ? medColor : 'var(--text-3)',
          }}>{j.nombre[0]}</div>
      }

      {/* Nombre + barra */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontSize: 13, fontWeight: 600,
            color: esYo ? 'var(--fire)' : 'var(--text)',
            fontFamily: 'var(--font-body)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{j.nombre}</span>
          {esYo && (
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 8, fontWeight: 800,
              color: 'var(--fire)', background: 'var(--fire-dim)',
              border: '1px solid var(--stroke-fire)',
              padding: '1px 5px', borderRadius: 3, letterSpacing: '0.1em', flexShrink: 0,
            }}>TÚ</span>
          )}
        </div>
        {/* Barra relativa al líder */}
        <div style={{ height: 3, background: 'var(--stroke)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 99,
            width: `${barPct}%`,
            background: pos === 0
              ? 'linear-gradient(90deg, var(--gold), rgba(255,214,10,0.4))'
              : esYo
                ? 'linear-gradient(90deg, var(--fire), rgba(255,77,0,0.4))'
                : 'linear-gradient(90deg, var(--text-3), rgba(240,244,248,0.1))',
            transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
          }} />
        </div>
      </div>

      {/* Exactos — oculto mobile */}
      <div className="rk-th-hide" style={{ width: 52, textAlign: 'right', flexShrink: 0 }}>
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800,
          color: j.exactos > 0 ? 'var(--gold)' : 'var(--text-3)',
        }}>{j.exactos}</span>
      </div>

      {/* Ganadores — oculto mobile */}
      <div className="rk-th-hide" style={{ width: 52, textAlign: 'right', flexShrink: 0 }}>
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800,
          color: j.ganadores > 0 ? 'var(--turf)' : 'var(--text-3)',
        }}>{j.ganadores}</span>
      </div>

      {/* Puntos */}
      <div style={{ width: 60, flexShrink: 0, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 900, lineHeight: 1,
          color: pos === 0 ? 'var(--gold)' : pos === 1 ? '#C0C0C0' : pos === 2 ? '#CD7F32' : esYo ? 'var(--fire)' : 'var(--text)',
          textShadow: pos === 0 ? '0 0 20px rgba(255,214,10,0.4)' : 'none',
        }}>{j.total}</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 8, color: 'var(--text-3)', letterSpacing: '0.1em' }}>PTS</span>
      </div>
    </div>
  )
}
