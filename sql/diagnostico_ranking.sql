-- ══════════════════════════════════════════════════════════════
-- DIAGNÓSTICO DE RANKING — Quiniela MX 2026
-- Ejecutar en Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════

-- 1. Ver TODOS los perfiles y cuántos pronósticos tienen
--    (detecta quién no tiene pronósticos cargados)
SELECT 
  p.id,
  p.nombre,
  p.email,
  p.es_admin,
  COUNT(pr.id) as total_pronosticos,
  COALESCE(SUM(CASE WHEN pr.puntos IS NOT NULL THEN pr.puntos ELSE 0 END), 0) as puntos_totales
FROM perfiles p
LEFT JOIN pronosticos pr ON pr.usuario_id = p.id
GROUP BY p.id, p.nombre, p.email, p.es_admin
ORDER BY total_pronosticos ASC, p.nombre ASC;

-- ══════════════════════════════════════════════════════════════

-- 2. Recalcular puntos de TODOS los pronósticos donde el partido ya tiene resultado
--    (fix para Jorge López Jr. y cualquier otro en la misma situación)
UPDATE pronosticos p
SET puntos = CASE
  WHEN p.goles_local = pa.goles_local 
    AND p.goles_visitante = pa.goles_visitante THEN 3
  WHEN 
    (p.goles_local > p.goles_visitante AND pa.goles_local > pa.goles_visitante) OR
    (p.goles_local < p.goles_visitante AND pa.goles_local < pa.goles_visitante) OR
    (p.goles_local = p.goles_visitante AND pa.goles_local = pa.goles_visitante) 
  THEN 1
  ELSE 0
END
FROM partidos pa
WHERE p.partido_id = pa.id
  AND pa.goles_local IS NOT NULL
  AND pa.goles_visitante IS NOT NULL;

-- ══════════════════════════════════════════════════════════════

-- 3. Verificar ranking después del fix (top 10)
SELECT 
  p.nombre,
  COUNT(pr.id) as total_pronos,
  COALESCE(SUM(CASE WHEN pr.puntos IS NOT NULL THEN pr.puntos ELSE 0 END), 0) as puntos,
  COUNT(CASE WHEN pr.puntos = 3 THEN 1 END) as exactos,
  COUNT(CASE WHEN pr.puntos = 1 THEN 1 END) as ganadores,
  COUNT(CASE WHEN pr.puntos = 0 THEN 1 END) as fallos
FROM perfiles p
JOIN pronosticos pr ON pr.usuario_id = p.id
WHERE p.es_admin = false
GROUP BY p.id, p.nombre
ORDER BY puntos DESC, exactos DESC, ganadores DESC
LIMIT 20;
