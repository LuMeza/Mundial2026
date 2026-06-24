import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import Nav from '@/app/components/Nav'
import PodioCard from './PodioCard'
import RankingBg from './RankingBg'
import RankingFila from './RankingFila'

export default async function RankingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  // Paginación para superar límite de 1000 filas de Supabase
  const fetchAllPronos = async () => {
    const pageSize = 1000
    let all: { usuario_id: string; puntos: number | null }[] = []
    let from = 0
    while (true) {
      const { data, error } = await service
        .from('pronosticos').select('usuario_id,puntos').range(from, from + pageSize - 1)
      if (error || !data || data.length === 0) break
      all = all.concat(data)
      if (data.length < pageSize) break
      from += pageSize
    }
    return all
  }

  const [pronos, { data: perfiles }, { data: perfil }] = await Promise.all([
    fetchAllPronos(),
    service.from('perfiles').select('id,nombre,avatar_url,es_admin'),
    supabase.from('perfiles').select('nombre,es_admin,avatar_url').eq('id', user.id).single(),
  ])

  const pMap: Record<string, { nombre: string; avatar: string | null; esAdmin: boolean }> = {}
  perfiles?.forEach(p => { pMap[p.id] = { nombre: p.nombre ?? 'Usuario', avatar: p.avatar_url, esAdmin: p.es_admin ?? false } })

  const res: Record<string, { uid: string; nombre: string; avatar: string | null; total: number; exactos: number; ganadores: number; totalPronos: number }> = {}
  pronos.forEach(p => {
    const uid = p.usuario_id
    const pm = pMap[uid]
    if (!pm || pm.esAdmin) return
    if (!res[uid]) res[uid] = { uid, nombre: pm.nombre, avatar: pm.avatar, total: 0, exactos: 0, ganadores: 0, totalPronos: 0 }
    res[uid].totalPronos++
    if (p.puntos !== null && p.puntos !== undefined) {
      res[uid].total += p.puntos
      if (p.puntos === 3) res[uid].exactos++
      if (p.puntos === 1) res[uid].ganadores++
    }
  })

  const tabla = Object.values(res)
    .filter(j => j.totalPronos > 0)
    .sort((a, b) => b.total !== a.total ? b.total - a.total : b.exactos !== a.exactos ? b.exactos - a.exactos : b.ganadores - a.ganadores)

  const sinPronos = perfiles?.filter(p => !p.es_admin && !res[p.id]).map(p => p.nombre) ?? []

  const nombre = perfil?.nombre ?? pMap[user.id]?.nombre ?? 'U'
  const M = ['🥇', '🥈', '🥉']

  const podio = [
    tabla[1] ? { j: tabla[1], mi: 1 } : null,
    tabla[0] ? { j: tabla[0], mi: 0 } : null,
    tabla[2] ? { j: tabla[2], mi: 2 } : null,
  ]

  const miPosicion = tabla.findIndex(j => j.uid === user.id) + 1
  const miData = tabla.find(j => j.uid === user.id)
  const lidPts = tabla[0]?.total ?? 0

  // Estadísticas generales para el header
  const totalPronos = tabla.reduce((s, j) => s + j.totalPronos, 0)
  const totalExactos = tabla.reduce((s, j) => s + j.exactos, 0)

  return (
    <div className="page">
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, var(--turf), var(--fire) 50%, var(--turf))', backgroundSize: '200% 100%', animation: 'fire-sweep 4s linear infinite', zIndex: 200 }} />
      <Nav nombre={nombre} avatarUrl={perfil?.avatar_url} esAdmin={perfil?.es_admin} pagina="/ranking" />
      <RankingBg />

      <main className="wrap" style={{ paddingTop: 40, paddingBottom: 80, display: 'flex', flexDirection: 'column', gap: 28, position: 'relative', zIndex: 1 }}>

        {/* Aviso admin: sin pronósticos */}
        {perfil?.es_admin && sinPronos.length > 0 && (
          <div style={{ background: 'rgba(255,77,0,0.08)', border: '1px solid rgba(255,77,0,0.25)', borderRadius: 8, padding: '10px 16px' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--fire)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>
              ⚠️ SIN PRONÓSTICOS: {sinPronos.join(' · ')}
            </p>
          </div>
        )}

        {/* ── HEADER ── */}
        <div className="anim-up">
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--fire)', marginBottom: 10 }}>
            Mundial 2026 · Fase de Grupos
          </p>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(56px,10vw,104px)', lineHeight: 0.87, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.01em', margin: 0 }}>
              TABLA<br /><span style={{ color: 'var(--fire)' }}>GENERAL</span>
            </h1>

            {/* Meta boxes */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div className="rk-meta-box">
                <span className="rk-meta-val">{tabla.length}</span>
                <span className="rk-meta-lbl">Participantes</span>
              </div>
              {miPosicion > 0 && (
                <div className="rk-meta-box rk-meta-fire-box">
                  <span className="rk-meta-val" style={{ color: 'var(--fire)' }}>#{miPosicion}</span>
                  <span className="rk-meta-lbl">Tu posición</span>
                </div>
              )}
              {miData && lidPts > 0 && miPosicion > 1 && (
                <div className="rk-meta-box">
                  <span className="rk-meta-val" style={{ color: 'var(--red-hot)' }}>−{lidPts - miData.total}</span>
                  <span className="rk-meta-lbl">Del líder</span>
                </div>
              )}
            </div>
          </div>

          {/* Ticker */}
          <div style={{ overflow: 'hidden', background: 'var(--ink-3)', border: '1px solid var(--stroke)', borderRadius: 6, height: 30, display: 'flex', alignItems: 'center', marginTop: 20 }}>
            <div style={{ display: 'flex', whiteSpace: 'nowrap', animation: 'rk-scroll 30s linear infinite' }}>
              {Array.from({ length: 6 }, (_, i) => (
                <span key={i} style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', padding: '0 6px' }}>
                  ⚽ QUINIELA MX 2026 &nbsp;·&nbsp; MUNDIAL NORTEAMÉRICA &nbsp;·&nbsp; RANKING EN VIVO &nbsp;·&nbsp;
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── PODIO ── */}
        {tabla.length >= 1 && (
          <section className="anim-in d1">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--stroke)' }} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: 'var(--text-3)', textTransform: 'uppercase' }}>PODIO</span>
              <div style={{ flex: 1, height: 1, background: 'var(--stroke)' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, alignItems: 'flex-end' }}>
              {podio.map((slot, pos) => {
                if (!slot) return <div key={`e-${pos}`} />
                return (
                  <div key={slot.j.uid} style={{ display: 'flex', flexDirection: 'column' }}>
                    <PodioCard j={slot.j} mi={slot.mi} esYo={slot.j.uid === user.id} medallas={M} />
                    {/* Pedestal */}
                    <div style={{
                      height: slot.mi === 0 ? 52 : slot.mi === 1 ? 36 : 20,
                      background: slot.mi === 0
                        ? 'linear-gradient(180deg, rgba(255,214,10,0.2), rgba(255,214,10,0.03))'
                        : slot.mi === 1
                          ? 'linear-gradient(180deg, rgba(192,192,192,0.12), rgba(192,192,192,0.02))'
                          : 'linear-gradient(180deg, rgba(205,127,50,0.12), rgba(205,127,50,0.02))',
                      borderTop: slot.mi === 0
                        ? '2px solid rgba(255,214,10,0.35)'
                        : slot.mi === 1
                          ? '2px solid rgba(192,192,192,0.2)'
                          : '2px solid rgba(205,127,50,0.2)',
                      borderRadius: '0 0 4px 4px',
                    }} />
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── TABLA COMPLETA ── */}
        <section className="anim-in d2" style={{ background: 'var(--ink-2)', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--stroke)' }}>

          {/* Header de la tabla */}
          <div>
            <div style={{ height: 3, background: 'linear-gradient(90deg, var(--fire), var(--gold) 40%, var(--turf))' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'var(--ink-3)', borderBottom: '1px solid var(--stroke-2)' }}>
              <span className="rk-th" style={{ width: 40, flexShrink: 0, textAlign: 'center' }}>#</span>
              <span className="rk-th" style={{ width: 36, flexShrink: 0 }} />
              <span className="rk-th" style={{ flex: 1 }}>Jugador</span>
              <span className="rk-th rk-th-hide" style={{ width: 52, textAlign: 'right' }}>⭐ Exact.</span>
              <span className="rk-th rk-th-hide" style={{ width: 52, textAlign: 'right' }}>✓ Gan.</span>
              <span className="rk-th" style={{ width: 60, textAlign: 'right' }}>Puntos</span>
            </div>
          </div>

          {/* Filas */}
          {tabla.length === 0 ? (
            <div style={{ padding: '60px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--text-3)' }}>AÚN NO HAY PRONÓSTICOS</p>
            </div>
          ) : tabla.map((j, i) => (
            <RankingFila
              key={j.uid}
              j={j}
              pos={i}
              esYo={j.uid === user.id}
              lidPts={lidPts}
              medallas={M}
            />
          ))}
        </section>

        {/* ── SISTEMA DE PUNTOS ── */}
        <div className="anim-in d3" style={{ background: 'var(--ink-2)', border: '1px solid var(--stroke)', borderRadius: 12, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', flexShrink: 0 }}>
            Sistema de puntos
          </span>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {[
              { v: '3', l: 'Marcador exacto', c: 'var(--gold)' },
              { v: '1', l: 'Ganador correcto', c: 'var(--turf)' },
              { v: '0', l: 'Resultado incorrecto', c: 'var(--text-3)' },
            ].map(({ v, l, c }, idx) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {idx > 0 && <div style={{ width: 1, height: 28, background: 'var(--stroke)' }} />}
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: c, lineHeight: 1 }}>{v}</span>
                <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-body)', lineHeight: 1.3 }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

      </main>

      <style>{`
        .rk-meta-box { background: var(--ink-2); border: 1px solid var(--stroke); border-radius: 10px; padding: 12px 18px; text-align: center; min-width: 72px; }
        .rk-meta-fire-box { border-color: var(--stroke-fire); background: var(--fire-glow); }
        .rk-meta-val { display: block; font-family: var(--font-display); font-size: 26px; font-weight: 900; color: var(--text); line-height: 1; }
        .rk-meta-lbl { display: block; font-family: var(--font-display); font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-3); margin-top: 4px; }
        .rk-th { font-family: var(--font-display); font-size: 9px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-3); }
        @keyframes rk-scroll { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @media (max-width: 640px) { .rk-th-hide { display: none !important; } }
      `}</style>
    </div>
  )
}
