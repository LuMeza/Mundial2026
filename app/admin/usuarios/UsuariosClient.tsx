'use client'
import { useState, useTransition } from 'react'
import { toggleAdmin, eliminarUsuario, forzarResetPassword } from './actions'

interface Perfil {
  id: string
  nombre: string | null
  avatar_url: string | null
  es_admin: boolean | null
  must_change_password: boolean | null
  created_at: string | null
}
interface Props { perfiles: Perfil[]; currentUserId: string }

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return <div className={`toast ${ok ? 'toast-ok' : 'toast-err'}`}>{ok ? '✓' : '✗'} {msg}</div>
}

export default function UsuariosClient({ perfiles, currentUserId }: Props) {
  const [q,     setQ]      = useState('')
  const [perfs, setPerfs]  = useState<Perfil[]>(perfiles)
  const [toast, setToast]  = useState<{ ok: boolean; msg: string } | null>(null)
  const [isPending, start] = useTransition()

  const showT = (ok: boolean, msg: string) => { setToast({ ok, msg }); setTimeout(() => setToast(null), 3500) }

  const handleToggle = (uid: string, nombre: string, isAdmin: boolean) => {
    if (!confirm(`¿${isAdmin ? 'Quitar admin de' : 'Hacer admin a'} ${nombre}?`)) return
    start(async () => {
      const r = await toggleAdmin(uid, !isAdmin)
      if (r?.error) { showT(false, r.error); return }
      setPerfs(prev => prev.map(p => p.id === uid ? { ...p, es_admin: !isAdmin } : p))
      showT(true, `${!isAdmin ? 'Admin activado' : 'Admin removido'} para ${nombre}`)
    })
  }

  const handleDel = (uid: string, nombre: string) => {
    start(async () => {
      const r = await eliminarUsuario(uid)
      if (r?.error) { showT(false, r.error); return }
      setPerfs(prev => prev.filter(p => p.id !== uid))
      showT(true, `${nombre} eliminado`)
    })
  }

  const handleResetPw = (uid: string, nombre: string) => {
    if (!confirm(`¿Forzar cambio de contraseña a ${nombre}?\nAl próximo login se le pedirá que la cambie.`)) return
    start(async () => {
      const r = await forzarResetPassword(uid)
      if (r?.error) { showT(false, r.error); return }
      setPerfs(prev => prev.map(p => p.id === uid ? { ...p, must_change_password: true } : p))
      showT(true, `Reset de contraseña activado para ${nombre}`)
    })
  }

  const filtrados = perfs.filter(p => (p.nombre ?? '').toLowerCase().includes(q.toLowerCase()))
  const admins    = perfs.filter(p => p.es_admin).length
  const pendingPw = perfs.filter(p => p.must_change_password).length

  return (
    <main className="wrap" style={{ paddingTop: 32, paddingBottom: 60, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}

      <div className="anim-up">
        <h1 className="f-display" style={{ fontSize: 48, color: 'var(--text)' }}>USUARIOS</h1>
        <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 6 }}>{perfs.length} participantes registrados</p>
      </div>

      {/* Stats rápidas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
        {[
          { icon: '👥', label: 'Jugadores', value: perfs.filter(p => !p.es_admin).length, color: 'var(--turf)' },
          { icon: '🛡️', label: 'Admins',    value: admins,    color: 'var(--gold)'  },
          { icon: '🔑', label: 'Pendientes reset', value: pendingPw, color: 'var(--fire)' },
        ].map(({ icon, label, value, color }) => (
          <div key={label} className="card" style={{ padding: '16px 18px' }}>
            <div style={{ height: 2, background: color, borderRadius: 2, marginBottom: 12 }} />
            <p style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-display)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>{icon} {label}</p>
            <p className="f-display" style={{ fontSize: 32, color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Instrucciones */}
      <div className="card" style={{ padding: 16, display: 'flex', gap: 12, borderColor: 'rgba(255,77,0,0.15)' }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>💡</span>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Gestión de acceso</p>
          <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>
            Usa <strong style={{ color: 'var(--fire)' }}>Reset PW</strong> para forzar que un usuario cambie su contraseña al próximo login.
          </p>
        </div>
      </div>

      {/* Lista de usuarios */}
      <div className="card anim-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--stroke-2)', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{filtrados.length} participantes</p>
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{admins} admins · {perfs.filter(p => !p.es_admin).length} jugadores</p>
          </div>
          <input
            type="text"
            placeholder="Buscar nombre..."
            value={q}
            onChange={e => setQ(e.target.value)}
            className="input"
            style={{ width: 180, height: 38, fontSize: 13 }}
          />
        </div>

        {filtrados.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Sin resultados</p>
          </div>
        ) : filtrados.map(p => {
          const nombre   = p.nombre ?? 'Sin nombre'
          const esAdmin  = p.es_admin ?? false
          const esSelf   = p.id === currentUserId
          const needsPw  = p.must_change_password ?? false
          return (
            <UserRow
              key={p.id}
              p={p}
              nombre={nombre}
              esAdmin={esAdmin}
              esSelf={esSelf}
              needsPw={needsPw}
              isPending={isPending}
              onToggle={() => handleToggle(p.id, nombre, esAdmin)}
              onDelete={() => handleDel(p.id, nombre)}
              onResetPw={() => handleResetPw(p.id, nombre)}
            />
          )
        })}
      </div>
    </main>
  )
}

function UserRow({ p, nombre, esAdmin, esSelf, needsPw, isPending, onToggle, onDelete, onResetPw }: {
  p: any; nombre: string; esAdmin: boolean; esSelf: boolean; needsPw: boolean; isPending: boolean
  onToggle: () => void; onDelete: () => void; onResetPw: () => void
}) {
  const [conf, setConf] = useState(false)
  return (
    <div className="row" style={{
      borderLeft: esSelf ? '3px solid var(--turf)' : '3px solid transparent',
      background: esSelf ? 'var(--lime-glow)' : 'transparent',
      flexWrap: 'wrap', gap: 10,
    }}>
      {/* Avatar */}
      {p.avatar_url
        ? <img src={p.avatar_url} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--stroke)', flexShrink: 0 }} alt={nombre} />
        : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--ink-3)', border: '1px solid var(--stroke)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'var(--text-2)', flexShrink: 0 }}>{nombre[0]?.toUpperCase()}</div>
      }

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: esSelf ? 'var(--turf)' : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nombre}</p>
          {esSelf   && <span className="pill pill-lime" style={{ fontSize: 9 }}>TÚ</span>}
          {esAdmin  && <span className="pill pill-gold" style={{ fontSize: 9 }}>ADMIN</span>}
          {needsPw  && <span className="pill pill-fire" style={{ fontSize: 9 }}>🔑 RESET PW</span>}
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Desde {fmt(p.created_at)}</p>
      </div>

      {/* Acciones */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Toggle admin */}
        <button
          onClick={onToggle}
          disabled={esSelf || isPending}
          className="btn btn-outline"
          style={{ fontSize: 11, borderColor: esAdmin ? 'rgba(255,214,10,0.3)' : 'var(--stroke)', color: esAdmin ? 'var(--gold)' : 'var(--text-2)', ...(esSelf ? { opacity: 0.3, cursor: 'not-allowed' } : {}) }}>
          {esAdmin ? '🛡 Admin' : 'Usuario'}
        </button>

        {/* Reset contraseña */}
        {!esSelf && !needsPw && (
          <button
            onClick={onResetPw}
            disabled={isPending}
            className="btn btn-outline"
            style={{ fontSize: 11, color: 'var(--fire)', borderColor: 'var(--stroke-fire)' }}>
            🔑 Reset PW
          </button>
        )}

        {/* Eliminar */}
        {!esSelf && (conf ? (
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => { onDelete(); setConf(false) }} disabled={isPending} className="btn btn-danger" style={{ fontSize: 11, padding: '7px 12px' }}>
              {isPending ? <span style={{ width: 12, height: 12, border: '2px solid var(--red)', borderTopColor: 'transparent', borderRadius: '50%', display: 'block' }} className="anim-spin" /> : 'Confirmar'}
            </button>
            <button onClick={() => setConf(false)} className="btn btn-ghost" style={{ fontSize: 11 }}>Cancelar</button>
          </div>
        ) : (
          <button
            onClick={() => setConf(true)}
            className="btn btn-ghost"
            style={{ fontSize: 11, color: 'rgba(255,59,48,0.4)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,59,48,0.4)')}>
            Eliminar
          </button>
        ))}
      </div>
    </div>
  )
}
