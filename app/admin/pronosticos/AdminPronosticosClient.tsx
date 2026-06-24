'use client'
import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

const flag = (c: string, s = '20x15') => `https://flagcdn.com/${s}/${c.toLowerCase()}.png`

const FASE_LABEL: Record<string, string> = {
  'Fase de Grupos': 'GRUPOS',
  'Ronda de 32': 'R.32',
  'Octavos de final': 'OCTAVOS',
  'Cuartos de final': 'CUARTOS',
  'Semifinales': 'SEMIS',
  'Tercer Puesto': '3er LUGAR',
  'Final': 'FINAL',
}

const FASE_ICON: Record<string, string> = {
  'Fase de Grupos': '⚽', 'Ronda de 32': '🎯', 'Octavos de final': '⚡',
  'Cuartos de final': '🔥', 'Semifinales': '⭐', 'Tercer Puesto': '🥉', 'Final': '🏆',
}

interface Partido {
  id: number; equipo_local: string; equipo_visitante: string
  codigo_local: string | null; codigo_visitante: string | null
  fecha: string; hora: string; grupo: string | null; fase: string | null
  goles_local: number | null; goles_visitante: number | null
}
interface Perfil { id: string; nombre: string | null; avatar_url: string | null; es_admin: boolean | null }
interface Prono { usuario_id: string; partido_id: number; goles_local: number; goles_visitante: number; puntos: number | null }

interface Props {
  partidos: Partido[]
  perfiles: Perfil[]
  pronos: Prono[]
  fasesDisp: string[]
  gruposDisp: string[]
  faseActiva: string
  grupoActivo: string | null
}

function getPtsBadge(puntos: number | null) {
  if (puntos === 3) return <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--gold)', background: 'rgba(255,214,10,0.12)', border: '1px solid rgba(255,214,10,0.3)', borderRadius: 4, padding: '1px 5px', fontFamily: 'var(--font-display)', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>+3⭐</span>
  if (puntos === 1) return <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--turf)', background: 'rgba(0,212,106,0.1)', border: '1px solid rgba(0,212,106,0.25)', borderRadius: 4, padding: '1px 5px', fontFamily: 'var(--font-display)', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>+1✓</span>
  if (puntos === 0) return <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--red-hot)', background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.2)', borderRadius: 4, padding: '1px 5px', fontFamily: 'var(--font-display)', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>0✗</span>
  return <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-display)' }}>—</span>
}

const fmtF = (f: string) =>
  new Date(f + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })

export default function AdminPronosticosClient({ partidos, perfiles, pronos, fasesDisp, gruposDisp, faseActiva, grupoActivo }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  const [busqueda, setBusqueda] = useState('')
  const [expandido, setExpandido] = useState<string | null>(null)
  const [grupoLocal, setGrupoLocal] = useState<string | null>(grupoActivo)

  const pronoMap: Record<string, Record<number, Prono>> = {}
  pronos.forEach(p => {
    if (!pronoMap[p.usuario_id]) pronoMap[p.usuario_id] = {}
    pronoMap[p.usuario_id][p.partido_id] = p
  })

  const navFase = (fase: string) => {
    setGrupoLocal(null)
    router.push(`${pathname}?fase=${encodeURIComponent(fase)}`)
  }

  const navGrupo = (g: string | null) => {
    setGrupoLocal(g)
    const params = new URLSearchParams({ fase: faseActiva })
    if (g) params.set('grupo', g)
    router.push(`${pathname}?${params.toString()}`)
  }

  const partidosFase = partidos.filter(p => p.fase === faseActiva)
  const esFaseGrupos = faseActiva === 'Fase de Grupos'
  const grupoEfectivo = esFaseGrupos ? grupoLocal : null

  const partidosMostrados = grupoEfectivo
    ? partidosFase.filter(p => p.grupo === grupoEfectivo)
    : esFaseGrupos
      ? partidosFase.slice(0, 48) // limitar en "todos" para no saturar
      : partidosFase

  const jugadoresFiltrados = perfiles
    .filter(p => !p.es_admin)
    .filter(p => busqueda === '' || (p.nombre ?? '').toLowerCase().includes(busqueda.toLowerCase()))

  // Stats globales por jugador en esta fase/grupo
  const statsJugador = (uid: string) => {
    const mis = partidosMostrados.map(p => pronoMap[uid]?.[p.id]).filter(Boolean)
    const conRes = mis.filter(p => p && p.puntos !== null)
    const pts = conRes.reduce((s, p) => s + (p?.puntos ?? 0), 0)
    const exactos = conRes.filter(p => p?.puntos === 3).length
    const acertados = conRes.filter(p => p?.puntos === 1).length
    const fallos = conRes.filter(p => p?.puntos === 0).length
    return { total: mis.length, conRes: conRes.length, pts, exactos, acertados, fallos }
  }

  const colorPts = (pts: number) =>
    pts >= 10 ? 'var(--gold)' : pts >= 5 ? 'var(--turf)' : pts > 0 ? 'var(--fire)' : 'var(--text-3)'

  return (
    <div className="page">
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, var(--gold), var(--fire))', zIndex: 200 }} />

      {/* NAV */}
      <nav className="site-nav" style={{ borderBottomColor: 'rgba(255,214,10,0.15)' }}>
        <div className="wrap" style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <a href="/admin" className="btn btn-outline" style={{ fontSize: 12, padding: '7px 14px' }}>← Admin</a>
            <div style={{ width: 1, height: 20, background: 'var(--stroke)' }} />
            <span className="f-display" style={{ fontSize: 18, color: 'var(--gold)', letterSpacing: '0.06em' }}>
              PRONÓSTICOS · TODOS
            </span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>
            {jugadoresFiltrados.length} jugadores
          </span>
        </div>
      </nav>

      <main className="wrap" style={{ paddingTop: 24, paddingBottom: 80 }}>

        {/* TABS DE FASE */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          {fasesDisp.map(fase => {
            const isAct = faseActiva === fase
            return (
              <button key={fase} onClick={() => navFase(fase)}
                style={{
                  flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 14px', borderRadius: 8,
                  border: isAct ? '1px solid var(--gold)' : '1px solid var(--stroke)',
                  background: isAct ? 'rgba(255,214,10,0.12)' : 'var(--ink-2)',
                  color: isAct ? 'var(--gold)' : 'var(--text-2)',
                  fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 800,
                  letterSpacing: '0.06em', cursor: 'pointer', transition: 'all 0.15s',
                }}>
                <span>{FASE_ICON[fase] ?? '⚽'}</span>
                <span>{FASE_LABEL[fase] ?? fase.toUpperCase()}</span>
              </button>
            )
          })}
        </div>

        {/* SUB-TABS GRUPO */}
        {esFaseGrupos && gruposDisp.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 20 }}>
            <button onClick={() => navGrupo(null)}
              style={{
                padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
                border: grupoEfectivo === null ? '1px solid var(--gold)' : '1px solid var(--stroke-2)',
                background: grupoEfectivo === null ? 'rgba(255,214,10,0.08)' : 'transparent',
                color: grupoEfectivo === null ? 'var(--gold)' : 'var(--text-3)',
                fontSize: 11, fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '0.08em',
              }}>
              TODOS
            </button>
            {gruposDisp.map(g => (
              <button key={g} onClick={() => navGrupo(g)}
                style={{
                  padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
                  border: grupoEfectivo === g ? '1px solid var(--gold)' : '1px solid var(--stroke-2)',
                  background: grupoEfectivo === g ? 'rgba(255,214,10,0.08)' : 'transparent',
                  color: grupoEfectivo === g ? 'var(--gold)' : 'var(--text-3)',
                  fontSize: 11, fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '0.08em',
                }}>
                GRP {g}
              </button>
            ))}
          </div>
        )}

        {/* BUSCADOR */}
        <div style={{ marginBottom: 20, position: 'relative' }}>
          <input
            type="text"
            placeholder="Buscar jugador..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{
              width: '100%', padding: '10px 16px 10px 36px',
              background: 'var(--ink-2)', border: '1px solid var(--stroke)',
              borderRadius: 8, color: 'var(--text)', fontSize: 13,
              fontFamily: 'var(--font-body)', outline: 'none',
            }}
          />
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', fontSize: 14 }}>🔍</span>
        </div>

        {/* ENCABEZADO PARTIDOS — solo si hay grupo o es knockout */}
        {(grupoEfectivo || !esFaseGrupos) && partidosMostrados.length > 0 && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ height: 2, background: 'linear-gradient(90deg, var(--gold), var(--fire))', borderRadius: '12px 12px 0 0' }} />

            {/* Header tabla */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                <thead>
                  <tr style={{ background: 'var(--ink-3)', borderBottom: '1px solid var(--stroke-2)' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 9, fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-3)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                      Jugador
                    </th>
                    <th style={{ padding: '10px 8px', fontSize: 9, fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--gold)', textTransform: 'uppercase', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      Pts
                    </th>
                    {partidosMostrados.map(p => (
                      <th key={p.id} style={{ padding: '8px 6px', minWidth: 68, textAlign: 'center', fontSize: 9, fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            {p.codigo_local && <img src={flag(p.codigo_local)} alt="" style={{ width: 16, height: 11, borderRadius: 2, objectFit: 'cover' }} />}
                            <span style={{ fontSize: 8 }}>vs</span>
                            {p.codigo_visitante && <img src={flag(p.codigo_visitante)} alt="" style={{ width: 16, height: 11, borderRadius: 2, objectFit: 'cover' }} />}
                          </div>
                          {p.goles_local !== null && (
                            <span style={{ color: 'var(--fire)', fontWeight: 800, fontSize: 9 }}>{p.goles_local}–{p.goles_visitante}</span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {jugadoresFiltrados.map(jugador => {
                    const stats = statsJugador(jugador.id)
                    return (
                      <tr key={jugador.id} style={{ borderBottom: '1px solid var(--stroke-2)' }}>
                        {/* Nombre */}
                        <td style={{ padding: '9px 14px', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)', color: 'var(--text)', whiteSpace: 'nowrap' }}>
                          {jugador.nombre ?? '—'}
                        </td>
                        {/* Puntos totales */}
                        <td style={{ padding: '9px 8px', textAlign: 'center' }}>
                          <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 900, color: colorPts(stats.pts) }}>
                            {stats.pts}
                          </span>
                        </td>
                        {/* Pronóstico por partido */}
                        {partidosMostrados.map(p => {
                          const pr = pronoMap[jugador.id]?.[p.id]
                          const tieneRes = p.goles_local !== null
                          const puntos = pr?.puntos ?? null
                          const pronoText = pr ? `${pr.goles_local}–${pr.goles_visitante}` : '·'
                          const color = !pr
                            ? 'var(--text-4)'
                            : tieneRes
                              ? (puntos === 3 ? 'var(--gold)' : puntos === 1 ? 'var(--turf)' : 'var(--red-hot)')
                              : 'var(--turf)'
                          const bgColor = !pr
                            ? 'transparent'
                            : tieneRes
                              ? (puntos === 3 ? 'rgba(255,214,10,0.06)' : puntos === 1 ? 'rgba(0,212,106,0.04)' : 'rgba(255,59,48,0.04)')
                              : 'transparent'
                          return (
                            <td key={p.id} style={{ padding: '8px 4px', textAlign: 'center', background: bgColor }}>
                              <span style={{
                                fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 800,
                                color, letterSpacing: '0.02em',
                              }}>
                                {pronoText}
                              </span>
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VISTA COMPACTA — cuando no hay grupo seleccionado en Fase de Grupos */}
        {esFaseGrupos && !grupoEfectivo && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {jugadoresFiltrados.map(jugador => {
              const misProno = pronoMap[jugador.id] ?? {}
              const conRes = partidosFase.filter(p => misProno[p.id]?.puntos !== null && misProno[p.id]?.puntos !== undefined)
              const pts = conRes.reduce((s, p) => s + (misProno[p.id]?.puntos ?? 0), 0)
              const exactos = conRes.filter(p => misProno[p.id]?.puntos === 3).length
              const acertados = conRes.filter(p => misProno[p.id]?.puntos === 1).length
              const fallos = conRes.filter(p => misProno[p.id]?.puntos === 0).length
              const totalFase = partidosFase.length
              const hechos = Object.keys(misProno).filter(id => partidosFase.some(p => p.id === Number(id))).length
              const isOpen = expandido === jugador.id

              return (
                <div key={jugador.id} className="card">
                  <div style={{ height: 2, background: pts > 0 ? 'linear-gradient(90deg, var(--gold), var(--fire))' : 'var(--stroke)', borderRadius: '12px 12px 0 0' }} />

                  {/* Header jugador */}
                  <div
                    onClick={() => setExpandido(isOpen ? null : jugador.id)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', cursor: 'pointer', gap: 12 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--ink-3)', border: '1px solid var(--stroke)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {jugador.avatar_url
                          ? <img src={jugador.avatar_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: 14 }}>⚽</span>
                        }
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {jugador.nombre ?? '—'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                      {/* Mini stats */}
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.04em' }}>{exactos}⭐</span>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: 'var(--turf)', letterSpacing: '0.04em' }}>{acertados}✓</span>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: 'var(--red-hot)', letterSpacing: '0.04em' }}>{fallos}✗</span>
                      </div>
                      {/* Pts totales */}
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, color: colorPts(pts), lineHeight: 1 }}>
                        {pts}
                      </span>
                      {/* Progreso */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 48, height: 3, borderRadius: 2, background: 'var(--stroke)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${totalFase > 0 ? (hechos / totalFase) * 100 : 0}%`, background: 'var(--fire)', borderRadius: 2 }} />
                        </div>
                        <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>{hechos}/{totalFase}</span>
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {/* Desglose expandido */}
                  {isOpen && (
                    <div style={{ borderTop: '1px solid var(--stroke-2)', overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420 }}>
                        <thead>
                          <tr style={{ background: 'var(--ink-3)' }}>
                            <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 9, fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-3)', textTransform: 'uppercase' }}>Partido</th>
                            <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: 9, fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-3)', textTransform: 'uppercase' }}>Resultado</th>
                            <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: 9, fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-3)', textTransform: 'uppercase' }}>Pronóstico</th>
                            <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: 9, fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-3)', textTransform: 'uppercase' }}>Pts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {partidosFase.map(p => {
                            const pr = misProno[p.id]
                            const tieneRes = p.goles_local !== null
                            const puntos = pr?.puntos ?? null
                            const rowBg = tieneRes && pr
                              ? puntos === 3 ? 'rgba(255,214,10,0.04)' : puntos === 1 ? 'rgba(0,212,106,0.03)' : 'rgba(255,59,48,0.03)'
                              : 'transparent'
                            const pronoColor = !pr ? 'var(--text-3)'
                              : tieneRes ? (puntos === 3 ? 'var(--gold)' : puntos === 1 ? 'var(--turf)' : 'var(--red-hot)')
                              : 'var(--turf)'
                            return (
                              <tr key={p.id} style={{ borderBottom: '1px solid var(--stroke-2)', background: rowBg }}>
                                <td style={{ padding: '9px 14px', fontSize: 11, color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
                                  <span style={{ fontWeight: 700 }}>{p.equipo_local}</span>
                                  <span style={{ color: 'var(--text-3)', margin: '0 5px', fontFamily: 'var(--font-display)', fontWeight: 800 }}>vs</span>
                                  <span style={{ fontWeight: 700 }}>{p.equipo_visitante}</span>
                                  <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-display)', textTransform: 'capitalize' }}>· {fmtF(p.fecha)}</span>
                                </td>
                                <td style={{ padding: '9px 10px', textAlign: 'center' }}>
                                  {tieneRes
                                    ? <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 800, color: 'var(--text-2)' }}>{p.goles_local}–{p.goles_visitante}</span>
                                    : <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-display)' }}>PEND.</span>
                                  }
                                </td>
                                <td style={{ padding: '9px 10px', textAlign: 'center' }}>
                                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 900, color: pronoColor }}>
                                    {pr ? `${pr.goles_local}–${pr.goles_visitante}` : '—'}
                                  </span>
                                </td>
                                <td style={{ padding: '9px 10px', textAlign: 'center' }}>
                                  {getPtsBadge(puntos)}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
