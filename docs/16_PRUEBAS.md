# 16 — Pruebas — DonaConnect Ecuador

Inventario de lo que existe (verificado leyendo los 6 archivos completos) + plan de pruebas para los huecos reales identificados en esta auditoría.

---

## 1. Qué existe — clasificación

**Todas son pruebas de integración HTTP** (Vitest + Supertest, contra `app` de Express real, con Postgres/Mongo reales — no hay una sola prueba unitaria de dominio en aislamiento, ni mocks de repositorio). No hay pruebas de componentes de frontend, end-to-end de navegador, de seguridad automatizadas, ni de rendimiento/carga.

| Archivo | Casos reales (contados) | Qué cubren |
|---|---|---|
| `donaciones.test.ts` | 2 | Rechazo sin auth (401); flujo completo crear→listar→cancelar (happy path) |
| `solicitudes.test.ts` | ~4 (97 líneas) | Flujo de creación + ofertas |
| `trueques.test.ts` | ~3 (76 líneas) | Flujo de creación + propuestas |
| `perfiles.test.ts` | 6 | Rechazo de contrato viejo (`rol`), 403 por perfil insuficiente (2 casos), `PATCH /usuarios/me/perfiles` + necesidad de re-login para que el JWT refleje el cambio, `GET /usuarios/me` consistente, rechazo de `COMUNIDAD` (ADR-049) |
| `publicaciones.test.ts` | varios (156 líneas) | Módulo nuevo `GET /publicaciones/mias` |
| `helpers.ts` | — | Fixtures: `crearUsuarioDePrueba(perfil)`, `obtenerCategoriaId()` |

**Hallazgo operativo confirmado por `perfiles.test.ts:70-88`:** cambiar los perfiles de un usuario vía `PATCH /usuarios/me/perfiles` **no tiene efecto inmediato** — el JWT ya emitido sigue con los perfiles viejos hasta el siguiente login, porque `perfiles` va embebido en el token (`ITokenService.ts:10`, decisión explícita para evitar una consulta extra por request). Vale la pena tenerlo presente para la demo en vivo: si se cambia un perfil desde `PerfilPage.tsx` y se prueba publicar sin volver a loguear, va a fallar con `403` aunque la base de datos ya esté actualizada.

## 2. Qué NO existe

- **Ningún test de frontend** — cero `*.test.*`/`*.spec.*`, sin Vitest/RTL/Playwright en `frontend/package.json`.
- **Backend sin test:** Identidad (registro/login fuera de lo que cubre `perfiles.test.ts` de rebote), Entregas, Mensajería, Notificaciones, IA (los 4 servicios), Categorías, Dashboard, Administración.
- **Sin pruebas unitarias de dominio puras** — todas pasan por HTTP + Postgres/Mongo reales (más lentas, pero prueban la integración real end-to-end, incluida la CI que las levanta como contenedores).

---

## 3. Plan de pruebas — casos existentes (resumen) + casos nuevos recomendados

| ID | Módulo | Caso | Precondición | Pasos | Resultado esperado | Estado |
|---|---|---|---|---|---|---|
| T-01 | Donaciones | Publicar sin auth | — | `POST /donaciones` sin header | `401` | ✅ Existe |
| T-02 | Donaciones | Flujo completo | usuario `DONANTE` | crear → listar → cancelar | `201`→`200` (incluye la creada)→`204`→estado `CANCELADA` | ✅ Existe |
| T-03 | Perfiles | Perfil insuficiente | usuario solo `SOLICITANTE` | `POST /donaciones` | `403` | ✅ Existe |
| T-04 | Perfiles | Cambio de perfiles requiere re-login | usuario `SOLICITANTE` | `PATCH .../perfiles` agrega `DONANTE`, publica con el token viejo | `403` (no reflejado hasta re-login) — **no está probado explícitamente el caso negativo**, solo el positivo tras re-login | ⚠️ Parcial |
| T-05 | Identidad | Registro con correo duplicado | usuario ya existe | `POST /auth/registro` mismo correo | `409 CONFLICT` | ❌ Falta |
| T-06 | Identidad | Login con contraseña incorrecta | usuario existe | `POST /auth/login` password mala | `401`, y verificar que sí se crea 1 fila en `auditoria` (`LOGIN_FALLIDO`) | ❌ Falta |
| T-07 | Identidad | Login con correo inexistente | — | `POST /auth/login` correo random | `401`, y verificar que **no** se crea fila en `auditoria` (comportamiento real documentado en `11_REGLAS_DE_NEGOCIO.md`, no un bug — pero merece un test que lo deje explícito) | ❌ Falta |
| T-08 | Solicitudes | Doble oferta del mismo donante | solicitud `ABIERTA`, donante ya ofertó | 2do `POST .../ofertas` mismo donante | `409` (`OfertaDuplicadaError`) | ❌ Falta |
| T-09 | Solicitudes | Ofertar sobre solicitud ya aceptada | solicitud `ACEPTADA_POR_DONANTE` | otro donante intenta ofertar | `422` (`SolicitudNoAceptaOfertasError`) | ❌ Falta |
| T-10 | Trueques | Aceptación bilateral completa | 2 trueques publicados, propuesta pendiente | `PATCH .../propuestas/:id { aceptar:true }` | ambos trueques `EN_COORDINACION`, se crea 1 `Entrega` | ❌ Falta (T-08 de sección 4 abajo) |
| T-11 | Trueques | Trueque sin aceptación bilateral | propuesta pendiente, sin responder | intentar `marcarIntercambiado` directo (no hay endpoint — verificar que no exista camino) | confirma que no hay forma de saltarse la aceptación bilateral (RF-013) | ❌ Falta |
| T-12 | Entregas | Confirmar entrega cierra el origen | oferta aceptada → Entrega `PROGRAMADA` | `PATCH /entregas/:id { confirmar:true }` | Entrega `CONFIRMADA` + Donación `ENTREGADA` + Solicitud `ATENDIDA` (cascada síncrona, `04_COMUNICACION_ENTRE_CAPAS.md §10`) | ❌ Falta |
| T-13 | Entregas | Confirmar dos veces | Entrega ya `CONFIRMADA` | `PATCH` de nuevo | `422` (`EntregaYaFinalizadaError`) | ❌ Falta |
| T-14 | IA | Fallo de proveedor no configurado | `IA_API_KEY=''` | `POST /ia/clasificar` | `503 SERVICE_UNAVAILABLE`, resto de la API sigue viva | ❌ Falta |
| T-15 | IA | Clasificación respeta categorías vigentes | categoría `INACTIVA` existe | clasificar, verificar que nunca aparece esa categoría en `categoriasVigentes` enviadas al modelo | requiere mockear `IIAProvider` — primer caso candidato a test unitario en vez de integración | ❌ Falta |
| Imagen | Donaciones | Imagen sobre el límite | — | `POST .../imagenes/firma` con `tamanoBytes` > 5MB | `400` (`ArchivoInvalidoError`) | ❌ Falta |
| Imagen | Donaciones | MIME no permitido | — | `tamanoBytes` OK, `mimeType: 'application/pdf'` | `400` | ❌ Falta |
| Ubicación | Donaciones | Ubicación exacta oculta a terceros | donación de otro usuario, request sin auth | `GET /donaciones/:id` | respuesta sin `latitud`/`longitud`/`referencia` exactos | ❌ Falta |
| Ubicación | Solicitudes | Ubicación exacta revelada al aceptar oferta | — | `POST .../ofertas`, inspeccionar la respuesta | incluye ubicación exacta (comportamiento real, `11_REGLAS_DE_NEGOCIO.md §5`) — bueno codificarlo como test para que no se pierda si se refactoriza | ❌ Falta |
| Fallo BD | — | Postgres caído | detener contenedor `postgres` en un entorno de prueba aislado | cualquier request que toque Postgres | `500` controlado, sin crash del proceso Node | ❌ Falta (requiere infraestructura de test específica, no solo Vitest) |
| Fallo BD | — | Mongo caído | detener contenedor `mongo` | request de chatbot/notificaciones | `500` controlado — el resto de la API (Postgres) sigue funcionando | ❌ Falta |

---

## 4. Casos ya cubiertos indirectamente (vale la pena saberlo para no duplicar esfuerzo)

`publicaciones.test.ts` (156 líneas, el archivo de test más largo) probablemente cubre varios de los flujos T-08/T-10 de forma indirecta al verificar que el índice de "mis publicaciones" refleja los cambios de estado — no se leyó línea por línea en esta pasada por presupuesto de tiempo; recomendado revisarlo antes de escribir T-10/T-12 para no duplicar.

---

## 5. Prioridad recomendada (si se decide cerrar huecos)

1. **T-12 (cierre en cascada de Entrega)** — es el flujo Must-have más complejo del sistema (3 entidades, 2 servicios de dominio) y no tiene ni un test.
2. **T-06/T-07 (auditoría de login)** — mientras el hallazgo de `17_DEUDA_TECNICA.md #19` siga sin resolverse, al menos que quede *probado* cuál es el comportamiento real, no solo documentado.
3. **T-14 (IA no configurada)** — un test de 5 líneas (`IA_API_KEY=''`) que confirma la degradación explícita (RNF-002) sin levantar ninguna dependencia externa real.
4. **Frontend:** ni un test hoy — antes de agregar el primero, decidir herramienta (Vitest + React Testing Library es lo más natural dado que ya se usa Vitest en backend) y empezar por los 5 guards de perfil (`14_FRONTEND_Y_ROLES.md §2`), que son lógica pura fácil de aislar.

---

## 6. Qué sigue

Con `16_PRUEBAS.md`, el conjunto de documentos ya cubre: inventario, trazabilidad, arquitectura, flujos, datos, reglas de negocio, endpoints, seguridad, deuda técnica, librerías, Docker, IA, frontend/roles y pruebas — 14 de 23. Quedan los documentos de síntesis final (resumen ejecutivo, informe técnico consolidado, construcción desde cero, servicios externos, glosario, guion de exposición, banco de 80 preguntas, línea por línea de código, README técnico índice).
