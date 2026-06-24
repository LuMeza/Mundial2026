import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import UsuariosClient from './UsuariosClient'
import LogoutButton from '@/app/quiniela/LogoutButton'

export default async function UsuariosAdminPage() {
  // Verificar sesión con cliente normal (RLS OK para propio perfil)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('es_admin')
    .eq('id', user.id)
    .single()
  if (!perfil?.es_admin) redirect('/quiniela')

  // Leer TODOS los perfiles con service role (bypassea RLS)
  const service = createServiceClient()
  const { data: perfiles } = await service
    .from('perfiles')
    .select('id,nombre,avatar_url,es_admin,must_change_password,created_at')
    .order('created_at', { ascending: true })

  return (
    <div className="page">
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, var(--gold), var(--fire))', zIndex: 200 }} />

      <nav className="site-nav" style={{ borderBottomColor: 'rgba(255,214,10,0.15)' }}>
        <div className="wrap" style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <a href="/admin" className="btn btn-outline" style={{ fontSize: 12, padding: '7px 14px' }}>← Admin</a>
            <a href="/quiniela" className="btn btn-outline" style={{ fontSize: 12, padding: '7px 14px' }}>⚽ Inicio</a>
            <div style={{ width: 1, height: 20, background: 'var(--stroke)' }} />
            <span className="f-display" style={{ fontSize: 18, color: 'var(--gold)', letterSpacing: '0.06em' }}>USUARIOS</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'none', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="email-badge">{user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </nav>

      <UsuariosClient perfiles={perfiles ?? []} currentUserId={user.id} />
      <style>{`@media(min-width:640px){.email-badge{display:block!important}}`}</style>
    </div>
  )
}
