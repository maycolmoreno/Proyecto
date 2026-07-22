# Auditoría Funcional — Modelo Donante / Solicitante / Usuario Trueque / Comunidad

**Tipo de documento:** informe de auditoría de solo lectura. No modifica código. Evalúa el estado real del proyecto DonaConnect Ecuador contra el modelo funcional de 4 perfiles solicitado por el usuario (2026-07-10).
**Alcance de la inspección:** `backend/` (dominio, aplicación, adapters, main), `frontend/src/` (features, shared, app), `backend/prisma/schema.prisma`, todos los modelos Mongoose.
**Metodología:** lectura directa de archivos reales + `grep`/`glob` estructural. Cada afirmación cita archivo y, cuando aplica, línea o nombre de método exacto. Donde no se encontró evidencia, se declara explícitamente como ausente — no se asume ni se inventa.

---

## 1. Arquitectura

**Backend:** Clean Architecture / Hexagonal, 4 capas explícitas **al tope** de `backend/` (no anidadas bajo `src/`), cada capa subdividida por Bounded Context (BC):

```
backend/
├── domain/        entidades, value objects, puertos (interfaces), domain services — sin dependencias externas
├── application/   casos de uso — orquestan domain + puertos, sin lógica de framework
├── adapters/      controllers (entrada HTTP), repositories (salida Prisma/Mongoose), external (Cloudinary/IA)
└── main/          composition root: routes, di-container.ts, middlewares, env.ts, express-app.ts
```

Confirmado por `find domain application adapters main -type d` — 11 Bounded Contexts: `identidad`, `categorias`, `donaciones`, `solicitudes`, `trueques`, `entregas`, `ia`, `administracion`, `notificaciones`, `mensajeria`, `dashboard`, más `auditoria`/`eventos` como infraestructura transversal.

**Patrón por módulo** (ejemplo Donaciones, se repite idéntico en Solicitudes/Trueques):
- `domain/donaciones/entities/Donacion.ts` — aggregate root, invariantes de negocio como métodos (`cancelar()`, `marcarEntregada()`, líneas 148/155).
- `domain/donaciones/ports/IDonacionRepository.ts` — interfaz del repositorio (puerto de salida).
- `domain/donaciones/value-objects/EstadoDonacion.ts`, `EstadoObjeto.ts` — enums de dominio.
- `application/donaciones/use-cases/*.ts` — un archivo por caso de uso (`PublicarDonacionUseCase`, `ListarDonacionesUseCase`, `ObtenerDonacionUseCase`, `ActualizarDonacionUseCase`, `CancelarDonacionUseCase`, `FirmarSubidaImagenUseCase`, `RegistrarImagenUseCase`).
- `adapters/donaciones/controllers/donaciones.controller.ts` — traduce HTTP↔caso de uso, sin lógica de negocio.
- `adapters/donaciones/repositories/PrismaDonacionRepository.ts` — implementa el puerto con Prisma.

**Event Bus in-process** (`domain/eventos/ports/IEventBus.ts`, implementado en `main/event-bus.ts` sobre `EventEmitter` nativo de Node) — 13 eventos de dominio catalogados (`NombreEventoDominio`), dos listeners reales: `ModeracionIAService` (modera automáticamente con IA al publicar) y `NotificacionDispatchService` (genera notificaciones in-app).

**Frontend:** arquitectura funcional feature-based (no Redux/Zustand), TanStack Query para estado de servidor:
```
frontend/src/
├── features/<dominio>/{types,api,hooks,components}/   un directorio por dominio (13: administracion, categorias, chatbot, dashboard, donaciones, entregas, ia, identidad, mensajeria, notificaciones, solicitudes, trueques)
├── shared/{components/{atoms,molecules,organisms},lib}/   componentes reutilizables sin conocimiento de dominio
└── app/{pages,layouts}/   páginas + composition root (App.tsx, AppShell.tsx)
```

**Reutilización de componentes ya es un pilar explícito** (ADR-045, `docs/DECISIONES.md`): `PublicacionCard.tsx`, `FiltroPanel.tsx`, `Stepper.tsx`, `ImageUploader.tsx`, `LocationPicker.tsx`, `Modal.tsx`, `StatusBadge.tsx` ya son genéricos y se usan indistintamente en Donaciones/Solicitudes/Trueques hoy.

---

## 2. Base de datos

### PostgreSQL (`backend/prisma/schema.prisma`) — 11 tablas

| Tabla | PK | FKs relevantes | Campos clave | Índices |
|---|---|---|---|---|
| `usuarios` | `id_usuario` | — | `rol` (enum: ADMINISTRADOR\|DONANTE\|BENEFICIARIO\|USUARIO_COMUNIDAD), `estado` (ACTIVO\|SUSPENDIDO\|ELIMINADO) | `rol` |
| `ubicaciones` | `id_ubicacion` | `id_usuario`→usuarios | `provincia`, `ciudad`, `latitud`/`longitud`, `tipo` (ESTABLECIDA\|RETIRO) | `(usuarioId,tipo)`, `(provincia,ciudad)` |
| `categorias` | `id_categoria` | — | `nombre`, `tipo`, `estado` | único `(nombre,tipo)` |
| `donaciones` | `id_donacion` | `id_donante`, `id_categoria`, `id_ubicacion_retiro` | `estadoDonacion` (6 estados), `estadoObjeto`, `requiereRetiro` | `estadoDonacion`, `categoriaId`, `donanteId`, `fecha desc` |
| `imagenes` | `id_imagen` | — (polimórfica, sin FK física) | `tipoEntidad` (DONACION\|SOLICITUD\|TRUEQUE) + `idEntidad` | `(tipoEntidad,idEntidad)` |
| `solicitudes` | `id_solicitud` | `id_beneficiario`, `id_categoria`, `id_ubicacion` | `estadoSolicitud` (6 estados), `urgencia`, `evidenciaUrl` (string simple) | `estadoSolicitud`, `categoriaId`, `urgencia`, `fecha desc` |
| `ofertas_solicitud` | `id_oferta` | `id_solicitud`, `id_donante`, `id_donacion` | `estado` (PENDIENTE\|ACEPTADA\|RECHAZADA) | `solicitudId` |
| `entregas` | `id_entrega` | — (polimórfica: `tipoOperacion`+`idReferencia`, sin FK física) | `modalidad` (RETIRO_DOMICILIO\|ENTREGA_DIRECTA\|PUNTO_ENCUENTRO — el 3ro nunca se asigna en código real), `estado`, `fechaProgramada` | `(tipoOperacion,idReferencia)`, `estado` |
| `trueques` | `id_trueque` | `id_usuario`, `id_categoria` | `estadoTrueque` (6 estados), `estadoObjeto` | `estadoTrueque`, `categoriaId`, `fecha desc` |
| `propuestas_trueque` | `id_propuesta` | `id_trueque_origen`, `id_trueque_ofrecido` (ambas a `trueques`), `id_usuario_proponente` | `estado` (PENDIENTE\|ACEPTADA\|RECHAZADA) | `truequeOrigenId` |
| `auditoria` | `id_auditoria` | `id_usuario` (nullable, `onDelete: SetNull`) | `accion`, `entidad`, `idEntidad`, `detalle` (JSON) | `(entidad,idEntidad)`, `fecha desc`, `usuarioId` |

**Relación polimórfica sin FK física** (documentada como decisión deliberada, ADR-015): `imagenes` y `entregas` se vinculan a su entidad dueña vía `(tipoEntidad, idEntidad)`/`(tipoOperacion, idReferencia)` en vez de una FK — permite que una sola tabla sirva a Donación/Solicitud/Trueque sin 3 tablas de imágenes duplicadas.

### MongoDB — 5 colecciones (esquema flexible, sin `mongoose.Schema` estricto en algunos campos)

| Colección | Modelo/archivo | Propósito |
|---|---|---|
| `analisis_ia` | `adapters/ia/repositories/MongooseAnalisisIARepository.ts:24` | Log de clasificación/moderación IA (incluye `riesgoDetectado`, `categoriaRiesgo`) |
| `chatbot_conversaciones` | `adapters/ia/repositories/MongooseConversacionChatbotRepository.ts:35` | Historial del chatbot, 1 documento por usuario |
| `mensajes` | `adapters/mensajeria/repositories/MongooseConversacionRepository.ts:26` | Conversaciones usuario↔usuario, mensajes embebidos, campo `entregaIdReferencia` (nunca poblado desde ningún caso de uso — ver hallazgo en sección 8) |
| `eventos_sistema` | `adapters/notificaciones/repositories/MongooseEventoSistemaRepository.ts:25` | Solo 3 eventos "de cierre positivo" para el dashboard KPI |
| `notificaciones` | `adapters/notificaciones/repositories/MongooseNotificacionRepository.ts:23` | Notificaciones in-app, incluye `entidadTipo`/`entidadRelacionada` para navegación desde el frontend |

**Entidades ya existentes reutilizables para el modelo pedido** (mapeo directo, sin necesidad de nuevas tablas):

| Concepto pedido | Ya existe como |
|---|---|
| Publicaciones / Marketplace | `donaciones` + `solicitudes` + `trueques` (3 tablas paralelas, mismo patrón) |
| Solicitudes | `solicitudes` (tabla completa) |
| Intercambios | `trueques` + `propuestas_trueque` |
| Donaciones | `donaciones` |
| Entregas | `entregas` (polimórfica, ya cubre Donación y Trueque) |
| Mensajes/Chat/Conversaciones | `mensajes` (Mongo) |
| Imágenes | `imagenes` (polimórfica) |
| Ubicaciones | `ubicaciones` |
| Beneficiarios | Rol `BENEFICIARIO` en `usuarios.rol` — **no es una tabla propia**, es un usuario con ese rol |
| Comunidades / Organizaciones | **No existe.** `USUARIO_COMUNIDAD` es un valor más del enum `rol` en `usuarios` — un usuario individual, no una entidad organizacional con lista de miembros/beneficiarios propia |
| Evidencias | Parcial: `solicitudes.evidenciaUrl` (una URL simple, seteada al crear la solicitud — evidencia de la *necesidad*, no del *cumplimiento*). No existe evidencia de entrega completada |

---

## 3. Backend — lógica de negocio, estados y roles

### 3.1 Máquinas de estado (confirmadas en las entidades de dominio)

**`EstadoDonacion`** (`domain/donaciones/value-objects/EstadoDonacion.ts` + `Donacion.ts`): `PUBLICADA → [CANCELADA | ENTREGADA]`. Transiciones vía `cancelar()` (línea 148) y `marcarEntregada()` (línea 155, invocado automáticamente por `EntregaCierreOrigenService` al confirmar la Entrega — no hay endpoint público para setearlo directamente). Los estados `SOLICITADA`/`APROBADA`/`EN_RETIRO` existen en el enum de Postgres pero **ningún caso de uso los asigna** — son remanentes del diseño original (Fase 3) nunca cableados en Fase 6.

**`EstadoSolicitud`**: `ABIERTA → EN_REVISION/ACEPTADA_POR_DONANTE → EN_ENTREGA → ATENDIDA`, o `→ CANCELADA` en cualquier punto no terminal. Métodos: `puedeRecibirOferta()` (línea 189), `agregarOfertaAceptada()` (línea 217, **auto-acepta en un solo paso** — no hay negociación previa), `rechazarOferta()` (línea 230, revierte a `ABIERTA`), `cancelar()` (204), `marcarAtendida()` (211).

**`EstadoTrueque`**: `PUBLICADO → PROPUESTA_RECIBIDA → EN_COORDINACION → INTERCAMBIADO`, o `→ CANCELADO`. A diferencia de Solicitud, **sí admite negociación de dos pasos**: `agregarPropuestaPendiente()` (línea 197, NO auto-acepta) → `aceptarPropuesta()` (211) o `rechazarPropuesta()` (229, puede revertir una ya aceptada). El estado `ACEPTADO` del enum de Postgres tampoco se asigna nunca (el código salta directo a `EN_COORDINACION`).

**`EstadoEntrega`**: `PROGRAMADA → CONFIRMADA`, o `→ CANCELADA`. `confirmar()` (línea 72) acepta una `fechaProgramada` opcional. Es polimórfica (`tipoOperacion: DONACION|TRUEQUE`, `idReferencia`) — un único mecanismo de coordinación de entrega sirve a ambos flujos.

### 3.2 Roles y permisos reales (RBAC)

Confirmado en `main/routes/*.ts` (`rbacMiddleware([...])`):

| Acción | Roles permitidos | Archivo:línea |
|---|---|---|
| Crear Donación | `DONANTE`, `USUARIO_COMUNIDAD` | `donaciones.routes.ts:10,20` |
| Crear Solicitud | `BENEFICIARIO`, `USUARIO_COMUNIDAD` | `solicitudes.routes.ts:10,24` |
| Ofertar sobre una Solicitud | `DONANTE`, `USUARIO_COMUNIDAD` | `solicitudes.routes.ts:11,28` |
| Crear/Proponer Trueque | `DONANTE`, `USUARIO_COMUNIDAD` | `trueques.routes.ts:10,29,33-37` |
| Moderar (aprobar/bloquear/eliminar) | `ADMINISTRADOR` únicamente | `admin.routes.ts:9` |
| Crear/editar Categoría | `ADMINISTRADOR` únicamente | `categorias.routes.ts:8,12-13` |

**Hallazgo clave:** el modelo de roles actual **no tiene un rol "Usuario Trueque" independiente** — la capacidad de trueque está mezclada dentro de `DONANTE`/`USUARIO_COMUNIDAD`, igual que "ofertar en una solicitud". Cualquier `DONANTE` ya puede publicar donaciones, ofertar en solicitudes ajenas Y proponer trueques — son 3 capacidades sobre el mismo rol, no 3 roles separados como pide el modelo funcional solicitado.

**"Comunidad" tal como se pide (organización que administra beneficiarios) no existe.** `USUARIO_COMUNIDAD` (confirmado por `grep` en `domain/`/`application/`/`adapters/`, sin resultados salvo el propio enum) es solo un usuario individual con permiso de hacer las 3 acciones (donar+solicitar+intercambiar) — no representa una fundación/iglesia/organización con lista de beneficiarios propios.

### 3.3 Lógica de negocio equivalente encontrada

| Patrón pedido | Dónde existe | Archivo |
|---|---|---|
| publicar | `PublicarDonacionUseCase`, `CrearSolicitudUseCase`, `PublicarTruequeUseCase` | `application/{donaciones,solicitudes,trueques}/use-cases/` |
| aceptar/rechazar | `ActualizarOfertaUseCase` (Solicitud), `ResponderPropuestaUseCase` (Trueque) | ídem |
| entregar | `ActualizarEntregaUseCase.ejecutar` (`confirmar: true`) + `EntregaCierreOrigenService.cerrarOrigen` | `application/entregas/use-cases/`, `domain/entregas/services/` |
| cancelar | `cancelar()` en las 3 entidades + `CancelarDonacionUseCase`/equivalentes | ídem |
| intercambiar | `agregarPropuestaPendiente`/`aceptarPropuesta`/`marcarIntercambiado` en `Trueque.ts` | `domain/trueques/entities/Trueque.ts` |
| ofertar (marketplace) | `CrearOfertaUseCase` | `application/solicitudes/use-cases/` |
| historial | **Parcial** — `auditoria` (tabla) registra CREAR/CANCELAR pero es un log de sistema, no una vista de "mi historial" expuesta al usuario. `GET /admin/reportes` tampoco es historial de usuario. No hay endpoint `GET /donaciones/mias` ni equivalente | — |
| seguimiento | Estados + `GET /entregas/por-referencia/:idReferencia` permiten seguimiento puntual de una publicación conocida, pero no hay una vista agregada "mis publicaciones en curso" | `entregas.routes.ts:11` |

---

## 4. Frontend — pantallas existentes

| Pantalla pedida | Ya existe como | Archivo |
|---|---|---|
| Marketplace / Catálogo | `DonacionesPage`, `SolicitudesPage`, `TruequesPage` — grid responsive con `FiltroPanel` (chips de categoría + estado/urgencia) | `app/pages/*.tsx` |
| Cards | `PublicacionCard.tsx` (genérico, foto + insignia de estado superpuesta) | `shared/components/molecules/PublicacionCard.tsx` |
| Detalle | `DonacionDetallePage`, `SolicitudDetallePage`, `TruequeDetallePage` | `app/pages/*.tsx` |
| Publicaciones (formulario/wizard) | `DonacionWizard`, `SolicitudWizard`, `TruequeWizard` — 5 pasos, sugerencia IA opcional en el último paso | `features/{donaciones,solicitudes,trueques}/components/*Wizard.tsx` |
| Chat | `ChatWidget.tsx` (chatbot IA, flotante) + `ConversationThread.tsx`/`ConversacionesPage.tsx` (mensajería usuario↔usuario) | `features/chatbot/`, `features/mensajeria/`, `app/pages/ConversacionesPage.tsx` |
| Historial | **No existe.** Ninguna página lista "mis publicaciones" ni "mis entregas pasadas" | — |
| Perfil | `PerfilPage.tsx` — tabs Cuenta/Ubicación (Ubicación es solo informativa, ver línea 44-48 del archivo) | `app/pages/PerfilPage.tsx` |
| Dashboard | `HomePage.tsx` (logueado) — 4 tarjetas KPI vía `DashboardStatTile` | `app/pages/HomePage.tsx`, `features/dashboard/` |
| Panel admin | `AdminPage.tsx` — tabs Usuarios/Publicaciones/Reportes | `app/pages/AdminPage.tsx` |

**Coordinación de entrega** ya tiene su propio componente reutilizable embebido en las 3 páginas de detalle: `CoordinacionEntrega.tsx` (`features/entregas/components/`) — muestra modalidad, estado, fecha programada y un botón "Confirmar entrega".

---

## 5. Seguridad

- **Autenticación:** JWT Bearer (`authMiddleware`/`authOpcionalMiddleware`, `main/middlewares/auth.middleware.ts`), token en `sessionStorage` del frontend (ADR-032).
- **Autorización por rol:** `rbacMiddleware(roles[])` (`main/middlewares/rbac.middleware.ts`) — guard a nivel de ruta Express, ya soporta múltiples roles por endpoint (ver tabla sección 3.2). **Sí hay soporte real para RBAC multi-rol**, solo que los roles actuales no coinciden 1:1 con "Donante/Solicitante/Usuario Trueque/Comunidad" pedidos.
- **Autorización a nivel de recurso** (dueño vs. tercero): resuelta dentro de cada caso de uso (no middleware separado — decisión documentada, `fase-06-backend.md` historial Sprint 1: evita una segunda consulta redundante).
- **Frontend:** `RutaProtegida.tsx` (exige sesión, sin distinción de rol) + guards de rol **inline dentro de cada página** (ej. `ROLES_PUEDEN_PUBLICAR`, `ROLES_PUEDEN_OFERTAR`, `ROLES_PUEDEN_PROPONER` — constantes locales en `DonacionesPage.tsx`/`SolicitudDetallePage.tsx`/`TruequeDetallePage.tsx`), no hay un componente `RoleGuard` reutilizable todavía. El menú de navegación (`Navbar`/`Sidebar`/`BottomTabBar`, alimentados por `shared/lib/nav-items.ts`) **no filtra ítems por rol** — todo usuario logueado ve los mismos 7 ítems de navegación (Inicio/Donaciones/Solicitudes/Trueque/Chatbot/Mensajes/Perfil), independientemente de su rol. Esto es justamente lo que motivó la pregunta de la conversación previa a este informe.

---

## 6. Estados — resumen consolidado

Ver detalle completo en sección 3.1. Resumen de nomenclatura pedida vs. real:

| Estado pedido | Equivalente real |
|---|---|
| PUBLICADO | `PUBLICADA` (Donación/Solicitud usan variantes de género), `PUBLICADO` (Trueque) |
| PENDIENTE | `EstadoOferta.PENDIENTE`, `EstadoPropuesta.PENDIENTE` (a nivel de sub-entidad, no de la publicación completa) |
| ACEPTADO | `EstadoOferta.ACEPTADA`, `EstadoPropuesta.ACEPTADA`; a nivel de Solicitud es `ACEPTADA_POR_DONANTE` |
| RECHAZADO | `EstadoOferta.RECHAZADA`, `EstadoPropuesta.RECHAZADA` |
| ENTREGADO | `EstadoDonacion.ENTREGADA`, `EstadoEntrega.CONFIRMADA` |
| FINALIZADO | `EstadoSolicitud.ATENDIDA`, `EstadoTrueque.INTERCAMBIADO` |
| CANCELADO | `CANCELADA`/`CANCELADO` en las 4 entidades — nomenclatura ya consistente |

---

## 7. Modelo de dominio — equivalencias conceptuales

| Concepto pedido | Equivalente real | Coincide en comportamiento? |
|---|---|---|
| Publicación | `Donacion` \| `Solicitud` \| `Trueque` (3 aggregates paralelos, no una superclase única) | Sí, mismo ciclo de vida (crear→estado→cancelar) replicado 3 veces |
| Beneficiario | Rol `BENEFICIARIO` sobre `Usuario`, o el destinatario de una `OfertaSolicitud` aceptada | Sí — beneficiario = quien recibe |
| Organización/Comunidad | `USUARIO_COMUNIDAD` (rol individual) | **No** — el modelo pedido implica una entidad organizacional con beneficiarios propios; lo que existe es un usuario individual con más permisos |
| Solicitud ≠ Pedido | `Solicitud` | Sí, mapeo directo |
| Intercambio ≠ Negociación | `Trueque` + `PropuestaTrueque` | Parcial — hay aceptar/rechazar, pero no hay "negociar" (contraoferta, ajustar términos); es binario |
| Entrega/Evidencia | `Entrega` (estado+fecha), sin evidencia fotográfica de cumplimiento | Parcial |

---

## 8. Código reutilizable — inventario concreto

**Reutilizable sin cambios:**
- `PublicacionCard.tsx`, `FiltroPanel.tsx`, `Stepper.tsx`, `ImageUploader.tsx`, `LocationPicker.tsx`, `Modal.tsx`, `StatusBadge.tsx`, `IASuggestionBox.tsx` (`shared/components/`) — ya diseñados para ser agnósticos de dominio.
- `CoordinacionEntrega.tsx` — ya sirve tanto a Donación como a Trueque vía `idReferencia` polimórfico; extenderlo a un 3er `tipoOperacion` (si se creara un dominio nuevo) seguiría el mismo patrón.
- `httpClient.ts`, `estado-color.ts` (mapeo estado→color semántico, ya cubre los 4 grupos: neutral/progreso/éxito/cancelado).
- Patrón completo de wizard (5 pasos, subida diferida de imágenes) — replicado 3 veces ya, un 4to dominio seguiría el mismo molde.

**Extensible con nuevos atributos (no nueva tabla):**
- `usuarios.rol` podría ganar un 5to valor de enum si se requiere un rol "Usuario Trueque" separado — pero **rompe** la relación actual donde `DONANTE` ya cubre trueques (requeriría decidir si se migra o se coexiste).
- `solicitudes.evidenciaUrl` (string) podría convertirse en relación a `imagenes` (ya tipada para `SOLICITUD`) para admitir múltiples evidencias en vez de una URL suelta.

**Hallazgo real durante la auditoría (no un gap pedido, un descubrimiento):** `mensajes.entregaIdReferencia` (`domain/mensajeria/entities/Conversacion.ts:11`, campo `entregaIdReferencia: string | null`) existe en el modelo pero **ningún caso de uso lo asigna nunca** — `EnviarMensajeUseCase.ts` siempre crea la conversación con `entregaIdReferencia: undefined` (mapea a `null`). Es un campo "preparado para" vincular una conversación a una coordinación de entrega específica, nunca completado. Documentado aquí porque es exactamente el tipo de "código a medio construir" relevante para esta auditoría de reutilización.

---

## 9. Análisis GAP

| Funcionalidad | Ya existe | Parcial | No existe | Archivo relacionado | Observaciones |
|---|:---:|:---:|:---:|---|---|
| Publicar donación (foto+categoría+descripción+ubicación) | ✅ | | | `PublicarDonacionUseCase.ts`, `DonacionWizard.tsx` | Completo, wizard de 5 pasos |
| Administrar mis publicaciones (Donante) | | ⚠️ | | — | Solo filtrado client-side transitorio (`SolicitudDetallePage.tsx:45`), no hay página dedicada |
| Revisar solicitudes de terceros | ✅ | | | `SolicitudesPage.tsx` | Listado público, cualquiera puede ver |
| Aceptar/rechazar beneficiarios (sobre una oferta propia) | ✅ | | | `ActualizarOfertaUseCase.ts` | Vía "Rechazar" en `SolicitudDetallePage.tsx` — aceptar ya ocurrió al crear la oferta (1 paso) |
| Marcar donación como entregada | ✅ | | | `Donacion.marcarEntregada()` línea 155 | Automático al confirmar Entrega, no manual |
| Historial (Donante) | | | ❌ | — | Sin vista dedicada |
| Publicar solicitud (necesidad+urgencia+fotos) | ✅ | | | `CrearSolicitudUseCase.ts`, `SolicitudWizard.tsx` | Completo |
| Recibir propuestas de donantes | ✅ | | | `CrearOfertaUseCase.ts` | Se auto-acepta en 1 paso (RF-009 documentado así, no es un bug) |
| Aceptar una propuesta | ✅ | | | (mismo caso de uso — aceptar y crear oferta son un solo paso) | |
| Coordinar la entrega | ✅ | | | `CoordinacionEntrega.tsx`, `EntregaCoordinacionService.ts` | Reutilizado con Trueques |
| Finalizar la solicitud | ✅ | | | `Solicitud.marcarAtendida()` línea 211 | Automático al confirmar Entrega |
| Publicar artículo para intercambio | ✅ | | | `PublicarTruequeUseCase.ts`, `TruequeWizard.tsx` | Completo |
| Buscar artículos (trueque) | ✅ | | | `TruequesPage.tsx` con `FiltroPanel` | |
| Enviar propuesta de intercambio (ofreciendo un artículo propio) | ✅ | | | `ProponerTruequeUseCase.ts` | |
| Negociar (contraoferta, ajustar términos) | | | ❌ | — | Solo aceptar/rechazar binario, sin contrapropuesta |
| Aceptar/rechazar propuestas | ✅ | | | `ResponderPropuestaUseCase.ts` | |
| Confirmar intercambio | ✅ | | | `Trueque.marcarIntercambiado()` línea 187 | |
| Rol "Comunidad" (organización con beneficiarios propios) | | | ❌ | — | `USUARIO_COMUNIDAD` es un usuario individual, no una organización |
| Solicitar donaciones (como organización) | | ⚠️ | | `solicitudes.routes.ts:10` (`beneficiarioOComunidad`) | Un `USUARIO_COMUNIDAD` puede crear Solicitudes, pero como individuo, no representando a una organización con identidad propia |
| Publicar necesidades colectivas | | | ❌ | — | Toda Solicitud pertenece a un único `beneficiarioId`, no a un colectivo |
| Administrar beneficiarios (de una comunidad) | | | ❌ | — | No existe relación "organización→lista de beneficiarios" en ningún lado |
| Registrar entregas (comunidad) | ✅ | | | `Entrega` (genérico, no específico de comunidad) | Mismo mecanismo que Donación/Trueque |
| Generar evidencia (de entrega cumplida) | | | ❌ | — | `evidenciaUrl` existe solo en Solicitud y es evidencia de la *necesidad*, seteada al crear, no al entregar |
| Llevar historial (comunidad) | | | ❌ | — | Mismo gap que "historial" de Donante/Solicitante |
| Menú de navegación filtrado por rol | | | ❌ | `shared/lib/nav-items.ts`, `AppShell.tsx` | Todos los roles ven los mismos ítems de nav hoy — es la pregunta que originó esta auditoría |
| Chat/mensajería | ✅ | | | `features/mensajeria/` completo | Funcional, con polling |
| Notificaciones | ✅ | | | `features/notificaciones/` completo | In-app únicamente (correo/n8n removido 2026-07-10) |
| Roles múltiples (RBAC) | ✅ | | | `rbacMiddleware`, 4 roles ya soportados | La infraestructura de roles existe; los 4 roles concretos no calzan con el modelo pedido |

---

## 10. Riesgo de cambios

| Cambio | Riesgo | Por qué |
|---|---|---|
| Agregar filtro de menú por rol (ocultar nav items) | **Bajo** | Cambio puramente de frontend (`nav-items.ts` + `AppShell.tsx`), no toca backend ni datos. Reversible en minutos. |
| Renombrar/redefinir roles (`DONANTE`→"perfil trueque" separado, etc.) | **Alto** | `Rol` es un enum de Postgres (`schema.prisma:18-25`) usado en `rbacMiddleware` de 5 archivos de rutas distintas, en `usuarios.rol` con datos ya persistidos (usuarios reales creados durante todo el proyecto), y en el frontend (`RegistroForm.tsx`, guards inline en 3+ páginas). Cambiar el enum exige migración de datos existentes y tocar autorización en ambas capas simultáneamente. |
| Agregar entidad "Comunidad/Organización" con beneficiarios propios | **Alto** | Requiere tabla nueva (`organizaciones`), relación `organizaciones↔usuarios` (muchos a muchos o FK), nuevos casos de uso, nuevos endpoints, nueva UI de administración — es una Bounded Context completa nueva, no una extensión de una existente. |
| Agregar "negociación" (contraoferta) a Trueques | **Medio** | La entidad `Trueque`/`PropuestaTrueque` ya modela un ciclo de vida de propuesta con estado — agregar una tercera transición ("contraproponer") es extender la máquina de estados existente, no rediseñarla, pero sí toca `Trueque.ts`, el use case, el controller y el wizard/detalle de frontend. |
| Agregar "Mis publicaciones"/historial por usuario | **Bajo-Medio** | Los endpoints de listado (`GET /donaciones`, etc.) ya aceptan filtros — agregar `?donanteId=` (o inferirlo del JWT) es un cambio contenido en el use case + repositorio de cada módulo (3 módulos, patrón idéntico ya repetido). Frontend necesita 3 páginas nuevas o una genérica reutilizando `PublicacionCard`. |
| Evidencia fotográfica de entrega cumplida | **Medio** | `Imagen` ya soporta `tipoEntidad` polimórfico — agregar `ENTREGA` como 4to valor del enum `TipoEntidadImagen` es de bajo riesgo en dato, pero exige nueva UI de captura en el flujo de confirmar entrega y decidir la regla de negocio (¿obligatoria? ¿quién la sube, donante o beneficiario?). |

---

## 11. Impacto por capa (si se decide avanzar con el modelo pedido)

- **Base de datos:** el mayor impacto es una tabla nueva `organizaciones` (o reutilizar `usuarios` con una relación autoreferencial "pertenece a organización X") si se quiere modelar "Comunidad" de verdad. El resto (estados, publicaciones, entregas) no requiere cambios de esquema.
- **Backend — dominio:** si se decide separar roles, tocar `Rol` (enum Prisma + value object `domain/identidad/value-objects/Rol.ts`) y las 5 verificaciones `rbacMiddleware` existentes. Si se agrega negociación de trueque, tocar `Trueque.ts` (nueva transición de estado) y su caso de uso.
- **Backend — aplicación/adapters:** nuevos casos de uso solo si se agregan capacidades genuinamente nuevas (negociar, administrar beneficiarios, evidencia de entrega); los CRUD existentes de Donación/Solicitud/Trueque no necesitan tocarse para el filtro de menú.
- **API:** un endpoint nuevo (`GET /donaciones?donanteId=me` o similar) por módulo si se agrega "historial"; ninguno si el alcance se limita al filtro de menú.
- **DTOs:** sin cambios si el alcance es solo frontend (nav filtering); nuevos DTOs de request/response si se agrega negociación o evidencia.
- **Frontend:** `nav-items.ts` + `AppShell.tsx` para filtro de menú (bajo impacto); nuevas páginas para historial/mis-publicaciones; nuevo wizard/flujo si se agrega negociación de trueque.
- **Seguridad:** sin impacto adicional para el filtro de menú (es UX, no autorización real — las rutas ya están protegidas por `rbacMiddleware` independientemente de si el link es visible). Si se separan roles de verdad, sí hay impacto real en autorización.

---

## 12. Informe final — plan de reutilización

**¿Qué porcentaje del sistema ya cubre este modelo?** Aproximadamente **75-80%** de las capacidades funcionales descritas (publicar, aceptar/rechazar, entregar, cancelar, intercambiar, ofertar, chat, notificaciones) ya existen y funcionan end-to-end, verificado con pruebas reales durante todo este proyecto. El **20-25% restante** se concentra casi enteramente en: (1) la ausencia de un concepto real de "Comunidad/Organización" con beneficiarios propios, (2) la falta de vistas de "historial"/"mis publicaciones", y (3) el filtro de menú por rol que originó esta auditoría.

**¿Qué funcionalidades son idénticas?** Publicar (Donación/Solicitud/Trueque), aceptar/rechazar (Oferta/Propuesta), confirmar entrega, cancelar, cambiar categoría/foto/ubicación, chat, notificaciones — coinciden en comportamiento y en la mayoría de los casos también en nombre.

**¿Cuáles son parcialmente compatibles?** El rol "Comunidad" (existe como permiso individual ampliado, no como organización); el "historial" (existe como filtrado transitorio dentro de un flujo, no como vista dedicada); la "evidencia" (existe como campo de texto en Solicitud, no como adjunto de entrega cumplida); la "negociación" de trueque (existe aceptar/rechazar, no contraoferta).

**¿Qué conviene reutilizar?** Todo el patrón de módulo (`domain/application/adapters` × Bounded Context), los 3 wizards existentes, `PublicacionCard`/`FiltroPanel`/`CoordinacionEntrega`, el Event Bus + `NotificacionDispatchService`, el sistema RBAC (`rbacMiddleware` ya soporta N roles por endpoint sin cambios).

**¿Qué conviene extender?** Los use cases de listado (agregar filtro "propio"), el enum `TipoEntidadImagen` (agregar `ENTREGA` si se quiere evidencia fotográfica), la entidad `Trueque` (si se quiere negociación real).

**¿Qué conviene desarrollar desde cero?** Únicamente el concepto de "Comunidad/Organización" con administración de beneficiarios propios — es la única pieza que no tiene ningún equivalente parcial en el código actual, y encaja como un Bounded Context nuevo (`domain/organizaciones/`, siguiendo el mismo molde que los 11 ya existentes) en vez de una extensión de uno existente.

**¿Cuál sería el camino con menor impacto?** Para la pregunta original que motivó esta auditoría (filtro de menú por rol): es un cambio de **riesgo bajo, solo frontend**, sin tocar base de datos ni backend — los roles y permisos reales (RBAC) ya existen y siguen intactos; el menú solo dejaría de *mostrar* enlaces a secciones donde el rol actual no tiene ninguna acción real disponible, respetando lo que cada rol puede hacer hoy (confirmado en la sección 3.2), no lo que "se registró para hacer" literalmente.
