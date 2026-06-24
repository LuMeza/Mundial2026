'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props { onDone: () => void }

export default function ForcePasswordChange({ onDone }: Props) {
  const [newPw,  setNewPw]  = useState('')
  const [confPw, setConfPw] = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (newPw.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return }
    if (newPw !== confPw)  { setError('Las contraseñas no coinciden.'); return }

    setLoading(true)
    const supabase = createClient()

    // 1. Cambiar la contraseña en Auth
    const { error: pwErr } = await supabase.auth.updateUser({ password: newPw })
    if (pwErr) { setError(pwErr.message); setLoading(false); return }

    // 2. Marcar must_change_password = false en perfiles
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('perfiles')
        .update({ must_change_password: false })
        .eq('id', user.id)
    }

    setLoading(false)
    onDone()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '24px 20px',
      backdropFilter: 'blur(8px)',
    }}>
      <div className="card" style={{
        width: '100%', maxWidth: 420, padding: 36,
        border: '1px solid var(--stroke-fire)',
        background: 'var(--ink-2)',
        animation: 'fade-up 0.35s cubic-bezier(0.16,1,0.3,1) both',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, var(--fire), #FF8000)',
            borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, boxShadow: '0 8px 28px rgba(255,77,0,0.4)',
          }}>🔐</div>
          <h2 className="f-display" style={{ fontSize: 32, color: 'var(--text)', marginBottom: 8 }}>
            CAMBIA TU CONTRASEÑA
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-2)', fontFamily: 'var(--font-body)', lineHeight: 1.5 }}>
            Es tu primer acceso. Crea una contraseña personal para continuar.
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.3)',
            color: 'var(--red-hot)', borderRadius: 8, padding: '10px 14px',
            fontSize: 13, fontFamily: 'var(--font-body)', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span>✗</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', fontFamily: 'var(--font-display)' }}>
              Nueva contraseña
            </label>
            <input
              type="password"
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              className="input"
              style={{ height: 50, fontSize: 15 }}
              autoFocus
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', fontFamily: 'var(--font-display)' }}>
              Confirmar contraseña
            </label>
            <input
              type="password"
              value={confPw}
              onChange={e => setConfPw(e.target.value)}
              required
              placeholder="Repite tu nueva contraseña"
              className="input"
              style={{ height: 50, fontSize: 15 }}
            />
          </div>

          {/* Indicador de fuerza (visual) */}
          {newPw.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div className="prog-track">
                <div className="prog-fill" style={{
                  width: `${Math.min(100, (newPw.length / 12) * 100)}%`,
                  background: newPw.length < 8 ? 'var(--red-hot)' : newPw.length < 10 ? 'var(--gold)' : 'var(--turf)',
                }} />
              </div>
              <p style={{ fontSize: 11, color: newPw.length < 8 ? 'var(--red-hot)' : newPw.length < 10 ? 'var(--gold)' : 'var(--turf)', fontFamily: 'var(--font-body)' }}>
                {newPw.length < 8 ? `Faltan ${8 - newPw.length} caracteres más` : newPw.length < 10 ? 'Contraseña aceptable' : '✓ Contraseña fuerte'}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4,
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              background: 'linear-gradient(135deg, var(--fire), #FF7A00)',
              color: '#fff', border: 'none', borderRadius: 10,
              padding: '16px 24px', fontSize: 15, fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              fontFamily: 'var(--font-display)', letterSpacing: '0.06em', textTransform: 'uppercase',
              boxShadow: '0 4px 16px rgba(255,77,0,0.3)',
              transition: 'transform 0.18s, box-shadow 0.18s',
            }}>
            {loading
              ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%' }} className="anim-spin" /><span>Guardando...</span></>
              : '🔒 Establecer contraseña'
            }
          </button>
        </form>
      </div>
    </div>
  )
}
