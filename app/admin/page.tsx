import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminPartidoCard from './AdminPartidoCard'
import AdminFaseControl from './AdminFaseControl'
import LogoutButton from '@/app/quiniela/LogoutButton'

const ORDEN_FASES = [
  'Fase de Grupos',
  'Ronda de 32',
  'Octavos de final',
  'Cuartos de final',
  'Semifinales',
  'Tercer Puesto',
  'Final',
]

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase.from('perfiles').select('es_admin,nombre').eq('id', user.id).single()
  if (!perfil?.es_admin) redirect('/quiniela')

  // Todos los partidos — no solo grupos
  const { data: partidos } = await supabase
    .from('partidos')
    .select('*')
    .order('fecha', { ascending: true })
    .order('hora', { ascending: true })

  const fmt = (f: string) => new Date(f + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })

  // Agrupar por fase
  const porFase: Record<string, typeof partidos> = {}
  partidos?.forEach(p => {
    if (!porFase[p.fase]) porFase[p.fase] = []
    porFase[p.fase]!.push(p)
  })

  // Stats globales
  const total  = partidos?.length ?? 0
  const listos = partidos?.filter(p => p.goles_local !== null && p.goles_visitante !== null).length ?? 0
  const abiertas = [...new Set(partidos?.filter(p => p.fase_abierta).map(p => p.fase) ?? [])].length

  // Info por fase para el control panel
  const fasesInfo = ORDEN_FASES.map(fase => {
    const ps = porFase[fase] ?? []
    const abierta = ps.some(p => p.fase_abierta)
    const conResultado = ps.filter(p => p.goles_local !== null).length
    const cierre = ps.find(p => p.cierre_pronosticos)?.cierre_pronosticos ?? null
    return { fase, total: ps.length, abierta, conResultado, cierre }
  }).filter(f => f.total > 0)

  // Fases ordenadas con partidos
  const fasesOrdenadas = ORDEN_FASES.filter(f => porFase[f]?.length)

  return (
    <div className="page">
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, var(--gold), var(--fire))', zIndex: 200 }} />

      <nav className="site-nav" style={{ borderBottomColor: 'rgba(255,214,10,0.15)' }}>
        <div className="wrap" style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <a href="/quiniela" className="btn btn-outline" style={{ fontSize: 12, padding: '7px 14px' }}>← Salir</a>
            <div style={{ width: 1, height: 20, background: 'var(--stroke)' }} />
            <span className="f-display" style={{ fontSize: 18, color: 'var(--gold)', letterSpacing: '0.06em' }}>PANEL ADMIN</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <a href="/admin/usuarios" className="btn btn-outline" style={{ fontSize: 12, padding: '7px 14px', borderColor: 'rgba(255,214,10,0.25)', color: 'var(--gold)' }}>Usuarios</a>
            <LogoutButton />
          </div>
        </div>
      </nav>

      <main className="wrap" style={{ paddingTop: 32, paddingBottom: 80 }}>

        {/* Header */}
        <div className="anim-up" style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8, fontFamily: 'var(--font-display)' }}>
            ▸ PANEL DE CONTROL
          </p>
          <h1 className="f-display" style={{ fontSize: 'clamp(40px,7vw,72px)', color: 'var(--text)', lineHeight: 0.9 }}>ADMIN</h1>
        </div>

        {/* Stats globales */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 32 }}>
          {[
            { v: `${listos}/${total}`, l: 'Resultados cargados', c: 'var(--text)',  bar: total > 0 ? (listos / total) * 100 : 0, barC: 'var(--gold)' },
            { v: abiertas,             l: 'Fases abiertas',       c: 'var(--turf)', bar: null, barC: '' },
            { v: total - listos,       l: 'Partidos pendientes',  c: 'var(--fire)', bar: null, barC: '' },
          ].map(({ v, l, c, bar, barC }) => (
            <div key={l} className="card" style={{ padding: 20 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'var(--font-display)' }}>{l}</p>
              <p className="f-display" style={{ fontSize: 36, color: c, lineHeight: 1 }}>{v}</p>
              {bar !== null && (
                <div className="prog-track" style={{ marginTop: 12 }}>
                  <div className="prog-fill" style={{ width: `${bar}%`, background: barC }} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── CONTROL DE FASES ── */}
        <div className="card anim-in d1" style={{ marginBottom: 32, overflow: 'visible' }}>
          <div style={{ height: 3, background: 'linear-gradient(90deg, var(--gold), var(--fire))', borderRadius: '12px 12px 0 0' }} />
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--stroke-2)' }}>
            <p className="f-display" style={{ fontSize: 18, color: 'var(--gold)', letterSpacing: '0.06em' }}>CONTROL DE FASES</p>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4, fontFamily: 'var(--font-body)' }}>
              Abre cada fase cuando se sepan los clasificados. Los usuarios verán los partidos automáticamente.
            </p>
          </div>
          <AdminFaseControl fasesInfo={fasesInfo} />
        </div>

        {/* ── PARTIDOS POR FASE ── */}
        {fasesOrdenadas.map(fase => {
          const ps = porFase[fase] ?? []
          const estaAbierta = ps.some(p => p.fase_abierta)
          const conRes = ps.filter(p => p.goles_local !== null).length
          const porFechaLocal: Record<string, typeof ps> = {}
          ps.forEach(p => { if (!porFechaLocal[p.fecha]) porFechaLocal[p.fecha] = []; porFechaLocal[p.fecha]!.push(p) })

          return (
            <div key={fase} className="anim-in" style={{ marginBottom: 32 }}>
              {/* Fase header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1, height: 1, background: 'var(--stroke)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="f-display" style={{ fontSize: 14, letterSpacing: '0.12em', color: estaAbierta ? 'var(--turf)' : 'var(--text-3)', textTransform: 'uppercase' }}>
                    {fase}
                  </span>
                  <span className={`pill ${estaAbierta ? 'pill-lime' : 'pill-muted'}`} style={{ fontSize: 9 }}>
                    {estaAbierta ? '✓ ABIERTA' : 'CERRADA'}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}>
                    {conRes}/{ps.length}
                  </span>
                </div>
                <div style={{ flex: 1, height: 1, background: 'var(--stroke)' }} />
              </div>

              {/* Partidos */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {Object.entries(porFechaLocal).map(([fecha, fechaPs]) => (
                  <div key={fecha}>
                    <div className="sep" style={{ marginBottom: 12 }}>{fmt(fecha).toUpperCase()}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {fechaPs?.map(p => <AdminPartidoCard key={p.id} partido={p} />)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </main>
    </div>
  )
}
