import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const FASE_ORDER = ['Fase de Grupos','Ronda de 32','Octavos de final','Cuartos de final','Semifinales','Tercer Puesto','Final']
const FASE_ICON: Record<string,string> = {
  'Fase de Grupos':'⚽','Ronda de 32':'🎯','Octavos de final':'⚡',
  'Cuartos de final':'🔥','Semifinales':'⭐','Tercer Puesto':'🥉','Final':'🏆',
}

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('nombre')
    .eq('id', user.id)
    .single()

  const { data: partidos } = await supabase
    .from('partidos')
    .select('*')
    .eq('fase_abierta', true)
    .order('fecha', { ascending: true })
    .order('hora', { ascending: true })

  const { data: pronos } = await supabase
    .from('pronosticos')
    .select('*')
    .eq('usuario_id', user.id)

  const pronoMap: Record<number, { goles_local: number; goles_visitante: number; puntos: number | null }> = {}
  pronos?.forEach(p => {
    pronoMap[p.partido_id] = {
      goles_local: p.goles_local,
      goles_visitante: p.goles_visitante,
      puntos: p.puntos ?? null
    }
  })

  const todosPartidos = partidos ?? []
  const nombre = perfil?.nombre ?? 'Jugador'
  const ahora = new Date().toLocaleDateString('es-MX', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  const fmtF = (f: string) =>
    new Date(f + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })

  // Agrupar por fase, solo fases con al menos 1 pronóstico
  const faseMap: Record<string, typeof todosPartidos> = {}
  todosPartidos.forEach(p => {
    const f = p.fase ?? 'Otros'
    if (!faseMap[f]) faseMap[f] = []
    faseMap[f].push(p)
  })
  const fasesConProno = FASE_ORDER
    .filter(f => faseMap[f]?.some(p => pronoMap[p.id] !== undefined))

  // Stats globales
  const todosConProno = todosPartidos.filter(p => pronoMap[p.id] !== undefined)
  const conPuntosG = todosConProno.filter(p => pronoMap[p.id]?.puntos !== null && pronoMap[p.id]?.puntos !== undefined)
  const puntosTotal = conPuntosG.reduce((s, p) => s + (pronoMap[p.id]?.puntos ?? 0), 0)
  const exactos = conPuntosG.filter(p => pronoMap[p.id]?.puntos === 3).length
  const acertados = conPuntosG.filter(p => pronoMap[p.id]?.puntos === 1).length

  const buildFilas = (ps: typeof todosPartidos) => ps
    .filter(p => pronoMap[p.id] !== undefined)
    .map(p => {
      const pr = pronoMap[p.id]
      const tieneRes = p.goles_local !== null
      const puntos = pr?.puntos ?? null
      let color = '#888'
      if (pr) {
        color = tieneRes
          ? (puntos === 3 ? '#FFD60A' : puntos === 1 ? '#00D46A' : '#FF3B30')
          : '#00D46A'
      }
      return {
        fecha: fmtF(p.fecha),
        local: p.equipo_local,
        visitante: p.equipo_visitante,
        grupo: p.grupo,
        resultado: tieneRes ? `${p.goles_local}–${p.goles_visitante}` : null,
        prono: pr ? `${pr.goles_local}–${pr.goles_visitante}` : '–',
        puntos,
        color,
      }
    })

  const conProno = todosConProno.length

  const faseSections = fasesConProno.map(fase => {
    const ps = faseMap[fase] ?? []
    const filas = buildFilas(ps)
    const icon = FASE_ICON[fase] ?? '⚽'
    const faseExactos = filas.filter(f => f.puntos === 3).length
    const faseAcertados = filas.filter(f => f.puntos === 1).length
    const fasePuntos = filas.filter(f => f.puntos !== null && f.puntos !== undefined).reduce((s, f) => s + (f.puntos ?? 0), 0)

    const rows = filas.map(f => {
      const cls = f.puntos === 3 ? 'row-exacto' : f.puntos === 1 ? 'row-acertado' : f.puntos === 0 ? 'row-fallo' : ''
      const badgeBg = f.puntos === 3 ? 'rgba(255,214,10,0.12)' : f.puntos === 1 ? 'rgba(0,212,106,0.1)' : f.puntos === 0 ? 'rgba(255,59,48,0.08)' : 'rgba(255,255,255,0.05)'
      const badgeBorder = f.puntos === 3 ? 'rgba(255,214,10,0.3)' : f.puntos === 1 ? 'rgba(0,212,106,0.25)' : f.puntos === 0 ? 'rgba(255,59,48,0.2)' : 'rgba(255,255,255,0.1)'
      const ptsLabel = f.puntos === 3 ? '+3 ⭐' : f.puntos === 1 ? '+1 ✓' : f.puntos === 0 ? '0 ✗' : '—'
      return `<tr class="${cls}">
        <td class="td-fecha">${f.fecha}${f.grupo ? `<br/><span style="color:#FF4D00;font-size:9px">GRP ${f.grupo}</span>` : ''}</td>
        <td class="td-partido">
          <span style="font-weight:700">${f.local}</span>
          <span style="color:rgba(240,244,248,0.35);margin:0 6px;font-family:'Barlow Condensed',Impact,sans-serif;font-weight:800">vs</span>
          <span style="font-weight:700">${f.visitante}</span>
        </td>
        <td style="text-align:center">
          ${f.resultado
            ? `<span class="resultado-pill">${f.resultado}</span>`
            : `<span style="color:rgba(240,244,248,0.2);font-size:10px;font-family:'Barlow Condensed',Impact,sans-serif;font-weight:700">PEND.</span>`
          }
        </td>
        <td style="text-align:center">
          <span class="prono-val" style="color:${f.color}">${f.prono}</span>
        </td>
        <td style="text-align:center">
          <span class="pts-badge" style="background:${badgeBg};border:1px solid ${badgeBorder};color:${f.color}">${ptsLabel}</span>
        </td>
      </tr>`
    }).join('')

    return `
    <div class="fase-block">
      <div class="fase-header">
        <div class="fase-title">${icon} ${fase.toUpperCase()}</div>
        <div class="fase-stats">
          <span style="color:#FFD60A">⭐ ${faseExactos}</span>
          <span style="color:#00D46A">✓ ${faseAcertados}</span>
          <span style="color:#FF4D00;font-weight:900">${fasePuntos} pts</span>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width:80px">Fecha</th>
            <th>Partido</th>
            <th style="text-align:center;width:72px">Result.</th>
            <th style="text-align:center;width:90px">Mi Pronóstico</th>
            <th style="text-align:center;width:56px">Pts</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`
  }).join('')

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Quiniela MX 2026 · ${nombre}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;700;800;900&family=Barlow:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Barlow', system-ui, sans-serif;
    background: #080B0F;
    color: #F0F4F8;
    padding: 28px 32px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .header {
    display: flex; align-items: flex-start; justify-content: space-between;
    margin-bottom: 20px; padding-bottom: 16px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .logo { font-family: 'Barlow Condensed', Impact, sans-serif; font-size: 26px; font-weight: 900; letter-spacing: 0.04em; color: #FF4D00; }
  .logo-sub { font-family: 'Barlow Condensed', Impact, sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 0.15em; color: rgba(240,244,248,0.4); text-transform: uppercase; margin-top: 3px; }
  .badge-voucher { background: rgba(255,77,0,0.12); border: 1px solid rgba(255,77,0,0.3); border-radius: 6px; padding: 5px 12px; font-family: 'Barlow Condensed', Impact, sans-serif; font-size: 11px; font-weight: 800; letter-spacing: 0.12em; color: #FF4D00; text-transform: uppercase; }
  .jugador-section {
    display: flex; align-items: center; justify-content: space-between;
    background: #0F1318; border: 1px solid rgba(255,255,255,0.06);
    border-radius: 10px; padding: 14px 20px; margin-bottom: 16px;
  }
  .jugador-nombre { font-family: 'Barlow Condensed', Impact, sans-serif; font-size: 30px; font-weight: 900; letter-spacing: 0.04em; color: #F0F4F8; }
  .jugador-sub { font-family: 'Barlow Condensed', Impact, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; color: rgba(240,244,248,0.35); text-transform: uppercase; margin-top: 3px; }
  .stats-row { display: flex; gap: 8px; margin-bottom: 20px; }
  .stat-box { flex: 1; background: #0F1318; border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 10px 12px; text-align: center; }
  .stat-val { font-family: 'Barlow Condensed', Impact, sans-serif; font-size: 26px; font-weight: 900; line-height: 1; }
  .stat-lbl { font-family: 'Barlow Condensed', Impact, sans-serif; font-size: 8px; font-weight: 700; letter-spacing: 0.12em; color: rgba(240,244,248,0.4); text-transform: uppercase; margin-top: 3px; }
  .fase-block { margin-bottom: 20px; }
  .fase-header {
    display: flex; align-items: center; justify-content: space-between;
    background: #161C24; border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px 8px 0 0; padding: 10px 14px;
    border-bottom: 2px solid rgba(255,77,0,0.4);
  }
  .fase-title { font-family: 'Barlow Condensed', Impact, sans-serif; font-size: 15px; font-weight: 900; letter-spacing: 0.08em; color: #F0F4F8; }
  .fase-stats { display: flex; gap: 14px; font-family: 'Barlow Condensed', Impact, sans-serif; font-size: 12px; font-weight: 800; letter-spacing: 0.06em; }
  table { width: 100%; border-collapse: collapse; background: #0F1318; border: 1px solid rgba(255,255,255,0.06); border-top: none; border-radius: 0 0 8px 8px; overflow: hidden; }
  thead tr { background: #0F1318; border-bottom: 1px solid rgba(255,255,255,0.06); }
  th { font-family: 'Barlow Condensed', Impact, sans-serif; font-size: 8px; font-weight: 700; letter-spacing: 0.15em; color: rgba(240,244,248,0.35); text-transform: uppercase; padding: 8px 12px; text-align: left; }
  td { font-family: 'Barlow', system-ui, sans-serif; font-size: 11px; color: #F0F4F8; padding: 9px 12px; border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  .td-fecha { color: rgba(240,244,248,0.45); font-size: 9px; font-family: 'Barlow Condensed', Impact, sans-serif; font-weight: 700; letter-spacing: 0.04em; text-transform: capitalize; white-space: nowrap; }
  .td-partido { font-weight: 600; font-size: 11px; }
  .resultado-pill { display: inline-block; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; padding: 1px 6px; font-family: 'Barlow Condensed', Impact, sans-serif; font-size: 11px; font-weight: 800; color: rgba(240,244,248,0.6); }
  .prono-val { font-family: 'Barlow Condensed', Impact, sans-serif; font-size: 16px; font-weight: 900; letter-spacing: 0.02em; }
  .pts-badge { display: inline-block; border-radius: 4px; padding: 1px 6px; font-family: 'Barlow Condensed', Impact, sans-serif; font-size: 10px; font-weight: 800; letter-spacing: 0.06em; }
  .row-exacto td { background: rgba(255,214,10,0.04); border-left: 3px solid rgba(255,214,10,0.4); }
  .row-acertado td { background: rgba(0,212,106,0.03); border-left: 3px solid rgba(0,212,106,0.3); }
  .row-fallo td { background: rgba(255,59,48,0.03); border-left: 3px solid rgba(255,59,48,0.2); }
  .footer { margin-top: 20px; text-align: center; font-family: 'Barlow Condensed', Impact, sans-serif; font-size: 9px; font-weight: 700; letter-spacing: 0.12em; color: rgba(240,244,248,0.2); text-transform: uppercase; }
  .footer span { color: #FF4D00; }
  @page {
    margin: 0;
    background: #080B0F;
  }
  @media print {
    html, body { background: #080B0F !important; margin: 0 !important; padding: 20px !important; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .fase-block { page-break-inside: avoid; }
  }
</style>
</head>
<body>

<div class="header">
  <div>
    <div class="logo">⚽ QUINIELA MX 2026</div>
    <div class="logo-sub">Comprobante oficial de pronósticos</div>
  </div>
  <div class="badge-voucher">🎟 VOUCHER</div>
</div>

<div class="jugador-section">
  <div>
    <div class="jugador-nombre">${nombre}</div>
    <div class="jugador-sub">Pronósticos · Mundial 2026</div>
  </div>
  <div style="text-align:right;">
    <div style="font-family:'Barlow Condensed',Impact,sans-serif;font-size:9px;font-weight:700;letter-spacing:0.1em;color:rgba(240,244,248,0.3);text-transform:uppercase;">Generado</div>
    <div style="font-size:10px;color:rgba(240,244,248,0.5);margin-top:2px;">${ahora}</div>
  </div>
</div>

<div class="stats-row">
  <div class="stat-box">
    <div class="stat-val" style="color:#FF4D00">${conProno}</div>
    <div class="stat-lbl">Pronósticos</div>
  </div>
  <div class="stat-box">
    <div class="stat-val" style="color:#FFD60A">${exactos}</div>
    <div class="stat-lbl">⭐ Exactos</div>
  </div>
  <div class="stat-box">
    <div class="stat-val" style="color:#00D46A">${acertados}</div>
    <div class="stat-lbl">✓ Acertados</div>
  </div>
  <div class="stat-box">
    <div class="stat-val" style="color:#FF4D00">${puntosTotal}</div>
    <div class="stat-lbl">Pts Totales</div>
  </div>
</div>

${faseSections}

<div class="footer">
  Quiniela MX 2026 · <span>⚽</span> · Comprobante oficial de pronósticos de ${nombre}
</div>

<script>
  window.onload = function() {
    setTimeout(function() { window.print(); }, 800);
  };
</script>

</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    }
  })
}
