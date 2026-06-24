'use server'

import { createClient } from '@/lib/supabase/server'

export async function guardarPronostico(
  partidoId: number,
  golesLocal: number,
  golesVisitante: number
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('pronosticos')
    .upsert({
      usuario_id: user.id,
      partido_id: partidoId,
      goles_local: golesLocal,
      goles_visitante: golesVisitante,
    }, {
      onConflict: 'usuario_id,partido_id'
    })

  if (error) return { error: error.message }
  return { ok: true }
}