import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import Nav from '@/app/components/Nav'
import ResultadosStats from './ResultadosStats'

async function fetchAllPronos(service: ReturnType<typeof createServiceClient>) {
  const pageSize = 1000
  let all: { usuario_id: string; puntos: number | null }[] = []
  let from = 0
  while (true) {
    const { data, error } = await service.from('pronosticos').select('usuario_id,puntos').range(from, from + pageSize - 1)
    if (error || !data || data.length === 0) break
    all = all.concat(data)
    if (data.length < pageSize) break
    from += pageSize
  }
  return all
}

const BADGES = [
  { id:'primer_exacto', icon:'🎯', nombre:'Exacto de arranque', desc:'Primer marcador exacto',      check:(s:any)=>s.exactos>=1 },
  { id:'racha_5',       icon:'🔥', nombre:'Racha de 5',         desc:'5 exactos consecutivos',       check:(s:any)=>s.rachaMax>=5 },
  { id:'francotirador', icon:'🏹', nombre:'Francotirador',      desc:'10 exactos en total',           check:(s:any)=>s.exactos>=10 },
  { id:'jornada_perf',  icon:'🏆', nombre:'Jornada perfecta',  desc:'Todos los ganadores en jornada',check:()=>false },
  { id:'dominio',       icon:'👑', nombre:'Dominio total',      desc:'Líder al final de J1,J2,J3',   check:()=>false },
  { id:'top_exactos',   icon:'⭐', nombre:'El que más sabe',   desc:'Más exactos en fase grupos',    check:(s:any)=>s.esTop },
  { id:'adivino',       icon:'🔮', nombre:'Adivino',           desc:'Predijo al campeón',            check:()=>false },
]

const fmtFecha = (f: string) =>
  new Date(f + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })

const flag = (c: string, s = '20x15') => `https://flagcdn.com/${s}/${c.toLowerCase()}.png`

export default async function ResultadosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  // Traer todos los pronósticos del usuario (con datos del partido)
  // Ordenar por fecha del partido
  const [{ data: perfil }, { data: misP }, todosP] = await Promise.all([
    supabase.from('perfiles').select('nombre,avatar_url,es_admin').eq('id', user.id).single(),
    supabase.from('pronosticos')
      .select('*,partidos(*)')
      .eq('usuario_id', user.id)
      .order('partido_id')
      .limit(200),
    fetchAllPronos(service),
  ])

  const nombre  = perfil?.nombre ?? 'Usuario'
  const pts     = misP?.reduce((s, p) => s + (p.puntos ?? 0), 0) ?? 0
  const exactos = misP?.filter(p => p.puntos === 3).length ?? 0
  const ganad   = misP?.filter(p => p.puntos === 1).length ?? 0
  const fallos  = misP?.filter(p => p.puntos !== null && p.puntos === 0).length ?? 0
  // Solo los que YA tienen resultado asignado
  const conRes  = misP?.filter(p => p.puntos !== null) ?? []
  // Todos los pronósticos (para mostrar los pendientes también)
  const todos   = misP ?? []

  // Ranking global
  const resP: Record<string, number> = {}
  todosP.forEach(p => { resP[p.usuario_id] = (resP[p.usuario_id] ?? 0) + (p.puntos ?? 0) })
  const rankO = Object.entries(resP).sort((a, b) => b[1] - a[1])
  const miPos = rankO.findIndex(([uid]) => uid === user.id) + 1
  const totJ  = rankO.length

  const exByU: Record<string, number> = {}
  todosP.filter(p => p.puntos === 3).forEach(p => { exByU[p.usuario_id] = (exByU[p.usuario_id] ?? 0) + 1 })
  const maxEx = Math.max(0, ...Object.values(exByU))
  const esTop = (exByU[user.id] ?? 0) > 0 && (exByU[user.id] ?? 0) === maxEx

  const efectividad = conRes.length > 0 ? Math.round(((exactos + ganad) / conRes.length) * 100) : 0

  const stats = { exactos, rachaMax: 0, esTop }

  const statItems = [
    { l: 'POSICIÓN',        v: miPos > 0 ? `#${miPos}` : '—', sub: totJ > 0 ? `de ${totJ} jugadores` : '',  c: 'var(--gold)',  type: 'gold' },
    { l: 'EXACTOS ⭐',     v: exactos,   sub: 'marcador exacto · 3 pts',     c: 'var(--gold)',  type: 'gold' },
    { l: 'GANADOR ✓',      v: ganad,     sub: 'resultado correcto · 1 pt',   c: 'var(--turf)',  type: 'turf' },
    { l: 'PUNTOS TOTALES', v: pts,       sub: `${efectividad}% efectividad`, c: 'var(--fire)',  type: 'fire' },
  ]

  // Agrupar TODOS los pronósticos por fecha del partido (ordenados por fecha ASC)
  const porFecha: Record<string, typeof todos> = {}
  todos.forEach(p => {
    const partido = (p as any).partidos
    const fecha = partido?.fecha ?? 'sin-fecha'
    if (!porFecha[fecha]) porFecha[fecha] = []
    porFecha[fecha].push(p)
  })
  const fechasOrdenadas = Object.keys(porFecha).sort()

  return (
    <div className="page">
      <div style={{ position:'fixed',top:0,left:0,right:0,height:3,background:'linear-gradient(90deg,var(--turf),var(--fire) 50%,var(--turf))',backgroundSize:'200% 100%',animation:'fire-sweep 4s linear infinite',zIndex:200 }} />
      <Nav nombre={nombre} avatarUrl={perfil?.avatar_url} esAdmin={perfil?.es_admin} pagina="/resultados" />

      <main className="wrap" style={{ paddingTop:44, paddingBottom:64, display:'flex', flexDirection:'column', gap:20 }}>

        {/* ── HEADER ── */}
        <div className="anim-up">
          <p style={{ fontSize:11,fontWeight:700,letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--fire)',marginBottom:10,fontFamily:'var(--font-display)' }}>
            ▸ ESTADÍSTICAS PERSONALES
          </p>
          <h1 className="f-display" style={{ fontSize:'clamp(52px,8vw,88px)',color:'var(--text)',marginBottom:8,lineHeight:0.9 }}>
            MIS RESULTADOS
          </h1>
          <p style={{ fontSize:13,color:'var(--text-2)',fontFamily:'var(--font-body)' }}>
            {nombre} · Mundial 2026
          </p>
        </div>

        {/* ── STATS PRINCIPALES ── */}
        <div className="card anim-in d1" style={{ padding:28 }}>
          <div style={{ height:2,background:'linear-gradient(90deg,var(--fire),var(--gold),var(--turf))',marginBottom:28,borderRadius:2 }} />
          <ResultadosStats statItems={statItems} exactos={exactos} />
        </div>

        {/* ── PRONÓSTICOS AGRUPADOS POR DÍA ── */}
        {todos.length > 0 ? (
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

            {/* Leyenda de colores */}
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
              <span style={{ fontSize:11, color:'var(--text-3)', fontFamily:'var(--font-display)', fontWeight:700, letterSpacing:'0.1em', marginRight:4 }}>LEYENDA:</span>
              {[
                { color:'var(--gold)',   bg:'rgba(255,214,10,0.1)',  b:'rgba(255,214,10,0.25)',  label:'⭐ Exacto (3 pts)' },
                { color:'var(--turf)',   bg:'rgba(0,212,106,0.08)',  b:'rgba(0,212,106,0.2)',    label:'✓ Ganador (1 pt)' },
                { color:'var(--red-hot)',bg:'rgba(255,59,48,0.06)',  b:'rgba(255,59,48,0.2)',    label:'✗ Fallo (0 pts)' },
                { color:'var(--text-3)', bg:'var(--ink-3)',          b:'var(--stroke-2)',         label:'⏳ Sin resultado' },
              ].map(({color,bg,b,label}) => (
                <div key={label} style={{ display:'flex',alignItems:'center',gap:6,background:bg,border:`1px solid ${b}`,borderRadius:6,padding:'4px 10px' }}>
                  <span style={{ fontSize:11,color,fontWeight:700,fontFamily:'var(--font-body)' }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Cards por día */}
            {fechasOrdenadas.map((fecha, fi) => {
              const pronos = porFecha[fecha]
              const ptsDia = pronos.reduce((s, p) => s + (p.puntos ?? 0), 0)
              const exactosDia = pronos.filter(p => p.puntos === 3).length
              const ganadDia   = pronos.filter(p => p.puntos === 1).length
              const fallosDia  = pronos.filter(p => p.puntos === 0).length
              const pendDia    = pronos.filter(p => p.puntos === null).length
              const todosCal   = pendDia === 0

              return (
                <div key={fecha} className="card anim-in" style={{ animationDelay:`${fi * 40}ms`, overflow:'hidden' }}>
                  {/* Accent top — verde si todos calificados, gradiente si hay pendientes */}
                  <div style={{
                    height:3,
                    background: todosCal
                      ? 'var(--turf)'
                      : 'linear-gradient(90deg, var(--fire), var(--gold))',
                    borderRadius:'12px 12px 0 0',
                  }} />

                  {/* Header del día */}
                  <div style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'14px 20px', borderBottom:'1px solid var(--stroke-2)',
                    flexWrap:'wrap', gap:8,
                  }}>
                    <div>
                      <p className="f-display" style={{ fontSize:16, color:'var(--text)', letterSpacing:'0.04em', textTransform:'uppercase' }}>
                        {fmtFecha(fecha)}
                      </p>
                      <p style={{ fontSize:11, color:'var(--text-3)', fontFamily:'var(--font-body)', marginTop:2 }}>
                        {pronos.length} {pronos.length === 1 ? 'partido' : 'partidos'}
                        {todosCal ? ` · ${ptsDia} pts` : pendDia > 0 ? ` · ${pendDia} sin resultado` : ''}
                      </p>
                    </div>

                    {/* Mini stats del día */}
                    <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
                      {exactosDia > 0 && (
                        <span style={{ fontSize:11,fontWeight:800,color:'var(--gold)',background:'rgba(255,214,10,0.1)',border:'1px solid rgba(255,214,10,0.25)',borderRadius:5,padding:'3px 8px',fontFamily:'var(--font-display)' }}>
                          {exactosDia}⭐
                        </span>
                      )}
                      {ganadDia > 0 && (
                        <span style={{ fontSize:11,fontWeight:800,color:'var(--turf)',background:'rgba(0,212,106,0.1)',border:'1px solid rgba(0,212,106,0.2)',borderRadius:5,padding:'3px 8px',fontFamily:'var(--font-display)' }}>
                          {ganadDia}✓
                        </span>
                      )}
                      {fallosDia > 0 && (
                        <span style={{ fontSize:11,fontWeight:800,color:'var(--red-hot)',background:'rgba(255,59,48,0.08)',border:'1px solid rgba(255,59,48,0.2)',borderRadius:5,padding:'3px 8px',fontFamily:'var(--font-display)' }}>
                          {fallosDia}✗
                        </span>
                      )}
                      {pendDia > 0 && (
                        <span style={{ fontSize:11,fontWeight:800,color:'var(--text-3)',background:'var(--ink-3)',border:'1px solid var(--stroke-2)',borderRadius:5,padding:'3px 8px',fontFamily:'var(--font-display)' }}>
                          {pendDia}⏳
                        </span>
                      )}
                      {todosCal && ptsDia > 0 && (
                        <span className="f-display" style={{ fontSize:20, color: ptsDia >= 6 ? 'var(--gold)' : ptsDia >= 3 ? 'var(--turf)' : 'var(--text-3)' }}>
                          +{ptsDia}<span style={{ fontSize:10, color:'var(--text-3)', marginLeft:2 }}>pts</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Partidos del día */}
                  {pronos.map((p: any, pi: number) => {
                    const partido = p.partidos
                    const tieneRes = p.puntos !== null   // Ya tiene resultado calificado
                    const hayGoles = partido?.goles_local != null  // El partido ya se jugó

                    // Colores: solo mostrar rojo si YA hay resultado Y falló
                    // Si no hay resultado aún → neutro/gris, no rojo
                    const ptColor  = !tieneRes ? 'var(--text-3)'
                                   : p.puntos === 3 ? 'var(--gold)'
                                   : p.puntos === 1 ? 'var(--turf)'
                                   : 'var(--red-hot)'
                    const ptBg     = !tieneRes ? 'transparent'
                                   : p.puntos === 3 ? 'rgba(255,214,10,0.07)'
                                   : p.puntos === 1 ? 'rgba(0,212,106,0.05)'
                                   : 'rgba(255,59,48,0.04)'
                    const ptBorder = !tieneRes ? 'transparent'
                                   : p.puntos === 3 ? 'rgba(255,214,10,0.3)'
                                   : p.puntos === 1 ? 'rgba(0,212,106,0.25)'
                                   : 'rgba(255,59,48,0.2)'
                    const ptLabel  = !tieneRes ? '⏳'
                                   : p.puntos === 3 ? '+3 ⭐'
                                   : p.puntos === 1 ? '+1 ✓'
                                   : '0 ✗'

                    const gl = partido?.goles_local
                    const gv = partido?.goles_visitante

                    return (
                      <div key={p.id} style={{
                        display:'flex', alignItems:'center', gap:12,
                        padding:'13px 20px',
                        borderBottom: pi < pronos.length - 1 ? '1px solid var(--stroke-2)' : 'none',
                        background: ptBg,
                        borderLeft: `3px solid ${ptBorder}`,
                        transition:'background 0.12s',
                      }}>

                        {/* Badge puntos / estado */}
                        <div style={{
                          flexShrink:0, width:54, textAlign:'center',
                          fontSize:11, fontWeight:800, color: ptColor,
                          background: !tieneRes ? 'var(--ink-3)'
                                    : p.puntos === 3 ? 'rgba(255,214,10,0.1)'
                                    : p.puntos === 1 ? 'rgba(0,212,106,0.1)'
                                    : 'rgba(255,59,48,0.08)',
                          border: `1px solid ${!tieneRes ? 'var(--stroke-2)' : ptBorder}`,
                          borderRadius:6, padding:'4px 6px',
                          fontFamily:'var(--font-display)', letterSpacing:'0.04em',
                        }}>
                          {ptLabel}
                        </div>

                        {/* Info del partido */}
                        <div style={{ flex:1, minWidth:0 }}>
                          {/* Equipos */}
                          <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:4 }}>
                            {partido?.codigo_local && (
                              <img src={flag(partido.codigo_local)} style={{ width:18,height:13,borderRadius:2,objectFit:'cover' }} alt="" />
                            )}
                            <span style={{ fontSize:13,fontWeight:600,color:'var(--text)',fontFamily:'var(--font-body)',whiteSpace:'nowrap' }}>
                              {partido?.equipo_local ?? `Partido #${p.partido_id}`}
                            </span>
                            <span style={{ fontSize:10,color:'var(--text-3)',fontFamily:'var(--font-display)',fontWeight:700 }}>vs</span>
                            {partido?.codigo_visitante && (
                              <img src={flag(partido.codigo_visitante)} style={{ width:18,height:13,borderRadius:2,objectFit:'cover' }} alt="" />
                            )}
                            <span style={{ fontSize:13,fontWeight:600,color:'var(--text)',fontFamily:'var(--font-body)',whiteSpace:'nowrap' }}>
                              {partido?.equipo_visitante ?? ''}
                            </span>
                          </div>

                          {/* Pronóstico vs Real */}
                          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                            <span style={{ fontSize:11,color:'var(--text-3)',fontFamily:'var(--font-body)' }}>
                              Mi pronóstico:
                              <strong style={{
                                color: tieneRes ? ptColor : 'var(--text-2)',
                                fontFamily:'var(--font-display)', fontSize:13, marginLeft:4,
                              }}>
                                {p.goles_local}–{p.goles_visitante}
                              </strong>
                            </span>
                            {hayGoles && (
                              <>
                                <span style={{ color:'var(--stroke)',fontSize:10 }}>·</span>
                                <span style={{ fontSize:11,color:'var(--text-3)',fontFamily:'var(--font-body)' }}>
                                  Resultado:
                                  <strong style={{ color:'var(--text-2)',fontFamily:'var(--font-display)',fontSize:13,marginLeft:4 }}>
                                    {gl}–{gv}
                                  </strong>
                                </span>
                              </>
                            )}
                            {!hayGoles && (
                              <span style={{ fontSize:10,color:'var(--text-3)',fontFamily:'var(--font-body)',fontStyle:'italic' }}>
                                · Partido no jugado aún
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Hora del partido */}
                        <div style={{ flexShrink:0, textAlign:'right', display:'flex', flexDirection:'column', alignItems:'flex-end', gap:2 }}>
                          <span style={{ fontSize:10,color:'var(--fire)',fontFamily:'var(--font-display)',fontWeight:700,letterSpacing:'0.06em' }}>
                            {partido?.hora?.slice(0,5)} CST
                          </span>
                          {tieneRes && (
                            <span className="f-display" style={{ fontSize:24, color:ptColor, lineHeight:1 }}>
                              {p.puntos}
                              <span style={{ fontSize:9,color:'var(--text-3)',marginLeft:2 }}>pts</span>
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}

            {/* Footer puntos totales */}
            {conRes.length > 0 && (
              <div style={{
                display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'16px 22px',
                background:'var(--ink-2)', border:'1px solid var(--stroke)',
                borderRadius:12,
              }}>
                <div>
                  <p style={{ fontSize:11,fontWeight:700,letterSpacing:'0.12em',color:'var(--text-3)',textTransform:'uppercase',fontFamily:'var(--font-display)' }}>
                    RESUMEN TOTAL
                  </p>
                  <p style={{ fontSize:12,color:'var(--text-3)',fontFamily:'var(--font-body)',marginTop:4 }}>
                    {conRes.length} partidos calificados · {efectividad}% efectividad
                  </p>
                </div>
                <div style={{ display:'flex', gap:16, alignItems:'center' }}>
                  <div style={{ textAlign:'center' }}>
                    <p className="f-display" style={{ fontSize:24,color:'var(--gold)',lineHeight:1 }}>{exactos}</p>
                    <p style={{ fontSize:9,color:'var(--text-3)',fontFamily:'var(--font-display)',letterSpacing:'0.1em' }}>EXACTOS</p>
                  </div>
                  <div style={{ textAlign:'center' }}>
                    <p className="f-display" style={{ fontSize:24,color:'var(--turf)',lineHeight:1 }}>{ganad}</p>
                    <p style={{ fontSize:9,color:'var(--text-3)',fontFamily:'var(--font-display)',letterSpacing:'0.1em' }}>GANADORES</p>
                  </div>
                  <div style={{ width:1,height:36,background:'var(--stroke)' }} />
                  <div style={{ textAlign:'center' }}>
                    <p className="f-display" style={{ fontSize:32,color:'var(--fire)',lineHeight:1 }}>
                      {pts}
                    </p>
                    <p style={{ fontSize:9,color:'var(--text-3)',fontFamily:'var(--font-display)',letterSpacing:'0.1em' }}>PTS TOTALES</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="card anim-in d2" style={{ padding:48,textAlign:'center' }}>
            <div style={{ fontSize:52,marginBottom:16 }}>⏳</div>
            <p className="f-display" style={{ fontSize:28,color:'var(--text-3)',marginBottom:8 }}>SIN RESULTADOS AÚN</p>
            <p style={{ fontSize:13,color:'var(--text-3)',fontFamily:'var(--font-body)' }}>
              Los puntos aparecerán cuando el admin cargue los resultados.
            </p>
          </div>
        )}

        {/* ── BADGES ── */}
        <div className="card anim-in" style={{ padding:24 }}>
          <div style={{ height:2,background:'linear-gradient(90deg,var(--gold),var(--fire))',marginBottom:20,borderRadius:2 }} />
          <p style={{ fontSize:11,fontWeight:700,letterSpacing:'0.12em',color:'var(--text-3)',textTransform:'uppercase',marginBottom:20,fontFamily:'var(--font-display)' }}>
            🏅 Mis Badges
          </p>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',gap:12 }}>
            {BADGES.map((b,i)=>{
              const ok=b.check(stats)
              return (
                <div key={b.id}
                  className={ok?'anim-badge':'locked'}
                  style={{ animationDelay:`${i*60}ms`,background:ok?'rgba(255,77,0,0.06)':'var(--ink-3)',border:`1px solid ${ok?'rgba(255,77,0,0.2)':'var(--stroke-2)'}`,borderRadius:12,padding:'18px 12px',display:'flex',flexDirection:'column',alignItems:'center',gap:8,textAlign:'center',position:'relative',transition:'transform 0.2s,border-color 0.2s',cursor:ok?'default':'not-allowed' }}>
                  {ok&&<div style={{ position:'absolute',top:0,left:0,right:0,height:2,background:'var(--fire)',borderRadius:'12px 12px 0 0' }} />}
                  <div style={{ fontSize:30 }}>{b.icon}</div>
                  <p style={{ fontSize:12,fontWeight:700,color:ok?'var(--text)':'var(--text-3)',lineHeight:1.2,fontFamily:'var(--font-body)' }}>{b.nombre}</p>
                  <p style={{ fontSize:10,color:'var(--text-3)',lineHeight:1.3,fontFamily:'var(--font-body)' }}>{b.desc}</p>
                  {ok&&<div className="pill pill-fire" style={{ fontSize:9 }}>LOGRADO</div>}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── SISTEMA DE PUNTUACIÓN ── */}
        <div className="card" style={{ padding:24 }}>
          <div style={{ height:2,background:'var(--stroke)',marginBottom:20,borderRadius:2 }} />
          <p style={{ fontSize:11,fontWeight:700,letterSpacing:'0.12em',color:'var(--text-3)',textTransform:'uppercase',marginBottom:16,fontFamily:'var(--font-display)' }}>
            Sistema de puntuación
          </p>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:10 }}>
            {[
              { v:'3 PTS',l:'Marcador exacto',  d:'Predijiste 2-1 · salió 2-1',  accent:'var(--gold)',  bg:'rgba(255,214,10,0.05)', b:'rgba(255,214,10,0.18)' },
              { v:'1 PT', l:'Ganador correcto', d:'Predijiste 1-0 · salió 3-1',  accent:'var(--turf)', bg:'rgba(0,212,106,0.05)',  b:'rgba(0,212,106,0.18)'  },
              { v:'0 PTS',l:'Fallo',            d:'Resultado incorrecto',         accent:'var(--text-3)',bg:'var(--ink-3)',          b:'var(--stroke)'         },
            ].map(({v,l,d,accent,bg,b})=>(
              <div key={l} style={{ background:bg,border:`1px solid ${b}`,borderRadius:10,padding:16,position:'relative',overflow:'hidden' }}>
                <div style={{ position:'absolute',top:0,left:0,right:0,height:2,background:accent }} />
                <p className="f-display" style={{ fontSize:30,color:accent,marginBottom:6,lineHeight:1 }}>{v}</p>
                <p style={{ fontSize:11,fontWeight:700,color:'var(--text)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:4,fontFamily:'var(--font-display)' }}>{l}</p>
                <p style={{ fontSize:11,color:'var(--text-3)',fontFamily:'var(--font-body)' }}>{d}</p>
              </div>
            ))}
          </div>
        </div>

      </main>

      <style>{`
        @media (min-width: 640px) { .stats-grid { grid-template-columns: repeat(4,1fr) !important; } }
        .stat-card { background:var(--ink-3); border:1px solid var(--stroke-2); border-radius:12px; padding:20px 16px; text-align:center; position:relative; overflow:hidden; transition:border-color 0.2s, transform 0.2s; }
        .stat-card:hover { transform:translateY(-2px); border-color:var(--stroke-fire); }
        .stat-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; border-radius:2px 2px 0 0; }
        .stat-card.fire::before { background:var(--fire); }
        .stat-card.turf::before { background:var(--turf); }
        .stat-card.gold::before { background:var(--gold); }
        .stat-card.white::before { background:var(--text-2); }
      `}</style>
    </div>
  )
}
