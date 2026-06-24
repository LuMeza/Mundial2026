'use client'
import LogoutButton from '@/app/quiniela/LogoutButton'

interface Props {
  nombre: string
  avatarUrl?: string | null
  esAdmin?: boolean
  backHref?: string
  backLabel?: string
  subtitle?: string
  title?: string
}

export default function Header({ nombre, avatarUrl, esAdmin, backHref, backLabel, subtitle, title }: Props) {
  const inicial = nombre[0]?.toUpperCase() ?? 'U'
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(8,11,15,0.96)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--stroke)',
    }}>
      {/* Línea animada arriba */}
      <div style={{ height: 2, background: 'linear-gradient(90deg, var(--turf), var(--fire) 50%, var(--turf))', backgroundSize: '200% 100%', animation: 'fire-sweep 4s linear infinite' }} />
      <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          {backHref && (
            <a href={backHref} className="header-back-btn">←</a>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg, var(--fire), #FF8000)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0, boxShadow: '0 3px 10px rgba(255,77,0,0.3)' }}>⚽</div>
            <div style={{ minWidth: 0 }}>
              <p className="f-display" style={{ fontSize: 20, color: 'var(--text)', letterSpacing: '0.04em', lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title ?? 'QUINIELA MX 2026'}</p>
              {subtitle && <p style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, marginTop: 2, fontFamily: 'var(--font-display)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{subtitle}</p>}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {esAdmin && (
            <a href="/admin" className="header-nav-link header-admin-link">🛡️ ADMIN</a>
          )}
          {[
            { href: '/quiniela', label: '⚡ Dashboard' },
            { href: '/quiniela/partidos', label: '🎯 Pronósticos' },
            { href: '/ranking', label: '🏆 Ranking' },
            { href: '/resultados', label: '📊 Resultados' },
          ].map(({ href, label }) => (
            <a key={href} href={href} className="header-nav-link">{label}</a>
          ))}
          {avatarUrl ? (
            <img src={avatarUrl} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--stroke-fire)', flexShrink: 0 }} alt={nombre} />
          ) : (
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--fire-dim)', border: '2px solid var(--stroke-fire)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: 'var(--fire)', flexShrink: 0, fontFamily: 'var(--font-display)' }}>{inicial}</div>
          )}
          <LogoutButton />
        </div>
      </div>
      <style>{`
        .header-back-btn {
          flex-shrink: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
          border-radius: 8px; background: var(--ink-3); border: 1px solid var(--stroke); color: var(--text-2);
          font-size: 14px; font-weight: 700; text-decoration: none;
          transition: color 0.15s, border-color 0.15s; font-family: var(--font-display);
        }
        .header-back-btn:hover { color: var(--fire); border-color: var(--stroke-fire); }
        .header-nav-link {
          font-size: 10px; font-weight: 600; color: var(--text-3); background: var(--ink-3);
          border: 1px solid var(--stroke); padding: 4px 10px; border-radius: 4px; text-decoration: none;
          font-family: var(--font-display); letter-spacing: 0.06em; text-transform: uppercase;
          transition: all 0.15s; white-space: nowrap;
        }
        .header-nav-link:hover { color: var(--fire); border-color: var(--stroke-fire); }
        .header-admin-link { color: var(--gold); background: var(--gold-dim); border-color: rgba(255,214,10,0.2); }
        .header-admin-link:hover { background: rgba(255,214,10,0.18); border-color: rgba(255,214,10,0.4); color: var(--gold); }
      `}</style>
    </header>
  )
}
