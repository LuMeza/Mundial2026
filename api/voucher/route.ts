import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const url = new URL(req.url)
  const faseParam = url.searchParams.get('fase') ?? null
  const grupo = url.searchParams.get('grupo') ?? null

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('nombre')
    .eq('id', user.id)
    .single()

  // Solo partidos de la fase activa (fase_abierta=true)
  const { data: todosPartidos } = await supabase
    .from('partidos')
    .select('*')
    .eq('fase_abierta', true)
    .order('fecha', { ascending: true })
    .order('hora', { ascending: true })

  // Determinar la fase a mostrar
  const fasesAbiertas = [...new Set((todosPartidos ?? []).map(p => p.fase).filter(Boolean))]
  const fase = faseParam && fasesAbiertas.includes(faseParam) ? faseParam : fasesAbiertas[0] ?? 'Fase de Grupos'

  // Solo partidos de ESA fase
  const partidosFase = (todosPartidos ?? []).filter(p => p.fase === fase)
  const partidosMostrados = grupo
    ? partidosFase.filter(p => p.grupo === grupo)
    : partidosFase

  // Solo pronósticos de los partidos de esta fase (no de fases anteriores)
  const idsPartidos = partidosMostrados.map(p => p.id)
  const { data: pronos } = await supabase
    .from('pronosticos')
    .select('*')
    .eq('usuario_id', user.id)
    .in('partido_id', idsPartidos.length > 0 ? idsPartidos : [-1])

  const pronoMap: Record<number, { goles_local: number; goles_visitante: number; puntos: number | null }> = {}
  pronos?.forEach(p => {
    pronoMap[p.partido_id] = {
      goles_local: p.goles_local,
      goles_visitante: p.goles_visitante,
      puntos: p.puntos ?? null,
    }
  })

  const nombre = perfil?.nombre ?? 'Jugador'
  const ahora = new Date().toLocaleString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
    timeZone: 'America/Mexico_City',
  })

  const conProno = partidosMostrados.filter(p => pronoMap[p.id]).length
  const conPuntos = partidosMostrados.filter(p => pronoMap[p.id]?.puntos !== null && pronoMap[p.id]?.puntos !== undefined)
  const puntosTotal = conPuntos.reduce((s, p) => s + (pronoMap[p.id]?.puntos ?? 0), 0)
  const exactos = conPuntos.filter(p => pronoMap[p.id]?.puntos === 3).length
  const acertados = conPuntos.filter(p => pronoMap[p.id]?.puntos === 1).length
  const fallos = conPuntos.filter(p => pronoMap[p.id]?.puntos === 0).length
  const pendientes = conProno - conPuntos.length

  const fmtFecha = (f: string) =>
    new Date(f + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })
  const fmtHora = (h: string) => h.slice(0, 5)

  const filas = partidosMostrados.map(p => {
    const pr = pronoMap[p.id]
    const tieneRes = p.goles_local !== null && p.goles_local !== undefined
    const puntos = pr?.puntos ?? null
    const pronoText = pr ? `${pr.goles_local} – ${pr.goles_visitante}` : null
    const resText = tieneRes ? `${p.goles_local} – ${p.goles_visitante}` : null

    let rowClass = ''
    let accentColor = '#555'
    if (pr) {
      if (tieneRes) {
        rowClass = puntos === 3 ? 'exacto' : puntos === 1 ? 'acertado' : 'fallo'
        accentColor = puntos === 3 ? '#FFD60A' : puntos === 1 ? '#00D46A' : '#FF3B30'
      } else {
        rowClass = 'pendiente'
        accentColor = '#FF4D00'
      }
    } else {
      rowClass = 'sinprono'
    }

    return { ...p, pr, tieneRes, puntos, pronoText, resText, rowClass, accentColor,
      fecha: fmtFecha(p.fecha), hora: fmtHora(p.hora) }
  })

  // Agrupar por fecha para el diseño
  const porFecha: Record<string, typeof filas> = {}
  filas.forEach(f => {
    if (!porFecha[f.fecha]) porFecha[f.fecha] = []
    porFecha[f.fecha].push(f)
  })

  const tituloFase = grupo ? `${fase} · Grupo ${grupo}` : fase
  const folio = String(user.id).slice(0, 8).toUpperCase()

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Voucher · ${nombre} · Quiniela MX 2026</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,800;0,900;1,700&family=Barlow:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink:    #080B0F;
    --ink-2:  #0F1318;
    --ink-3:  #161C24;
    --fire:   #FF4D00;
    --turf:   #00D46A;
    --gold:   #FFD60A;
    --red:    #FF3B30;
    --text:   #F0F4F8;
    --text-2: rgba(240,244,248,0.55);
    --text-3: rgba(240,244,248,0.28);
    --stroke: rgba(255,255,255,0.07);
    --fd: 'Barlow Condensed', Impact, sans-serif;
  }

  html { font-size: 14px; }

  body {
    font-family: 'Barlow', system-ui, sans-serif;
    background: #0a0d12;
    color: var(--text);
    padding: 24px 20px 40px;
    max-width: 700px;
    margin: 0 auto;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ── TICKET WRAPPER ── */
  .ticket {
    background: var(--ink-2);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04);
    position: relative;
  }

  /* Top accent bar */
  .ticket-bar {
    height: 4px;
    background: linear-gradient(90deg, var(--fire) 0%, #FF7A30 40%, var(--gold) 70%, var(--turf) 100%);
  }

  /* ── HEADER ── */
  .ticket-header {
    padding: 20px 24px 16px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    border-bottom: 1px solid var(--stroke);
    position: relative;
  }

  .brand-name {
    font-family: 'Barlow Condensed', Impact, sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.18em;
    color: var(--text-3);
    text-transform: uppercase;
    margin-bottom: 4px;
  }

  .event-title {
    font-family: 'Barlow Condensed', Impact, sans-serif;
    font-size: 28px;
    font-weight: 900;
    color: var(--text);
    letter-spacing: 0.03em;
    line-height: 0.95;
  }

  .event-title span { color: var(--fire); }

  .event-sub {
    font-family: 'Barlow Condensed', Impact, sans-serif;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: var(--text-3);
    text-transform: uppercase;
    margin-top: 6px;
  }

  .fase-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(255,77,0,0.1);
    border: 1px solid rgba(255,77,0,0.25);
    border-radius: 6px;
    padding: 6px 12px;
    font-family: 'Barlow Condensed', Impact, sans-serif;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.1em;
    color: var(--fire);
    text-transform: uppercase;
    white-space: nowrap;
    flex-shrink: 0;
  }

  /* ── JUGADOR STRIP ── */
  .jugador-strip {
    background: linear-gradient(135deg, rgba(255,77,0,0.08) 0%, rgba(255,214,10,0.04) 100%);
    border-bottom: 1px solid var(--stroke);
    padding: 14px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .jugador-nombre {
    font-family: 'Barlow Condensed', Impact, sans-serif;
    font-size: 22px;
    font-weight: 900;
    color: var(--text);
    letter-spacing: 0.04em;
  }

  .folio {
    font-family: 'Barlow Condensed', Impact, sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.18em;
    color: var(--text-3);
    text-transform: uppercase;
  }

  .folio-val {
    font-family: 'Barlow Condensed', Impact, sans-serif;
    font-size: 14px;
    font-weight: 800;
    color: var(--gold);
    letter-spacing: 0.12em;
    margin-top: 2px;
  }

  /* ── STATS ROW ── */
  .stats-strip {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    border-bottom: 1px solid var(--stroke);
  }

  .stat {
    padding: 12px 10px;
    text-align: center;
    border-right: 1px solid var(--stroke);
    position: relative;
  }
  .stat:last-child { border-right: none; }

  .stat-n {
    font-family: 'Barlow Condensed', Impact, sans-serif;
    font-size: 26px;
    font-weight: 900;
    line-height: 1;
  }

  .stat-l {
    font-family: 'Barlow Condensed', Impact, sans-serif;
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.14em;
    color: var(--text-3);
    text-transform: uppercase;
    margin-top: 3px;
  }

  /* ── SEPARADOR PERFORADO ── */
  .perforado {
    display: flex;
    align-items: center;
    margin: 0;
    position: relative;
    background: var(--ink-2);
    border-top: 1px dashed rgba(255,255,255,0.1);
  }

  .perforado::before,
  .perforado::after {
    content: '';
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #0a0d12;
    border: 1px solid rgba(255,255,255,0.07);
    flex-shrink: 0;
    margin: -10px -10px;
    z-index: 2;
  }

  .perforado-label {
    flex: 1;
    text-align: center;
    font-family: 'Barlow Condensed', Impact, sans-serif;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.2em;
    color: var(--text-3);
    text-transform: uppercase;
    padding: 6px 0;
  }

  /* ── TABLA DE PARTIDOS ── */
  .partidos-section {
    padding: 0;
  }

  .fecha-header {
    padding: 8px 24px;
    background: rgba(255,255,255,0.02);
    border-bottom: 1px solid var(--stroke);
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .fecha-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--fire);
    flex-shrink: 0;
  }

  .fecha-text {
    font-family: 'Barlow Condensed', Impact, sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.18em;
    color: var(--text-3);
    text-transform: uppercase;
  }

  .partido-row {
    display: flex;
    align-items: center;
    padding: 10px 24px;
    border-bottom: 1px solid var(--stroke);
    gap: 0;
    position: relative;
    transition: background 0.1s;
  }

  .partido-row.exacto  { border-left: 3px solid var(--gold); background: rgba(255,214,10,0.025); }
  .partido-row.acertado{ border-left: 3px solid var(--turf); background: rgba(0,212,106,0.02); }
  .partido-row.fallo   { border-left: 3px solid var(--red);  background: rgba(255,59,48,0.02); }
  .partido-row.pendiente { border-left: 3px solid rgba(255,77,0,0.4); }
  .partido-row.sinprono { border-left: 3px solid transparent; opacity: 0.5; }

  .col-hora {
    font-family: 'Barlow Condensed', Impact, sans-serif;
    font-size: 10px;
    font-weight: 700;
    color: var(--text-3);
    letter-spacing: 0.06em;
    width: 40px;
    flex-shrink: 0;
  }

  .col-equipos {
    flex: 1;
    min-width: 0;
  }

  .equipo-local {
    font-size: 11px;
    font-weight: 700;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .equipo-divider {
    font-family: 'Barlow Condensed', Impact, sans-serif;
    font-size: 9px;
    font-weight: 700;
    color: var(--text-3);
    letter-spacing: 0.1em;
  }

  .equipo-visit {
    font-size: 11px;
    font-weight: 700;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .col-flags {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    width: 26px;
    flex-shrink: 0;
    margin: 0 8px;
  }

  .flag-img {
    width: 22px;
    height: 14px;
    border-radius: 2px;
    object-fit: cover;
    box-shadow: 0 1px 3px rgba(0,0,0,0.4);
  }

  .col-resultado {
    text-align: center;
    width: 44px;
    flex-shrink: 0;
    margin: 0 8px;
  }

  .resultado-val {
    font-family: 'Barlow Condensed', Impact, sans-serif;
    font-size: 13px;
    font-weight: 800;
    color: var(--text-2);
    letter-spacing: 0.02em;
  }

  .resultado-pend {
    font-family: 'Barlow Condensed', Impact, sans-serif;
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: var(--text-3);
    text-transform: uppercase;
  }

  .col-prono {
    text-align: center;
    width: 58px;
    flex-shrink: 0;
  }

  .prono-lbl {
    font-family: 'Barlow Condensed', Impact, sans-serif;
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: var(--text-3);
    text-transform: uppercase;
    margin-bottom: 2px;
  }

  .prono-val {
    font-family: 'Barlow Condensed', Impact, sans-serif;
    font-size: 17px;
    font-weight: 900;
    line-height: 1;
    letter-spacing: 0.02em;
  }

  .col-pts {
    text-align: center;
    width: 36px;
    flex-shrink: 0;
    margin-left: 8px;
  }

  .pts-badge {
    font-family: 'Barlow Condensed', Impact, sans-serif;
    font-size: 11px;
    font-weight: 900;
    line-height: 1;
  }

  /* ── TALÓN (pie del ticket) ── */
  .talon {
    background: rgba(255,255,255,0.02);
    padding: 14px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .talon-text {
    font-family: 'Barlow Condensed', Impact, sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.14em;
    color: var(--text-3);
    text-transform: uppercase;
  }

  .talon-text strong {
    color: rgba(240,244,248,0.5);
  }

  .footer-note {
    text-align: center;
    margin-top: 20px;
    font-family: 'Barlow Condensed', Impact, sans-serif;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.16em;
    color: rgba(240,244,248,0.15);
    text-transform: uppercase;
  }

  /* ── PRINT ── */
  @media print {
    body { background: #0a0d12 !important; padding: 0; }
    .ticket { box-shadow: none; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  }
</style>
</head>
<body>

<div class="ticket">

  <!-- Barra superior -->
  <div class="ticket-bar"></div>

  <!-- Header -->
  <div class="ticket-header">
    <div>
      <div class="brand-name">Quiniela MX 2026</div>
      <div class="event-title">⚽ MUNDIAL <span>2026</span></div>
      <div class="event-sub">Comprobante de pronósticos</div>
    </div>
    <div class="fase-badge">
      ⚽ ${tituloFase.toUpperCase()}
    </div>
  </div>

  <!-- Jugador -->
  <div class="jugador-strip">
    <div>
      <div style="font-family:'Barlow Condensed',Impact,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.14em;color:rgba(240,244,248,0.3);text-transform:uppercase;margin-bottom:3px;">Participante</div>
      <div class="jugador-nombre">${nombre}</div>
    </div>
    <div style="text-align:right;">
      <div class="folio">Folio</div>
      <div class="folio-val">#${folio}</div>
      <div style="font-size:10px;color:rgba(240,244,248,0.3);font-family:'Barlow Condensed',Impact,sans-serif;margin-top:4px;">${ahora} CST</div>
    </div>
  </div>

  <!-- Stats -->
  <div class="stats-strip">
    <div class="stat">
      <div class="stat-n" style="color:#FF4D00">${conProno}</div>
      <div class="stat-l">Pronósticos</div>
    </div>
    <div class="stat">
      <div class="stat-n" style="color:#FFD60A">${exactos}</div>
      <div class="stat-l">⭐ Exactos</div>
    </div>
    <div class="stat">
      <div class="stat-n" style="color:#00D46A">${acertados}</div>
      <div class="stat-l">✓ Ganador</div>
    </div>
    <div class="stat">
      <div class="stat-n" style="color:#FF3B30">${fallos}</div>
      <div class="stat-l">✗ Fallos</div>
    </div>
    <div class="stat">
      <div class="stat-n" style="color:#FFD60A">${puntosTotal}</div>
      <div class="stat-l">PTS TOTAL</div>
    </div>
  </div>

  <!-- Separador perforado -->
  <div class="perforado">
    <div class="perforado-label">detalle de pronósticos</div>
  </div>

  <!-- Partidos -->
  <div class="partidos-section">
    ${Object.entries(porFecha).map(([fecha, rows]) => `
      <div class="fecha-header">
        <div class="fecha-dot"></div>
        <div class="fecha-text">${fecha}</div>
      </div>
      ${rows.map(f => `
        <div class="partido-row ${f.rowClass}">
          <div class="col-hora">${f.hora}</div>
          <div class="col-flags">
            ${f.codigo_local ? `<img class="flag-img" src="https://flagcdn.com/24x18/${f.codigo_local.toLowerCase()}.png" alt="">` : '<div style="width:22px;height:14px;background:rgba(255,255,255,0.06);border-radius:2px;"></div>'}
            ${f.codigo_visitante ? `<img class="flag-img" src="https://flagcdn.com/24x18/${f.codigo_visitante.toLowerCase()}.png" alt="">` : '<div style="width:22px;height:14px;background:rgba(255,255,255,0.06);border-radius:2px;"></div>'}
          </div>
          <div class="col-equipos">
            <div class="equipo-local">${f.equipo_local}</div>
            <div class="equipo-divider">vs</div>
            <div class="equipo-visit">${f.equipo_visitante}</div>
          </div>
          <div class="col-resultado">
            ${f.resText
              ? `<div class="resultado-val">${f.resText}</div>`
              : `<div class="resultado-pend">—</div>`
            }
          </div>
          <div class="col-prono">
            <div class="prono-lbl">mi prono</div>
            ${f.pronoText
              ? `<div class="prono-val" style="color:${f.accentColor}">${f.pronoText}</div>`
              : `<div style="font-family:'Barlow Condensed',Impact,sans-serif;font-size:12px;font-weight:700;color:rgba(240,244,248,0.2);">SIN PRONO</div>`
            }
          </div>
          <div class="col-pts">
            ${f.pr && f.tieneRes
              ? `<div class="pts-badge" style="color:${f.accentColor}">${f.puntos === 3 ? '+3⭐' : f.puntos === 1 ? '+1✓' : '0✗'}</div>`
              : f.pr
                ? `<div style="font-family:'Barlow Condensed',Impact,sans-serif;font-size:9px;font-weight:700;color:rgba(240,244,248,0.25);">PEND</div>`
                : ``
            }
          </div>
        </div>
      `).join('')}
    `).join('')}
  </div>

  <!-- Separador perforado (talón) -->
  <div class="perforado">
    <div class="perforado-label">✂</div>
  </div>

  <!-- Talón -->
  <div class="talon">
    <div class="talon-text">
      Quiniela MX 2026 · <strong>${tituloFase}</strong>
    </div>
    <div class="talon-text" style="text-align:right;">
      Folio <strong>#${folio}</strong> · <strong>${nombre}</strong>
    </div>
  </div>

</div>

<div class="footer-note">
  Quiniela MX 2026 · Documento de verificación de pronósticos · Generado ${ahora} CST
</div>

<script>
  // Esperar fuentes y luego imprimir
  document.fonts.ready.then(function() {
    setTimeout(function() { window.print(); }, 400);
  });
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
