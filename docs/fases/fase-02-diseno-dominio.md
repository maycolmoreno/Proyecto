# Fase 2 — Diseño del Dominio (DDD)

**Estado:** ✅ Aprobada
**Fecha de creación:** 2026-07-07
**Última actualización:** 2026-07-07
**Fuente:** `SRS_DonaConnect_Ecuador_ISO29148.docx` v1.0 (§3.1, §7.1) + `docs/fases/fase-00-comprension-proyecto.md` + `docs/fases/fase-01-arquitectura-empresarial.md`

## Historial de cambios
| Fecha | Descripción |
|---|---|
| 2026-07-07 | Versión inicial. Subdominios estratégicos, bounded contexts, entidades, value objects, aggregates, repositories, domain services, eventos de dominio y mapeo de casos de uso. Se identifican 2 invariantes de negocio ambiguas en el SRS (ofertas/propuestas concurrentes) como preguntas abiertas. |
| 2026-07-07 | Usuario confirma las 3 invariantes abiertas (ofertas/propuestas: solo una activa; urgencia: 3 niveles). Registrado como ADR-011. Aprobada. Se avanza a Fase 3. |

---

## 1. Subdominios estratégicos (clasificación DDD)

| Subdominio | Tipo | Razonamiento |
|---|---|---|
| Donaciones | **Core** | Es la propuesta de valor diferencial del sistema (RF-005 a RF-010). |
| Solicitudes | **Core** | Contraparte del match donación↔necesidad (RF-008 a RF-010). |
| Trueques | **Core** | Tercer mecanismo de intercambio, con su propio ciclo de negociación (RF-011 a RF-013). |
| Identidad y Acceso | Supporting | Necesario para todo el sistema, pero no es diferenciador (RF-001 a RF-003). |
| Coordinación de Entregas | Supporting | Orquesta la logística entre los 3 dominios core (tabla `entregas`, §7.1.1). |
| Mensajería | Supporting | Habilita coordinación entre usuarios (RF-017). |
| Administración/Moderación | Supporting | Control de calidad de contenido (RF-018). |
| Categorías | Supporting (Shared Kernel) | Catálogo compartido por los 3 dominios core. |
| Inteligencia Artificial | **Generic** | Delegado a proveedor externo (IF-001); el sistema no reinventa IA, la consume (ADR-010). |
| Notificaciones | **Generic** | Reacciona a eventos, sin lógica de negocio propia (RF-020). |

**Implicación de diseño:** el esfuerzo de modelado fino (invariantes, aggregates ricos) se concentra en Donaciones, Solicitudes y Trueques. Los subdominios Generic (IA, Notificaciones) se diseñan como servicios delgados que consumen/reaccionan a los eventos de los dominios Core — coherente con la decisión de Fase 1 de que IA sea siempre una fachada server-side, nunca lógica de negocio propia.

---

## 2. Bounded Contexts y mapa de contexto

| Bounded Context | Responsabilidad | Aggregates que contiene |
|---|---|---|
| **BC-Identidad** | Registro, autenticación, roles, perfil (RF-001 a RF-004) | Usuario |
| **BC-Donaciones** | Ciclo de vida de una donación (RF-005 a RF-007, RF-009, RF-010) | Donación |
| **BC-Solicitudes** | Ciclo de vida de una solicitud y sus ofertas (RF-008 a RF-010) | Solicitud |
| **BC-Trueques** | Ciclo de vida de un trueque y sus propuestas (RF-011 a RF-013) | Trueque |
| **BC-Entregas** | Coordinación logística de retiro/entrega (tabla `entregas`) | Entrega |
| **BC-Mensajería** | Comunicación entre usuarios (RF-017, CU-015) | Conversación |
| **BC-Administración** | Moderación de usuarios/publicaciones/reportes (RF-018, CU-011) | — (opera sobre aggregates de otros contextos vía Domain Service) |
| **BC-Categorías** | Catálogo de categorías (Shared Kernel) | Categoría |
| **BC-IA** (Generic) | Clasificación, matching, chatbot (RF-014 a RF-016) | — (sin aggregate transaccional; opera sobre MongoDB) |
| **BC-Notificaciones** (Generic) | Emisión de notificaciones (RF-020, CU-016) | — (listener de eventos) |

**Mapa de relaciones entre contextos:**

```
BC-Identidad ══(Shared Kernel: UsuarioId)══► todos los demás contextos
BC-Categorías ══(Shared Kernel: CategoriaId)══► BC-Donaciones, BC-Solicitudes, BC-Trueques
BC-Donaciones ──(Customer/Supplier: Oferta)──► BC-Solicitudes
BC-Solicitudes ──(upstream, al aceptar oferta)──► BC-Entregas
BC-Trueques ──(upstream, al aceptar propuesta)──► BC-Entregas
BC-Entregas ──(dispara eventos)──► BC-Mensajería, BC-Notificaciones
BC-Donaciones / BC-Solicitudes / BC-Trueques ──(Open Host Service)──► BC-IA
BC-Administración ──(Anti-corruption / operación directa autorizada)──► BC-Donaciones, BC-Solicitudes, BC-Trueques, BC-Identidad
```

**Justificación del patrón "Open Host Service" para BC-IA:** el dominio de IA no debe filtrar su modelo (prompts, tokens, formato del proveedor) hacia los dominios core; expone una interfaz de dominio propia (`sugerirClasificacion()`, `buscarCoincidencias()`) que oculta el proveedor externo — consistente con ADR-010.

---

## 3. Entidades y Value Objects por contexto

### BC-Identidad
- **Usuario** (Entidad, Aggregate Root): id, nombre, correo, passwordHash, telefono, rol, estado, fechaCreacion.
- **Rol** (Value Object, enum): Administrador | Donante | Beneficiario | UsuarioComunidad (§2.3).
- **Ubicación** (Value Object): provincia, ciudad, sector, referencia, latitud, longitud, tipo (`ESTABLECIDA` | `RETIRO`) — reutilizado también dentro de Donación (ver más abajo). No tiene identidad propia relevante al dominio, aunque se persista con su propio id en Fase 3.

### BC-Donaciones
- **Donación** (Entidad, Aggregate Root): id, donanteId (ref. Usuario), categoriaId (ref. Categoría), titulo, descripcion, estadoObjeto, estadoDonacion, requiereRetiro, ubicacionRetiro (VO, opcional — solo si requiereRetiro=true, regla de negocio #5), imágenes (lista de URLs), fecha.
- **EstadoDonacion** (Value Object, enum): PUBLICADA | SOLICITADA | APROBADA | EN_RETIRO | ENTREGADA | CANCELADA (§3.1.1).

### BC-Solicitudes
- **Solicitud** (Entidad, Aggregate Root): id, beneficiarioId, categoriaId, titulo, descripcion, urgencia, estadoSolicitud, ubicacion (VO), evidencia (opcional), fecha.
- **Oferta** (Entidad hija dentro del aggregate Solicitud): id, donanteId, donacionId (ref. Donación), mensaje, estado, fecha. Vive dentro del aggregate porque su ciclo de vida (aceptar/rechazar) está gobernado por las invariantes de la Solicitud (RF-009, RF-010).
- **EstadoSolicitud** (Value Object, enum): ABIERTA | EN_REVISION | ACEPTADA_POR_DONANTE | EN_ENTREGA | ATENDIDA | CANCELADA (§3.1.1).
- **Urgencia** (Value Object, enum): `BAJA | MEDIA | ALTA` (confirmado por el usuario 2026-07-07; el SRS no especificaba sus valores).

### BC-Trueques
- **Trueque** (Entidad, Aggregate Root): id, usuarioId, categoriaId, titulo, descripcion, estadoObjeto, estadoTrueque, imágenes, fecha.
- **PropuestaTrueque** (Entidad hija dentro del aggregate Trueque): id, truequeOrigenId, truequeOfrecidoId, usuarioProponenteId, estado, fecha. Vive dentro del aggregate por la misma razón que Oferta.
- **EstadoTrueque** (Value Object, enum): PUBLICADO | PROPUESTA_RECIBIDA | ACEPTADO | EN_COORDINACION | INTERCAMBIADO | CANCELADO (§3.1.1).

### BC-Entregas
- **Entrega** (Entidad, Aggregate Root): id, tipoOperacion (`DONACION` | `TRUEQUE`), idReferencia (polimórfico hacia Donación o Trueque), modalidad, estado, fechaProgramada.

### BC-Mensajería
- **Conversación** (Entidad, Aggregate Root): participantes, mensajes (VOs: autor, texto, fecha), referenciaOpcional (a una Entrega/Solicitud/Trueque para dar contexto).

### BC-Categorías
- **Categoría** (Entidad, Aggregate Root): id, nombre, tipo, estado.

### BC-IA / BC-Notificaciones
Sin entidades transaccionales propias — operan como Domain Services sobre los aggregates de otros contextos y sobre las colecciones MongoDB ya definidas en §7.1.2 (ver Fase 1, sección 6 y 7).

---

## 4. Aggregates e invariantes

| Aggregate Root | Invariantes principales |
|---|---|
| **Usuario** | El correo es único en el sistema (RF-001). El rol determina el conjunto de acciones permitidas (RF-003). |
| **Donación** | `ubicacionRetiro` solo existe si `requiereRetiro = true` (regla de negocio #5). No puede transicionar a `ENTREGADA` sin pasar antes por `EN_RETIRO` o `APROBADA` según flujo (§3.1.1). Una vez `ENTREGADA` o `CANCELADA`, el estado es terminal. |
| **Solicitud** | Solo puede tener **una oferta activa (`ACEPTADA_POR_DONANTE`) a la vez**; al aceptar una, las demás pendientes pasan automáticamente a `RECHAZADA` (confirmado por el usuario 2026-07-07). Las transiciones de estado siguen estrictamente §3.1.1. |
| **Trueque** | Requiere **aceptación bilateral** antes de pasar a `EN_COORDINACION` (RF-013, regla de negocio #4). Solo puede tener **una propuesta activa (`ACEPTADO`) a la vez**; el resto se auto-rechaza al aceptar una (confirmado por el usuario 2026-07-07). |
| **Entrega** | `idReferencia` debe apuntar a una Donación en estado `APROBADA`/`EN_RETIRO` o a un Trueque en estado `ACEPTADO`/`EN_COORDINACION` — nunca se crea una Entrega sin acuerdo previo de ambas partes. |
| **Categoría** | El nombre es único por tipo de categoría (evita duplicados en el catálogo compartido). |

---

## 5. Repositories

Uno por Aggregate Root — regla estricta de DDD (nunca un repository para una entidad hija):

`UsuarioRepository` · `DonacionRepository` · `SolicitudRepository` (incluye acceso a sus Ofertas) · `TruequeRepository` (incluye acceso a sus Propuestas) · `EntregaRepository` · `ConversacionRepository` · `CategoriaRepository`.

Diseño detallado de queries, índices y mapeo objeto-relacional se formaliza en **Fase 3**.

---

## 6. Domain Services

Lógica que cruza más de un aggregate no pertenece a ninguno de ellos individualmente:

| Servicio | Responsabilidad | Contextos que cruza |
|---|---|---|
| `AutenticacionService` | Login, emisión/validación de JWT (RF-002) | BC-Identidad |
| `ModeracionService` | Aprobar/bloquear/eliminar usuarios, publicaciones, reportes (RF-018) | BC-Administración → Identidad, Donaciones, Solicitudes, Trueques |
| `ClasificacionService` | Sugerir categoría/título/descripción vía IA (RF-015) | BC-IA → Donaciones, Solicitudes, Trueques |
| `MatchingService` | Recomendar coincidencias entre Solicitud↔Donación↔Trueque según categoría, ubicación y disponibilidad (RF-016) | BC-IA → Donaciones, Solicitudes, Trueques |
| `ChatbotOrquestacionService` | Gestiona la conversación del chatbot IA (RF-014) | BC-IA → BC-Identidad (contexto de usuario) |
| `EntregaCoordinacionService` | Crea y gestiona una Entrega a partir de una Oferta aceptada o Propuesta aceptada | BC-Entregas → Donaciones, Solicitudes, Trueques |
| `NotificacionDispatchService` | Reacciona a eventos de dominio y decide qué notificar (RF-020) | BC-Notificaciones → todos |

---

## 7. Eventos de dominio

| Evento | Origen | Consumidores previstos |
|---|---|---|
| `UsuarioRegistrado` | BC-Identidad | BC-Notificaciones |
| `DonacionPublicada` | BC-Donaciones | BC-IA (clasificación automática), BC-Notificaciones |
| `OfertaRecibida` | BC-Solicitudes (dentro de aggregate Solicitud) | BC-Notificaciones |
| `SolicitudAceptadaPorDonante` | BC-Solicitudes | BC-Entregas, BC-Notificaciones |
| `SolicitudAtendida` | BC-Solicitudes | BC-Notificaciones (dashboard/KPI) |
| `TruequePublicado` | BC-Trueques | BC-IA (matching), BC-Notificaciones |
| `PropuestaTruequeRecibida` | BC-Trueques | BC-Notificaciones |
| `TruequeAceptadoBilateralmente` | BC-Trueques | BC-Entregas, BC-Notificaciones |
| `TruequeIntercambiado` | BC-Trueques | BC-Notificaciones (dashboard/KPI) |
| `EntregaProgramada` | BC-Entregas | BC-Mensajería, BC-Notificaciones |
| `EntregaConfirmada` | BC-Entregas | BC-Notificaciones (dashboard/KPI) |
| `PublicacionModerada` (aprobada/bloqueada) | BC-Administración | BC-Notificaciones |

**Nota de integración:** estos eventos son el punto de enganche natural para los webhooks de n8n definidos en Fase 1 (sección 7) — cada evento relevante puede disparar un webhook hacia n8n para su orquestación asíncrona. Se detalla el mapeo evento→workflow en **Fase 8**.

---

## 8. Mapeo Casos de Uso → Bounded Context

| Caso de uso | Bounded Context | Aggregate/Servicio principal |
|---|---|---|
| CU-001 Registrarse | BC-Identidad | Usuario / `AutenticacionService` |
| CU-002 Iniciar sesión | BC-Identidad | `AutenticacionService` |
| CU-003 Publicar donación | BC-Donaciones | Donación |
| CU-004 Subir fotografías | BC-Donaciones / BC-Solicitudes / BC-Trueques | (transversal, VO de imágenes) |
| CU-005 Crear solicitud de ayuda | BC-Solicitudes | Solicitud |
| CU-006 Aceptar solicitud como donante | BC-Solicitudes | Solicitud (Oferta) |
| CU-007 Publicar objeto para trueque | BC-Trueques | Trueque |
| CU-008 Proponer trueque | BC-Trueques | Trueque (PropuestaTrueque) |
| CU-009 Conversar con chatbot IA | BC-IA | `ChatbotOrquestacionService` |
| CU-010 Coordinar entrega o retiro | BC-Entregas | Entrega / `EntregaCoordinacionService` |
| CU-011 Administrar publicaciones | BC-Administración | `ModeracionService` |
| CU-012 Ver dashboard de impacto | BC-Notificaciones/KPI (transversal) | Lectura agregada de eventos de dominio |
| CU-013 Recibir sugerencia de clasificación IA | BC-IA | `ClasificacionService` |
| CU-014 Recibir recomendaciones de coincidencia | BC-IA | `MatchingService` |
| CU-015 Enviar mensaje a otro usuario | BC-Mensajería | Conversación |
| CU-016 Recibir notificación del sistema | BC-Notificaciones | `NotificacionDispatchService` |

---

## Invariantes de negocio confirmadas por el usuario (2026-07-07)

El SRS no especificaba estas 3 reglas explícitamente; quedan resueltas y registradas como **ADR-011** en `docs/DECISIONES.md`:

1. Una Solicitud solo puede tener **una Oferta `ACEPTADA_POR_DONANTE` a la vez**; al aceptar una, las demás pendientes se auto-rechazan.
2. Un Trueque solo puede tener **una Propuesta `ACEPTADA` a la vez**; al aceptar una, las demás pendientes se auto-rechazan.
3. El Value Object `Urgencia` usa escala de **3 niveles: `BAJA | MEDIA | ALTA`**.

---

**Aprobación:** Aprobada por el usuario (2026-07-07), incluyendo las 3 invariantes confirmadas. Fase cerrada.
