'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'

// Verificar sesión y rol admin (cliente normal, RLS OK para propio perfil)
async function verificarAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado', user: null }

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('es_admin')
    .eq('id', user.id)
    .single()

  if (!perfil?.es_admin) return { error: 'No autorizado', user: null }
  return { error: null, user }
}

// Dar o quitar permisos de admin (modifica perfil de otro usuario → service role)
export async function toggleAdmin(targetUserId: string, hacerAdmin: boolean) {
  const { error: authError } = await verificarAdmin()
  if (authError) return { error: authError }

  const service = createServiceClient()
  const { error } = await service
    .from('perfiles')
    .update({ es_admin: hacerAdmin })
    .eq('id', targetUserId)

  if (error) return { error: error.message }
  revalidatePath('/admin/usuarios')
  return { ok: true }
}

// Eliminar usuario (afecta pronósticos y perfil de otro → service role)
export async function eliminarUsuario(targetUserId: string) {
  const { error: authError, user } = await verificarAdmin()
  if (authError || !user) return { error: authError }
  if (targetUserId === user.id) return { error: 'No puedes eliminarte a ti mismo' }

  const service = createServiceClient()
  await service.from('pronosticos').delete().eq('usuario_id', targetUserId)
  const { error } = await service.from('perfiles').delete().eq('id', targetUserId)
  if (error) return { error: error.message }

  revalidatePath('/admin/usuarios')
  return { ok: true }
}

// Forzar reset de contraseña (modifica perfil de otro → service role)
export async function forzarResetPassword(targetUserId: string) {
  const { error: authError } = await verificarAdmin()
  if (authError) return { error: authError }

  const service = createServiceClient()
  const { error } = await service
    .from('perfiles')
    .update({ must_change_password: true })
    .eq('id', targetUserId)

  if (error) return { error: error.message }
  revalidatePath('/admin/usuarios')
  return { ok: true }
}
