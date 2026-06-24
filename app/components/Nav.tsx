'use client'
import { useState } from 'react'
import LogoutButton from '@/app/quiniela/LogoutButton'

interface Props {
  nombre: string
  avatarUrl?: string | null
  esAdmin?: boolean
  pagina?: string
}

const LINKS = [
  { href: '/quiniela',          label: 'Dashboard',    icon: '⚡' },
  { href: '/quiniela/partidos', label: 'Pronósticos',  icon: '🎯' },
  { href: '/ranking',           label: 'Ranking',      icon: '🏆' },
  { href: '/resultados',        label: 'Resultados',   icon: '📊' },
]

export default function Nav({ nombre, avatarUrl, esAdmin, pagina }: Props) {
  const [open, setOpen] = useState(false)
  const ini = nombre[0]?.toUpperCase() ?? 'U'

  return (
    <>
      <nav className="site-nav">
        <div className="wrap" style={{ height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>

          {/* Logo */}
          <a href="/quiniela" className="nav-logo">
            <div className="nav-logo-icon">⚽</div>
            <div style={{ display: 'none' }} id="nav-brand">
              <span className="nav-logo-text">QMX<span>26</span></span>
            </div>
          </a>

          {/* Links desktop */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, justifyContent: 'center' }} className="nav-desktop-links">
            {LINKS.map(l => (
              <a key={l.href} href={l.href} className={`nav-item ${pagina === l.href ? 'active' : ''}`}>
                <span className="tab-icon">{l.icon}</span>
                {l.label}
              </a>
            ))}
          </div>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {esAdmin && (
              <a href="/admin" className="nav-item admin-link nav-admin-btn">
                <span className="tab-icon">🛡️</span>ADMIN
              </a>
            )}

            {/* Avatar */}
            {avatarUrl
              ? <img src={avatarUrl} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--stroke-fire)', flexShrink: 0, transition: 'border-color 0.2s' }} alt={nombre}
                  onMouseEnter={e => (e.target as HTMLImageElement).style.borderColor = 'var(--fire)'}
                  onMouseLeave={e => (e.target as HTMLImageElement).style.borderColor = 'var(--stroke-fire)'}
                />
              : <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--ink-3)', border: '2px solid var(--stroke-fire)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'var(--fire)', fontFamily: 'var(--font-display)', flexShrink: 0 }}>{ini}</div>
            }

            <div className="nav-logout-btn"><LogoutButton /></div>

            {/* Hamburger */}
            <button onClick={() => setOpen(o => !o)} className="nav-hamburger" aria-label="Menú">
              <span style={{ transform: open ? 'rotate(45deg) translate(4px,4px)' : 'none' }} />
              <span style={{ opacity: open ? 0 : 1 }} />
              <span style={{ transform: open ? 'rotate(-45deg) translate(4px,-4px)' : 'none' }} />
            </button>
          </div>
        </div>
      </nav>

      {/* Menú móvil */}
      {open && (
        <div className="anim-down" style={{ background: 'rgba(8,11,15,0.98)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--stroke)', position: 'relative', zIndex: 99 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '12px 16px 16px' }}>
            {LINKS.map(l => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)}
                className={`nav-item ${pagina === l.href ? 'active' : ''}`}
                style={{ justifyContent: 'flex-start', padding: '13px 16px', borderRadius: 8 }}>
                <span className="tab-icon">{l.icon}</span>
                {l.label}
              </a>
            ))}
            {esAdmin && (
              <a href="/admin" onClick={() => setOpen(false)} className="nav-item admin-link"
                style={{ justifyContent: 'flex-start', padding: '13px 16px', borderRadius: 8, marginTop: 4 }}>
                <span className="tab-icon">🛡️</span>Panel Admin
              </a>
            )}
            <div style={{ borderTop: '1px solid var(--stroke)', paddingTop: 12, marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {avatarUrl
                  ? <img src={avatarUrl} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--stroke-fire)' }} alt={nombre} />
                  : <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--fire-dim)', border: '1px solid var(--stroke-fire)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: 'var(--fire)', fontFamily: 'var(--font-display)' }}>{ini}</div>
                }
                <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}>{nombre}</span>
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          #nav-brand { display: block !important; }
          .nav-hamburger { display: none !important; }
        }
        @media (max-width: 767px) {
          .nav-desktop-links { display: none !important; }
          .nav-admin-btn { display: none !important; }
          .nav-logout-btn { display: none !important; }
        }
      `}</style>
    </>
  )
}
