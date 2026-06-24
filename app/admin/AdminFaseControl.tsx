'use client'
import { useState } from 'react'
import { abrirFase, cerrarFase, actualizarEquipo } from './actions'

interface FaseInfo {
  fase: string
  total: number
  abierta: boolean
  conResultado: number
  cierre: string | null
}

export default function AdminFaseControl({ fasesInfo }: { fasesInfo: FaseInfo[] }) {
  const [estados, setEstados] = useState<Record<string, 'idle' | 'saving' | 'ok' | 'err'>>({})
  const [expandido, setExpandido] = useState<string | null>(null)

  const handleAbrir = async (fase: string) => {
    setEstados(e => ({ ...e, [fase]: 'saving' }))
    const r = await abrirFase(fase)
    setEstados(e => ({ ...e, [fase]: r?.ok ? 'ok' : 'err' }))
    setTimeout(() => { setEstados(e => ({ ...e, [fase]: 'idle' })); if (r?.ok) window.location.reload() }, 1500)
  }

  const handleCerrar = async (fase: string) => {
    if (!confirm(`¿Cerrar pronósticos para "${fase}"? Los usuarios ya no podrán modificar sus pronósticos.`)) return
    setEstados(e => ({ ...e, [fase]: 'saving' }))
    const r = await cerrarFase(fase)
    setEstados(e => ({ ...e, [fase]: r?.ok ? 'ok' : 'err' }))
    setTimeout(() => { setEstados(e => ({ ...e, [fase]: 'idle' })); if (r?.ok) window.location.reload() }, 1500)
  }

  const fmtCierre = (iso: string | null) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City' }) + ' CST'
  }

  return (
    <div style={{ padding: '4px 0 8px' }}>
      {fasesInfo.map(({ fase, total, abierta, conResultado, cierre }) => {
        const est = estados[fase] ?? 'idle'
        const pct = total > 0 ? Math.round((conResultado / total) * 100) : 0

        return (
          <div key={fase} style={{
            borderBottom: '1px solid var(--stroke-2)',
            transition: 'background 0.12s',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 22px',
              background: abierta ? 'rgba(0,212,106,0.03)' : 'transparent',
              borderLeft: `3px solid ${abierta ? 'var(--turf)' : 'transparent'}`,
            }}>
              {/* Estado dot */}
              <div style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: abierta ? 'var(--turf)' : 'var(--text-3)',
                boxShadow: abierta ? '0 0 8px rgba(0,212,106,0.5)' : 'none',
              }} />

              {/* Nombre fase */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span className="f-display" style={{ fontSize: 14, letterSpacing: '0.06em', color: abierta ? 'var(--text)' : 'var(--text-2)' }}>
                    {fase}
                  </span>
                  <span className={`pill ${abierta ? 'pill-lime' : 'pill-muted'}`} style={{ fontSize: 9 }}>
                    {abierta ? 'ABIERTA' : 'CERRADA'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}>
                    {conResultado}/{total} resultados
                  </span>
                  {cierre && (
                    <span style={{ fontSize: 11, color: abierta ? 'var(--fire)' : 'var(--text-3)', fontFamily: 'var(--font-body)' }}>
                      ⏰ {fmtCierre(cierre)}
                    </span>
                  )}
                  {/* Mini barra */}
                  <div style={{ flex: 1, maxWidth: 80, height: 3, background: 'var(--stroke)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? 'var(--turf)' : 'var(--fire)', borderRadius: 99, transition: 'width 0.5s' }} />
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {!abierta ? (
                  <button
                    onClick={() => handleAbrir(fase)}
                    disabled={est === 'saving'}
                    className="btn btn-lime"
                    style={{ fontSize: 12, padding: '8px 16px' }}
                  >
                    {est === 'saving'
                      ? <span style={{ width: 12, height: 12, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%', display: 'block' }} className="anim-spin" />
                      : est === 'ok' ? '✓ ABIERTA'
                      : est === 'err' ? '✗ ERROR'
                      : '⚡ ABRIR FASE'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleCerrar(fase)}
                    disabled={est === 'saving'}
                    className="btn btn-danger"
                    style={{ fontSize: 12, padding: '8px 16px' }}
                  >
                    {est === 'saving'
                      ? <span style={{ width: 12, height: 12, border: '2px solid rgba(255,59,48,0.3)', borderTopColor: 'var(--red-hot)', borderRadius: '50%', display: 'block' }} className="anim-spin" />
                      : '🔒 CERRAR'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
