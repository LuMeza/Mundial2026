-- ═══════════════════════════════════════════════════════════════
-- QUINIELA MX 2026 — Migración: Google OAuth → Email/Password
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- 1. Agregar columna must_change_password a perfiles
--    TRUE = el usuario verá el modal de cambio al próximo login
ALTER TABLE perfiles
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Verificar que quedó bien
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'perfiles'
  AND column_name = 'must_change_password';

-- ── NOTA SOBRE DESHABILITAR GOOGLE ──────────────────────────────
-- Esto NO se hace con SQL, se hace en el Dashboard de Supabase:
--
--   Authentication → Providers → Google → OFF
--   Authentication → Providers → Email  → ON
--   Authentication → Providers → Email  → "Confirm email" → OFF
--     (para que los usuarios no necesiten confirmar su correo,
--      ya que los emails son internos @quiniela2026.mx)
-- ────────────────────────────────────────────────────────────────
