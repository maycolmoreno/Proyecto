# Fase 4 — Diseño de APIs

**Estado:** ✅ Aprobada
**Fecha de creación:** 2026-07-07
**Última actualización:** 2026-07-08
**Fuente:** `SRS_DonaConnect_Ecuador_ISO29148.docx` (RF-001 a RF-020, IF-001 a IF-008) + Fases 0-3 + `docs/DECISIONES.md`

## Historial de cambios
| Fecha | Descripción |
|---|---|
| 2026-07-07 | Versión inicial. Catálogo completo de endpoints REST, DTOs, validaciones, versionado, manejo de errores, matriz RBAC estricta (confirmada por el usuario, ADR-016), paginación y filtros. |
| 2026-07-07 | Aprobada por el usuario sin cambios. Se avanza a Fase 5. |
| 2026-07-08 | Implementación de Sprint 1 (BC-Donaciones): se agrega `503 SERVICE_UNAVAILABLE` a la tabla de errores (sección 6), no contemplado en la versión original, para el caso en que `POST /donaciones/:id/imagenes/firma` se invoca sin credenciales Cloudinary configuradas — distingue un problema de configuración del servidor (RNF-002, integraciones externas) de un `500 INTERNAL_ERROR` genérico. |
| 2026-07-08 | Implementación de Sprint 3 (BC-Trueques): se agregan `POST /trueques/:id/imagenes/firma` y `POST /trueques/:id/imagenes` a la sección 3, ausentes del catálogo original de esta fase (que solo los listaba para BC-Donaciones). Se completan por analogía porque Fase 2 sección 3 declara CU-004 "Subir fotografías" como transversal a Donaciones/Solicitudes/Trueques, y Fase 3 ya modela `imagenes.tipo_entidad` incluyendo `TRUEQUE` desde su versión inicial — es un gap-fill del catálogo, no una funcionalidad nueva. |

---

## 1. Principios generales

- **Formato:** REST sobre JSON (IF-SW-001), `Content-Type: application/json` salvo el endpoint de firma de subida de imágenes.
- **Base URL:** `http://localhost:4000/api/v1` (ADR-017 — versionado en la URL).
- **Autenticación:** JWT Bearer (`Authorization: Bearer <token>`) en todos los endpoints salvo registro/login y listados públicos de solo lectura.
- **Codificación de IDs:** UUID v4 en todos los recursos (ADR-013).

## 2. Modelo RBAC (confirmado por el usuario — ADR-016)

Modelo **estricto y segregado**: el rol declarado al registrarse determina exactamente qué puede hacer el usuario, no solo una etiqueta descriptiva.

| Capacidad | ADMINISTRADOR | DONANTE | BENEFICIARIO | USUARIO_COMUNIDAD |
|---|:---:|:---:|:---:|:---:|
| Publicar/editar/cancelar donación | ❌ | ✅ | ❌ | ✅ |
| Aceptar solicitud (crear oferta) | ❌ | ✅ | ❌ | ✅ |
| Crear/editar/cancelar solicitud | ❌ | ❌ | ✅ | ✅ |
| Publicar/proponer/aceptar trueque | ❌ | ✅ | ❌ | ✅ |
| Coordinar/confirmar entrega propia | ❌ | ✅ | ✅ | ✅ |
| Mensajería y chatbot IA | ✅ | ✅ | ✅ | ✅ |
| Ver dashboard de impacto (RF-019) | ✅ | ✅ | ✅ | ✅ |
| Moderar usuarios/publicaciones/reportes (RF-018) | ✅ | ❌ | ❌ | ❌ |
| Gestionar categorías | ✅ | ❌ | ❌ | ❌ |

**Autorización de dos capas en cada endpoint mutable:** (1) el rol debe tener la capacidad general (tabla de arriba); (2) el usuario debe ser **dueño** del recurso o tener una relación autorizada con él (ej. beneficiario solo puede actuar sobre sus propias solicitudes) — excepto ADMINISTRADOR, que puede operar sobre cualquier recurso con fines de moderación.

⚠️ **Consecuencia documentada de este modelo (ADR-016):** un usuario registrado como BENEFICIARIO no puede publicar donaciones ni trueques salvo que se registre como USUARIO_COMUNIDAD; no hay endpoint de "cambio de rol" en este alcance.

---

## 3. Catálogo de endpoints

### BC-Identidad
| Método | Ruta | RF/CU | Roles |
|---|---|---|---|
| POST | `/auth/registro` | RF-001 / CU-001 | Público |
| POST | `/auth/login` | RF-002 / CU-002 | Público |
| GET | `/usuarios/me` | RF-004 | Autenticado |
| PATCH | `/usuarios/me` | RF-004 (perfil, ubicación establecida) | Autenticado (propio) |
| GET | `/usuarios/:id` | RF-018 (vista admin) | ADMINISTRADOR o propio |
| PATCH | `/usuarios/:id/estado` | RF-018 (suspender/activar) | ADMINISTRADOR |

### BC-Categorías (Shared Kernel)
| Método | Ruta | RF/CU | Roles |
|---|---|---|---|
| GET | `/categorias` | Catálogo | Público |
| POST | `/categorias` | Administración | ADMINISTRADOR |
| PATCH | `/categorias/:id` | Administración | ADMINISTRADOR |

### BC-Donaciones
| Método | Ruta | RF/CU | Roles |
|---|---|---|---|
| POST | `/donaciones` | RF-005 / CU-003 | DONANTE, USUARIO_COMUNIDAD |
| GET | `/donaciones` | Listado, filtros | Público |
| GET | `/donaciones/:id` | Detalle | Público (con regla ADR-019) |
| PATCH | `/donaciones/:id` | Editar | Dueño |
| DELETE | `/donaciones/:id` | Cancelar (soft-delete → `CANCELADA`) | Dueño o ADMINISTRADOR |
| POST | `/donaciones/:id/imagenes/firma` | RF-006 / CU-004 (firma Cloudinary, ADR-009) | Dueño |
| POST | `/donaciones/:id/imagenes` | RF-006 / CU-004 (registrar URL tras subida) | Dueño |

### BC-Solicitudes
| Método | Ruta | RF/CU | Roles |
|---|---|---|---|
| POST | `/solicitudes` | RF-008 / CU-005 | BENEFICIARIO, USUARIO_COMUNIDAD |
| GET | `/solicitudes` | Listado, filtros | Público |
| GET | `/solicitudes/:id` | Detalle | Público (con regla ADR-019 sobre ubicación) |
| PATCH | `/solicitudes/:id` | Editar/cancelar | Dueño |
| POST | `/solicitudes/:id/ofertas` | RF-009 / CU-006 ("aceptar solicitud como donante") | DONANTE, USUARIO_COMUNIDAD |
| PATCH | `/solicitudes/:id/ofertas/:ofertaId` | RF-010 (rechazar manualmente una oferta) | Beneficiario dueño de la solicitud, o ADMINISTRADOR |

> **Nota de interpretación (bajo riesgo):** CU-006 se titula literalmente "Aceptar solicitud **como donante**". Se interpreta que `POST /solicitudes/:id/ofertas` ya representa la aceptación (crea la oferta en estado `ACEPTADA` directamente si no hay otra activa — ADR-011), sin un paso adicional de confirmación del beneficiario, a diferencia del trueque que sí exige aceptación bilateral explícita (RF-013). El beneficiario conserva la posibilidad de rechazar/cancelar vía `PATCH .../ofertas/:ofertaId` si la oferta no le sirve.

### BC-Trueques
| Método | Ruta | RF/CU | Roles |
|---|---|---|---|
| POST | `/trueques` | RF-011 / CU-007 | DONANTE, USUARIO_COMUNIDAD |
| GET | `/trueques` | Listado, filtros | Público |
| GET | `/trueques/:id` | Detalle | Público |
| PATCH | `/trueques/:id` | Editar/cancelar | Dueño |
| POST | `/trueques/:id/imagenes/firma` | RF-006 / CU-004 (firma Cloudinary, ADR-009) — gap-fill Sprint 3 | Dueño |
| POST | `/trueques/:id/imagenes` | RF-006 / CU-004 (registrar URL tras subida) — gap-fill Sprint 3 | Dueño |
| POST | `/trueques/:id/propuestas` | RF-012 / CU-008 | DONANTE, USUARIO_COMUNIDAD (dueño del trueque ofrecido) |
| PATCH | `/trueques/:id/propuestas/:propuestaId` | RF-013 (aceptar/rechazar — bilateral) | Dueño del trueque origen |

### BC-Entregas
| Método | Ruta | RF/CU | Roles |
|---|---|---|---|
| GET | `/entregas/:id` | CU-010 | Partes involucradas o ADMINISTRADOR |
| PATCH | `/entregas/:id` | Confirmar/cancelar (CU-010) | Partes involucradas |

> Las entregas se **crean automáticamente** por `EntregaCoordinacionService` (Fase 2) al aceptar una oferta o una propuesta bilateral — no existe `POST /entregas` público.

### BC-Mensajería
| Método | Ruta | RF/CU | Roles |
|---|---|---|---|
| GET | `/conversaciones` | RF-017 / CU-015 | Autenticado (propias) |
| GET | `/conversaciones/:id/mensajes` | RF-017 / CU-015 | Participante |
| POST | `/conversaciones/:id/mensajes` | RF-017 / CU-015 | Participante |

### BC-IA
| Método | Ruta | RF/CU | Roles |
|---|---|---|---|
| POST | `/chatbot/mensajes` | RF-014 / CU-009 | Autenticado |
| GET | `/chatbot/conversaciones/:id` | RF-014 / CU-009 | Dueño |
| POST | `/ia/clasificar` | RF-015 / CU-013 (sugerencia previa a publicar) | Autenticado |
| GET | `/ia/matching?entidadTipo=&entidadId=` | RF-016 / CU-014 | Autenticado |

### BC-Notificaciones
| Método | Ruta | RF/CU | Roles |
|---|---|---|---|
| GET | `/notificaciones` | RF-020 / CU-016 | Autenticado (propias) |
| PATCH | `/notificaciones/:id/leido` | RF-020 / CU-016 | Dueño |

### BC-Administración
| Método | Ruta | RF/CU | Roles |
|---|---|---|---|
| GET | `/admin/reportes` | RF-018 / CU-011 | ADMINISTRADOR |
| PATCH | `/admin/donaciones/:id/moderar` | RF-018 / CU-011 | ADMINISTRADOR |
| PATCH | `/admin/solicitudes/:id/moderar` | RF-018 / CU-011 | ADMINISTRADOR |
| PATCH | `/admin/trueques/:id/moderar` | RF-018 / CU-011 | ADMINISTRADOR |
| PATCH | `/admin/usuarios/:id/moderar` | RF-018 / CU-011 | ADMINISTRADOR |

### Dashboard
| Método | Ruta | RF/CU | Roles |
|---|---|---|---|
| GET | `/dashboard/impacto` | RF-019 / CU-012 | Autenticado |

### Integraciones internas (no expuestas al frontend directamente)
- Backend → n8n: `POST {N8N_WEBHOOK_URL}` disparado al ocurrir un evento de dominio (Fase 2, sección 7) — detallado en Fase 8.
- Backend → IA Provider: llamado server-side desde `ia.service`, nunca ruta pública equivalente al proveedor externo (ADR-010).

---

## 4. DTOs principales

**`RegistroUsuarioDTO`** (request): `nombre, correo, password, telefono?, rol, aceptaTerminos: boolean`
**`LoginDTO`** (request): `correo, password`
**`UsuarioResponseDTO`**: `id, nombre, correo, telefono?, rol, estado, fechaCreacion` (nunca incluye `passwordHash`)

**`DonacionCreateDTO`** (request): `titulo, descripcion, categoriaId, estadoObjeto, requiereRetiro: boolean, ubicacionRetiro?: { provincia, ciudad, sector, referencia, latitud, longitud }`
**`DonacionResponseDTO`**: `id, donanteId, categoria, titulo, descripcion, estadoObjeto, estadoDonacion, requiereRetiro, ubicacionRetiro?: { provincia, ciudad, sector }` — campos exactos (`latitud/longitud/referencia`) solo si aplica ADR-019, `imagenes: string[], fecha`

**`SolicitudCreateDTO`** (request): `titulo, descripcion, categoriaId, urgencia, evidenciaUrl?`
**`SolicitudResponseDTO`**: análogo a Donación, incluye `ofertas: OfertaResponseDTO[]` (solo visibles al dueño/admin/donante-autor de cada oferta)

**`OfertaCreateDTO`** (request): `donacionId, mensaje?`
**`TruequeCreateDTO`** (request): `titulo, descripcion, categoriaId, estadoObjeto`
**`PropuestaTruequeCreateDTO`** (request): `truequeOfrecidoId` (el trueque origen viene en la URL)

**`MensajeCreateDTO`** (request): `texto`
**`ChatbotMensajeDTO`** (request): `texto, sesionId?`

**`ErrorResponseDTO`**: `{ error: { code: string, message: string, details?: object } }` (ADR-018)
**`PaginatedResponseDTO<T>`**: `{ data: T[], meta: { page, limit, total, totalPages } }` (ADR-018)

---

## 5. Validaciones

Reglas generales aplicadas en middleware antes de llegar al controller:

- Campos obligatorios y longitudes según los límites definidos en Fase 3 (ej. `titulo` ≤ 150 caracteres, `descripcion` no vacía).
- Enums validados contra los mismos valores que los `CHECK` de PostgreSQL (rol, estado_*, urgencia, tipo_operacion, modalidad) — una sola fuente de verdad para evitar drift entre API y BD.
- `requiere_retiro = true` exige `ubicacionRetiro` completo (regla de negocio #5, ya aplicada como `CHECK` en Fase 3 — la API debe rechazar el request en 400 antes de llegar a la BD, para dar un mensaje claro en español, RNF-015).
- `propuestas_trueque`: el `usuarioProponente` debe ser dueño del `truequeOfrecido` (regla de aplicación, no expresable como `CHECK` de BD) — de lo contrario 403.
- Imágenes: `POST /.../imagenes/firma` valida `mimeType` (`image/jpeg`, `image/png`, `image/webp`) y tamaño declarado ≤ 5 MB (§5.4) antes de emitir la firma Cloudinary.
- No se puede crear una oferta sobre la propia solicitud, ni una propuesta sobre el propio trueque (auto-transacción inválida) → 400.

---

## 6. Manejo de errores (ADR-018)

| Código HTTP | `error.code` | Cuándo |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Datos de entrada inválidos |
| 401 | `UNAUTHORIZED` | Token ausente/expirado/inválido |
| 403 | `FORBIDDEN` | Rol sin capacidad, o no es dueño del recurso |
| 404 | `NOT_FOUND` | Recurso inexistente |
| 409 | `CONFLICT` | Ej. intentar aceptar una oferta cuando ya existe una activa (choca con el índice único parcial de Fase 3) |
| 422 | `UNPROCESSABLE` | Regla de negocio violada (ej. proponer trueque a un objeto propio) |
| 500 | `INTERNAL_ERROR` | Error no controlado |
| 503 | `SERVICE_UNAVAILABLE` | Integración externa requerida para el flujo no está configurada (ej. Cloudinary sin credenciales) |

Todos los mensajes (`error.message`) se redactan en español, claros y accionables (RNF-015, consolidado en Fase 1/ADR-003).

---

## 7. Paginación (ADR-018)

Offset-based en todos los listados: `?page=1&limit=20` (máximo `limit=100`). Respuesta:
```json
{ "data": [ /* ... */ ], "meta": { "page": 1, "limit": 20, "total": 134, "totalPages": 7 } }
```

## 8. Filtros

| Recurso | Filtros soportados |
|---|---|
| `/donaciones` | `estado`, `categoriaId`, `provincia`, `ciudad`, `requiereRetiro` |
| `/solicitudes` | `estado`, `categoriaId`, `urgencia`, `provincia`, `ciudad` |
| `/trueques` | `estado`, `categoriaId` |
| Todos los listados | `desde`, `hasta` (rango de fecha), `sort` (`fecha_asc`\|`fecha_desc`, default `fecha_desc`) |

---

## Nuevas decisiones de esta fase (ver `docs/DECISIONES.md`)
- ADR-016 — Modelo RBAC estricto y segregado por rol (confirmado por el usuario).
- ADR-017 — Versionado de API vía URL (`/api/v1`).
- ADR-018 — Envelope estándar de paginación y de error.
- ADR-019 — Regla de exposición de ubicación exacta en la API (aplica RNF-011 a nivel de DTO).

## Supuesto de bajo riesgo documentado
- `POST /solicitudes/:id/ofertas` crea la oferta ya `ACEPTADA` (si no hay otra activa), interpretando literalmente CU-006 "Aceptar solicitud como donante" como acción de un solo paso, sin confirmación adicional del beneficiario (a diferencia del trueque, que sí la exige explícitamente en RF-013).

---

**Aprobación:** Aprobada por el usuario (2026-07-07). Fase cerrada.
