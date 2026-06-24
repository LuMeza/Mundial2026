'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()
  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }
  return (
    <button onClick={handleLogout} className="btn btn-ghost" style={{ fontSize: 12 }}>
      Salir
    </button>
  )
}
