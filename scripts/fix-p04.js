// ═══════════════════════════════════════════════════════════════
// FIX: Agregar Jorge López Jr (P04) que faltó por colisión de email
//
// El seed generó jorge.lopez@quiniela2026.mx para P04 y P06.
// Solo uno de los dos se creó. Este script crea P04 con email
// único jorge.lopezjr@quiniela2026.mx y carga sus 72 pronósticos.
//
// USO: node scripts/fix-p04.js
// ═══════════════════════════════════════════════════════════════

require('dotenv').config({ path: '.env.local' })
const ws = require('ws')
const { createClient } = require('@supabase/supabase-js')

if (typeof globalThis !== 'undefined' && !globalThis.WebSocket) {
  globalThis.WebSocket = ws
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function norm(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

const PRONOSTICOS_P04 = [
  { fecha: '2026-06-11', local: 'México', visitante: 'Sudáfrica', gl: 2, gv: 0 },
  { fecha: '2026-06-11', local: 'Corea del Sur', visitante: 'Chequia', gl: 1, gv: 1 },
  { fecha: '2026-06-18', local: 'Chequia', visitante: 'Sudáfrica', gl: 1, gv: 1 },
  { fecha: '2026-06-18', local: 'México', visitante: 'Corea del Sur', gl: 2, gv: 1 },
  { fecha: '2026-06-24', local: 'Chequia', visitante: 'México', gl: 0, gv: 1 },
  { fecha: '2026-06-24', local: 'Sudáfrica', visitante: 'Corea del Sur', gl: 0, gv: 1 },
  { fecha: '2026-06-12', local: 'Canadá', visitante: 'Bosnia y Herzegovina', gl: 1, gv: 0 },
  { fecha: '2026-06-13', local: 'Qatar', visitante: 'Suiza', gl: 0, gv: 2 },
  { fecha: '2026-06-18', local: 'Suiza', visitante: 'Bosnia y Herzegovina', gl: 1, gv: 0 },
  { fecha: '2026-06-18', local: 'Canadá', visitante: 'Qatar', gl: 0, gv: 2 },
  { fecha: '2026-06-24', local: 'Suiza', visitante: 'Canadá', gl: 2, gv: 2 },
  { fecha: '2026-06-24', local: 'Bosnia y Herzegovina', visitante: 'Qatar', gl: 1, gv: 0 },
  { fecha: '2026-06-13', local: 'Brasil', visitante: 'Marruecos', gl: 3, gv: 2 },
  { fecha: '2026-06-13', local: 'Haití', visitante: 'Escocia', gl: 1, gv: 2 },
  { fecha: '2026-06-19', local: 'Escocia', visitante: 'Marruecos', gl: 0, gv: 2 },
  { fecha: '2026-06-19', local: 'Brasil', visitante: 'Haití', gl: 5, gv: 0 },
  { fecha: '2026-06-24', local: 'Escocia', visitante: 'Brasil', gl: 1, gv: 3 },
  { fecha: '2026-06-24', local: 'Marruecos', visitante: 'Haití', gl: 3, gv: 1 },
  { fecha: '2026-06-12', local: 'Estados Unidos', visitante: 'Paraguay', gl: 1, gv: 1 },
  { fecha: '2026-06-13', local: 'Australia', visitante: 'Turquía', gl: 0, gv: 1 },
  { fecha: '2026-06-19', local: 'Estados Unidos', visitante: 'Australia', gl: 2, gv: 0 },
  { fecha: '2026-06-19', local: 'Turquía', visitante: 'Paraguay', gl: 2, gv: 1 },
  { fecha: '2026-06-25', local: 'Turquía', visitante: 'Estados Unidos', gl: 1, gv: 1 },
  { fecha: '2026-06-25', local: 'Paraguay', visitante: 'Australia', gl: 1, gv: 0 },
  { fecha: '2026-06-14', local: 'Alemania', visitante: 'Curazao', gl: 3, gv: 0 },
  { fecha: '2026-06-14', local: 'Costa de Marfil', visitante: 'Ecuador', gl: 2, gv: 1 },
  { fecha: '2026-06-20', local: 'Alemania', visitante: 'Costa de Marfil', gl: 1, gv: 0 },
  { fecha: '2026-06-20', local: 'Ecuador', visitante: 'Curazao', gl: 1, gv: 0 },
  { fecha: '2026-06-25', local: 'Curazao', visitante: 'Costa de Marfil', gl: 0, gv: 1 },
  { fecha: '2026-06-25', local: 'Ecuador', visitante: 'Alemania', gl: 1, gv: 2 },
  { fecha: '2026-06-14', local: 'Países Bajos', visitante: 'Japón', gl: 1, gv: 1 },
  { fecha: '2026-06-14', local: 'Suecia', visitante: 'Túnez', gl: 1, gv: 0 },
  { fecha: '2026-06-20', local: 'Países Bajos', visitante: 'Suecia', gl: 0, gv: 0 },
  { fecha: '2026-06-20', local: 'Túnez', visitante: 'Japón', gl: 1, gv: 1 },
  { fecha: '2026-06-25', local: 'Japón', visitante: 'Suecia', gl: 0, gv: 0 },
  { fecha: '2026-06-25', local: 'Túnez', visitante: 'Países Bajos', gl: 0, gv: 1 },
  { fecha: '2026-06-15', local: 'Bélgica', visitante: 'Egipto', gl: 2, gv: 0 },
  { fecha: '2026-06-15', local: 'Irán', visitante: 'Nueva Zelanda', gl: 1, gv: 0 },
  { fecha: '2026-06-21', local: 'Bélgica', visitante: 'Irán', gl: 1, gv: 0 },
  { fecha: '2026-06-21', local: 'Nueva Zelanda', visitante: 'Egipto', gl: 1, gv: 1 },
  { fecha: '2026-06-26', local: 'Egipto', visitante: 'Irán', gl: 2, gv: 0 },
  { fecha: '2026-06-26', local: 'Nueva Zelanda', visitante: 'Bélgica', gl: 0, gv: 2 },
  { fecha: '2026-06-15', local: 'España', visitante: 'Cabo Verde', gl: 2, gv: 0 },
  { fecha: '2026-06-15', local: 'Arabia Saudita', visitante: 'Uruguay', gl: 0, gv: 2 },
  { fecha: '2026-06-21', local: 'España', visitante: 'Arabia Saudita', gl: 3, gv: 0 },
  { fecha: '2026-06-21', local: 'Uruguay', visitante: 'Cabo Verde', gl: 2, gv: 0 },
  { fecha: '2026-06-26', local: 'Cabo Verde', visitante: 'Arabia Saudita', gl: 0, gv: 0 },
  { fecha: '2026-06-26', local: 'Uruguay', visitante: 'España', gl: 2, gv: 3 },
  { fecha: '2026-06-16', local: 'Francia', visitante: 'Senegal', gl: 3, gv: 0 },
  { fecha: '2026-06-16', local: 'Iraq', visitante: 'Noruega', gl: 1, gv: 3 },
  { fecha: '2026-06-22', local: 'Francia', visitante: 'Iraq', gl: 4, gv: 0 },
  { fecha: '2026-06-22', local: 'Noruega', visitante: 'Senegal', gl: 1, gv: 0 },
  { fecha: '2026-06-26', local: 'Noruega', visitante: 'Francia', gl: 0, gv: 1 },
  { fecha: '2026-06-26', local: 'Senegal', visitante: 'Iraq', gl: 1, gv: 0 },
  { fecha: '2026-06-16', local: 'Argentina', visitante: 'Algeria', gl: 3, gv: 0 },
  { fecha: '2026-06-17', local: 'Austria', visitante: 'Jordania', gl: 1, gv: 0 },
  { fecha: '2026-06-22', local: 'Argentina', visitante: 'Austria', gl: 3, gv: 1 },
  { fecha: '2026-06-22', local: 'Jordania', visitante: 'Algeria', gl: 0, gv: 0 },
  { fecha: '2026-06-27', local: 'Jordania', visitante: 'Argentina', gl: 1, gv: 4 },
  { fecha: '2026-06-27', local: 'Algeria', visitante: 'Austria', gl: 1, gv: 0 },
  { fecha: '2026-06-17', local: 'Portugal', visitante: 'DR Congo', gl: 3, gv: 0 },
  { fecha: '2026-06-17', local: 'Uzbekistán', visitante: 'Colombia', gl: 0, gv: 2 },
  { fecha: '2026-06-23', local: 'Portugal', visitante: 'Uzbekistán', gl: 2, gv: 0 },
  { fecha: '2026-06-23', local: 'Colombia', visitante: 'DR Congo', gl: 4, gv: 0 },
  { fecha: '2026-06-27', local: 'Colombia', visitante: 'Portugal', gl: 3, gv: 3 },
  { fecha: '2026-06-27', local: 'DR Congo', visitante: 'Uzbekistán', gl: 0, gv: 0 },
  { fecha: '2026-06-17', local: 'Inglaterra', visitante: 'Croacia', gl: 1, gv: 1 },
  { fecha: '2026-06-17', local: 'Ghana', visitante: 'Panamá', gl: 0, gv: 0 },
  { fecha: '2026-06-23', local: 'Inglaterra', visitante: 'Ghana', gl: 1, gv: 0 },
  { fecha: '2026-06-23', local: 'Panamá', visitante: 'Croacia', gl: 1, gv: 2 },
  { fecha: '2026-06-27', local: 'Panamá', visitante: 'Inglaterra', gl: 0, gv: 2 },
  { fecha: '2026-06-27', local: 'Croacia', visitante: 'Ghana', gl: 2, gv: 1 },
]

async function main() {
  console.log('\n🔧 Creando Jorge López Jr (P04)...\n')

  // 1. Crear usuario en Auth
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: 'jorge.lopezjr@quiniela2026.mx',
    password: 'Mundial26!04',
    email_confirm: true,
    user_metadata: { full_name: 'Jorge López Jr' },
  })

  if (authErr) {
    console.error('✗ Auth error:', authErr.message)
    return
  }

  const userId = authData.user.id
  console.log('✓ Auth creado:', userId)

  // 2. Crear perfil
  const { error: perfErr } = await supabase
    .from('perfiles')
    .upsert({ id: userId, nombre: 'Jorge López Jr', must_change_password: true })

  if (perfErr) { console.error('✗ Perfil error:', perfErr.message); return }
  console.log('✓ Perfil creado')

  // 3. Cargar todos los partidos para mapear
  const { data: partidos } = await supabase
    .from('partidos')
    .select('id, fecha, equipo_local, equipo_visitante')

  if (!partidos) { console.error('✗ No se pudieron cargar partidos'); return }

  const mapa = {}
  for (const p of partidos) {
    mapa[`${p.fecha}|${norm(p.equipo_local)}|${norm(p.equipo_visitante)}`] = p.id
  }
  console.log(`✓ ${partidos.length} partidos cargados`)

  // 4. Insertar pronósticos
  let found = 0, notFound = 0
  const rows = []
  for (const p of PRONOSTICOS_P04) {
    const key = `${p.fecha}|${norm(p.local)}|${norm(p.visitante)}`
    const partidoId = mapa[key]
    if (!partidoId) {
      // Fallback: solo por fecha + local
      const fb = Object.keys(mapa).find(k => k.startsWith(`${p.fecha}|${norm(p.local)}|`))
      if (fb) { rows.push({ usuario_id: userId, partido_id: mapa[fb], goles_local: p.gl, goles_visitante: p.gv }); found++ }
      else notFound++
      continue
    }
    rows.push({ usuario_id: userId, partido_id: partidoId, goles_local: p.gl, goles_visitante: p.gv })
    found++
  }

  const { error: pErr } = await supabase
    .from('pronosticos')
    .upsert(rows, { onConflict: 'usuario_id,partido_id' })

  if (pErr) console.error('✗ Pronósticos error:', pErr.message)
  else console.log(`✓ ${found} pronósticos insertados${notFound > 0 ? ` (${notFound} sin mapear)` : ''}`)

  console.log('\n✅ Jorge López Jr listo.')
  console.log('   Email: jorge.lopezjr@quiniela2026.mx')
  console.log('   Contraseña temporal: Mundial26!04')
  console.log('   Pronósticos cargados:', found)
}

main().catch(console.error)
