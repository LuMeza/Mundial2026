import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Nav from '@/app/components/Nav'
import PartidosClient from './PartidosClient'

const ORDEN_GRUPOS = ['A','B','C','D','E','F','G','H','I','J','K','L']

export default async function PartidosPage({ searchParams }: { searchParams: Promise<{grupo?:string;fase?:string}> }) {
  const { grupo: grupoInicial = null, fase: faseInicial = null } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data:partidos },{ data:pronos },{ data:perfil }] = await Promise.all([
    // Todos los partidos con fase_abierta=true, sin importar cierre_pronosticos
    supabase.from('partidos').select('*').eq('fase_abierta',true).order('fecha',{ascending:true}).order('hora',{ascending:true}),
    // Pronósticos del usuario filtrados SOLO a los partidos actualmente abiertos
    supabase.from('pronosticos').select('*').eq('usuario_id',user.id),
    supabase.from('perfiles').select('nombre,avatar_url,es_admin').eq('id',user.id).single(),
  ])

  // Solo contar pronósticos de partidos que están abiertos ahora
  const partidosAbiertoIds = new Set(partidos?.map(p => p.id) ?? [])
  const pronosActivos = pronos?.filter(p => partidosAbiertoIds.has(p.partido_id)) ?? []

  const pronosticoMap: Record<number,{goles_local:number;goles_visitante:number;puntos:number|null}> = {}
  pronosActivos.forEach(p=>{ pronosticoMap[p.partido_id]={goles_local:p.goles_local,goles_visitante:p.goles_visitante,puntos:p.puntos??null} })

  const total  = partidos?.length ?? 0
  const hechos = pronosActivos.length
  const pct    = total > 0 ? Math.round((hechos/total)*100) : 0
  const nombre = perfil?.nombre ?? user.email?.split('@')[0] ?? 'Usuario'

  // Cerrado: cierre_pronosticos en el pasado Y la fase NO fue reabierta manualmente
  // Si fase_abierta=true el admin la quiere abierta, así que solo cerramos
  // si TODOS los partidos abiertos tienen cierre_pronosticos en el pasado
  const ahora = new Date()
  const todosConCierre = partidos?.every(p => p.cierre_pronosticos) ?? false
  const cierreMaximo = partidos
    ?.filter(p => p.cierre_pronosticos)
    .reduce((max, p) => {
      const t = new Date(p.cierre_pronosticos).getTime()
      return t > max ? t : max
    }, 0) ?? 0

  // Solo está cerrado si TODOS los partidos tienen cierre pasado
  // Si el admin reabrió (fase_abierta=true) pero no actualizó cierre, dejamos editar
  const cerrado = todosConCierre && cierreMaximo > 0 && ahora.getTime() > cierreMaximo

  // Agrupar por fase y grupo
  const porFase: Record<string, typeof partidos> = {}
  const porGrupo: Record<string,typeof partidos> = {}
  partidos?.forEach(p=>{
    const f = p.fase ?? 'Otros'
    const g = p.grupo ?? 'Otros'
    if(!porFase[f]) porFase[f]=[]
    porFase[f]!.push(p)
    if(!porGrupo[g]) porGrupo[g]=[]
    porGrupo[g]!.push(p)
  })

  const banderasPorGrupo: Record<string,string[]> = {}
  Object.entries(porGrupo).forEach(([g,ps])=>{
    const s=new Set<string>(); ps?.forEach(p=>{ if(p.codigo_local) s.add(p.codigo_local); if(p.codigo_visitante) s.add(p.codigo_visitante) })
    banderasPorGrupo[g]=Array.from(s).slice(0,4)
  })

  const ORDEN_FASES = ['Fase de Grupos','Ronda de 32','Octavos de final','Cuartos de final','Semifinales','Tercer Puesto','Final']
  const gruposOrdenados=[...ORDEN_GRUPOS.filter(g=>porGrupo[g]),...Object.keys(porGrupo).filter(g=>!ORDEN_GRUPOS.includes(g))]
  const fasesOrdenadas=[...ORDEN_FASES.filter(f=>porFase[f]),...Object.keys(porFase).filter(f=>!ORDEN_FASES.includes(f))]

  // Fase inicial: si no viene en URL, usar la primera disponible
  const faseDefault = faseInicial ?? fasesOrdenadas[0] ?? null

  return (
    <div className="page">
      <div style={{ position:'fixed',top:0,left:0,right:0,height:3,background:'linear-gradient(90deg, var(--turf), var(--fire) 50%, var(--turf))',backgroundSize:'200% 100%',animation:'fire-sweep 4s linear infinite',zIndex:200 }} />
      <Nav nombre={nombre} avatarUrl={perfil?.avatar_url} esAdmin={perfil?.es_admin} pagina="/quiniela/partidos" />

      {/* Barra de progreso global */}
      <div style={{ height:3, background:'var(--stroke)', position:'relative' }}>
        <div style={{ height:'100%', background:'linear-gradient(90deg, var(--turf), var(--fire))', width:`${pct}%`, transition:'width 0.8s ease', boxShadow:'0 0 8px rgba(255,77,0,0.4)' }} />
      </div>

      {/* Sin partidos abiertos */}
      {total === 0 && (
        <div className="wrap" style={{ paddingTop:60, textAlign:'center' }}>
          <div style={{ fontSize:56, marginBottom:16 }}>🔒</div>
          <p className="f-display" style={{ fontSize:32, color:'var(--text)', marginBottom:8 }}>SIN FASES ABIERTAS</p>
          <p style={{ fontSize:14, color:'var(--text-3)', fontFamily:'var(--font-body)' }}>El administrador abrirá la siguiente fase pronto.</p>
        </div>
      )}

      {cerrado && total > 0 && (
        <div className="wrap" style={{ paddingTop:12 }}>
          <div style={{ background:'rgba(255,59,48,0.08)', border:'1px solid rgba(255,59,48,0.2)', borderRadius:8, padding:'10px 18px', textAlign:'center' }}>
            <p style={{ fontSize:13, fontWeight:700, color:'var(--red-hot)', fontFamily:'var(--font-display)', letterSpacing:'0.06em', textTransform:'uppercase' }}>🔒 Pronósticos cerrados · Solo lectura</p>
          </div>
        </div>
      )}

      {total > 0 && (
        <PartidosClient
          partidos={partidos??[]}
          pronosticoMap={pronosticoMap}
          banderasPorGrupo={banderasPorGrupo}
          gruposOrdenados={gruposOrdenados}
          fasesOrdenadas={fasesOrdenadas}
          cerrado={cerrado}
          grupoInicial={grupoInicial}
          faseInicial={faseDefault}
        />
      )}
    </div>
  )
}
