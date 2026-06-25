'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

// ─── Verificar admin ─────────────────────────────────────────────
async function verificarAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado', supabase: null }
  const { data: perfil } = await supabase.from('perfiles').select('es_admin').eq('id', user.id).single()
  if (!perfil?.es_admin) return { error: 'No autorizado', supabase: null }
  return { error: null, supabase }
}

// ─── Guardar resultado de un partido ────────────────────────────
export async function guardarResultado(
  partidoId: number,
  golesLocal: number,
  golesVisitante: number
) {
  const { error } = await verificarAdmin()
  if (error) return { error }

  // Usar service client para bypassar RLS (partidos con fase_abierta=false también deben poder actualizarse)
  const service = createServiceClient()

  const { error: errUpdate } = await service
    .from('partidos')
    .update({ goles_local: golesLocal, goles_visitante: golesVisitante })
    .eq('id', partidoId)

  if (errUpdate) return { error: errUpdate.message }

  // Recalcular puntos de todos los pronósticos de este partido
  const { data: pronosticos } = await service
    .from('pronosticos')
    .select('*')
    .eq('partido_id', partidoId)

  for (const p of pronosticos ?? []) {
    const acertoExacto =
      p.goles_local === golesLocal && p.goles_visitante === golesVisitante
    const acertoGanador =
      (p.goles_local > p.goles_visitante && golesLocal > golesVisitante) ||
      (p.goles_local < p.goles_visitante && golesLocal < golesVisitante) ||
      (p.goles_local === p.goles_visitante && golesLocal === golesVisitante)

    const puntos = acertoExacto ? 3 : acertoGanador ? 1 : 0

    await service.from('pronosticos').update({ puntos }).eq('id', p.id)
  }

  return { ok: true }
}

// ─── Abrir una fase (usuarios pueden pronosticar) ────────────────
export async function abrirFase(fase: string) {
  const { error, supabase } = await verificarAdmin()
  if (error || !supabase) return { error }

  // Fecha de cierre sugerida: 30 min antes del primer partido de la fase
  const { data: primerPartido } = await supabase
    .from('partidos')
    .select('fecha, hora')
    .eq('fase', fase)
    .order('fecha', { ascending: true })
    .order('hora', { ascending: true })
    .limit(1)
    .single()

  let cierre: string | null = null
  if (primerPartido) {
    const dt = new Date(`${primerPartido.fecha}T${primerPartido.hora}`)
    dt.setMinutes(dt.getMinutes() - 30)         // 30 min antes del primer partido
    dt.setHours(dt.getHours() + 6)              // compensar a UTC (CST = UTC-6)
    cierre = dt.toISOString()
  }

  const { error: errUpdate } = await supabase
    .from('partidos')
    .update({
      fase_abierta: true,
      ...(cierre ? { cierre_pronosticos: cierre } : {}),
    })
    .eq('fase', fase)

  if (errUpdate) return { error: errUpdate.message }
  return { ok: true }
}

// ─── Cerrar una fase (ya no se puede pronosticar) ─────────────────
export async function cerrarFase(fase: string) {
  const { error, supabase } = await verificarAdmin()
  if (error || !supabase) return { error }

  const { error: errUpdate } = await supabase
    .from('partidos')
    .update({ fase_abierta: false })
    .eq('fase', fase)

  if (errUpdate) return { error: errUpdate.message }
  return { ok: true }
}

// ─── Actualizar equipo de un partido de ronda eliminatoria ────────
export async function actualizarEquipo(
  partidoId: number,
  campo: 'equipo_local' | 'equipo_visitante',
  nombre: string,
  codigo: string | null
) {
  const { error, supabase } = await verificarAdmin()
  if (error || !supabase) return { error }

  const update = campo === 'equipo_local'
    ? { equipo_local: nombre, codigo_local: codigo }
    : { equipo_visitante: nombre, codigo_visitante: codigo }

  const { error: errUpdate } = await supabase
    .from('partidos')
    .update(update)
    .eq('id', partidoId)

  if (errUpdate) return { error: errUpdate.message }
  return { ok: true }
}
