# Plan de Ejecución — Modelo de Perfiles Funcionales (Opción D)

**Tipo de documento:** tracker vivo de implementación, mismo criterio que `docs/PLAN_IMPLEMENTACION.md` (backend) y `docs/PLAN_FRONTEND.md` (frontend) — distinto de `docs/AUDITORIA_FUNCIONAL_MARKETPLACE.md` y `docs/DISENO_MODELO_PERFILES.md` (diseño/auditoría ya congelados, no se repiten aquí). Se actualiza con checkboxes a medida que se construye cada fase.

**Fuente:** `docs/DISENO_MODELO_PERFILES.md` sección 7 (roadmap técnico, decisión aprobada: Opción D). Objetivo: permitir que un mismo usuario tenga múltiples perfiles funcionales (`DONANTE`/`SOLICITANTE`/`TRUEQUE`/`COMUNIDAD`) simultáneamente, separando esa capacidad de marketplace del rol de seguridad (`ADMINISTRADOR`/`USUARIO`), sin reescribir el sistema existente.

**Alcance de este documento:** Fases 1-4 (obligatorias). La Fase 5 del diseño (Organización con beneficiarios propios, `publicaciones_index`, negociación de trueques, evidencia de entrega) es independiente y priorizable por separado — no forma parte de este tracker hasta que se decida abordarla.

---

## Estado

| Fase | Nombre | Estado |
|---|---|---|
| 1 | Preparación aditiva (tabla + backfill) | ✅ Cerrada (2026-07-14) |
| 2 | Refactorización del dominio (activar Perfiles) | ✅ Cerrada (2026-07-15) |
| 3 | Adaptación del frontend | ✅ Cerrada (2026-07-15) |
| 4 | Migraciones y cierre | ✅ Cerrada (2026-07-15) |

---

## Fase 1 — Preparación aditiva ✅ Cerrada (2026-07-14)

**Por qué es segura:** 100% aditivo — ninguna columna, endpoint o middleware existente se modificó. `rol` sigue con sus 4 valores actuales; `rbacMiddleware` y todas las rutas siguen exactamente igual.

- [x] `PerfilFuncional` (value object) — `domain/identidad/value-objects/PerfilFuncional.ts` (`DONANTE|SOLICITANTE|TRUEQUE|COMUNIDAD`)
- [x] Migración Prisma `20260715022617_add_usuarios_perfiles` — tabla `usuarios_perfiles` (`id_usuario_perfil`, `id_usuario` FK cascade, `perfil`, `fecha`, único compuesto `(usuarioId, perfil)`), mismo patrón relacional que `Ubicacion`. `schema.prisma` documenta la extensión en el encabezado.
- [x] `IUsuarioPerfilRepository` (`domain/identidad/ports/`) — `asignarPerfil`, `quitarPerfil`, `listarPerfiles`, `tienePerfil`
- [x] `PrismaUsuarioPerfilRepository` (`adapters/identidad/repositories/`) — implementa el puerto, `asignarPerfil` usa `upsert` (idempotente)
- [x] Script de backfill `backend/scripts/backfill-usuarios-perfiles.ts` (`npm run backfill:perfiles`) — mapeo exacto del diseño:
  - `DONANTE` → `[DONANTE, TRUEQUE]`
  - `BENEFICIARIO` → `[SOLICITANTE]`
  - `USUARIO_COMUNIDAD` → `[DONANTE, SOLICITANTE, TRUEQUE, COMUNIDAD]`
  - `ADMINISTRADOR` → `[]`
- [x] **Ejecutado contra la base real**: 23 usuarios procesados, 35 perfiles asignados. Verificado idempotente (upsert, no duplica si se corre de nuevo).
- [x] `tsconfig.json` — `scripts/**/*.ts` agregado a `include` para que el backfill tenga typecheck y resolución de alias (`@domain/*`, `@adapters/*`).
- [x] `npm run typecheck && npm run lint && npm run build` — limpios.
- [ ] Reinicio de contenedores — no aplica todavía: `api`/`web` no estaban levantados durante esta fase (solo se usó `postgres` vía el puerto expuesto `5433` desde el host). Se reconstruyen/reinician en la Fase 2, cuando el código en ejecución sí cambia.

**Nota de diseño:** `usuarioPerfilRepository` **no se cableó en `main/di-container.ts` todavía** — a propósito, siguiendo el punto explícito del roadmap ("el sistema de perfiles se construye en paralelo, sin activarse"). Se cablea al inicio de la Fase 2, cuando `perfilMiddleware` y el endpoint `PATCH /usuarios/me/perfiles` empiecen a consumirlo.

---

## Fase 2 — Refactorización del dominio (activar Perfiles) ✅ Cerrada (2026-07-15)

**Riesgo real observado:** medio, como se anticipó — se tocó autorización real y se migró el enum `Rol` con 23 usuarios reales persistidos (5 ADMINISTRADOR, 18 USUARIO). Cero incidentes.

- [x] `PrismaUsuarioPerfilRepository` cableado en `main/di-container.ts`, inyectado en `RegistrarUsuarioUseCase`, `IniciarSesionUseCase`, `ObtenerPerfilUseCase`, `AsignarPerfilesUseCase` y `DashboardQueryService`
- [x] `perfilMiddleware` (`main/middlewares/perfil.middleware.ts`) — verifica `req.usuario.perfiles` (embebido en el JWT en cada login, igual que `rol`; evita una consulta a `usuarios_perfiles` por request)
- [x] `donaciones.routes.ts` → `perfilMiddleware(['DONANTE','COMUNIDAD'])`
- [x] `solicitudes.routes.ts` → `perfilMiddleware(['SOLICITANTE','COMUNIDAD'])` / `perfilMiddleware(['DONANTE','COMUNIDAD'])`
- [x] `trueques.routes.ts` → `perfilMiddleware(['TRUEQUE','COMUNIDAD'])`
- [x] `rbacMiddleware` conservado sin cambios, uso exclusivo `ADMINISTRADOR` (`admin.routes.ts`, `categorias.routes.ts`)
- [x] `TokenPayload` (`ITokenService.ts`) gana `perfiles: PerfilFuncional[]`, poblado en `IniciarSesionUseCase` desde `usuarios_perfiles`
- [x] Endpoint nuevo `PATCH /usuarios/me/perfiles` (`AsignarPerfilesUseCase`, reemplaza el conjunto completo de perfiles) + `GET /usuarios/me` ahora incluye `perfiles` (`ObtenerPerfilUseCase`)
- [x] Migración `20260715030000_reduce_rol_enum` (patrón expand-and-contract: columna temporal + `CASE` explícito, sin cast directo) — `usuarios.rol` reducido a `ADMINISTRADOR | USUARIO`. Verificado antes/después: 5 ADMINISTRADOR sin cambio, 18 USUARIO (11 ex-DONANTE + 5 ex-BENEFICIARIO + 2 ex-USUARIO_COMUNIDAD) — coincide exactamente con el backfill de Fase 1.
- [x] `RegistrarUsuarioUseCase` — input cambia de `rol` a `perfiles: PerfilFuncional[]`; el usuario se crea siempre con `rol: 'USUARIO'` (**corrige de paso un hallazgo real**: el registro público anterior aceptaba `rol: 'ADMINISTRADOR'` sin ninguna verificación — cualquiera podía auto-registrarse como administrador. Confirmado con curl: el payload viejo con `rol` ahora devuelve 400 de validación).
- [x] `registroSchema`/`actualizarPerfilesSchema` (`adapters/identidad/controllers/schemas.ts`) actualizados
- [x] `DashboardQueryService` — reemplaza `IUsuarioRepository.listarPorRol('DONANTE'|'BENEFICIARIO'|'USUARIO_COMUNIDAD')` (ya no existen esos valores) por `IUsuarioPerfilRepository.contarUsuarios(...)`; nombres de campo del DTO (`donantes`/`beneficiarios`/`usuariosComunidad`) sin cambios para no romper el contrato ya consumido por el frontend
- [x] `tests/helpers.ts` — `crearUsuarioDePrueba('ADMINISTRADOR')` ahora siembra directo por Prisma (ya no puede pasar por el registro público); las otras 3 personas de prueba traducen a `perfiles[]` con el mismo mapeo del backfill
- [x] Suite de integración: **3 archivos, 6/6 tests pasando** contra Postgres+Mongo reales (`docker compose exec api npm test`)
- [x] `npm run typecheck && npm run lint && npm run build` — limpios; contenedor `api` reconstruido (`docker compose up -d --build mongo api`) y probado con curl real: registro con `perfiles` (201), registro viejo con `rol` (400 — fix confirmado), `GET /usuarios/me` incluye `perfiles`, `PATCH /usuarios/me/perfiles` reemplaza el set correctamente, `GET /dashboard/impacto` con conteos reales coherentes (donantes 19, beneficiarios 11, comunidad 5)

**Nota de compatibilidad temporal:** el frontend actual (`RegistroForm.tsx`) todavía envía `rol` — el registro desde la UI real quedará roto hasta que la Fase 3 lo adapte. Se prioriza cerrar Fase 3 en la misma sesión para minimizar esa ventana.

---

## Fase 3 — Adaptación del frontend ✅ Cerrada (2026-07-15)

- [x] `useSesion()` expone `perfiles` — vía tipo `PerfilPropio` (extiende `UsuarioPublico`, usado solo por `GET /usuarios/me`; `registro`/`login` mantienen `UsuarioPublico` sin perfiles, espejo exacto de lo que el backend realmente devuelve en cada endpoint)
- [x] Guards inline reemplazados: `ROLES_PUEDEN_PUBLICAR`→`PERFILES_PUEDEN_PUBLICAR` (`DonacionesPage.tsx`, `SolicitudesPage.tsx`, `TruequesPage.tsx`), `ROLES_PUEDEN_OFERTAR`→`PERFILES_PUEDEN_OFERTAR` (`SolicitudDetallePage.tsx`), `ROLES_PUEDEN_PROPONER`→`PERFILES_PUEDEN_PROPONER` (`TruequeDetallePage.tsx`) — 5 páginas, mismo patrón (`.some((p) => sesion.data.perfiles.includes(p))`)
- [x] **Decisión explícita del usuario, distinta del roadmap original:** `nav-items.ts`/`Sidebar.tsx`/`BottomTabBar.tsx` **no se filtran por perfil**. Razón: Donaciones/Solicitudes/Trueques son navegación pública (rutas `GET` con `authOpcionalMiddleware`, visibles incluso sin sesión) — ocultar una sección a un usuario logueado sin ese perfil le impediría descubrir que podría activarlo, y es inconsistente con que un visitante anónimo sigue viendo todo. Los perfiles gatean únicamente los botones de acción (`+Publicar`, `Ofertar`, `Proponer`), ya cubierto por el punto anterior.
- [x] `RegistroForm.tsx` — checkboxes de selección múltiple (`DONANTE`/`SOLICITANTE`/`TRUEQUE`/`COMUNIDAD`), reemplaza el `<select>` único de rol; valida al menos un perfil antes de habilitar el submit
- [x] `PerfilPage.tsx` — nueva sección en el tab Cuenta: checkboxes + botón "Guardar perfiles", consume `useActualizarPerfiles` (`PATCH /usuarios/me/perfiles`), invalida `['sesion']` al guardar
- [x] `identidad.api.ts`/`types/index.ts` — `PerfilFuncional`, `PerfilPropio`, `ActualizarPerfilesInput`, `identidadApi.actualizarPerfiles`
- [x] `npm run typecheck && npm run lint && npm run build` — limpios; contenedor `web` levantado (`docker compose up -d web`), Vite sirve sin errores de compilación (`curl` a `/` y `/src/main.tsx`, HTTP 200)
- [ ] Verificación visual en navegador — **pendiente del usuario** (el agente no tiene acceso a un navegador real, mismo criterio que todo `PLAN_FRONTEND.md`): probar registro con perfiles múltiples y la nueva sección de `PerfilPage` en `http://127.0.0.1:5173`

---

## Fase 4 — Migraciones y cierre ✅ Cerrada (2026-07-15)

- [x] Suite de tests de integración ampliada — `tests/perfiles.test.ts` (nuevo, 5 tests): rechaza el contrato viejo de registro con `rol` (400), un usuario con solo `SOLICITANTE` no puede publicar Donación (403), un usuario con solo `DONANTE` no puede crear Solicitud (403), `PATCH /usuarios/me/perfiles` cambia efectivamente lo que el siguiente login puede hacer, `GET /usuarios/me` refleja los perfiles asignados. **Suite completa: 4 archivos, 11/11 tests pasando** (`docker compose exec api npm test`).
- [x] Cero regresión funcional confirmada — los 6 tests pre-existentes (Donaciones/Solicitudes/Trueques) siguen pasando sin modificar su lógica de negocio, solo `tests/helpers.ts` tradujo personas de prueba a perfiles
- [x] ADR-048 en `docs/DECISIONES.md`
- [x] Historial de desviación en `docs/fases/fase-02-diseno-dominio.md` (entrada 2026-07-15)
- [x] Cierre de este documento (esta entrada)

**Resumen de cierre:** Opción D implementada de punta a punta en una sola sesión (2026-07-14/15) — 23 usuarios reales migrados sin pérdida de capacidad (backfill Fase 1 → migración de enum Fase 2, verificados 1-a-1), cero cambios en Aggregates/Domain Services/casos de uso de Donaciones-Solicitudes-Trueques (la autorización nunca vivió en `domain/`), y un hallazgo de seguridad real corregido de paso (registro público ya no puede crear `ADMINISTRADOR`). Pendiente exclusivamente la verificación visual del usuario en navegador.

---

## Fuera del alcance de este documento

- **Fase 5 del diseño** (`docs/DISENO_MODELO_PERFILES.md` sección 7): `Organizacion` (agregado nuevo), `publicaciones_index` (historial/mis-publicaciones), evidencia fotográfica de entrega, negociación real en Trueques — cada una independiente y priorizable por separado, ninguna es prerequisito de Fase 1-4 de este documento.
