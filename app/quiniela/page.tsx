import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import Countdown from './Countdown'
import Nav from '@/app/components/Nav'
import DashboardStats from './DashboardStats'
import ProgresoBars from './ProgresoBars'

// Cierre se toma directamente de cierre_pronosticos en la BD
const flagUrl = (c: string) => `https://flagcdn.com/64x48/${c.toLowerCase()}.png`
const fmtDate = (f: string) => new Date(f+'T00:00:00').toLocaleDateString('es-MX',{weekday:'short',day:'numeric',month:'short'})
const fmtTime = (h: string) => h.slice(0,5)+' CST'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  const [
    {data:partidos},{data:pronos},{data:perfil},
    {data:todosP},{data:perfiles},
  ] = await Promise.all([
    supabase.from('partidos').select('*').eq('fase_abierta',true).order('fecha',{ascending:true}).order('hora',{ascending:true}),
    supabase.from('pronosticos').select('*').eq('usuario_id',user.id),
    supabase.from('perfiles').select('nombre,avatar_url,es_admin').eq('id',user.id).single(), // propio perfil (RLS OK)
    service.from('pronosticos').select('usuario_id,puntos'),           // todos los pronósticos (service role)
    service.from('perfiles').select('id,nombre,avatar_url'),           // todos los perfiles (service role)
  ])

  // Solo contar pronósticos de partidos que están ACTUALMENTE abiertos
  const partidosAbiertoIds = new Set(partidos?.map(p => p.id) ?? [])
  const pronosActivos = pronos?.filter(p => partidosAbiertoIds.has(p.partido_id)) ?? []

  const done  = new Set(pronosActivos.map(p => p.partido_id))
  const total = partidos?.length ?? 0
  const hechos = pronosActivos.length
  const pct   = total > 0 ? Math.round((hechos/total)*100) : 0
  const pend  = total - hechos
  const next  = partidos?.find(p => !done.has(p.id)) ?? null
  // Puntos y exactos: usar TODOS los pronósticos (no solo los abiertos)
  const pts   = pronos?.reduce((s,p) => s+(p.puntos??0), 0) ?? 0
  const exs   = pronos?.filter(p => p.puntos===3).length ?? 0

  const pMap  = new Map(perfiles?.map(p=>[p.id,{nombre:p.nombre??'Usuario',avatar:p.avatar_url}])??[])
  const res: Record<string,{uid:string;nombre:string;avatar:string|null;total:number}> = {}
  todosP?.forEach(p=>{
    if(!res[p.usuario_id]) res[p.usuario_id]={uid:p.usuario_id,nombre:pMap.get(p.usuario_id)?.nombre??'Usuario',avatar:pMap.get(p.usuario_id)?.avatar??null,total:0}
    res[p.usuario_id].total+=(p.puntos??0)
  })
  const ranking   = Object.values(res).sort((a,b)=>b.total-a.total)
  const top5      = ranking.slice(0,5)
  const hayPts    = ranking.some(r=>r.total>0)
  const nombre    = perfil?.nombre??user.email?.split('@')[0]??'Usuario'
  const miPos     = ranking.findIndex(r=>r.uid===user.id)+1
  // Cerrado: solo si TODOS los partidos abiertos tienen cierre_pronosticos en el pasado
  const ahora2    = new Date()
  const todosConCierre = partidos?.every(p => p.cierre_pronosticos) ?? false
  const cierreMaximo   = partidos
    ?.filter(p => p.cierre_pronosticos)
    .reduce((max, p) => {
      const t = new Date(p.cierre_pronosticos).getTime()
      return t > max ? t : max
    }, 0) ?? 0
  const cerrado   = todosConCierre && cierreMaximo > 0 && ahora2.getTime() > cierreMaximo
  const M         = ['🥇','🥈','🥉']
  const primerNombre = nombre.split(' ')[0].toUpperCase()

  return (
    <div className="page">
      {/* Barra top animada */}
      <div style={{ position:'fixed',top:0,left:0,right:0,height:3,background:'linear-gradient(90deg, var(--turf), var(--fire) 50%, var(--turf))',backgroundSize:'200% 100%',animation:'fire-sweep 4s linear infinite',zIndex:200 }} />
      <Nav nombre={nombre} avatarUrl={perfil?.avatar_url} esAdmin={perfil?.es_admin} pagina="/quiniela" />

      <main className="wrap" style={{ paddingTop:44, paddingBottom:64 }}>

        {/* ── SALUDO HERO ── */}
        <div className="anim-up" style={{ marginBottom:44, position:'relative' }}>
          {/* Decoración background */}
          <div style={{ position:'absolute', right:-20, top:-20, fontSize:'clamp(80px,15vw,180px)', opacity:0.04, pointerEvents:'none', userSelect:'none' }}>⚽</div>

          <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--fire)', marginBottom:10, fontFamily:'var(--font-display)' }}>
            ▸ BIENVENIDO DE VUELTA
          </p>
          <h1 className="f-display" style={{ fontSize:'clamp(56px,9vw,104px)', lineHeight:0.9, marginBottom:12 }}>
            <span style={{ color:'var(--text)' }}>{primerNombre}</span>
            <span style={{ color:'var(--fire)' }}>.</span>
          </h1>
          <p style={{ fontSize:15, color:'var(--text-2)', fontFamily:'var(--font-body)', fontWeight:500, maxWidth:480 }}>
            {total === 0
              ? '⏳ No hay fases abiertas en este momento. El torneo avanza...'
              : cerrado
              ? '🔒 Los pronósticos están cerrados. ¡Espera los resultados!'
              : pend===0
                ? '🎉 ¡Completaste todos tus pronósticos de esta fase! Ahora solo queda esperar.'
                : `⚠️ Te ${pend===1?'falta':'faltan'} ${pend} pronóstico${pend!==1?'s':''} por ingresar.`}
          </p>

          {/* Mini KPIs — animados */}
          <DashboardStats pct={pct} exs={exs} pts={pts} miPos={miPos} rankingLen={ranking.length} />
        </div>

        {/* ── GRID PRINCIPAL ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:16 }}>

          {/* ── CIERRE ── */}
          <div className="card anim-in d1" style={{ padding:28, borderColor:'var(--stroke-fire)' }}>
            <div style={{ height:2, background:'linear-gradient(90deg, var(--fire), transparent)', marginBottom:20, borderRadius:2 }} />
            <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--fire)', marginBottom:16, fontFamily:'var(--font-display)' }}>
              🔥 Cierre de pronósticos
            </p>
            {cierreMaximo > 0 ? (
              <>
                <Countdown fechaCierre={new Date(cierreMaximo).toISOString()} large />
                <p style={{ fontSize:12, color:'var(--text-3)', marginTop:18, fontFamily:'var(--font-body)' }}>
                  {new Date(cierreMaximo).toLocaleString('es-MX',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})} CST
                </p>
              </>
            ) : (
              <p style={{ fontSize:14, color:'var(--text-3)', fontFamily:'var(--font-body)' }}>Sin fecha de cierre definida</p>
            )}
            {cerrado&&<div className="pill pill-red" style={{ marginTop:10, display:'inline-flex' }}>🔒 CERRADO</div>}
          </div>

          {/* ── TOP 5 ── */}
          <div className="card anim-in d2" style={{ padding:0, display:'flex', flexDirection:'column' }}>
            <div style={{ height:2, background:'linear-gradient(90deg, var(--gold), transparent)', borderRadius:'12px 12px 0 0' }} />
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'18px 22px 14px', borderBottom:'1px solid var(--stroke-2)' }}>
              <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--text-3)', fontFamily:'var(--font-display)' }}>🏆 Top 5</p>
              <a href="/ranking" style={{ fontSize:12, fontWeight:700, color:'var(--fire)', textDecoration:'none', letterSpacing:'0.06em', fontFamily:'var(--font-display)', textTransform:'uppercase' }}>VER RANKING →</a>
            </div>
            {!hayPts ? (
              <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 24px', textAlign:'center', gap:10 }}>
                <span style={{ fontSize:36 }}>⏳</span>
                <p className="f-display" style={{ fontSize:20, color:'var(--text-3)' }}>EL TORNEO NO HA COMENZADO</p>
              </div>
            ) : (
              <div style={{ padding:'8px 0', flex:1 }}>
                {top5.map((j,i)=>(
                  <div key={j.uid} style={{
                    display:'flex', alignItems:'center', gap:12, padding:'10px 22px',
                    background:j.uid===user.id?'var(--fire-glow)':'transparent',
                    borderLeft:j.uid===user.id?'3px solid var(--fire)':'3px solid transparent',
                    transition:'background 0.12s',
                  }}>
                    <span style={{ width:22, textAlign:'center', fontSize:i<3?16:12, flexShrink:0, color:i<3?undefined:'var(--text-3)', fontFamily:'var(--font-display)', fontWeight:700 }}>
                      {i<3?M[i]:i+1}
                    </span>
                    <div style={{ width:28, height:28, borderRadius:'50%', background:j.uid===user.id?'var(--fire-dim)':'var(--ink-3)', border:`1px solid ${j.uid===user.id?'var(--stroke-fire)':'var(--stroke)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:j.uid===user.id?'var(--fire)':'var(--text-3)', fontFamily:'var(--font-display)', flexShrink:0 }}>
                      {j.nombre[0]}
                    </div>
                    <span style={{ fontSize:13, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:j.uid===user.id?'var(--fire)':'var(--text-2)', fontWeight:j.uid===user.id?700:500, fontFamily:'var(--font-body)' }}>{j.nombre}</span>
                    <span className="f-display" style={{ fontSize:22, color:i===0?'var(--gold)':j.uid===user.id?'var(--fire)':'var(--text)', flexShrink:0 }}>{j.total}<span style={{ fontSize:11, color:'var(--text-3)', marginLeft:2 }}>pts</span></span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── SIGUIENTE SIN PRONÓSTICO ── */}
          <div className="card anim-in d3" style={{ padding:24 }}>
            <div style={{ height:2, background:'linear-gradient(90deg, var(--turf), transparent)', marginBottom:20, borderRadius:2 }} />
            <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--text-3)', marginBottom:16, fontFamily:'var(--font-display)' }}>
              🎯 Siguiente sin pronóstico
            </p>
            {!next ? (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 0', gap:10, textAlign:'center' }}>
                <span style={{ fontSize:44 }}>✅</span>
                <p className="f-display" style={{ fontSize:28, color:'var(--turf)' }}>¡COMPLETADO!</p>
                <p style={{ fontSize:13, color:'var(--text-3)', fontFamily:'var(--font-body)' }}>Ya tienes todos tus pronósticos</p>
              </div>
            ) : (
              <>
                <p style={{ fontSize:12, color:'var(--text-3)', marginBottom:22, textTransform:'capitalize', fontFamily:'var(--font-body)' }}>
                  {fmtDate(next.fecha)} · {fmtTime(next.hora)} ·{' '}
                  <span style={{ color:'var(--fire)', fontWeight:700 }}>Grupo {next.grupo}</span>
                </p>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, marginBottom:26 }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, flex:1 }}>
                    {next.codigo_local
                      ?<img src={flagUrl(next.codigo_local)} style={{ width:60,height:44,borderRadius:8,objectFit:'cover', boxShadow:'0 4px 12px rgba(0,0,0,0.4)' }} alt={next.equipo_local} />
                      :<div style={{ width:60,height:44,background:'var(--ink-3)',borderRadius:8 }} />}
                    <span style={{ fontSize:12, fontWeight:600, textAlign:'center', fontFamily:'var(--font-body)', color:'var(--text)' }}>{next.equipo_local}</span>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                    <span className="f-display" style={{ fontSize:14, color:'var(--text-3)' }}>VS</span>
                    <div style={{ width:2, height:20, background:'var(--stroke)' }} />
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, flex:1 }}>
                    {next.codigo_visitante
                      ?<img src={flagUrl(next.codigo_visitante)} style={{ width:60,height:44,borderRadius:8,objectFit:'cover', boxShadow:'0 4px 12px rgba(0,0,0,0.4)' }} alt={next.equipo_visitante} />
                      :<div style={{ width:60,height:44,background:'var(--ink-3)',borderRadius:8 }} />}
                    <span style={{ fontSize:12, fontWeight:600, textAlign:'center', fontFamily:'var(--font-body)', color:'var(--text)' }}>{next.equipo_visitante}</span>
                  </div>
                </div>
                <a href={`/quiniela/partidos?grupo=${next.grupo}`} className="btn btn-fire" style={{ width:'100%', textAlign:'center' }}>
                  IR A GRUPO {next.grupo} →
                </a>
              </>
            )}
          </div>

          {/* ── PROGRESO ── */}
          <div className="card anim-in d4" style={{ padding:24 }}>
            <div style={{ height:2, background:'linear-gradient(90deg, var(--turf), var(--fire))', marginBottom:20, borderRadius:2 }} />
            <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--text-3)', marginBottom:16, fontFamily:'var(--font-display)' }}>
              📊 Mi progreso
            </p>
            <ProgresoBars pct={pct} hechos={hechos} total={total} exs={exs} pts={pts} miPos={miPos} rankingLen={ranking.length} />

            <a href="/quiniela/partidos" className="btn btn-outline" style={{ width:'100%', textAlign:'center' }}>
              Ingresar pronósticos →
            </a>
          </div>

        </div>

        {/* Nav móvil — botones rápidos */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginTop:24 }} className="mob-nav">
          {[
            {href:'/quiniela/partidos',label:'⚽ Pronósticos'},
            {href:'/ranking',label:'🏆 Ranking'},
            {href:'/resultados',label:'📊 Resultados'},
          ].map(({href,label})=>(
            <a key={href} href={href} className="btn btn-outline" style={{ textAlign:'center', justifyContent:'center', fontSize:13 }}>{label}</a>
          ))}
        </div>

      </main>
      <style>{`
        @media (min-width: 768px) { .mob-nav { display: none !important; } }
        .stat-card { background:var(--ink-3); border:1px solid var(--stroke-2); border-radius:12px; padding:18px 12px; text-align:center; position:relative; overflow:hidden; transition:border-color 0.2s, transform 0.2s; }
        .stat-card:hover { border-color:var(--stroke-fire); transform:translateY(-2px); }
        .stat-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; border-radius:2px 2px 0 0; }
        .stat-card.fire::before { background:var(--fire); }
        .stat-card.turf::before { background:var(--turf); }
        .stat-card.gold::before { background:var(--gold); }
        .stat-card.white::before { background:var(--text-2); }
      `}</style>
    </div>
  )
}
