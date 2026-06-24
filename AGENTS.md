# quiniela-mundial

Aplicación de quiniela para el Mundial 2026. Los usuarios registran sus pronósticos de cada partido y obtienen puntos según acierten marcador exacto o ganador.

---

## Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19 + TypeScript 5
- **Estilos:** Tailwind CSS 4 (sin `tailwind.config` — configurado vía `@tailwindcss/postcss` en PostCSS)
- **Base de datos / Auth:** Supabase (PostgreSQL + Auth)
- **3D:** Three.js / `@react-three/fiber` + `@react-three/drei` (solo en ranking)
- **Fuentes:** Barlow Condensed (títulos), Barlow (cuerpo)
- **Path alias:** `@/*` → raíz del proyecto

## Comandos

```bash
npm run dev      # next dev → http://localhost:3000
npm run build    # next build
npm run start    # next start
npm run lint     # ESLint (flat config en eslint.config.mjs)
```

**No hay framework de testing** (ni Jest, ni Vitest, ni Playwright).  
**No hay script de typecheck** — usar `npx tsc --noEmit` directamente si se necesita.

## Base de datos (Supabase)

### Tablas principales

| Tabla | Propósito |
|---|---|
| `perfiles` | Usuarios — columnas clave: `es_admin` (boolean), `nombre`, `puntaje_total` |
| `partidos` | Partidos del mundial — `fase`, `grupo`, `equipo_local`, `equipo_visita`, `fecha`, `goles_local`, `goles_visita` (null si no jugado) |
| `pronosticos` | Pronósticos de usuarios — `usuario_id`, `partido_id`, `goles_local`, `goles_visita` |

### Sistema de puntuación

- **3 puntos** — marcador exacto
- **1 punto** — acierto de ganador (o empate), pero no marcador exacto
- **0 puntos** — totalmente errado

### Autenticación

Supabase SSR con manejo de cookies. Hay **tres clientes**:

| Archivo | Uso |
|---|---|
| `lib/supabase/server.ts` | Componentes de servidor — usa cookies, respeta RLS |
| `lib/supabase/client.ts` | Navegador — `createBrowserClient` |
| `lib/supabase/service.ts` | Servicio — usa `service_role` key, **bypassea RLS**, solo para acciones de admin |

**No hay `middleware.ts`** — la protección de rutas se hace manualmente en cada server component (verificando `supabase.auth.getUser()`).

### Políticas RLS

Definidas en `sql/rls_policies.sql`:
- `perfiles`: cada usuario puede leer su propio perfil; admins pueden leer todo
- `pronosticos`: cada usuario puede leer/insertar/actualizar sus propios pronósticos; admins pueden leer todo

## Arquitectura del proyecto

```
app/                        # App Router de Next.js
├── quiniela/               # Dashboard principal
│   ├── page.tsx            #   Vista de pronósticos activos + cuenta regresiva
│   ├── actions.ts          #   Server actions del dashboard
│   ├── PartidoCard.tsx     #   Tarjeta de partido individual
│   ├── Countdown.tsx       #   Cuenta regresiva al próximo partido
│   ├── DashboardStats.tsx  #   Estadísticas del usuario
│   ├── ProgresoBars.tsx    #   Barras de progreso
│   └── LogoutButton.tsx    #   Botón de cierre de sesión
├── quiniela/partidos/      # Registro de pronósticos
│   ├── page.tsx            #   Página principal
│   └── PartidosClient.tsx  #   Cliente con filtros (fase/grupo) y formularios
├── ranking/                # Ranking completo
│   ├── page.tsx            #   Página con tabla + podio 3D
│   ├── actions.ts          #   Server actions del ranking
│   ├── RankingFila.tsx     #   Fila individual de la tabla
│   ├── PodioCard.tsx       #   Tarjeta de podio (Top 3)
│   └── RankingBg.tsx       #   Fondo 3D con Three.js
├── resultados/             # Resultados + medallas/logros
│   ├── page.tsx            #   Página principal
│   └── ResultadosStats.tsx #   Estadísticas y badges del usuario
├── login/                  # Inicio de sesión
│   ├── page.tsx            #   Login con email/contraseña
│   ├── LoginBall.tsx       #   Animación decorativa
│   └── ForcePasswordChange.tsx  # Modal forzar cambio de contraseña
├── admin/                  # Panel de administración
│   ├── page.tsx            #   Dashboard admin
│   ├── actions.ts          #   Server actions de admin
│   ├── AdminPartidoCard.tsx     #   Editar resultados de partidos
│   ├── AdminFaseControl.tsx     #   Abrir/cerrar fases
│   └── AdminEquipoEditor.tsx    #   Editar nombres de equipos
├── admin/usuarios/         # Gestión de usuarios
│   ├── page.tsx            #   Lista de usuarios
│   ├── actions.ts          #   Actions: toggle admin, eliminar, reset pass
│   └── UsuariosClient.tsx  #   Cliente con tabla de usuarios
├── admin/pronosticos/      # Visor de pronósticos (admin)
│   ├── page.tsx            #   Página con filtros
│   └── AdminPronosticosClient.tsx  # Cliente con filtros por usuario/partido
├── api/voucher/route.ts    # Endpoint GET /api/voucher → HTML (voucher imprimible)
├── auth/callback/route.ts  # Callback OAuth de Supabase
├── components/
│   ├── Header.tsx          # Barra de navegación superior
│   ├── Nav.tsx             # Navegación inferior/lateral
│   └── CountUp.tsx         # Contador animado
├── layout.tsx              # Layout raíz (fuentes, metadata, body wrapper)
├── page.tsx                # Redirige / → /quiniela
└── globals.css             # Estilos globales + variables CSS dark-theme

api/voucher/route.ts        # 🚫 ORFANO — diseño alternativo no usado (no editar)

lib/supabase/
├── server.ts               # Cliente Supabase para server components (cookies, RLS)
├── client.ts               # Cliente Supabase para el navegador
└── service.ts              # Cliente service_role (bypasea RLS)

scripts/                    # Scripts Node.js de seed/reparación (no se ejecutan en build)
├── seed-users.js           # Crear 44 usuarios en Auth + perfiles
├── seed-p43-p44-fix.js     # Corrección para usuarios 43-44
├── seed-nuevos.js          # Seed adicional de usuarios
├── seed-nuevos-completo.js # Reseed completo de usuarios
├── fix-pronosticos.js      # Corrección masiva de pronósticos
└── fix-p04.js              # Corrección para partido 04

sql/                        # Migraciones y diagnósticos SQL
├── rls_policies.sql        # Políticas RLS de Supabase
├── auth_email_password.sql # Migración auth + columna must_change_password
└── diagnostico_ranking.sql # Consultas de diagnóstico y recálculo de ranking
```

## Particularidades importantes

### 1. Dos archivos de voucher
- **`app/api/voucher/route.ts`** — el que realmente funciona (GET → HTML con pronósticos del usuario). Diseño simple con impresión automática.
- **`api/voucher/route.ts`** (raíz, fuera de `app/`) — **huérfano**, no es servido por Next.js. Es un diseño alternativo más elaborado (ticket troquelado, banderas, folio). No editarlo, no moverlo.

### 2. Sin middleware de autenticación
Cada página verifica la sesión manualmente al inicio del server component. Patrón típico:
```ts
const supabase = createServerClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login')
```

### 3. Límite de 1000 filas en Supabase
Las consultas de ranking usan paginación de 1000 en 1000 para evitar el límite de `in()` de Supabase. Ver `app/ranking/actions.ts` para el patrón.

### 4. .env.local tiene secretos duplicados
Las líneas 1–3 están comentadas pero son copias exactas de las líneas 4–6 activas. Es inofensivo pero redundante.

### 5. Tailwind CSS v4
No hay `tailwind.config.js` ni `tailwind.config.ts`. La configuración se hace únicamente vía PostCSS con el plugin `@tailwindcss/postcss`. Las variables y temas se definen en `app/globals.css`.

### 6. Server Actions
Todas las mutaciones (crear/editar pronósticos, cambiar resultados, gestionar usuarios) usan Server Actions de Next.js, definidas en archivos `actions.ts` dentro de cada ruta. No hay API routes para mutaciones.

### 7. Admin
El flag `es_admin` (boolean) en la tabla `perfiles` controla el acceso al panel de admin. Las server actions de admin usan el cliente `service.ts` para bypassear RLS y poder leer/escribir datos de cualquier usuario.
