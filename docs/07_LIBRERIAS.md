# 07 — Librerías y Dependencias — DonaConnect Ecuador

Verificado contra `backend/package.json` y `frontend/package.json` completos, con confirmación de uso real (grep del import) para cada librería relevante. No hay `package.json` en la raíz — dos proyectos npm independientes, sin monorepo.

---

## 1. Backend — `dependencies`

| Librería | Versión | Para qué sirve | Dónde se usa | Qué pasaría si se elimina |
|---|---|---|---|---|
| `express` | `^4.21.2` | Framework HTTP/enrutamiento | `main/express-app.ts`, todos los `routes/*.ts` | No hay servidor — es la base de toda la capa `main`/`adapters` de entrada |
| `@prisma/client` | `^6.1.0` | Cliente tipado de Postgres, generado desde `schema.prisma` | Todos los `Prisma*Repository.ts` | Sin acceso a Postgres; habría que reescribir 8 repositorios con un driver crudo |
| `mongoose` | `^9.7.4` | ODM de MongoDB | Los 6 `Mongoose*Repository.ts` | Sin acceso a las 6 colecciones Mongo |
| `zod` | `^3.24.1` | Validación de DTOs con inferencia de tipos TS | `schemas.ts` de cada uno de los 12 módulos, `.parse()` inline en cada controller | Sin validación de entrada — cada endpoint tendría que validar a mano |
| `bcrypt` | `^5.1.1` | Hash de contraseñas | `BcryptPasswordHasher.ts` (única implementación de `IPasswordHasher`) | Sin hash — violaría RNF-005 directamente |
| `jsonwebtoken` | `^9.0.2` | Firma/verificación de JWT | `JwtTokenService.ts` (única implementación de `ITokenService`) | Sin autenticación stateless — habría que migrar a sesiones |
| `cors` | `^2.8.5` | Middleware CORS | `express-app.ts:25` | El navegador bloquearía las llamadas del frontend en otro origen |
| `helmet` | `^8.0.0` | Cabeceras HTTP de seguridad | `express-app.ts:24` | Pierde CSP, `X-Frame-Options`, etc. — mitigación de XSS más débil |
| `pino` | `^9.6.0` | Logger estructurado | `main/logger.ts`, usado en casi todos los middlewares/servicios | Sin logs estructurados — solo `console.log` |
| `pino-http` | `^10.4.0` | Middleware de logging HTTP por request (con `request_id`) | `express-app.ts:27` | Sin trazabilidad de requests en logs |
| `@google/genai` | `^2.10.0` | SDK oficial de Google Gemini | `GeminiAdapter.ts` — **el proveedor de IA realmente cableado en `di-container.ts:295`** | Sin IA — rompe chatbot, clasificación, matching, moderación |
| `@anthropic-ai/sdk` | `^0.110.0` | SDK oficial de Claude/Anthropic | `ClaudeAdapter.ts` — **existe, implementa el mismo puerto `IIAProvider`, pero no está instanciado en `di-container.ts`** | Ninguno en producción hoy (no cableado); sí rompería la posibilidad de volver a Claude sin reescribir el adaptador |

## 2. Backend — `devDependencies`

| Librería | Versión | Para qué sirve |
|---|---|---|
| `typescript` | `^5.7.3` | Lenguaje/compilador (ADR-021) |
| `tsx` | `^4.19.2` | Ejecuta TS directo en dev (`npm run dev`: `tsx watch main/express-app.ts`) sin paso de compilación previo |
| `tsc-alias` | `^1.8.10` | Reescribe los path aliases (`@domain/*`, etc.) a rutas relativas reales tras `tsc -p` en el build de producción (`npm run build`) |
| `prisma` | `^6.1.0` | CLI de migraciones/generación de cliente (`prisma:generate`, `prisma:migrate`, `prisma:deploy`) |
| `vitest` | `^2.1.8` | Test runner — los 5 archivos de `backend/tests/` |
| `supertest` | `^7.0.0` | Peticiones HTTP contra la app Express en los tests de integración |
| `eslint` + `@typescript-eslint/{eslint-plugin,parser}` | `^8.57.1`/`^8.19.1` | Linting |
| `@types/{bcrypt,cors,express,jsonwebtoken,node}` | varias | Tipos para librerías sin tipos propios |

**No usada pese a estar en dependencies:** ninguna detectada — las 12 dependencies tienen uso confirmado por grep de import. **Usada sin declarar:** ninguna detectada (todas las llamadas a paquetes externos corresponden a algo en `package.json`).

**Sin rate limiting** (`13_SEGURIDAD.md §6`): no hay `express-rate-limit` ni ninguna librería equivalente en ninguna de las dos listas — es la ausencia más relevante de todo el catálogo de dependencias.

---

## 3. Frontend — `dependencies`

| Librería | Versión | Para qué sirve | Dónde se usa | Qué pasaría si se elimina |
|---|---|---|---|---|
| `react` / `react-dom` | `^18.3.1` | Librería de UI | Toda la SPA | No hay proyecto |
| `react-router-dom` | `^7.1.1` | Enrutamiento SPA | `app/App.tsx` (18 rutas) | Sin navegación entre páginas |
| `@tanstack/react-query` | `^5.62.11` | Cache/invalidación/refetch de estado de servidor | Todos los `features/*/api/`, decisión explícita para no usar Redux/Zustand (ADR-043) | Cada componente tendría que manejar loading/cache/invalidación a mano |
| `@fontsource/inter`, `@fontsource/sora` | `^5.2.8` | Fuentes autoalojadas (sin depender de Google Fonts en runtime) | `main.tsx` (import directo) | Cae a fuentes del sistema |

## 4. Frontend — `devDependencies`

| Librería | Versión | Para qué sirve |
|---|---|---|
| `typescript` | `^5.7.3` | Igual que backend |
| `vite` | `^6.0.7` | Dev server + bundler de producción |
| `@vitejs/plugin-react` | `^4.3.4` | Soporte de JSX/Fast Refresh en Vite |
| `eslint` + `@typescript-eslint/*` + `eslint-plugin-react-hooks` | varias | Linting, incluye reglas de hooks de React |
| `@types/react`, `@types/react-dom` | `^18.3.x` | Tipos |

**Ninguna librería de testing** (`16_PRUEBAS.md`) — no hay Vitest, React Testing Library, Playwright ni Cypress en el frontend, coherente con que no existe ni un solo archivo `*.test.*`/`*.spec.*` en `frontend/src`.

**Sin librería de estado global** (Redux/Zustand/Jotai) — decisión explícita (ADR-043): el estado de servidor lo resuelve TanStack Query, el estado de UI puramente local usa `useState`/`useReducer`.

---

## 5. Scripts — qué hace cada uno

### Backend (`backend/package.json`)

| Script | Comando | Cuándo se usa |
|---|---|---|
| `dev` | `tsx watch main/express-app.ts` | Desarrollo local — recarga en caliente al guardar |
| `build` | `tsc -p tsconfig.json && tsc-alias -p tsconfig.json` | Compila a `dist/`, reescribe los path aliases |
| `start` | `node dist/main/express-app.js` | Ejecuta el build de producción |
| `lint` | `eslint . --ext .ts` | CI + local |
| `typecheck` | `tsc --noEmit` | CI + local, sin generar output |
| `prisma:generate` | `prisma generate` | Regenera el cliente tipado tras cambiar `schema.prisma` |
| `prisma:migrate` | `prisma migrate dev` | Crea y aplica una migración nueva en desarrollo |
| `prisma:deploy` | `prisma migrate deploy` | Aplica migraciones pendientes sin generar una nueva (CI, Docker) |
| `test` | `vitest run` | Corre los 5 archivos de test una vez (no watch) |
| `backfill:perfiles` | `tsx scripts/backfill-usuarios-perfiles.ts` | Script puntual de migración de datos, ya ejecutado (ADR-048), no se vuelve a correr |

### Frontend (`frontend/package.json`)

| Script | Comando |
|---|---|
| `dev` | `vite --host 0.0.0.0 --port 5173` (el `--host` es necesario para exponerse fuera del contenedor Docker) |
| `build` | `tsc -b && vite build` |
| `lint` | `eslint . --ext .ts,.tsx` |
| `typecheck` | `tsc --noEmit` |
| `preview` | `vite preview` (sirve el build de producción localmente, no se usa en Docker — el contenedor `web` corre `dev`, no `preview`) |

---

## 6. Alternativas consideradas (de `docs/DECISIONES.md`, contrastadas con lo real)

| Elección real | Alternativas descartadas | ADR |
|---|---|---|
| Prisma (Postgres) | Sequelize, TypeORM, Knex | ADR-008 |
| Mongoose (Mongo) | Driver nativo de MongoDB | ADR-008 |
| Zod | Joi, class-validator, Yup | ADR-022 (implícito, sin alternativas detalladas en el ADR) |
| TanStack Query | Redux Toolkit Query, SWR, Zustand+fetch manual | ADR-043 |
| Gemini (real) vs. Claude (documentado, ADR-024) | — | Cambio pragmático, no un ADR formal (ver `02_TRAZABILIDAD_SRS_CODIGO.md §2`) |

---

## 7. Qué sigue

`08_INTELIGENCIA_ARTIFICIAL.md` profundiza específicamente en `@google/genai` (el SDK más relevante para la defensa, dado que reemplazó al proveedor originalmente documentado); `09_DOCKER.md` cubre `Dockerfile`/`docker-compose.yml` línea por línea.
