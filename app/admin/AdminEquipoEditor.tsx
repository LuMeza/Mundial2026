'use client'
import { useState, useRef } from 'react'
import { actualizarEquipo } from './actions'

// Lista de países con sus códigos de bandera para autocompletar
const PAISES: { nombre: string; codigo: string }[] = [
  { nombre: 'México', codigo: 'MX' },
  { nombre: 'EEUU', codigo: 'US' },
  { nombre: 'Canadá', codigo: 'CA' },
  { nombre: 'Argentina', codigo: 'AR' },
  { nombre: 'Brasil', codigo: 'BR' },
  { nombre: 'Colombia', codigo: 'CO' },
  { nombre: 'Uruguay', codigo: 'UY' },
  { nombre: 'Paraguay', codigo: 'PY' },
  { nombre: 'Ecuador', codigo: 'EC' },
  { nombre: 'Perú', codigo: 'PE' },
  { nombre: 'Chile', codigo: 'CL' },
  { nombre: 'Bolivia', codigo: 'BO' },
  { nombre: 'Venezuela', codigo: 'VE' },
  { nombre: 'Panamá', codigo: 'PA' },
  { nombre: 'Costa Rica', codigo: 'CR' },
  { nombre: 'Honduras', codigo: 'HN' },
  { nombre: 'Guatemala', codigo: 'GT' },
  { nombre: 'El Salvador', codigo: 'SV' },
  { nombre: 'Haití', codigo: 'HT' },
  { nombre: 'Jamaica', codigo: 'JM' },
  { nombre: 'España', codigo: 'ES' },
  { nombre: 'Francia', codigo: 'FR' },
  { nombre: 'Alemania', codigo: 'DE' },
  { nombre: 'Inglaterra', codigo: 'GB-ENG' },
  { nombre: 'Portugal', codigo: 'PT' },
  { nombre: 'Holanda', codigo: 'NL' },
  { nombre: 'Bélgica', codigo: 'BE' },
  { nombre: 'Italia', codigo: 'IT' },
  { nombre: 'Suiza', codigo: 'CH' },
  { nombre: 'Austria', codigo: 'AT' },
  { nombre: 'Suecia', codigo: 'SE' },
  { nombre: 'Noruega', codigo: 'NO' },
  { nombre: 'Dinamarca', codigo: 'DK' },
  { nombre: 'Escocia', codigo: 'GB-SCT' },
  { nombre: 'Croacia', codigo: 'HR' },
  { nombre: 'Polonia', codigo: 'PL' },
  { nombre: 'República Checa', codigo: 'CZ' },
  { nombre: 'Turquía', codigo: 'TR' },
  { nombre: 'Ucrania', codigo: 'UA' },
  { nombre: 'Serbia', codigo: 'RS' },
  { nombre: 'Hungría', codigo: 'HU' },
  { nombre: 'Rumanía', codigo: 'RO' },
  { nombre: 'Eslovenia', codigo: 'SI' },
  { nombre: 'Bosnia y Herzegovina', codigo: 'BA' },
  { nombre: 'Marruecos', codigo: 'MA' },
  { nombre: 'Senegal', codigo: 'SN' },
  { nombre: 'Nigeria', codigo: 'NG' },
  { nombre: 'Ghana', codigo: 'GH' },
  { nombre: 'Egipto', codigo: 'EG' },
  { nombre: 'Túnez', codigo: 'TN' },
  { nombre: 'Camerún', codigo: 'CM' },
  { nombre: 'Costa de Marfil', codigo: 'CI' },
  { nombre: 'Argelia', codigo: 'DZ' },
  { nombre: 'Congo Democrático', codigo: 'CD' },
  { nombre: 'Cabo Verde', codigo: 'CV' },
  { nombre: 'Sudáfrica', codigo: 'ZA' },
  { nombre: 'Japón', codigo: 'JP' },
  { nombre: 'Corea del Sur', codigo: 'KR' },
  { nombre: 'Australia', codigo: 'AU' },
  { nombre: 'Arabia Saudí', codigo: 'SA' },
  { nombre: 'Irán', codigo: 'IR' },
  { nombre: 'Catar', codigo: 'QA' },
  { nombre: 'Irak', codigo: 'IQ' },
  { nombre: 'Jordania', codigo: 'JO' },
  { nombre: 'Uzbekistán', codigo: 'UZ' },
  { nombre: 'Nueva Zelanda', codigo: 'NZ' },
  { nombre: 'Curasao', codigo: 'CW' },
  { nombre: 'Surinam', codigo: 'SR' },
  { nombre: 'Trinidad y Tobago', codigo: 'TT' },
]

const flag = (c: string) => `https://flagcdn.com/32x24/${c.toLowerCase()}.png`

interface Props {
  partidoId: number
  campo: 'equipo_local' | 'equipo_visitante'
  nombreActual: string
  codigoActual: string | null
  placeholder: string // e.g. "1A", "W73"
}

export default function AdminEquipoEditor({ partidoId, campo, nombreActual, codigoActual, placeholder }: Props) {
  const [editando, setEditando] = useState(false)
  const [query, setQuery] = useState('')
  const [seleccionado, setSeleccionado] = useState<{ nombre: string; codigo: string } | null>(
    codigoActual ? { nombre: nombreActual, codigo: codigoActual } : null
  )
  const [est, setEst] = useState<'idle' | 'saving' | 'ok' | 'err'>('idle')
  const t = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const esPlaceholder = !codigoActual // Si no tiene código, es placeholder tipo "1A", "W73"

  const sugerencias = query.length >= 1
    ? PAISES.filter(p =>
        p.nombre.toLowerCase().includes(query.toLowerCase()) ||
        p.codigo.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6)
    : []

  const guardar = async (pais: { nombre: string; codigo: string }) => {
    setEst('saving')
    const r = await actualizarEquipo(partidoId, campo, pais.nombre, pais.codigo)
    if (r?.ok) {
      setSeleccionado(pais)
      setEst('ok')
      setEditando(false)
      setQuery('')
      if (t.current) clearTimeout(t.current)
      t.current = setTimeout(() => setEst('idle'), 2500)
    } else {
      setEst('err')
      t.current = setTimeout(() => setEst('idle'), 2500)
    }
  }

  if (!editando) {
    return (
      <button
        onClick={() => { setEditando(true); setTimeout(() => inputRef.current?.focus(), 50) }}
        title={`Editar ${campo === 'equipo_local' ? 'equipo local' : 'equipo visitante'}`}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: esPlaceholder ? 'rgba(255,77,0,0.08)' : 'transparent',
          border: esPlaceholder ? '1px dashed rgba(255,77,0,0.3)' : '1px solid transparent',
          borderRadius: 6, padding: '4px 8px', cursor: 'pointer',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,77,0,0.4)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = esPlaceholder ? 'rgba(255,77,0,0.3)' : 'transparent')}
      >
        {seleccionado?.codigo
          ? <img src={flag(seleccionado.codigo)} style={{ width: 24, height: 18, borderRadius: 3, objectFit: 'cover', flexShrink: 0 }} alt="" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          : <span style={{ fontSize: 16 }}>🏳️</span>
        }
        <span style={{
          fontSize: 13, fontWeight: 600,
          color: esPlaceholder ? 'var(--fire)' : 'var(--text)',
          fontFamily: 'var(--font-body)',
          maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
        }}>
          {seleccionado?.nombre || nombreActual || placeholder}
        </span>
        {est === 'ok' && <span style={{ fontSize: 10, color: 'var(--turf)', fontWeight: 800 }}>✓</span>}
        <span style={{ fontSize: 9, color: 'var(--text-3)', marginLeft: 2 }}>✏️</span>
      </button>
    )
  }

  return (
    <div style={{ position: 'relative' }} onBlur={e => {
      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setEditando(false); setQuery('')
      }
    }}>
      <input
        ref={inputRef}
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Buscar país..."
        style={{
          background: 'var(--ink-3)', border: '1px solid var(--fire)',
          borderRadius: 6, padding: '6px 10px', fontSize: 13,
          color: 'var(--text)', outline: 'none', width: 140,
          fontFamily: 'var(--font-body)',
        }}
        onKeyDown={e => { if (e.key === 'Escape') { setEditando(false); setQuery('') } }}
      />
      {sugerencias.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 100,
          background: 'var(--ink-2)', border: '1px solid var(--stroke)',
          borderRadius: 8, overflow: 'hidden', marginTop: 4,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)', minWidth: 200,
        }}>
          {sugerencias.map(p => (
            <button
              key={p.codigo}
              tabIndex={0}
              onMouseDown={e => { e.preventDefault(); guardar(p) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '10px 14px', cursor: 'pointer',
                background: 'transparent', border: 'none',
                borderBottom: '1px solid var(--stroke-2)',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--ink-3)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <img src={flag(p.codigo)} style={{ width: 24, height: 18, borderRadius: 3, objectFit: 'cover', flexShrink: 0 }} alt="" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              <span style={{ fontSize: 13, color: 'var(--text)', fontFamily: 'var(--font-body)', textAlign: 'left' }}>{p.nombre}</span>
              <span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 'auto', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>{p.codigo}</span>
            </button>
          ))}
        </div>
      )}
      {est === 'saving' && (
        <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}>
          <span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.15)', borderTopColor: 'var(--fire)', borderRadius: '50%', display: 'block' }} className="anim-spin" />
        </div>
      )}
    </div>
  )
}
