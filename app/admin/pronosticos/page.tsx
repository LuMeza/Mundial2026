import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import AdminPronosticosClient from './AdminPronosticosClient'

export default async function AdminPronosticosPage({
  searchParams,
}: {
  searchParams: Promise<{ fase?: string; grupo?: string }>
}) {
  const { fase: faseParam, grupo: grupoParam } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('es_admin,nombre')
    .eq('id', user.id)
    .single()
  if (!perfil?.es_admin) redirect('/quiniela')

  const service = createServiceClient()

  // Traer todos los partidos
  const { data: partidos } = await service
    .from('partidos')
    .select('*')
    .order('fecha', { ascending: true })
    .order('hora', { ascending: true })

  // Traer todos los perfiles (jugadores)
  const { data: perfiles } = await service
    .from('perfiles')
    .select('id,nombre,avatar_url,es_admin')
    .order('nombre', { ascending: true })

  // Traer TODOS los pronósticos (paginados)
  let allPronos: {
    usuario_id: string
    partido_id: number
    goles_local: number
    goles_visitante: number
    puntos: number | null
  }[] = []
  let from = 0
  while (true) {
    const { data, error } = await service
      .from('pronosticos')
      .select('usuario_id,partido_id,goles_local,goles_visitante,puntos')
      .range(from, from + 999)
    if (error || !data || data.length === 0) break
    allPronos = allPronos.concat(data)
    if (data.length < 1000) break
    from += 1000
  }

  // Ordenar fases
  const ORDEN_FASES = [
    'Fase de Grupos', 'Ronda de 32', 'Octavos de final',
    'Cuartos de final', 'Semifinales', 'Tercer Puesto', 'Final',
  ]
  const ORDEN_GRUPOS = ['A','B','C','D','E','F','G','H','I','J','K','L']

  const fasesDisp = ORDEN_FASES.filter(f => partidos?.some(p => p.fase === f))
  const faseActiva = fasesDisp.includes(faseParam ?? '') ? faseParam! : fasesDisp[0] ?? 'Fase de Grupos'

  const partidosFase = (partidos ?? []).filter(p => p.fase === faseActiva)
  const gruposDisp = ORDEN_GRUPOS.filter(g => partidosFase.some(p => p.grupo === g))
  const grupoActivo = gruposDisp.includes(grupoParam ?? '') ? grupoParam! : null

  return (
    <AdminPronosticosClient
      partidos={partidos ?? []}
      perfiles={perfiles ?? []}
      pronos={allPronos}
      fasesDisp={fasesDisp}
      gruposDisp={gruposDisp}
      faseActiva={faseActiva}
      grupoActivo={grupoActivo}
    />
  )
}
