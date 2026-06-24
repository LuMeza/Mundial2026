-- ═══════════════════════════════════════════════════════════════
-- QUINIELA MX 2026 — Políticas RLS para perfiles y pronosticos
-- Ejecutar en: Supabase Dashboard → SQL Editor
--
-- El problema: RLS solo devolvía el propio perfil a cada usuario.
-- La solución en el código ya usa service role para leer todos los
-- perfiles, pero estas políticas son igualmente necesarias para
-- que la app funcione correctamente en todos los casos.
-- ═══════════════════════════════════════════════════════════════

-- ── PERFILES ────────────────────────────────────────────────────

-- Eliminar políticas existentes (para empezar limpio)
DROP POLICY IF EXISTS "Usuarios ven su propio perfil"    ON perfiles;
DROP POLICY IF EXISTS "Usuarios ven todos los perfiles"  ON perfiles;
DROP POLICY IF EXISTS "Usuarios editan su propio perfil" ON perfiles;
DROP POLICY IF EXISTS "Admins gestionan perfiles"        ON perfiles;
DROP POLICY IF EXISTS "perfiles_select_own"              ON perfiles;
DROP POLICY IF EXISTS "perfiles_select_all"              ON perfiles;
DROP POLICY IF EXISTS "perfiles_update_own"              ON perfiles;
DROP POLICY IF EXISTS "perfiles_insert_own"              ON perfiles;

-- SELECT: cualquier usuario autenticado puede ver todos los perfiles
-- (necesario para ranking, dashboard top5, etc.)
CREATE POLICY "perfiles_select_all"
  ON perfiles FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: solo el propio usuario puede crear su perfil
CREATE POLICY "perfiles_insert_own"
  ON perfiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- UPDATE: un usuario puede editar su propio perfil
CREATE POLICY "perfiles_update_own"
  ON perfiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- DELETE: solo service role (las acciones admin usan service role directamente)
-- No se necesita política DELETE para authenticated

-- ── PRONOSTICOS ─────────────────────────────────────────────────

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Usuarios ven sus pronosticos"      ON pronosticos;
DROP POLICY IF EXISTS "Usuarios ven todos pronosticos"    ON pronosticos;
DROP POLICY IF EXISTS "Usuarios insertan sus pronosticos" ON pronosticos;
DROP POLICY IF EXISTS "Usuarios editan sus pronosticos"   ON pronosticos;
DROP POLICY IF EXISTS "pronosticos_select_own"            ON pronosticos;
DROP POLICY IF EXISTS "pronosticos_select_all"            ON pronosticos;
DROP POLICY IF EXISTS "pronosticos_insert_own"            ON pronosticos;
DROP POLICY IF EXISTS "pronosticos_update_own"            ON pronosticos;

-- SELECT: cualquier usuario autenticado puede ver todos los pronósticos
-- (necesario para ranking, resultados, dashboard top5)
CREATE POLICY "pronosticos_select_all"
  ON pronosticos FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: solo el propio usuario puede crear sus pronósticos
CREATE POLICY "pronosticos_insert_own"
  ON pronosticos FOR INSERT
  TO authenticated
  WITH CHECK (usuario_id = auth.uid());

-- UPDATE: solo el propio usuario puede editar sus pronósticos
CREATE POLICY "pronosticos_update_own"
  ON pronosticos FOR UPDATE
  TO authenticated
  USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());

-- ── PARTIDOS ────────────────────────────────────────────────────
-- Los partidos son de solo lectura para usuarios; solo admins (service role) los editan.

DROP POLICY IF EXISTS "partidos_select_all" ON partidos;

CREATE POLICY "partidos_select_all"
  ON partidos FOR SELECT
  TO authenticated
  USING (true);

-- ── VERIFICACIÓN ────────────────────────────────────────────────
-- Ejecuta esto para confirmar que las políticas quedaron bien:
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('perfiles', 'pronosticos', 'partidos')
ORDER BY tablename, policyname;
