'use client'
import { useState, useRef } from 'react'
import { guardarResultado } from './actions'
import AdminEquipoEditor from './AdminEquipoEditor'

interface Props {
  partido: {
    id:number;equipo_local:string;equipo_visitante:string
    codigo_local:string|null;codigo_visitante:string|null
    fecha:string;hora:string;grupo:string|null;fase:string
    goles_local:number|null;goles_visitante:number|null
    fase_abierta:boolean;cierre_pronosticos:string|null
  }
}
const flag = (c: string) => `https://flagcdn.com/32x24/${c.toLowerCase()}.png`

// Detectar si un nombre de equipo es un placeholder (no resuelto)
const esPlaceholder = (nombre: string) =>
  /^(W|L)\d+$/.test(nombre) ||        // W73, L101
  /^\d+[A-L]$/.test(nombre) ||         // 1A, 2B
  /^[0-9]+[A-Z]{1,2}\//.test(nombre)   // 3A/B/C/D

export default function AdminPartidoCard({ partido }: Props) {
  const [loc,  setLoc]  = useState<number|''>(partido.goles_local??'')
  const [vis,  setVis]  = useState<number|''>(partido.goles_visitante??'')
  const [est,  setEst]  = useState<'idle'|'saving'|'ok'|'err'>('idle')
  const t = useRef<ReturnType<typeof setTimeout>|null>(null)

  const tieneRes = partido.goles_local!==null&&partido.goles_visitante!==null
  const cambio   = loc!==(partido.goles_local??'')||vis!==(partido.goles_visitante??'')
  const esGrupos = partido.fase === 'Fase de Grupos'
  const localPH  = esPlaceholder(partido.equipo_local)
  const visitPH  = esPlaceholder(partido.equipo_visitante)
  const hayPH    = localPH || visitPH

  const save = async () => {
    if(loc===''||vis==='') return
    setEst('saving'); if(t.current) clearTimeout(t.current)
    const r = await guardarResultado(partido.id,Number(loc),Number(vis))
    setEst(r?.ok?'ok':'err')
    t.current = setTimeout(()=>setEst('idle'),3000)
  }

  return (
    <div className="card" style={{
      borderLeft: hayPH ? '3px solid rgba(255,77,0,0.4)' : tieneRes&&!cambio ? '3px solid var(--turf)' : '3px solid transparent',
      overflow: 'visible'
    }}>
      {/* Banner de aviso cuando hay placeholders */}
      {hayPH && (
        <div style={{
          padding: '8px 16px', background: 'rgba(255,77,0,0.08)',
          borderBottom: '1px solid rgba(255,77,0,0.15)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 12 }}>⚠️</span>
          <span style={{ fontSize: 11, color: 'var(--fire)', fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '0.06em' }}>
            EQUIPOS PENDIENTES · Asigna los clasificados antes de abrir pronósticos
          </span>
        </div>
      )}

      {/* Desktop */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'16px 20px' }} className="admin-desk">
        <div style={{ width:56, flexShrink:0, textAlign:'center' }}>
          <p style={{ fontSize:10, color:'var(--text-3)', fontWeight:600 }}>{partido.hora.slice(0,5)}</p>
          <p style={{ fontSize:9, color:'var(--text-3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:56 }}>
            {partido.grupo ?? partido.fase.split(' ')[0]}
          </p>
        </div>

        {/* Equipo local */}
        <div style={{ flex:1, display:'flex', alignItems:'center', gap:8, justifyContent:'flex-end', minWidth:0 }}>
          {!esGrupos && (localPH || true) ? (
            <AdminEquipoEditor
              partidoId={partido.id}
              campo="equipo_local"
              nombreActual={partido.equipo_local}
              codigoActual={partido.codigo_local}
              placeholder={partido.equipo_local}
            />
          ) : (
            <>
              <span style={{ fontSize:13, fontWeight:500, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', textAlign:'right' }}>
                {partido.equipo_local}
              </span>
              {partido.codigo_local&&<img src={flag(partido.codigo_local)} style={{ width:32,height:24,borderRadius:4,objectFit:'cover',flexShrink:0 }} alt="" onError={e=>{(e.target as HTMLImageElement).style.display='none'}} />}
            </>
          )}
        </div>

        {/* Marcador */}
        <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          <input type="number" min="0" max="20" value={loc}
            onChange={e=>setLoc(e.target.value===''?'':Math.max(0,Math.min(20,+e.target.value)))}
            className="score-box" placeholder="0" />
          <span style={{ color:'var(--text-3)', fontWeight:600, fontSize:16 }}>–</span>
          <input type="number" min="0" max="20" value={vis}
            onChange={e=>setVis(e.target.value===''?'':Math.max(0,Math.min(20,+e.target.value)))}
            className="score-box" placeholder="0" />
        </div>

        {/* Equipo visitante */}
        <div style={{ flex:1, display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
          {!esGrupos && (visitPH || true) ? (
            <AdminEquipoEditor
              partidoId={partido.id}
              campo="equipo_visitante"
              nombreActual={partido.equipo_visitante}
              codigoActual={partido.codigo_visitante}
              placeholder={partido.equipo_visitante}
            />
          ) : (
            <>
              {partido.codigo_visitante&&<img src={flag(partido.codigo_visitante)} style={{ width:32,height:24,borderRadius:4,objectFit:'cover',flexShrink:0 }} alt="" onError={e=>{(e.target as HTMLImageElement).style.display='none'}} />}
              <span style={{ fontSize:13, fontWeight:500, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {partido.equipo_visitante}
              </span>
            </>
          )}
        </div>

        <SaveBtn est={est} onSave={save} disabled={loc===''||vis===''} />
      </div>

      {/* Mobile */}
      <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:12 }} className="admin-mob">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          {/* Local mobile */}
          {!esGrupos ? (
            <AdminEquipoEditor
              partidoId={partido.id}
              campo="equipo_local"
              nombreActual={partido.equipo_local}
              codigoActual={partido.codigo_local}
              placeholder={partido.equipo_local}
            />
          ) : (
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              {partido.codigo_local&&<img src={flag(partido.codigo_local)} style={{ width:24,height:18,borderRadius:3,objectFit:'cover' }} alt="" onError={e=>{(e.target as HTMLImageElement).style.display='none'}} />}
              <span style={{ fontSize:13, fontWeight:500, color:'var(--text)' }}>{partido.equipo_local}</span>
            </div>
          )}

          <span style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, flexShrink:0, padding:'0 8px' }}>
            {partido.hora.slice(0,5)} · {partido.grupo ?? 'R'}
          </span>

          {/* Visitante mobile */}
          {!esGrupos ? (
            <AdminEquipoEditor
              partidoId={partido.id}
              campo="equipo_visitante"
              nombreActual={partido.equipo_visitante}
              codigoActual={partido.codigo_visitante}
              placeholder={partido.equipo_visitante}
            />
          ) : (
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:13, fontWeight:500, color:'var(--text)' }}>{partido.equipo_visitante}</span>
              {partido.codigo_visitante&&<img src={flag(partido.codigo_visitante)} style={{ width:24,height:18,borderRadius:3,objectFit:'cover' }} alt="" onError={e=>{(e.target as HTMLImageElement).style.display='none'}} />}
            </div>
          )}
        </div>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
          <input type="number" min="0" max="20" value={loc}
            onChange={e=>setLoc(e.target.value===''?'':Math.max(0,Math.min(20,+e.target.value)))}
            className="score-box" placeholder="0" />
          <span style={{ color:'var(--text-3)', fontWeight:600 }}>–</span>
          <input type="number" min="0" max="20" value={vis}
            onChange={e=>setVis(e.target.value===''?'':Math.max(0,Math.min(20,+e.target.value)))}
            className="score-box" placeholder="0" />
          <SaveBtn est={est} onSave={save} disabled={loc===''||vis===''} />
        </div>
      </div>

      <style>{`
        @media (min-width: 640px) { .admin-desk { display: flex !important; } .admin-mob { display: none !important; } }
        @media (max-width: 639px) { .admin-desk { display: none !important; } .admin-mob { display: flex !important; } }
      `}</style>
    </div>
  )
}

function SaveBtn({ est, onSave, disabled }: { est:string; onSave:()=>void; disabled:boolean }) {
  return (
    <button onClick={onSave} disabled={est==='saving'||disabled}
      className={`btn ${est==='ok'?'btn-outline':est==='err'?'btn-danger':'btn-lime'}`}
      style={{
        fontSize:12, padding:'10px 16px', minWidth:90, flexShrink:0,
        ...(est==='ok'?{borderColor:'rgba(190,255,0,0.3)',color:'var(--turf)'}:{}),
        ...(est==='idle'?{background:'var(--gold)',borderColor:'var(--gold)',color:'var(--ink)'}:{}),
      }}>
      {est==='saving'
        ? <span style={{ width:12,height:12,border:'2px solid rgba(0,0,0,0.2)',borderTopColor:'#000',borderRadius:'50%',display:'block' }} className="anim-spin" />
        : est==='ok' ? '✓ LISTO'
        : est==='err' ? '✗ ERROR'
        : 'GUARDAR'}
    </button>
  )
}
