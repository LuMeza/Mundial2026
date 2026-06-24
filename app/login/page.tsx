'use client'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoginBall from './LoginBall'
import ForcePasswordChange from './ForcePasswordChange'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [rdy, setRdy]           = useState(false)
  const [showForce, setShowForce] = useState(false)

  useEffect(() => { setTimeout(() => setRdy(true), 80) }, [])

  // Si ya hay sesión activa al montar, chequear must_change_password
  useEffect(() => {
    let isMounted = true
    const supabase = createClient()
    
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session && isMounted) await checkMustChange(session.user.id)
      } catch (err) {
        console.error('Error checking session:', err)
      }
    }
    
    checkSession()
    return () => { isMounted = false }
  }, [])

  const checkMustChange = async (userId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('perfiles')
      .select('must_change_password')
      .eq('id', userId)
      .single()
    if (data?.must_change_password) {
      setShowForce(true)
    } else {
      router.push('/quiniela')
      router.refresh()
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    if (signInError) {
      setError('Email o contraseña incorrectos.')
      setLoading(false)
      return
    }
    if (data.user) await checkMustChange(data.user.id)
    setLoading(false)
  }

  return (
    <div className="page" style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>

      {/* Modal cambio de contraseña (primer login) */}
      {showForce && <ForcePasswordChange onDone={() => { setShowForce(false); router.push('/quiniela'); router.refresh() }} />}

      {/* Barra top */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, var(--turf), var(--fire) 50%, var(--turf))', backgroundSize: '200% 100%', animation: 'fire-sweep 4s linear infinite', zIndex: 100 }} />

      {/* Balón 3D Three.js */}
      <LoginBall />

      {/* Decoración estática */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', userSelect: 'none' }}>
        <span className="f-display" style={{ position: 'absolute', fontSize: 'clamp(200px,35vw,480px)', color: 'rgba(255,77,0,0.018)', bottom: -60, right: -20, lineHeight: 0.8, letterSpacing: '-0.05em', fontWeight: 900, fontStyle: 'italic' }}>26</span>
        <div style={{ position: 'absolute', top: '28%', left: '58%', width: 340, height: 340, borderRadius: '50%', border: '1px solid rgba(0,212,106,0.04)', transform: 'translate(-50%, -50%)' }} />
        <div style={{ position: 'absolute', top: '28%', left: '58%', width: 64, height: 64, borderRadius: '50%', border: '1px solid rgba(0,212,106,0.06)', transform: 'translate(-50%, -50%)' }} />
        <div style={{ position: 'absolute', top: '28%', left: '58%', width: 1, height: '60%', background: 'rgba(0,212,106,0.03)', transform: 'translateX(-50%)' }} />
      </div>

      <div style={{ position: 'relative', width: '100%', maxWidth: 440, zIndex: 1 }}>

        {/* Logo + letras animadas */}
        <div className="anim-up" style={{ marginBottom: 44, opacity: rdy ? 1 : 0, transition: 'opacity 0.4s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
            <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg, var(--fire), #FF8000)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0, boxShadow: '0 8px 28px rgba(255,77,0,0.4)' }}>⚽</div>
            <div style={{ flex: 1, height: 2, background: 'linear-gradient(90deg, var(--fire), transparent)' }} />
          </div>
          <h1 className="f-display login-title" style={{ fontSize: 'clamp(64px,13vw,108px)', lineHeight: 0.88, marginBottom: 4 }}>
            {'QUINIELA'.split('').map((l, i) => (
              <span key={i} className="login-letter" style={{ animationDelay: `${i * 55 + 120}ms` }}>{l}</span>
            ))}
          </h1>
          <p className="f-display" style={{ fontSize: 'clamp(30px,6vw,50px)', color: 'var(--fire)', marginBottom: 18, letterSpacing: '0.06em', fontStyle: 'italic', opacity: rdy ? 1 : 0, transition: 'opacity 0.5s 0.7s' }}>
            MUNDIAL 2026
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-2)', fontFamily: 'var(--font-body)', fontWeight: 500, opacity: rdy ? 1 : 0, transition: 'opacity 0.5s 0.85s' }}>
            Pronostica · Compite · <span style={{ color: 'var(--turf)', fontWeight: 700 }}>Demuestra que sí sabes</span>
          </p>
        </div>

        {/* Stats */}
        <div className="anim-in d2" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 36, opacity: rdy ? 1 : 0, transition: 'opacity 0.5s 0.5s' }}>
          {[
            { v: '104', l: 'Partidos', c: 'var(--fire)' },
            { v: '12',  l: 'Grupos',   c: 'var(--turf)' },
            { v: '48',  l: 'Naciones', c: 'var(--gold)' },
          ].map(({ v, l, c }) => (
            <div key={l} className="card" style={{ padding: '18px 12px', textAlign: 'center' }}>
              <div style={{ height: 2, background: c, marginBottom: 12, borderRadius: 2 }} />
              <p className="f-display" style={{ fontSize: 36, color: c, marginBottom: 2, lineHeight: 1 }}>{v}</p>
              <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-display)' }}>{l}</p>
            </div>
          ))}
        </div>

        {/* Formulario email + password */}
        <div style={{ opacity: rdy ? 1 : 0, transition: 'opacity 0.5s 0.65s' }}>
          {error && (
            <div style={{ background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.3)', color: 'var(--red-hot)', borderRadius: 8, padding: '11px 16px', fontSize: 13, fontFamily: 'var(--font-body)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>✗</span> {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', fontFamily: 'var(--font-display)' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="nombre@quiniela2026.mx"
                className="input"
                style={{ height: 50, fontSize: 15 }}
                autoComplete="email"
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', fontFamily: 'var(--font-display)' }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="input"
                style={{ height: 50, fontSize: 15 }}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="login-btn"
              style={{
                marginTop: 4,
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                background: 'linear-gradient(135deg, var(--fire), #FF7A00)',
                color: '#fff', border: 'none', borderRadius: 10,
                padding: '17px 24px', fontSize: 16, fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                fontFamily: 'var(--font-display)', letterSpacing: '0.06em', textTransform: 'uppercase',
                boxShadow: '0 4px 20px rgba(255,77,0,0.35)',
                transition: 'transform 0.18s, box-shadow 0.18s',
              }}>
              {loading
                ? <><div style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', flexShrink: 0 }} className="anim-spin" /><span>Entrando...</span></>
                : <><span style={{ fontSize: 18 }}>⚽</span><span>Entrar a la Quiniela</span></>
              }
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-3)', marginTop: 16, fontFamily: 'var(--font-body)' }}>
            Acceso exclusivo para participantes · Mundial 2026
          </p>
        </div>

        {/* Franjas MX */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 36 }}>
          {['#006830', 'rgba(255,255,255,0.15)', '#CE1126'].map((c, i) => (
            <div key={i} style={{ height: 3, width: 36, borderRadius: 99, background: c }} />
          ))}
        </div>
      </div>

      <style>{`
        .login-title { color: var(--text); display: inline-block; }
        .login-letter {
          display: inline-block;
          opacity: 0;
          transform: translateY(-40px) rotate(-8deg);
          animation: letter-drop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes letter-drop {
          to { opacity: 1; transform: translateY(0) rotate(0deg); }
        }
        .login-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(255,77,0,0.55) !important;
        }
        .login-btn:active:not(:disabled) { transform: scale(0.97); }
      `}</style>
    </div>
  )
}
