'use client'
import { useState, useRef } from 'react'
import { guardarPronostico } from '../actions'

const flag = (c: string, s = '32x24') => `https://flagcdn.com/${s}/${c.toLowerCase()}.png`
const fmtF = (f: string) => new Date(f+'T00:00:00').toLocaleDateString('es-MX',{weekday:'short',day:'numeric',month:'short'})
const fmtH = (h: string) => h.slice(0,5)+' CST'

// Etiquetas cortas para las tabs de fases
const FASE_LABEL: Record<string,string> = {
  'Fase de Grupos': 'GRUPOS',
  'Ronda de 32': 'R. 32',
  'Octavos de final': 'OCTAVOS',
  'Cuartos de final': 'CUARTOS',
  'Semifinales': 'SEMIS',
  'Tercer Puesto': '3er LUGAR',
  'Final': 'FINAL',
}

const FASE_ICON: Record<string,string> = {
  'Fase de Grupos': '⚽',
  'Ronda de 32': '🎯',
  'Octavos de final': '⚡',
  'Cuartos de final': '🔥',
  'Semifinales': '⭐',
  'Tercer Puesto': '🥉',
  'Final': '🏆',
}

interface Partido { id:number;equipo_local:string;equipo_visitante:string;codigo_local:string|null;codigo_visitante:string|null;fecha:string;hora:string;grupo:string|null;fase:string|null;goles_local:number|null;goles_visitante:number|null }
interface Props {
  partidos: Partido[]
  pronosticoMap: Record<number,{goles_local:number;goles_visitante:number;puntos:number|null}>
  banderasPorGrupo: Record<string,string[]>
  gruposOrdenados: string[]
  fasesOrdenadas: string[]
  cerrado: boolean
  grupoInicial?: string|null
  faseInicial?: string|null
}

// Color background + borde izquierdo por puntos obtenidos
function getPuntosStyle(puntos: number|null|undefined): React.CSSProperties {
  if (puntos === 3) return { background:'rgba(255,214,10,0.07)', borderLeft:'3px solid rgba(255,214,10,0.5)' }
  if (puntos === 1) return { background:'rgba(0,212,106,0.05)', borderLeft:'3px solid rgba(0,212,106,0.4)' }
  if (puntos === 0) return { background:'rgba(255,59,48,0.04)', borderLeft:'3px solid rgba(255,59,48,0.25)' }
  return { borderLeft:'3px solid transparent' }
}

function getPuntosBadge(puntos: number|null|undefined) {
  if (puntos === 3) return <span style={{ fontSize:10, fontWeight:800, color:'var(--gold)', background:'rgba(255,214,10,0.12)', border:'1px solid rgba(255,214,10,0.3)', borderRadius:4, padding:'2px 6px', fontFamily:'var(--font-display)', letterSpacing:'0.06em', flexShrink:0 }}>+3 ⭐</span>
  if (puntos === 1) return <span style={{ fontSize:10, fontWeight:800, color:'var(--turf)', background:'rgba(0,212,106,0.1)', border:'1px solid rgba(0,212,106,0.25)', borderRadius:4, padding:'2px 6px', fontFamily:'var(--font-display)', letterSpacing:'0.06em', flexShrink:0 }}>+1 ✓</span>
  if (puntos === 0) return <span style={{ fontSize:10, fontWeight:800, color:'var(--red-hot)', background:'rgba(255,59,48,0.08)', border:'1px solid rgba(255,59,48,0.2)', borderRadius:4, padding:'2px 6px', fontFamily:'var(--font-display)', letterSpacing:'0.06em', flexShrink:0 }}>0 ✗</span>
  return null
}

function PartidoRow({ p, pronoInicial, cerrado }: { p:Partido;pronoInicial?:{goles_local:number;goles_visitante:number;puntos:number|null};cerrado:boolean }) {
  const [loc,  setLoc]  = useState<number|''>(pronoInicial?.goles_local??'')
  const [vis,  setVis]  = useState<number|''>(pronoInicial?.goles_visitante??'')
  const [est,  setEst]  = useState<'idle'|'saving'|'ok'|'err'>('idle')
  const [open, setOpen] = useState(false)
  const lRef = useRef(loc); lRef.current = loc
  const vRef = useRef(vis); vRef.current = vis
  const tRef = useRef<ReturnType<typeof setTimeout>|null>(null)
  const bRef = useRef<ReturnType<typeof setTimeout>|null>(null)
  const has  = loc!==''&&vis!==''
  const puntos = pronoInicial?.puntos
  const tieneResultado = p.goles_local !== null && p.goles_local !== undefined

  const save = async () => {
    const l=lRef.current,v=vRef.current
    if(l===''||v===''||cerrado) return
    if(l===pronoInicial?.goles_local&&v===pronoInicial?.goles_visitante) return
    setEst('saving'); if(tRef.current) clearTimeout(tRef.current)
    const r = await guardarPronostico(p.id,Number(l),Number(v))
    setEst(r?.ok?'ok':'err')
    tRef.current = setTimeout(()=>setEst('idle'),2500)
  }
  const onBlur  = ()=>{ bRef.current=setTimeout(()=>{ setOpen(false); save() },300) }
  const onFocus = ()=>{ if(bRef.current) clearTimeout(bRef.current) }
  const onKey   = (e:React.KeyboardEvent)=>{ if(e.key==='Enter'){setOpen(false);save()} if(e.key==='Escape') setOpen(false) }

  // Estilo base: si hay puntos asignados úsalos, si no usa el estado de "llenado"
  const baseStyle = tieneResultado && has
    ? getPuntosStyle(puntos)
    : {
        background: open ? 'var(--ink-4)' : est==='ok' ? 'rgba(0,212,106,0.08)' : has ? 'rgba(0,212,106,0.025)' : 'transparent',
        borderLeft: est==='ok' ? '3px solid var(--turf)' : has ? '3px solid rgba(0,212,106,0.35)' : '3px solid transparent',
      }

  return (
    <div onClick={()=>!cerrado&&!open&&setOpen(true)}
      style={{
        display:'flex', alignItems:'center', gap:12, padding:'14px 20px',
        borderBottom:'1px solid var(--stroke-2)', cursor:cerrado?'default':open?'default':'pointer',
        transition:'background 0.15s',
        ...baseStyle,
      }}
      onMouseEnter={e=>{ if(!open&&!has) (e.currentTarget as HTMLElement).style.background='var(--ink-3)' }}
      onMouseLeave={e=>{ if(!open) {
        const s = tieneResultado && has ? getPuntosStyle(puntos) : { background: has ? 'rgba(0,212,106,0.025)' : 'transparent' }
        ;(e.currentTarget as HTMLElement).style.background = (s.background as string) ?? 'transparent'
      }}}>

      {/* Fecha — solo desktop */}
      <div style={{ width:64, flexShrink:0, display:'none' }} className="row-date">
        <p style={{ fontSize:10, color:'var(--text-3)', textTransform:'capitalize', fontFamily:'var(--font-body)' }}>{fmtF(p.fecha)}</p>
        <p style={{ fontSize:10, color:'var(--fire)', fontFamily:'var(--font-display)', fontWeight:700, letterSpacing:'0.06em' }}>{fmtH(p.hora)}</p>
      </div>

      {/* Equipos */}
      <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:0 }}>
        {p.codigo_local&&<img src={flag(p.codigo_local)} style={{ width:28,height:20,borderRadius:4,objectFit:'cover',flexShrink:0,boxShadow:'0 2px 6px rgba(0,0,0,0.35)' }} alt="" />}
        <span style={{ fontSize:13, fontWeight:700, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:'var(--font-body)' }}>{p.equipo_local}</span>

        {/* Resultado real si existe */}
        {tieneResultado ? (
          <span style={{ fontSize:12, color:'var(--text-2)', fontFamily:'var(--font-display)', fontWeight:800, flexShrink:0, padding:'2px 8px', background:'var(--ink-3)', borderRadius:4, border:'1px solid var(--stroke-2)' }}>
            {p.goles_local}–{p.goles_visitante}
          </span>
        ) : (
          <span style={{ fontSize:11, color:'var(--text-3)', flexShrink:0, padding:'0 4px', fontFamily:'var(--font-display)', fontWeight:700 }}>VS</span>
        )}

        {p.codigo_visitante&&<img src={flag(p.codigo_visitante)} style={{ width:28,height:20,borderRadius:4,objectFit:'cover',flexShrink:0,boxShadow:'0 2px 6px rgba(0,0,0,0.35)' }} alt="" />}
        <span style={{ fontSize:13, fontWeight:700, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:'var(--font-body)' }}>{p.equipo_visitante}</span>
      </div>

      {/* Badge de puntos (solo si ya hay resultado) */}
      {tieneResultado && has && (
        <div style={{ flexShrink:0 }}>
          {getPuntosBadge(puntos)}
        </div>
      )}

      {/* Pronóstico */}
      <div style={{ flexShrink:0, display:'flex', alignItems:'center', gap:8 }} onClick={e=>e.stopPropagation()}>
        {open&&!cerrado ? (
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <input autoFocus type="number" min="0" max="20" value={loc}
              inputMode="numeric" pattern="[0-9]*"
              onChange={e=>setLoc(e.target.value===''?'':Math.max(0,Math.min(20,+e.target.value)))}
              onBlur={onBlur} onFocus={onFocus} onKeyDown={onKey}
              className="score-box has-value" placeholder="0" />
            <span style={{ color:'var(--text-3)', fontWeight:700, fontFamily:'var(--font-display)' }}>–</span>
            <input type="number" min="0" max="20" value={vis}
              inputMode="numeric" pattern="[0-9]*"
              onChange={e=>setVis(e.target.value===''?'':Math.max(0,Math.min(20,+e.target.value)))}
              onBlur={onBlur} onFocus={onFocus} onKeyDown={onKey}
              className="score-box has-value" placeholder="0" />
            <button onMouseDown={e=>{ e.preventDefault();if(bRef.current) clearTimeout(bRef.current);setOpen(false);save() }}
              className="btn btn-fire" style={{ padding:'0 14px', height:52 }}>✓</button>
          </div>
        ) : has ? (
          <span className="f-display" style={{
            fontSize:22,
            color: tieneResultado ? (puntos===3?'var(--gold)':puntos===1?'var(--turf)':'var(--red-hot)') : 'var(--turf)',
            letterSpacing:'0.02em'
          }}>{loc} – {vis}</span>
        ) : (
          <span style={{ fontSize:11, color:'var(--text-3)', fontFamily:'var(--font-display)', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase' }}>
            {cerrado?'🔒 CERRADO':'→ PRONOSTICAR'}
          </span>
        )}
        {est==='saving'&&<span style={{ width:14,height:14,border:'2px solid rgba(255,255,255,0.15)',borderTopColor:'var(--fire)',borderRadius:'50%',flexShrink:0,display:'block' }} className="anim-spin" />}
        {est==='ok'&&<span style={{ color:'var(--turf)', fontSize:14, flexShrink:0, fontFamily:'var(--font-display)', fontWeight:800 }}>✓</span>}
        {est==='err'&&<span style={{ color:'var(--red-hot)', fontSize:12, flexShrink:0, fontFamily:'var(--font-display)', fontWeight:800 }}>✗</span>}
      </div>

      {/* Estado desktop */}
      <div style={{ width:80, textAlign:'right', flexShrink:0, display:'none' }} className="row-status">
        {cerrado
          ?<span style={{ fontSize:10, color:'var(--text-3)', fontFamily:'var(--font-display)', letterSpacing:'0.06em' }}>CERRADO</span>
          :has
            ?<span className="pill pill-turf" style={{ fontSize:9 }}>✓ LISTO</span>
            :<span style={{ fontSize:10, color:'var(--text-3)', fontFamily:'var(--font-display)', letterSpacing:'0.06em' }}>PENDIENTE</span>}
      </div>
    </div>
  )
}

export default function PartidosClient({ partidos, pronosticoMap, banderasPorGrupo, gruposOrdenados, fasesOrdenadas, cerrado, grupoInicial, faseInicial }: Props) {
  // Tab activo: primero por fase, luego puede filtrar por grupo dentro de esa fase
  const [faseActiva, setFaseActiva] = useState<string>(faseInicial ?? fasesOrdenadas[0] ?? 'Fase de Grupos')
  const [grupoActivo, setGrupoActivo] = useState<string|null>(grupoInicial ?? null)

  // Partidos de la fase activa
  const partidosFase = partidos.filter(p=>(p.fase??'Otros')===faseActiva)
  // Grupos disponibles en esta fase
  const gruposDeFase = gruposOrdenados.filter(g=>partidosFase.some(p=>p.grupo===g))
  const esFaseGrupos = faseActiva === 'Fase de Grupos'

  // Partidos finales a mostrar
  const partidosMostrados = (esFaseGrupos && grupoActivo)
    ? partidosFase.filter(p=>p.grupo===grupoActivo)
    : partidosFase

  // Grupos a renderizar en el cuerpo
  const gruposAMostrar = esFaseGrupos
    ? (grupoActivo ? [grupoActivo] : gruposDeFase)
    : ['__fase__']

  return (
    <div className="wrap" style={{ paddingTop:28, paddingBottom:64 }}>

      {/* ── TABS DE FASE ── */}
      <div style={{ display:'flex', gap:6, marginBottom:16, overflowX:'auto', paddingBottom:4 }}>
        {fasesOrdenadas.map(fase => {
          const ps = partidos.filter(p=>(p.fase??'Otros')===fase)
          const pron = ps.filter(p=>pronosticoMap[p.id]!==undefined).length
          const done = pron===ps.length && ps.length>0
          const isAct = faseActiva===fase
          return (
            <button key={fase} onClick={()=>{ setFaseActiva(fase); setGrupoActivo(null) }}
              style={{
                flexShrink:0,
                display:'flex', alignItems:'center', gap:6,
                padding:'10px 16px',
                borderRadius:8,
                border: isAct ? '1px solid var(--fire)' : '1px solid var(--stroke)',
                background: isAct ? 'var(--fire)' : done ? 'rgba(0,212,106,0.06)' : 'var(--ink-2)',
                color: isAct ? '#fff' : done ? 'var(--turf)' : 'var(--text-2)',
                fontFamily:'var(--font-display)',
                fontSize:12,
                fontWeight:800,
                letterSpacing:'0.06em',
                cursor:'pointer',
                transition:'all 0.15s',
              }}>
              <span>{FASE_ICON[fase]??'⚽'}</span>
              <span>{FASE_LABEL[fase]??fase.toUpperCase()}</span>
              {done && <span style={{ fontSize:9, opacity:0.8 }}>✓</span>}
            </button>
          )
        })}
      </div>

      {/* ── SUB-TABS DE GRUPO (solo en Fase de Grupos) ── */}
      {esFaseGrupos && gruposDeFase.length > 1 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:20 }}>
          <button onClick={()=>setGrupoActivo(null)}
            style={{
              display:'flex', alignItems:'center', gap:4,
              padding:'6px 12px', borderRadius:6,
              border: grupoActivo===null ? '1px solid var(--fire)' : '1px solid var(--stroke-2)',
              background: grupoActivo===null ? 'rgba(255,77,0,0.12)' : 'transparent',
              color: grupoActivo===null ? 'var(--fire)' : 'var(--text-3)',
              fontSize:11, fontFamily:'var(--font-display)', fontWeight:700, letterSpacing:'0.08em', cursor:'pointer',
            }}>
            TODOS
          </button>
          {gruposDeFase.map(g => {
            const bans = banderasPorGrupo[g]??[]
            const tot  = partidosFase.filter(p=>p.grupo===g).length
            const pron = partidosFase.filter(p=>p.grupo===g&&pronosticoMap[p.id]!==undefined).length
            const done = pron===tot&&tot>0
            const isAct = grupoActivo===g
            return (
              <button key={g} onClick={()=>setGrupoActivo(isAct?null:g)}
                style={{
                  display:'flex', alignItems:'center', gap:4,
                  padding:'6px 10px', borderRadius:6, position:'relative',
                  border: isAct ? '1px solid var(--fire)' : done ? '1px solid rgba(0,212,106,0.25)' : '1px solid var(--stroke-2)',
                  background: isAct ? 'rgba(255,77,0,0.12)' : done ? 'rgba(0,212,106,0.05)' : 'transparent',
                  color: isAct ? 'var(--fire)' : done ? 'var(--turf)' : 'var(--text-3)',
                  fontSize:11, fontFamily:'var(--font-display)', fontWeight:700, letterSpacing:'0.08em', cursor:'pointer',
                }}>
                {done && <div style={{ position:'absolute', top:-3, right:-3, width:7, height:7, borderRadius:'50%', background:'var(--turf)', border:'1.5px solid var(--ink)' }} />}
                <span>GRP {g}</span>
                <div style={{ display:'flex', gap:1 }}>
                  {bans.slice(0,4).map(c=><img key={c} src={flag(c,'20x15')} alt="" style={{ width:13,height:10,borderRadius:2,objectFit:'cover' }} />)}
                </div>
                <span style={{ fontSize:9, opacity:0.7 }}>{done?'✓':`${pron}/${tot}`}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* ── CONTENIDO ── */}
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        {esFaseGrupos ? (
          // Fase de Grupos: mostrar tarjetas por grupo
          gruposAMostrar.map(g => {
            const ps   = partidosFase.filter(p=>p.grupo===g)
            const pron = ps.filter(p=>pronosticoMap[p.id]!==undefined).length
            const done = pron===ps.length&&ps.length>0
            const pct  = ps.length>0?(pron/ps.length)*100:0
            return (
              <div key={g} id={`grupo-${g}`} className="card">
                <div style={{ height:2, background:done?'var(--turf)':'linear-gradient(90deg, var(--fire), var(--turf))', borderRadius:'12px 12px 0 0' }} />
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid var(--stroke-2)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ display:'flex', gap:3 }}>
                      {(banderasPorGrupo[g]??[]).map(c=><img key={c} src={flag(c)} alt="" style={{ width:28,height:20,borderRadius:4,objectFit:'cover',boxShadow:'0 2px 6px rgba(0,0,0,0.3)' }} />)}
                    </div>
                    <span className="f-display" style={{ fontSize:22, color:'var(--text)', letterSpacing:'0.04em' }}>GRUPO {g}</span>
                    {done&&<span className="pill pill-turf">✓ COMPLETO</span>}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div className="prog-track" style={{ width:64 }}>
                      <div className="prog-fill" style={{ width:`${pct}%` }} />
                    </div>
                    <span style={{ fontSize:12, color:'var(--text-3)', fontFamily:'var(--font-display)', fontWeight:700, letterSpacing:'0.06em' }}>{pron}/{ps.length}</span>
                  </div>
                </div>
                <div style={{ display:'flex', gap:12, padding:'8px 20px', background:'var(--ink-3)', borderBottom:'1px solid var(--stroke-2)' }} className="col-headers">
                  <div style={{ width:64, flexShrink:0, fontSize:9, color:'var(--text-3)', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', fontFamily:'var(--font-display)' }}>Fecha</div>
                  <div style={{ flex:1, fontSize:9, color:'var(--text-3)', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', fontFamily:'var(--font-display)' }}>Partido</div>
                  <div style={{ flexShrink:0, width:140, textAlign:'right', fontSize:9, color:'var(--text-3)', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', fontFamily:'var(--font-display)' }}>Pronóstico</div>
                  <div style={{ width:80, flexShrink:0, textAlign:'right', fontSize:9, color:'var(--text-3)', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', fontFamily:'var(--font-display)' }}>Estado</div>
                </div>
                {ps.map(p=><PartidoRow key={p.id} p={p} pronoInicial={pronosticoMap[p.id]} cerrado={cerrado} />)}
              </div>
            )
          })
        ) : (
          // Otras fases: tarjeta única con todos los partidos de la fase
          <div className="card">
            <div style={{ height:2, background:'linear-gradient(90deg, var(--fire), var(--gold))', borderRadius:'12px 12px 0 0' }} />
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid var(--stroke-2)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:24 }}>{FASE_ICON[faseActiva]??'⚽'}</span>
                <span className="f-display" style={{ fontSize:22, color:'var(--text)', letterSpacing:'0.04em' }}>{faseActiva.toUpperCase()}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div className="prog-track" style={{ width:64 }}>
                  <div className="prog-fill" style={{ width:`${partidosFase.length>0?(partidosFase.filter(p=>pronosticoMap[p.id]).length/partidosFase.length)*100:0}%` }} />
                </div>
                <span style={{ fontSize:12, color:'var(--text-3)', fontFamily:'var(--font-display)', fontWeight:700 }}>
                  {partidosFase.filter(p=>pronosticoMap[p.id]).length}/{partidosFase.length}
                </span>
              </div>
            </div>
            <div style={{ display:'flex', gap:12, padding:'8px 20px', background:'var(--ink-3)', borderBottom:'1px solid var(--stroke-2)' }} className="col-headers">
              <div style={{ width:64, flexShrink:0, fontSize:9, color:'var(--text-3)', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', fontFamily:'var(--font-display)' }}>Fecha</div>
              <div style={{ flex:1, fontSize:9, color:'var(--text-3)', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', fontFamily:'var(--font-display)' }}>Partido</div>
              <div style={{ flexShrink:0, width:140, textAlign:'right', fontSize:9, color:'var(--text-3)', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', fontFamily:'var(--font-display)' }}>Pronóstico</div>
              <div style={{ width:80, flexShrink:0, textAlign:'right', fontSize:9, color:'var(--text-3)', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', fontFamily:'var(--font-display)' }}>Estado</div>
            </div>
            {partidosFase.map(p=><PartidoRow key={p.id} p={p} pronoInicial={pronosticoMap[p.id]} cerrado={cerrado} />)}
          </div>
        )}
      </div>

      <p style={{ textAlign:'center', fontSize:11, color:'var(--text-3)', marginTop:36, fontFamily:'var(--font-display)', letterSpacing:'0.1em', textTransform:'uppercase' }}>
        Quiniela MX 2026 · Hecho con ⚽ en México
      </p>

      <style>{`
        @media (min-width: 640px) {
          .row-date, .row-status, .col-headers { display: flex !important; }
        }
        .pill-turf { background: var(--turf-dim); color: var(--turf); border-color: rgba(0,212,106,0.25); font-family: var(--font-display); font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 3px 9px; border-radius: 3px; border: 1px solid transparent; display: inline-flex; align-items: center; gap: 4px; }
      `}</style>
    </div>
  )
}
