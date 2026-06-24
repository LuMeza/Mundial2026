// ═══════════════════════════════════════════════════════════════
// QUINIELA MX 2026 — Agrega José Alfonso Rocha + Alejandro Meza
//
// USO:
//   node scripts/seed-nuevos.js
//
// PRERREQUISITO: .env.local con NEXT_PUBLIC_SUPABASE_URL y
//               SUPABASE_SERVICE_ROLE_KEY
//
// ⚠️  ANTES DE CORRER: rellena los arrays PRONOSTICOS[43] y
//     PRONOSTICOS[44] con los datos del Excel.
//     Formato: { fecha:'YYYY-MM-DD', local:'Equipo', visitante:'Equipo', gl:N, gv:N }
// ═══════════════════════════════════════════════════════════════

require('dotenv').config({ path: '.env.local' })
const ws = require('ws')
const { createClient } = require('@supabase/supabase-js')

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('\n❌  Faltan variables en .env.local\n')
  process.exit(1)
}
if (typeof globalThis !== 'undefined' && !globalThis.WebSocket) globalThis.WebSocket = ws

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// ─── NUEVOS USUARIOS ─────────────────────────────────────────────
const NUEVOS = [
  { num: 43, name: 'José Alfonso Rocha', email: 'jose.rocha@quiniela2026.mx',       tempPassword: 'Mundial26!43' },
  { num: 44, name: 'Alejandro Meza',     email: 'alejandro.meza@quiniela2026.mx',   tempPassword: 'Mundial26!44' },
]

// ─── PRONÓSTICOS ─────────────────────────────────────────────────
// ⚠️  COMPLETAR con los datos del Excel antes de correr el script
const PRONOSTICOS = {
  43: [
    // Ejemplo — sustituir con datos reales:
    // { fecha: '2026-06-11', local: 'México', visitante: 'Sudáfrica', gl: 2, gv: 0 },
    // { fecha: '2026-06-11', local: 'Corea del Sur', visitante: 'Chequia', gl: 1, gv: 1 },
    // ... (72 partidos de fase de grupos)
  ],
  44: [
    // Ejemplo — sustituir con datos reales:
    // { fecha: '2026-06-11', local: 'México', visitante: 'Sudáfrica', gl: 2, gv: 1 },
    // { fecha: '2026-06-11', local: 'Corea del Sur', visitante: 'Chequia', gl: 2, gv: 0 },
    // ... (72 partidos de fase de grupos)
  ],
}

// ─── HELPERS ─────────────────────────────────────────────────────
function norm(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

async function crearUsuario(u) {
  const { data: existing } = await supabase.auth.admin.listUsers()
  const ya = existing?.users?.find(x => x.email === u.email)
  if (ya) { console.log(`  ↩  Ya existe: ${u.email}`); return ya }

  const { data, error } = await supabase.auth.admin.createUser({
    email: u.email,
    password: u.tempPassword,
    email_confirm: true,
    user_metadata: { full_name: u.name },
  })
  if (error) { console.error(`  ✗ Error auth: ${error.message}`); return null }
  console.log(`  ✓ Creado: ${u.email}`)
  return data.user
}

async function upsertPerfil(userId, u) {
  const { error } = await supabase
    .from('perfiles')
    .upsert({ id: userId, nombre: u.name, must_change_password: true })
  if (error) console.error(`  ✗ Perfil: ${error.message}`)
  else       console.log(`  ✓ Perfil: ${u.name}`)
}

async function getPartidosMap() {
  const { data, error } = await supabase
    .from('partidos').select('id, fecha, equipo_local, equipo_visitante')
  if (error || !data) { console.error('✗ No se pudo cargar partidos'); return {} }
  const mapa = {}
  for (const p of data) {
    mapa[`${p.fecha}|${norm(p.equipo_local)}|${norm(p.equipo_visitante)}`] = p.id
  }
  console.log(`📋 ${data.length} partidos cargados`)
  return mapa
}

async function insertarPronosticos(userId, playerNum, mapa) {
  const preds = PRONOSTICOS[playerNum] ?? []
  if (preds.length === 0) {
    console.log(`  ⚠️  Pronósticos vacíos para P${playerNum} — agrega los datos del Excel y vuelve a correr`)
    return
  }

  let notFound = 0
  const rows = []
  for (const p of preds) {
    const key = `${p.fecha}|${norm(p.local)}|${norm(p.visitante)}`
    const partidoId = mapa[key]
    if (!partidoId) {
      // fallback: solo por fecha + local
      const fb = Object.keys(mapa).find(k => k.startsWith(`${p.fecha}|${norm(p.local)}|`))
      if (fb) { rows.push({ usuario_id: userId, partido_id: mapa[fb], goles_local: p.gl, goles_visitante: p.gv }) }
      else     notFound++
      continue
    }
    rows.push({ usuario_id: userId, partido_id: partidoId, goles_local: p.gl, goles_visitante: p.gv })
  }

  if (rows.length === 0) { console.log(`  ⚠️  0 pronósticos insertados`); return }

  const { error } = await supabase
    .from('pronosticos')
    .upsert(rows, { onConflict: 'usuario_id,partido_id' })
  if (error) console.error(`  ✗ ${error.message}`)
  else       console.log(`  ✓ ${rows.length} pronósticos OK${notFound ? ` (${notFound} sin mapear)` : ''}`)
}

// ─── MAIN ─────────────────────────────────────────────────────────
async function main() {
  console.log('\n🚀  Agregando nuevos jugadores...\n')
  const mapa = await getPartidosMap()

  for (const u of NUEVOS) {
    console.log(`\n[P${u.num}] ${u.name}`)
    const user = await crearUsuario(u)
    if (!user) continue
    await upsertPerfil(user.id, u)
    await insertarPronosticos(user.id, u.num, mapa)
    await new Promise(r => setTimeout(r, 80))
  }

  console.log('\n✅  Listo.\n')
  console.log('Credenciales temporales (los usuarios cambian al primer login):')
  console.log('─'.repeat(68))
  console.log('43  José Alfonso Rocha   jose.rocha@quiniela2026.mx      Mundial26!43')
  console.log('44  Alejandro Meza       alejandro.meza@quiniela2026.mx  Mundial26!44')
  console.log('─'.repeat(68))

  const faltanPronos = NUEVOS.filter(u => (PRONOSTICOS[u.num] ?? []).length === 0)
  if (faltanPronos.length > 0) {
    console.log('\n⚠️  Pendiente: agregar pronósticos en PRONOSTICOS[N] para:')
    faltanPronos.forEach(u => console.log(`   P${u.num} ${u.name}`))
    console.log('   Luego vuelve a correr: node scripts/seed-nuevos.js\n')
  }
}

main().catch(console.error)
