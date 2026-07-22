# 12 — Catálogo de Endpoints — DonaConnect Ecuador

Catálogo completo verificado leyendo **todos** los archivos de rutas (`backend/main/routes/*.ts`, 12 archivos) y **todos** los controllers correspondientes (`backend/adapters/*/controllers/*.controller.ts`) — no inferido, cada método/path/middleware/status code proviene de una lectura directa del archivo citado. Convenciones globales: prefijo `/api/v1` (ADR-017, aplicado en `express-app.ts`, no repetido en cada fila); envelope de éxito `{ data }` o `{ data, meta }` en listados paginados (ADR-018); envelope de error `{ error: { code, message, details? } }`.

---

## 1. Identidad — `backend/main/routes/identidad.routes.ts`

| Método | Endpoint | Auth | Perfil/Rol | Body/Query (Zod) | Controller → Caso de uso | Éxito | Errores posibles |
|---|---|---|---|---|---|---|---|
| POST | `/auth/registro` | No | — | `registroSchema`: `nombre`(1-150), `correo`(email), `password`(8-72), `telefono?`, `perfiles[]`(≥1, enum `PERFILES_FUNCIONALES`), `aceptaTerminos`(literal `true`) | `AuthController.registro` → `RegistrarUsuarioUseCase` | `201 { data: usuario }` | `400 VALIDATION_ERROR` (Zod), `409 CONFLICT` (`CorreoYaRegistradoError`) |
| POST | `/auth/login` | No | — | `loginSchema`: `correo`(email), `password`(≥1) | `AuthController.login` → `IniciarSesionUseCase` | `200 { data: { token, usuario } }` | `400`, `401 UNAUTHORIZED` (`CredencialesInvalidasError`), `403 FORBIDDEN` (`UsuarioInactivoError`) |
| GET | `/usuarios/me` | Sí | cualquiera | — | `UsuariosController.me` → `ObtenerPerfilUseCase` | `200 { data: perfil }` | `401` (sin token) |
| GET | `/usuarios/:id` | Sí | cualquiera | — | `UsuariosController.obtenerPorId` → `ObtenerUsuarioPublicoUseCase` | `200 { data: usuario }` | `401`, `404 NOT_FOUND` |
| PATCH | `/usuarios/me/perfiles` | Sí | cualquiera | `actualizarPerfilesSchema`: `perfiles[]` (enum `PERFILES_FUNCIONALES`) | `UsuariosController.actualizarPerfiles` → `AsignarPerfilesUseCase` | `200 { data: { perfiles } }` | `400`, `401` |

**Auditoría:** solo `POST /auth/registro` (`CREAR USUARIO`). `LOGIN_FALLIDO` se audita dentro del caso de uso, no vía middleware de ruta (`IniciarSesionUseCase.ts:55`).

---

## 2. Donaciones — `backend/main/routes/donaciones.routes.ts`

`soloDonante = perfilMiddleware(['DONANTE'])`.

| Método | Endpoint | Auth | Perfil | Body/Query | Controller → Caso de uso | Éxito | Errores |
|---|---|---|---|---|---|---|---|
| POST | `/donaciones` | Sí | `DONANTE` | `crearDonacionSchema` | `DonacionesController.crear` → `PublicarDonacionUseCase` | `201 { data }` | `400`, `403` (sin perfil `DONANTE`) |
| GET | `/donaciones` | Opcional | — (público) | `listarDonacionesQuerySchema` (page/limit/sort/filtros) | `.listar` → `ListarDonacionesUseCase` | `200 { data[], meta }` | `400` |
| GET | `/donaciones/:id` | Opcional | — (público) | — | `.obtener` → `ObtenerDonacionUseCase` | `200 { data }` | `404` |
| PATCH | `/donaciones/:id` | Sí | dueño (validado en el caso de uso, no en middleware) | `actualizarDonacionSchema` | `.actualizar` → `ActualizarDonacionUseCase` | `200 { data }` | `400`, `403` (`NoEsDueñoDeLaDonacionError`), `404`, `422` (`DonacionYaFinalizadaError`) |
| DELETE | `/donaciones/:id` | Sí | dueño | — | `.cancelar` → `CancelarDonacionUseCase` | `204` | `403`, `404`, `422` |
| POST | `/donaciones/:id/imagenes/firma` | Sí | dueño | `firmarImagenSchema`: `mimeType`, `tamanoBytes` | `.firmarImagen` → `FirmarSubidaImagenUseCase` | `200 { data: firma }` | `400` (`ArchivoInvalidoError` si MIME/tamaño inválido, máx. 5MB), `403`, `404` |
| POST | `/donaciones/:id/imagenes` | Sí | dueño | `registrarImagenSchema` | `.registrarImagenSubida` → `RegistrarImagenUseCase` | `201 { data: { imagenes } }` | `400`, `403`, `404` |

**Auditoría:** `POST` (`CREAR DONACION`), `DELETE` (`CANCELAR DONACION`). `PATCH` y ambos endpoints de imagen **no** auditan.

---

## 3. Solicitudes — `backend/main/routes/solicitudes.routes.ts`

`soloSolicitante = perfilMiddleware(['SOLICITANTE'])`, `soloDonante = perfilMiddleware(['DONANTE'])`.

| Método | Endpoint | Auth | Perfil | Body/Query | Controller → Caso de uso | Éxito | Errores |
|---|---|---|---|---|---|---|---|
| POST | `/solicitudes` | Sí | `SOLICITANTE` | `crearSolicitudSchema` | `.crear` → `CrearSolicitudUseCase` | `201 { data }` | `400`, `403` |
| GET | `/solicitudes` | Opcional | — | `listarSolicitudesQuerySchema` | `.listar` → `ListarSolicitudesUseCase` | `200 { data[], meta }` | `400` |
| GET | `/solicitudes/:id` | Opcional | — | — | `.obtener` → `ObtenerSolicitudUseCase` | `200 { data }` | `404` |
| PATCH | `/solicitudes/:id` | Sí | dueño | `actualizarSolicitudSchema` | `.actualizar` → `ActualizarSolicitudUseCase` | `200 { data }` | `403` (`NoEsDueñoDeLaSolicitudError`), `422` (`SolicitudYaFinalizadaError`) |
| POST | `/solicitudes/:id/ofertas` | Sí | `DONANTE` | `crearOfertaSchema` | `.crearOfertaHandler` → `CrearOfertaUseCase` (auto-acepta, 1 paso) | `201 { data: solicitud }` | `400` (`NoPuedeOfertarSobrePropiaSolicitudError`, `DonacionInvalidaParaOfertaError`), `409` (`OfertaDuplicadaError`), `422` (`SolicitudNoAceptaOfertasError`) |
| PATCH | `/solicitudes/:id/ofertas/:ofertaId` | Sí | dueño de la solicitud (implícito, sin `perfilMiddleware`) | **sin body** — es "rechazar" (aceptar ya ocurrió al crear la oferta) | `.actualizarOfertaHandler` → `ActualizarOfertaUseCase` | `200 { data }` | `404` (`OfertaNoEncontradaEnSolicitudError`), `409` (`OfertaYaRechazadaError`) |

**Auditoría:** `POST /solicitudes` (`CREAR SOLICITUD`), `PATCH /solicitudes/:id` solo si `req.body.cancelar===true` (`CANCELAR SOLICITUD`), `POST .../ofertas` (`APROBAR OFERTA`). El `PATCH .../ofertas/:ofertaId` (rechazar) **no** audita.

---

## 4. Trueques — `backend/main/routes/trueques.routes.ts`

`soloTrueque = perfilMiddleware(['TRUEQUE'])`.

| Método | Endpoint | Auth | Perfil | Body/Query | Controller → Caso de uso | Éxito | Errores |
|---|---|---|---|---|---|---|---|
| POST | `/trueques` | Sí | `TRUEQUE` | `crearTruequeSchema` | `.crear` → `PublicarTruequeUseCase` | `201 { data }` | `400`, `403` |
| GET | `/trueques` | Opcional | — | `listarTruequesQuerySchema` | `.listar` → `ListarTruequesUseCase` | `200 { data[], meta }` | `400` |
| GET | `/trueques/:id` | Opcional | — | — | `.obtener` → `ObtenerTruequeUseCase` | `200 { data }` | `404` |
| PATCH | `/trueques/:id` | Sí | dueño | `actualizarTruequeSchema` | `.actualizar` → `ActualizarTruequeUseCase` | `200 { data }` | `403`, `422` (`TruequeYaFinalizadoError`) |
| POST | `/trueques/:id/propuestas` | Sí | `TRUEQUE` | `proponerTruequeSchema` | `.proponerHandler` → `ProponerTruequeUseCase` | `201 { data }` | `400` (`NoPuedeProponerSobrePropioTruequeError`, `TruequeOfrecidoInvalidoError`, `OrigenIgualAOfrecidoError`), `409` (`PropuestaDuplicadaError`), `422` (`TruequeNoAceptaPropuestasError`) |
| PATCH | `/trueques/:id/propuestas/:propuestaId` | Sí | dueño del trueque origen | `responderPropuestaSchema` (aceptar/rechazar — sí admite ambos, a diferencia de Solicitud) | `.responderPropuestaHandler` → `ResponderPropuestaUseCase` | `200 { data }` | `404`, `409` (`PropuestaYaAceptadaError`), `422` (`PropuestaYaRechazadaError`) |
| POST | `/trueques/:id/imagenes/firma` | Sí | dueño | `firmarImagenSchema` | `.firmarImagen` → `FirmarSubidaImagenUseCase` | `200 { data: firma }` | `400`, `403` |
| POST | `/trueques/:id/imagenes` | Sí | dueño | `registrarImagenSchema` | `.registrarImagenSubida` → `RegistrarImagenUseCase` | `201 { data: { imagenes } }` | `400` |

**Auditoría:** `POST /trueques` (`CREAR TRUEQUE`), `PATCH /trueques/:id` solo si `cancelar===true` (`CANCELAR TRUEQUE`), `PATCH .../propuestas/:id` solo si `aceptar===true` (`APROBAR PROPUESTA_TRUEQUE`). `POST .../propuestas` y ambos endpoints de imagen **no** auditan.

---

## 5. Entregas — `backend/main/routes/entregas.routes.ts`

Sin `POST` público — una `Entrega` se crea automáticamente al aceptar una oferta o una propuesta (`EntregaCoordinacionService`), nunca por request directo del cliente.

| Método | Endpoint | Auth | Body/Query | Controller → Caso de uso | Éxito | Errores |
|---|---|---|---|---|---|---|
| GET | `/entregas/por-referencia/:idReferencia` | Sí | — | `.obtenerPorReferencia` → `ObtenerEntregaUseCase.ejecutarPorReferencia` | `200 { data }` | `403` (`NoAutorizadoParaLaEntregaError`), `404` |
| GET | `/entregas/:id` | Sí | — | `.obtener` → `ObtenerEntregaUseCase.ejecutar` | `200 { data }` | `403`, `404` |
| PATCH | `/entregas/:id` | Sí | `actualizarEntregaSchema` (`confirmar`, `fechaProgramada?`) | `.actualizar` → `ActualizarEntregaUseCase` (confirma → emite `EntregaConfirmada` → dispara `EntregaCierreOrigenService`) | `200 { data }` | `403`, `422` (`EntregaYaFinalizadaError`) |

**Nota de ruteo real:** `por-referencia/:idReferencia` está declarada ANTES de `/entregas/:id` en el archivo — necesario porque Express resuelve rutas por orden literal (a diferencia de React Router), comentario explícito en el propio código.

---

## 6. IA — `backend/main/routes/ia.routes.ts`

| Método | Endpoint | Auth | Body/Query | Controller → Caso de uso | Éxito | Errores |
|---|---|---|---|---|---|---|
| POST | `/chatbot/mensajes` | Sí | `chatbotMensajeSchema` | `.chatear` → `ChatearUseCase` → `ChatbotOrquestacionService` | `200 { data }` | `503 SERVICE_UNAVAILABLE` (`IAProviderNoConfiguradoError`) |
| GET | `/chatbot/conversaciones/:id` | Sí | — | `.obtenerConversacion` → `ObtenerConversacionUseCase` | `200 { data }` | `403` (`NoEsDueñoDeLaConversacionError`), `404` |
| POST | `/ia/clasificar` | Sí | `clasificarSchema` | `.clasificar` → `ClasificarUseCase` → `ClasificacionService` (JSON estructurado) | `200 { data }` | `503` |
| GET | `/ia/matching` | Sí | `matchingQuerySchema`: `entidadTipo`, `entidadId` | `.matching` → `ObtenerMatchesUseCase` → `MatchingService` | `200 { data[] }` | `400` (`EntidadInvalidaParaMatchingError` → mapea a `404` en el error handler, ver nota), `503` |

**Nota:** `EntidadInvalidaParaMatchingError` está clasificado junto con los errores `404 NOT_FOUND` en `error-handler.middleware.ts:110`, no como `400` — vale la pena confirmarlo si se pregunta en la defensa, porque el nombre de la clase sugiere lo contrario.

---

## 7. Mensajería — `backend/main/routes/mensajeria.routes.ts`

| Método | Endpoint | Auth | Body/Query | Controller → Caso de uso | Éxito | Errores |
|---|---|---|---|---|---|---|
| GET | `/conversaciones` | Sí | — | `.listarConversaciones` → `ListarConversacionesUseCase` | `200 { data[] }` | `401` |
| GET | `/conversaciones/:id/mensajes` | Sí | — | `.listarMensajes` → `ListarMensajesUseCase` | `200 { data }` | `404` (`ConversacionNoEncontradaError`), `403` (`NoEsParticipanteError`) |
| POST | `/conversaciones/:id/mensajes` | Sí | `enviarMensajeSchema`: `texto` | `.enviarMensaje` → `EnviarMensajeUseCase` (`:id` aquí es el `destinatarioId`, no el id de conversación) | `201 { data }` | `400` (`DestinatarioInvalidoError`, `NoPuedeEnviarseMensajeAsiMismoError`) |

**Hallazgo de contrato:** el mismo segmento `:id` de la URL representa cosas distintas según el verbo — `id` de conversación en `GET .../mensajes`, `id` de usuario destinatario en `POST .../mensajes`. Funciona porque el frontend (`ConversacionesPage.tsx`) conoce esta distinción, pero es una asimetría de diseño de API que vale la pena mencionar si se pregunta por consistencia REST.

---

## 8. Notificaciones — `backend/main/routes/notificaciones.routes.ts`

| Método | Endpoint | Auth | Controller → Caso de uso | Éxito | Errores |
|---|---|---|---|---|---|
| GET | `/notificaciones` | Sí | `.listar` → `ListarNotificacionesUseCase` | `200 { data[] }` | `401` |
| PATCH | `/notificaciones/:id/leido` | Sí | `.marcarLeido` → `MarcarLeidoUseCase` | `204` | `404` (`NotificacionNoEncontradaError`) |

---

## 9. Dashboard — `backend/main/routes/dashboard.routes.ts`

| Método | Endpoint | Auth | Controller → Caso de uso | Éxito |
|---|---|---|---|---|
| GET | `/dashboard/impacto` | Sí | `.obtenerImpacto` → `ObtenerDashboardImpactoUseCase` | `200 { data }` |

**Hallazgo:** el handler declara el parámetro request como `_req` (no usado, `dashboard.controller.ts:8`) — los KPIs son globales, no personalizados por usuario, pese a exigir `authMiddleware`. No es un problema de seguridad (no expone nada sensible por usuario), pero técnicamente el endpoint podría ser público según su propia lógica.

---

## 10. Administración — `backend/main/routes/admin.routes.ts`

`soloAdministrador = rbacMiddleware(['ADMINISTRADOR'])` — único módulo (junto con Categorías) que usa `Rol` en vez de `PerfilFuncional`, correctamente, porque es autorización de seguridad, no de marketplace.

| Método | Endpoint | Auth | Rol | Body | Controller → Caso de uso | Éxito | Errores |
|---|---|---|---|---|---|---|---|
| GET | `/admin/usuarios` | Sí | `ADMINISTRADOR` | `listarUsuariosQuerySchema` | `.listarUsuarios` → `ListarUsuariosUseCase` | `200 { data[], meta }` | `403` |
| GET | `/admin/reportes` | Sí | `ADMINISTRADOR` | — | `.reportes` → `ObtenerReportesUseCase` | `200 { data }` | `403` |
| PATCH | `/admin/donaciones/:id/moderar` | Sí | `ADMINISTRADOR` | `moderarSchema`: `accion` (`APROBAR`\|`BLOQUEAR`\|`ELIMINAR`) | `.moderarDonacion` → `ModerarPublicacionUseCase('DONACION',...)` | `200 { data }` | `404` (`PublicacionNoEncontradaParaModerarError`) |
| PATCH | `/admin/solicitudes/:id/moderar` | Sí | `ADMINISTRADOR` | `moderarSchema` | `.moderarSolicitud` → ídem `'SOLICITUD'` | `200 { data }` | `404` |
| PATCH | `/admin/trueques/:id/moderar` | Sí | `ADMINISTRADOR` | `moderarSchema` | `.moderarTrueque` → ídem `'TRUEQUE'` | `200 { data }` | `404` |
| PATCH | `/admin/usuarios/:id/moderar` | Sí | `ADMINISTRADOR` | `moderarSchema` | `.moderarUsuario` → `ModerarUsuarioUseCase` | `200 { data }` | `404` (`UsuarioNoEncontradoParaModerarError`) |

**Auditoría:** los 4 endpoints `PATCH .../moderar` auditan con 3 acciones posibles (`APROBAR`/`BLOQUEAR`/`ELIMINAR`), condicionadas a `req.body.accion` — patrón `crearAuditMiddlewaresModeracion()`.

---

## 11. Categorías — `backend/main/routes/categorias.routes.ts`

| Método | Endpoint | Auth | Rol | Body | Controller → Caso de uso | Éxito | Errores |
|---|---|---|---|---|---|---|---|
| GET | `/categorias` | No (público) | — | `listarCategoriasQuerySchema` | `.listar` → `ListarCategoriasUseCase` | `200 { data[] }` | — |
| POST | `/categorias` | Sí | `ADMINISTRADOR` | `crearCategoriaSchema` | `.crear` → `CrearCategoriaUseCase` | `201 { data }` | `409` (`CategoriaYaExisteError`) |
| PATCH | `/categorias/:id` | Sí | `ADMINISTRADOR` | `actualizarCategoriaSchema` | `.actualizar` → `ActualizarCategoriaUseCase` | `200 { data }` | `404` (`CategoriaNoEncontradaError`) |

---

## 12. Publicaciones — `backend/main/routes/publicaciones.routes.ts` (nuevo, sin commitear)

| Método | Endpoint | Auth | Controller → Caso de uso | Éxito |
|---|---|---|---|---|
| GET | `/publicaciones/mias` | Sí | `.listarMias` → `ListarMisPublicacionesUseCase` | `200 { data[] }` |

Lee de la proyección Mongo `publicaciones_index`, mantenida por `PublicacionIndexService` (8 suscripciones al Event Bus). No tiene endpoint de escritura propio — se alimenta solo de eventos de dominio de los otros 3 módulos de marketplace.

---

## 13. Códigos de error — catálogo completo (`error-handler.middleware.ts`, 197 líneas, único punto de mapeo)

| HTTP | `code` | Disparado por | Ejemplos de clase de error |
|---|---|---|---|
| 400 | `VALIDATION_ERROR` | `ZodError` (cualquier schema) o errores de negocio de validación de entrada | `CategoriaInvalidaError`, `ArchivoInvalidoError`, `NoPuedeOfertarSobrePropiaSolicitudError`, `NoPuedeProponerSobrePropioTruequeError`, `OrigenIgualAOfrecidoError`, `NoPuedeEnviarseMensajeAsiMismoError` |
| 401 | `UNAUTHORIZED` | Falta token / token inválido (`auth.middleware.ts`, fuera del error handler global) o `CredencialesInvalidasError` | login incorrecto |
| 403 | `FORBIDDEN` | `perfilMiddleware`/`rbacMiddleware` (fuera del error handler) o error de propiedad de recurso | `NoEsDueñoDeLa*Error` (7 variantes), `NoEsParticipanteError`, `UsuarioInactivoError` |
| 404 | `NOT_FOUND` | Entidad no encontrada | 14 variantes de `*NoEncontrad[ao]Error` |
| 409 | `CONFLICT` | Duplicado / condición de carrera | `CorreoYaRegistradoError`, `CategoriaYaExisteError`, `OfertaDuplicadaError`, `PropuestaDuplicadaError`, `PropuestaYaAceptadaError`, y `Prisma P2002` (constraint UNIQUE) — este último atrapa condiciones de carrera reales (ej. dos registros simultáneos con el mismo correo) que el caso de uso ya validó pero no puede garantizar sin la constraint de BD |
| 422 | `UNPROCESSABLE` | Transición de estado inválida | `*YaFinalizad[ao]Error` (4), `SolicitudNoAceptaOfertasError`, `OfertaYaRechazadaError`, `TruequeNoAceptaPropuestasError`, `PropuestaYaRechazadaError`, `UsuarioYaEliminadoError` |
| 503 | `SERVICE_UNAVAILABLE` | Adaptador externo no configurado | `CloudinaryNoConfiguradoError`, `IAProviderNoConfiguradoError` |
| 500 | `INTERNAL_ERROR` | Cualquier error no reconocido | fallback genérico, se loguea con Pino antes de responder |

No se usa `429 Too Many Requests` en ningún punto del código — coherente con el hallazgo de que no existe rate limiting real (ver `02_TRAZABILIDAD_SRS_CODIGO.md`, hallazgo #2).

---

## 14. Qué sigue

Con este catálogo, `13_SEGURIDAD.md` puede enfocarse en los controles transversales (auth, CORS, ausencia de rate limiting, validación de archivos) sin repetir el detalle endpoint por endpoint ya cubierto aquí.
