'use client'
import { useState, useRef } from 'react'
import { guardarPronostico } from './actions'

interface Props {
  partido: {
    id: number
    equipo_local: string
    equipo_visitante: string
    codigo_local: string | null
    codigo_visitante: string | null
    fecha: string
    hora: string
    grupo: string | null
  }
  pronosticoInicial?: { goles_local: number; goles_visitante: number }
  cerrado?: boolean
}

const getFlagUrl = (codigo: string) => `https://flagcdn.com/48x36/${codigo.toLowerCase()}.png`
const formatFecha = (fecha: string) => new Date(fecha + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })
const formatHora  = (hora: string) => hora.slice(0, 5) + ' CST'

export default function PartidoCard({ partido, pronosticoInicial, cerrado }: Props) {
  const [local, setLocal]       = useState<number | ''>(pronosticoInicial?.goles_local ?? '')
  const [visitante, setVisitante] = useState<number | ''>(pronosticoInicial?.goles_visitante ?? '')
  const [estado, setEstado]     = useState<'idle' | 'guardando' | 'guardado' | 'error'>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleGuardar = async () => {
    if (local === '' || visitante === '' || cerrado) return
    if (local === pronosticoInicial?.goles_local && visitante === pronosticoInicial?.goles_visitante) return
    setEstado('guardando')
    if (timerRef.current) clearTimeout(timerRef.current)
    const result = await guardarPronostico(partido.id, Number(local), Number(visitante))
    if (result?.ok) {
      setEstado('guardado')
      timerRef.current = setTimeout(() => setEstado('idle'), 2500)
    } else {
      setEstado('error')
      timerRef.current = setTimeout(() => setEstado('idle'), 3000)
    }
  }

  const tienePronostico = local !== '' && visitante !== ''

  return (
    <div style={{
      padding: '14px 20px',
      borderBottom: '1px solid var(--stroke-2)',
      transition: 'background 0.15s',
      background: tienePronostico ? 'rgba(0,212,106,0.03)' : 'transparent',
      borderLeft: tienePronostico ? '3px solid rgba(0,212,106,0.35)' : '3px solid transparent',
    }}
      onMouseEnter={e => { if (!tienePronostico) (e.currentTarget as HTMLElement).style.background = 'var(--ink-3)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = tienePronostico ? 'rgba(0,212,106,0.03)' : 'transparent' }}
    >
      {/* Fecha/hora + estado */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'capitalize', fontFamily: 'var(--font-body)' }}>{formatFecha(partido.fecha)}</span>
        <span style={{ color: 'var(--text-4)', fontSize: 10 }}>·</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>{formatHora(partido.hora)}</span>
        {tienePronostico && (
          <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: 'var(--turf)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>✓ PRONÓSTICO</span>
        )}
        {cerrado && !tienePronostico && (
          <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>🔒 CERRADO</span>
        )}
      </div>

      {/* Fila: local | inputs | visitante */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

        {/* Equipo local */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', textAlign: 'right', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}>
            {partido.equipo_local}
          </span>
          {partido.codigo_local && (
            <img src={getFlagUrl(partido.codigo_local)} alt={partido.equipo_local}
              style={{ width: 32, height: 24, borderRadius: 4, objectFit: 'cover', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.35)' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          )}
        </div>

        {/* Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="number" inputMode="numeric" pattern="[0-9]*" min="0" max="20" value={local}
              onChange={e => setLocal(e.target.value === '' ? '' : Math.max(0, Math.min(20, Number(e.target.value))))}
              onBlur={handleGuardar} disabled={cerrado} placeholder="?"
              className={`score-box ${tienePronostico ? 'has-value' : ''}`}
              style={{ width: 44, height: 44, fontSize: 22 }}
            />
            <span style={{ color: 'var(--text-3)', fontWeight: 700, fontSize: 14, fontFamily: 'var(--font-display)' }}>—</span>
            <input type="number" inputMode="numeric" pattern="[0-9]*" min="0" max="20" value={visitante}
              onChange={e => setVisitante(e.target.value === '' ? '' : Math.max(0, Math.min(20, Number(e.target.value))))}
              onBlur={handleGuardar} disabled={cerrado} placeholder="?"
              className={`score-box ${tienePronostico ? 'has-value' : ''}`}
              style={{ width: 44, height: 44, fontSize: 22 }}
            />
          </div>
          <div style={{ height: 16, display: 'flex', alignItems: 'center' }}>
            {estado === 'guardando' && (
              <span style={{ fontSize: 9, color: 'var(--gold)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>
                <span className="anim-spin" style={{ display: 'inline-block', width: 8, height: 8, border: '1.5px solid var(--gold)', borderTopColor: 'transparent', borderRadius: '50%' }} />
                GUARDANDO
              </span>
            )}
            {estado === 'guardado' && (
              <span style={{ fontSize: 9, color: 'var(--turf)', fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>✓ GUARDADO</span>
            )}
            {estado === 'error' && (
              <span style={{ fontSize: 9, color: 'var(--red-hot)', fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>✗ REINTENTAR</span>
            )}
          </div>
        </div>

        {/* Equipo visitante */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {partido.codigo_visitante && (
            <img src={getFlagUrl(partido.codigo_visitante)} alt={partido.equipo_visitante}
              style={{ width: 32, height: 24, borderRadius: 4, objectFit: 'cover', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.35)' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          )}
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}>
            {partido.equipo_visitante}
          </span>
        </div>

      </div>
    </div>
  )
}
