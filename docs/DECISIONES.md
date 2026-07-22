# Registro de Decisiones de Arquitectura — DonaConnect Ecuador

Log vivo de decisiones tomadas durante el diseño. Cada entrada indica: fase en que se originó, decisión, justificación y fases que impacta. Se actualiza y corrige a medida que el proyecto avanza — no se reescribe el historial, se agregan nuevas entradas que reemplazan o refinan una anterior si aplica.

---

### ADR-000 — Entorno de ejecución objetivo: localhost
- **Fecha:** 2026-07-07
- **Origen:** Instrucción directa del usuario (proyecto universitario).
- **Decisión:** El sistema se ejecutará y evaluará en **localhost**, orquestado con **Docker Compose** (backend Node.js/Express, Postgres, MongoDB y n8n), tal como ya sugiere el SRS en §7.3 como opción de desarrollo. Las opciones cloud mencionadas en el SRS (Vercel/Netlify para frontend, Render/Railway/VPS para backend) quedan documentadas como **posibles pero no requeridas** para la entrega académica.
- **Justificación:** El SRS usa lenguaje opcional ("podrá desplegarse en...") para las opciones cloud; el alcance real de evaluación es un entorno académico local.
- **Impacto:** Fase 1 (Arquitectura de despliegue), Fase 10 (DevOps) — CI/CD se simplifica a scripts locales reproducibles, no pipelines de despliegue cloud. Las variables de entorno (§7.3) siguen aplicando igual en `.env` local.
- **Estado:** Vigente.

---

### ADR-001 — n8n dentro del alcance como capa de automatización transversal
- **Fecha:** 2026-07-07
- **Origen:** Fase -1, inconsistencia #1 (n8n aparece en arquitectura/despliegue pero sin RF propio).
- **Decisión:** n8n se mantiene en alcance como infraestructura de automatización (soporta RF-020 Notificaciones y orquestación de llamadas a IA), formalizada en Fase 8, sin RF dedicado por no ser funcionalidad visible al usuario final.
- **Impacto:** Fase 1, Fase 8.
- **Estado:** Vigente.

### ADR-002 — IF-002 reservado para "n8n Webhooks"
- **Fecha:** 2026-07-07
- **Origen:** Fase -1, inconsistencia #2 (salto de numeración en tabla de Interfaces Externas §4).
- **Decisión:** Se asigna IF-002 = n8n Webhooks (Software), cerrando el hueco de numeración del SRS original.
- **Impacto:** Fase 1 (interfaces de integración), Fase 4 (APIs).
- **Estado:** Vigente.

### ADR-003 — Consolidación de numeración RNF
- **Fecha:** 2026-07-07
- **Origen:** Fase -1, inconsistencia #3 (tabla §3.2 y detalle §3.2.1–3.2.5 reutilizan IDs RNF-001…RNF-011 para requisitos distintos).
- **Decisión:** La tabla de §3.2 queda como ID canónico. El detalle en corchetes se fusiona por contenido. Se agregan 4 IDs nuevos para métricas sin equivalente en la tabla: RNF-012 (throughput ≥30 ops/min), RNF-013 (RTO ≤4h / RPO ≤24h), RNF-014 (crear publicación ≤5 pasos), RNF-015 (mensajes de error claros en español).
- **Impacto:** Fase 1 (atributos de calidad), Fase 3, Fase 4. Tabla RNF consolidada final se entrega como parte de Fase 1.
- **Estado:** Vigente — pendiente de publicar tabla consolidada completa en Fase 1.

### ADR-004 — Versión de PostgreSQL corregida
- **Fecha:** 2026-07-07
- **Origen:** Fase -1, inconsistencia #4 ("Postgres 8.x" no existe como versión moderna).
- **Decisión:** Se adopta PostgreSQL 16.x como versión objetivo.
- **Impacto:** Fase 1 (restricciones tecnológicas), Fase 3 (modelo de datos), Fase 10 (Docker).
- **Estado:** Reemplazado por ADR-039 (PostgreSQL 18.3, a pedido explícito del usuario en Fase 10).

### ADR-005 — Corrección y ampliación de la matriz de trazabilidad
- **Fecha:** 2026-07-07
- **Origen:** Fase -1, inconsistencia #5 (RF-014 a RF-020 mapeados por error a "CU-009/CU-012" en Apéndice C del SRS).
- **Decisión:** Se remapean los RF a su CU correcto y se agregan 4 casos de uso nuevos no contemplados en el SRS original: CU-013 (sugerencia de clasificación IA), CU-014 (recomendaciones de matching), CU-015 (mensajería interna), CU-016 (notificaciones del sistema).
- **Impacto:** Fase 0 (casos de uso, ya aplicado), Fase 2 (DDD), Fase 4 (APIs), Fase 12 (backlog).
- **Estado:** Vigente.

---

### ADR-006 — Excepción de HTTPS en entorno localhost académico
- **Fecha:** 2026-07-07
- **Origen:** Fase 1, Arquitectura de seguridad.
- **Decisión:** RNF-004 exige HTTPS/TLS 1.2+ en toda comunicación cliente-servidor. En el entorno de evaluación (localhost, ADR-000) se ejecuta sobre HTTP dado que el tráfico no sale de la máquina.
- **Justificación:** No hay red pública involucrada en localhost; exigir TLS agregaría complejidad (certificados, reverse proxy) sin beneficio real en este contexto de evaluación.
- **Impacto:** Fase 9 (Seguridad), Fase 10 (DevOps). Un despliegue real (fuera del alcance académico) debe reinstaurar HTTPS obligatorio.
- **Estado:** Vigente.

### ADR-007 — Monolito modular en lugar de microservicios
- **Fecha:** 2026-07-07
- **Origen:** Fase 1, Arquitectura lógica.
- **Decisión:** Backend único (Node.js/Express) organizado en módulos de dominio con fronteras internas claras, no microservicios independientes.
- **Justificación:** RNF-009/RNF-010 piden modularidad, no distribución física. Microservicios agregarían complejidad operativa (orquestación, comunicación entre servicios) injustificada para un MVP académico de 6 semanas en localhost.
- **Impacto:** Fase 2 (DDD, define fronteras de módulo), Fase 6 (Backend).
- **Estado:** Vigente.

### ADR-008 — Prisma (PostgreSQL) + Mongoose (MongoDB) como ORM/ODM
- **Fecha:** 2026-07-07
- **Origen:** Fase 1, Arquitectura backend.
- **Decisión:** Se elige Prisma para PostgreSQL y Mongoose para MongoDB, de las opciones que el SRS deja abiertas (IF-SW-002, IF-SW-003).
- **Justificación:** Prisma ofrece migraciones versionadas y tipado fuerte, útil para mantener las relaciones/FK exigidas por BD-004 en un plazo corto; Mongoose está nombrado explícitamente en el SRS y es el estándar de facto para MongoDB en Node.js.
- **Impacto:** Fase 3 (Modelo de Datos), Fase 6 (Backend).
- **Estado:** Vigente.

### ADR-009 — Carga de imágenes vía upload firmado directo a Cloudinary
- **Fecha:** 2026-07-07
- **Origen:** Fase 1, Arquitectura de integración.
- **Decisión:** El binario de la imagen se sube directo desde el frontend a Cloudinary usando una firma emitida por el backend; el backend nunca recibe el archivo, solo persiste la URL resultante.
- **Justificación:** Consistente con la restricción del SRS de no almacenar imágenes como BLOB (§5.3) y reduce carga innecesaria en el backend.
- **Impacto:** Fase 3 (tabla `imagenes`), Fase 4 (API de firma de subida), Fase 6.
- **Estado:** Vigente.

### ADR-010 — Llamadas a IA siempre server-side
- **Fecha:** 2026-07-07
- **Origen:** Fase 1, Arquitectura de IA.
- **Decisión:** El frontend nunca llama directamente al proveedor de IA; toda solicitud pasa por una fachada en el backend.
- **Justificación:** Protege `IA_API_KEY`, permite logging centralizado en MongoDB (`analisis_ia`, `chatbot_conversaciones`) y habilita rate limiting/control de costos.
- **Impacto:** Fase 6 (Backend), Fase 7 (IA).
- **Estado:** Vigente.

---

### ADR-011 — Invariantes de negocio no especificadas en el SRS
- **Fecha:** 2026-07-07
- **Origen:** Fase 2, preguntas abiertas sobre aggregates Solicitud y Trueque, y Value Object Urgencia.
- **Decisión:**
  1. Una Solicitud solo permite **una Oferta `ACEPTADA_POR_DONANTE` activa a la vez**; al aceptar una, las demás pendientes se auto-rechazan.
  2. Un Trueque solo permite **una Propuesta `ACEPTADA` activa a la vez**; al aceptar una, las demás pendientes se auto-rechazan.
  3. `Urgencia` usa escala de 3 niveles: `BAJA | MEDIA | ALTA`.
- **Justificación:** Confirmado directamente por el usuario (Product Owner) ante ambigüedad real del SRS — no se asumió sin validar.
- **Impacto:** Fase 3 (constraints de BD: unicidad de oferta/propuesta activa por solicitud/trueque, `CHECK` en columna urgencia), Fase 4 (validación de API), Fase 6 (lógica de servicio).
- **Estado:** Vigente.

---

### ADR-012 — Mensajería y Notificaciones en MongoDB, no PostgreSQL
- **Fecha:** 2026-07-07
- **Origen:** Fase 3, Modelo lógico.
- **Decisión:** Las colecciones `mensajes` (BC-Mensajería, RF-017/CU-015) y `notificaciones` (BC-Notificaciones, RF-020/CU-016) se crean en MongoDB, no como tablas nuevas en PostgreSQL.
- **Justificación:** Su contenido es conversacional/append-only y no participa de las máquinas de estado de Donación/Solicitud/Trueque; perder un mensaje o notificación no corrompe el negocio, a diferencia de las tablas core. Coherente con el principio de frontera de Fase 1 (Postgres = estado del negocio, Mongo = todo lo demás).
- **Impacto:** Fase 4 (APIs), Fase 6 (Backend), Fase 8 (n8n dispara escritura de notificaciones).
- **Estado:** Vigente.

### ADR-013 — UUID v4 como estrategia de clave primaria en PostgreSQL
- **Fecha:** 2026-07-07
- **Origen:** Fase 3, Modelo físico.
- **Decisión:** Todas las tablas de PostgreSQL usan `UUID` como PK en lugar de enteros autoincrementales.
- **Justificación:** Evita enumeración de recursos en la API (Broken Access Control, OWASP), relevante porque hay datos sensibles de ubicación de usuarios vulnerables. Compatible con Prisma sin fricción adicional.
- **Impacto:** Fase 3 (ya aplicado), Fase 4 (formato de IDs en API), Fase 6.
- **Estado:** Vigente.

### ADR-014 — Política de retención en MongoDB
- **Fecha:** 2026-07-07
- **Origen:** Fase 3, Optimización. El SRS (§5.4) exige una política de retención pero no la especifica.
- **Decisión:** TTL index de 90 días para `logs_n8n` y `eventos_sistema`. Sin expiración automática para `chatbot_conversaciones` y `analisis_ia` (valor histórico para mejorar matching/clasificación).
- **Justificación:** Balance entre cumplir el requisito de retención definida y no perder datos con valor de negocio a largo plazo.
- **Impacto:** Fase 6 (índices Mongo), Fase 10 (monitoreo de espacio en disco).
- **Estado:** Vigente.

### ADR-015 — Referencias polimórficas sin FK de base de datos
- **Fecha:** 2026-07-07
- **Origen:** Fase 3, Modelo ER.
- **Decisión:** `entregas.id_referencia` (hacia `donaciones` o `trueques`) e `imagenes.id_entidad` (hacia `donaciones`, `solicitudes` o `trueques`) son referencias polimórficas sin constraint FK declarativa; se validan en la capa de servicio del backend.
- **Justificación:** PostgreSQL no soporta FK polimórficas nativas. La alternativa (tablas separadas `entregas_donacion`/`entregas_trueque`, `imagenes_donacion`/`imagenes_solicitud`/`imagenes_trueque`) tripliplica estructura para un beneficio marginal en un proyecto académico; se documenta el trade-off en vez de ignorarlo.
- **Impacto:** Fase 4 (validación de API), Fase 6 (lógica de servicio debe validar existencia de la entidad referenciada), Fase 9 (Seguridad — evitar que un `id_referencia` apunte a una entidad inexistente o de otro usuario).
- **Estado:** Vigente.

---

### ADR-016 — Modelo RBAC estricto y segregado por rol
- **Fecha:** 2026-07-07
- **Origen:** Fase 4, Seguridad de API. §2.3 del SRS describe a "Usuario Comunidad" con acceso a donar/solicitar/intercambiar, pero no aclara si Donante/Beneficiario tienen permisos exclusivos o son solo etiquetas descriptivas.
- **Decisión:** Se adopta el modelo **estricto**, elegido explícitamente por el usuario: DONANTE solo puede publicar donaciones, aceptar solicitudes y participar en trueques; BENEFICIARIO solo puede crear/gestionar solicitudes; USUARIO_COMUNIDAD tiene acceso a las tres capacidades (donar, solicitar, truequear); ADMINISTRADOR solo modera (no publica contenido transaccional).
- **Consecuencia documentada:** un usuario registrado como BENEFICIARIO **no puede** publicar donaciones ni trueques a menos que se registre como USUARIO_COMUNIDAD; no existe (en este alcance) un flujo de "cambio de rol" — queda fuera de alcance salvo que se solicite explícitamente en una fase posterior.
- **Impacto:** Fase 4 (matriz RBAC completa), Fase 6 (middleware de autorización), Fase 9 (Seguridad).
- **Estado:** Vigente.

### ADR-017 — Versionado de API vía URL (`/api/v1`)
- **Fecha:** 2026-07-07
- **Origen:** Fase 4, Principios generales de API.
- **Decisión:** Todas las rutas se prefijan con `/api/v1`.
- **Justificación:** Explícito, cacheable, estándar de facto en REST; el versionado por cabecera no aporta valor adicional en un proyecto académico de un solo cliente (el propio frontend).
- **Impacto:** Fase 6 (estructura de rutas Express).
- **Estado:** Vigente.

### ADR-018 — Envelope estándar de paginación y de error
- **Fecha:** 2026-07-07
- **Origen:** Fase 4, Paginación y Manejo de errores.
- **Decisión:** Listados usan paginación offset-based con envelope `{ data, meta: { page, limit, total, totalPages } }`. Errores usan envelope `{ error: { code, message, details } }` con mensajes en español (RNF-011/RNF-015 consolidado).
- **Justificación:** Formato consistente y predecible en todos los endpoints, simplifica el cliente React y cumple el requisito de mensajes de error claros en español.
- **Impacto:** Fase 6 (middleware de error global, helper de paginación).
- **Estado:** Vigente.

### ADR-019 — Regla de exposición de ubicación exacta en la API
- **Fecha:** 2026-07-07
- **Origen:** Fase 4, Seguridad — aplica RNF-011 a nivel de contrato de API.
- **Decisión:** Los endpoints públicos de listado/detalle de donaciones nunca devuelven `latitud`/`longitud` ni `referencia` exactos de la ubicación de retiro; solo `provincia`/`ciudad`/`sector`. Los campos exactos solo se incluyen en la respuesta cuando el solicitante es el propio donante, el beneficiario con oferta `ACEPTADA` sobre esa donación, o un administrador.
- **Justificación:** RNF-011 exige que la ubicación exacta del donante no se muestre públicamente sin autorización expresa; sin esta regla a nivel de DTO, cualquier endpoint público filtraría el dato.
- **Impacto:** Fase 4 (DTOs de respuesta), Fase 6 (serializadores), Fase 9 (Seguridad).
- **Estado:** Vigente.

---

### ADR-020 — Panel de Administración fuera de la navegación principal; Dashboard integrado en Inicio
- **Fecha:** 2026-07-07
- **Origen:** Fase 5, Navegación. IF-USR-003 fija 8 ítems de navegación (Inicio, Donaciones, Solicitudes, Trueque, Chatbot IA, Mensajes, Ubicación, Perfil) que no incluyen explícitamente Dashboard (RF-019) ni Panel de Administración (RF-018).
- **Decisión:** El Panel de Administración vive en una ruta separada (`/admin`), accesible solo para ADMINISTRADOR vía menú de perfil, no en la navegación principal. El Dashboard de impacto se integra dentro de la página Inicio en lugar de agregar un 9º ítem de navegación.
- **Justificación:** Preserva literalmente los 8 ítems que el SRS ya fijó, evitando modificar un requisito de interfaz explícito, mientras cubre RF-018/RF-019 con patrones estándar de UX (panel admin separado, KPIs en home).
- **Impacto:** Fase 6 (rutas del frontend), Fase 9 (Seguridad — proteger ruta `/admin` en el cliente además del backend).
- **Estado:** Vigente.

---

### ADR-021 — Backend en TypeScript
- **Fecha:** 2026-07-07
- **Origen:** Fase 6, Decisiones de lenguaje.
- **Decisión:** El backend se implementa en TypeScript, no JavaScript plano.
- **Justificación:** El SRS solo exige "Node.js + Express.js" sin especificar lenguaje. TypeScript combina bien con Prisma (ADR-008) para tipado end-to-end y reduce errores de integración, relevante en un plazo de 6 semanas.
- **Impacto:** Fase 10 (configuración de build/DevOps).
- **Estado:** Vigente.

### ADR-022 — Zod como librería de validación de DTOs
- **Fecha:** 2026-07-07
- **Origen:** Fase 6, Decisiones de lenguaje.
- **Decisión:** Validación de entrada con Zod, reutilizando los tipos inferidos de TypeScript.
- **Justificación:** Evita duplicar definiciones de tipos y validación por separado; se integra naturalmente con TypeScript (ADR-021).
- **Impacto:** Fase 6 (middleware de validación).
- **Estado:** Vigente.

### ADR-023 — Event Bus in-process (no message broker externo)
- **Fecha:** 2026-07-07
- **Origen:** Fase 6, Eventos.
- **Decisión:** Los 12 eventos de dominio de Fase 2 se publican y consumen dentro del mismo proceso Node.js (EventEmitter o equivalente ligero), sin Kafka/RabbitMQ/SQS.
- **Justificación:** Coherente con el monolito modular (ADR-007) en localhost (ADR-000); un broker distribuido agregaría infraestructura sin beneficio real a esta escala.
- **Impacto:** Fase 8 (n8n consume estos eventos vía webhook HTTP, no vía el bus interno), Fase 10 (sin infraestructura de broker que desplegar).
- **Estado:** Vigente.

---

### ADR-024 — Claude como proveedor de IA; modelos diferenciados por tarea
- **Fecha:** 2026-07-07
- **Origen:** Fase 7, Selección de proveedor y modelo. §2.4.3 dejaba el proveedor abierto ("OpenAI / Claude / proveedor equivalente").
- **Decisión:** Se elige Claude (Anthropic). `claude-sonnet-5` para el chatbot (RF-014); `claude-haiku-4-5` para clasificación (RF-015), matching (RF-016) y moderación asistida (nueva).
- **Justificación:** Salida estructurada nativa (crítica para mapear a categorías reales sin parsing frágil), prompt caching para controlar costo académico, buen desempeño en español (§7.2), y separación de modelo por tarea evita pagar el precio de un modelo conversacional grande en tareas de clasificación de alto volumen.
- **Impacto:** Fase 6 (`IAProviderAdapter`), Fase 9 (gestión de `IA_API_KEY`), Fase 10 (variable de entorno).
- **Estado:** Vigente.

### ADR-025 — Salida estructurada para clasificación y matching
- **Fecha:** 2026-07-07
- **Origen:** Fase 7, secciones 3 y 4.
- **Decisión:** `ClasificacionService` y `MatchingService` usan `output_config.format` (JSON Schema) contra el proveedor de IA, con el `enum` de categorías consultado en vivo a la tabla `categorias` — nunca parsing de texto libre de la respuesta del modelo.
- **Justificación:** Garantiza que la IA nunca sugiera una categoría inexistente y elimina errores de parsing frágil (regex sobre texto libre).
- **Impacto:** Fase 6 (`IAProviderAdapter.clasificar`/`matchScore`).
- **Estado:** Vigente.

### ADR-026 — Sin RAG; conocimiento estático embebido con prompt caching
- **Fecha:** 2026-07-07
- **Origen:** Fase 7, secciones 7 y 8.
- **Decisión:** El chatbot no usa RAG (sin base de datos vectorial ni pipeline de indexación). El FAQ/reglas de la plataforma se embebe directamente en el system prompt, marcado con `cache_control: {type: "ephemeral"}` para abaratar llamadas repetidas.
- **Justificación:** El corpus de conocimiento es pequeño y estático; RAG agregaría infraestructura sin beneficio real a esta escala. Prompt caching reduce el costo de repetir las instrucciones estáticas en cada llamada (relevante para clasificación/moderación, que se disparan en cada publicación).
- **Impacto:** Fase 6 (`IAProviderAdapter.chat`), Fase 10 (costo operativo).
- **Estado:** Vigente. Revisable si el FAQ/catálogo crece sustancialmente post-MVP.

### ADR-027 — Moderación asistida por IA como capacidad nueva "Should have"
- **Fecha:** 2026-07-07
- **Origen:** Fase 7, sección 5. §5.2 exige moderación de contenido inadecuado/fraudulento, pero el mecanismo del SRS (RF-018) es manual.
- **Decisión:** Se agrega una capa de pre-moderación asistida por IA que solo marca riesgo (badge en panel admin), nunca decide ni bloquea automáticamente. Se clasifica como "Should have" (no estaba en el MVP "Must" de 16 RF de Fase -1).
- **Justificación:** Cumple mejor el espíritu de §5.2 sin comprometer el plazo de 6 semanas ni violar el principio human-in-the-loop (ADR-010) — el sistema no certifica ni decide, solo asiste al administrador humano.
- **Impacto:** Fase 6 (nuevo listener de eventos), Fase 11 (Roadmap — priorización), Fase 12 (Backlog).
- **Estado:** Vigente.

---

### ADR-028 — Notificación in-app resuelta en el backend; n8n reservado para correo
- **Fecha:** 2026-07-07
- **Origen:** Fase 8, sección 1. Resuelve la pregunta abierta de Fase 1 sobre el canal real de notificaciones (RF-020).
- **Decisión:** `NotificacionDispatchService` (Fase 6) escribe directamente en Mongo `notificaciones` sin pasar por n8n. n8n se reserva exclusivamente para el canal de correo electrónico y futuros canales externos.
- **Justificación:** La notificación in-app no requiere infraestructura externa; delegarla a n8n agregaría una dependencia innecesaria (si n8n cae, el feed in-app no debería verse afectado).
- **Impacto:** Fase 6 (ya implementado), Fase 10 (n8n deja de ser crítico para el flujo principal de notificaciones).
- **Estado:** Parcialmente vigente — la mitad "in-app sin n8n" se mantiene (nunca dependió de n8n); la reserva de n8n para correo queda sin efecto por ADR-033.

### ADR-029 — Solo eventos de "alto valor" disparan correo
- **Fecha:** 2026-07-07
- **Origen:** Fase 8, sección 5.
- **Decisión:** De los 12 eventos de dominio + `RiesgoDetectado`, solo 7 disparan correo vía n8n (OfertaRecibida, SolicitudAceptadaPorDonante, PropuestaTruequeRecibida, TruequeAceptadoBilateralmente, EntregaProgramada, PublicacionModerada, RiesgoDetectado). El resto queda solo en el feed in-app.
- **Justificación:** Evita saturar al usuario con correo por eventos de bajo valor (ej. que su propia donación fue publicada); prioriza correo para acciones que requieren su atención fuera de la sesión activa.
- **Impacto:** Fase 6 (`N8nWebhookAdapter` solo se invoca para estos 7 eventos).
- **Estado:** Revertida por ADR-047 (2026-07-10) — sin canal de correo, la distinción "alto valor" ya no aplica; los 13 eventos ahora se tratan igual (solo in-app).

### ADR-030 — Credenciales SMTP configuradas dentro de n8n
- **Fecha:** 2026-07-07
- **Origen:** Fase 8, sección 4.
- **Decisión:** Las credenciales del proveedor de correo se configuran en el sistema de credenciales propio de n8n, no como variable de entorno del backend.
- **Justificación:** Mantiene al backend agnóstico del proveedor de correo; simplifica cambiar de proveedor sin tocar código ni `.env` del backend.
- **Impacto:** Fase 10 (variables de entorno — no se agrega `SMTP_*` al backend).
- **Estado:** Sin objeto — revertida por ADR-047 (2026-07-10), no existe canal de correo ni credenciales SMTP en el proyecto.

### ADR-031 — El payload del webhook incluye el correo del destinatario
- **Fecha:** 2026-07-07
- **Origen:** Fase 8, sección 2.
- **Decisión:** El backend resuelve e incluye `usuarioDestinoCorreo` directamente en el payload del webhook, en vez de que n8n consulte la API del backend para obtenerlo.
- **Justificación:** Evita exponer un endpoint interno sin autenticación hacia n8n; mantiene a n8n como consumidor pasivo del evento, sin necesidad de credenciales hacia el backend.
- **Impacto:** Fase 6 (`N8nWebhookAdapter`), Fase 9 (Seguridad — reduce superficie de ataque).
- **Estado:** Sin objeto — revertida por ADR-047 (2026-07-10), no existe webhook.

### ADR-047 — n8n removido del proyecto por completo
- **Fecha:** 2026-07-10
- **Origen:** Decisión explícita del usuario tras probar el frontend en navegador — el workflow de n8n (Switch → Set → Send Email, Fase 8 sección 5) nunca se configuró en la UI y se optó por eliminar la integración en vez de dejarla a medio construir.
- **Decisión:** Se elimina el servicio `n8n` de `docker-compose.yml` (contenedor y volumen `n8n_data` detenidos y borrados), `N8nWebhookAdapter`, `IWebhookNotifier`, `MongooseLogsN8nRepository`, `ILogsN8nRepository` y `N8N_WEBHOOK_URL` (`.env`, `.env.example`, `main/env.ts`). `NotificacionDispatchService` pierde el canal de correo — `notificarConCorreo` se colapsa en `notificar` (todos los eventos quedan solo in-app, sin distinción de "alto valor").
- **Justificación:** El proyecto no tiene, ni tuvo nunca, correo funcionando (Fase 6 historial: la petición a n8n devolvía 404 porque el workflow no existía) — mantener código y un contenedor Docker completo para una integración nunca terminada y con un ADR de reversión pendiente no aporta valor al alcance académico del MVP; el usuario prefirió una base de código más simple sobre completar la configuración manual de n8n.
- **Impacto:** `docker-compose.yml` (un servicio menos), `backend/domain/notificaciones/`, `backend/adapters/notificaciones/`, `backend/main/di-container.ts`, `backend/main/env.ts`, revierte ADR-028 (parcialmente)/029/030/031, `docs/fases/fase-08-automatizaciones.md` (marcada como removida, ya no aplica).
- **Estado:** Vigente.

---

### ADR-032 — JWT permanece como Bearer token en sessionStorage (no se migra a cookies httpOnly)
- **Fecha:** 2026-07-07
- **Origen:** Fase 9, sección 1.
- **Decisión:** Se mantiene el contrato `Authorization: Bearer <token>` ya fijado en Fase 4, guardando el token en `sessionStorage` del cliente. No se migra a cookies `httpOnly` + CSRF token (el patrón más recomendado por OWASP para SPAs).
- **Justificación:** Migrar a cookies reabriría Fase 4 (ya aprobada) y añadiría complejidad de protección CSRF no justificada para un MVP académico de 6 semanas. El riesgo de XSS se mitiga con CSP restrictiva, expiración corta (ADR-033) y `sessionStorage` en vez de `localStorage`.
- **Impacto:** Fase 6 (middleware de autenticación), Fase 10 (cabecera CSP en configuración del servidor).
- **Estado:** Vigente. Si el proyecto evoluciona más allá del MVP académico, reconsiderar cookies `httpOnly` + CSRF.

### ADR-033 — JWT expira en 8 horas, sin refresh token
- **Fecha:** 2026-07-07
- **Origen:** Fase 9, sección 1.
- **Decisión:** Los tokens JWT expiran a las 8 horas; no hay mecanismo de refresh token ni rotación.
- **Justificación:** Suficiente para una sesión de evaluación/trabajo; implementar refresh tokens con revocación agrega complejidad no justificada en el plazo de 6 semanas.
- **Impacto:** Fase 6 (`AutenticacionService.generarToken`).
- **Estado:** Vigente.

### ADR-034 — Límites concretos de rate limiting
- **Fecha:** 2026-07-07
- **Origen:** Fase 9, sección 5.
- **Decisión:** Login/registro limitados por IP (5/15min y 10/hora respectivamente); chatbot e IA limitados por usuario (20-30/min) para control de costo; resto de la API a 100 req/min por IP.
- **Justificación:** Los límites de autenticación mitigan fuerza bruta (OWASP A07); los límites de IA controlan el gasto con el proveedor externo (Fase 7); el límite general es una salvaguarda genérica contra abuso/scraping.
- **Impacto:** Fase 6 (middleware `rateLimiter`), Fase 10 (configuración del servidor).
- **Estado:** Vigente.

---

### ADR-035 — Node.js 20 LTS como runtime
- **Fecha:** 2026-07-07
- **Origen:** Fase 10, sección 1.
- **Decisión:** Backend y frontend corren sobre Node.js 20 LTS en los contenedores Docker.
- **Justificación:** Versión con soporte a largo plazo, compatible con Prisma (ADR-008) y TypeScript 5.x (ADR-021).
- **Impacto:** Fase 10 (Dockerfiles), Fase 6.
- **Estado:** Reemplazado por ADR-041 (Node.js 22 LTS, a pedido explícito del usuario).

### ADR-036 — CI vía GitHub Actions, sin CD
- **Fecha:** 2026-07-07
- **Origen:** Fase 10, sección 3.
- **Decisión:** Pipeline de integración continua (install → lint → typecheck → test → build) en cada push/PR. No hay job de despliegue continuo.
- **Justificación:** El entorno objetivo es localhost (ADR-000); no existe un destino de despliegue continuo real. El pipeline de CI sigue aportando valor de calidad (detectar errores antes de fusionar cambios) sin la complejidad de un CD sin destino.
- **Impacto:** Fase 10 (repositorio, `.github/workflows/`).
- **Estado:** Vigente.

### ADR-037 — Pino como librería de logging estructurado
- **Fecha:** 2026-07-07
- **Origen:** Fase 10, sección 5.
- **Decisión:** Logging estructurado en JSON con Pino, salida a stdout.
- **Justificación:** Estándar de facto en el ecosistema Node/Express, bajo overhead, se integra bien con TypeScript (ADR-021) y con el `request_id` del envelope de error (ADR-018).
- **Impacto:** Fase 6 (middlewares), Fase 10 (observabilidad).
- **Estado:** Vigente.

### ADR-038 — Lista completa de variables de entorno (corrige faltante del SRS)
- **Fecha:** 2026-07-07
- **Origen:** Fase 10, sección 4. El SRS (§4, IF-006) define la interfaz de Mapas pero no la incluye en su lista de variables de entorno (§7.3).
- **Decisión:** Se agrega `MAPS_API_KEY` a la lista de variables de entorno, se desglosa `CLOUDINARY_KEYS` en 4 variables concretas, y se agregan `CORS_ORIGIN`, `PORT`, `NODE_ENV` como buenas prácticas no exigidas explícitamente por el SRS.
- **Justificación:** `MapsAdapter` (Fase 6) no puede funcionar sin esta clave; el SRS la omitió por inconsistencia (mencionó la interfaz pero no su credencial).
- **Impacto:** Fase 10 (`.env.example`), despliegue local.
- **Estado:** Vigente.

---

### ADR-039 — Corrección de versión de PostgreSQL a 18.3 (reemplaza ADR-004)
- **Fecha:** 2026-07-07
- **Origen:** Fase 10, corrección solicitada explícitamente por el usuario tras revisar el borrador de esta fase.
- **Decisión:** La versión objetivo de PostgreSQL pasa de 16.x a **18.3**.
- **Justificación:** Preferencia explícita del usuario (Product Owner), sin objeción técnica — 18.3 es una versión estable más reciente, compatible con Prisma (ADR-008) sin cambios adicionales.
- **Impacto:** Fase 1 (diagramas/tablas de arquitectura), Fase 3 (encabezados del modelo físico), Fase 10 (imagen Docker `postgres:18.3-alpine`). Ningún constraint, índice o tipo de dato definido en Fase 3 cambia — es solo la versión del motor.
- **Estado:** Vigente.

### ADR-040 — Corrección de versión de MongoDB a 8.3.4
- **Fecha:** 2026-07-07
- **Origen:** Fase 10, corrección solicitada explícitamente por el usuario. El SRS (§7.1.2) mencionaba "MongoDB 6.x o MongoDB Atlas".
- **Decisión:** La versión objetivo de MongoDB pasa de 6.x a **8.3.4**.
- **Justificación:** Preferencia explícita del usuario, sin objeción técnica — las colecciones y campos definidos en Fase 3 no usan ninguna característica exclusiva de MongoDB 6.x que no exista en 8.x.
- **Impacto:** Fase 1, Fase 3 (encabezados del modelo físico), Fase 10 (imagen Docker `mongo:8.3.4`).
- **Estado:** Vigente.

### ADR-041 — Corrección de versión de Node.js a 22 LTS (reemplaza ADR-035)
- **Fecha:** 2026-07-07
- **Origen:** Fase 10, corrección solicitada explícitamente por el usuario.
- **Decisión:** El runtime de Node.js pasa de 20 LTS a **22 LTS** en todos los contenedores (backend y frontend).
- **Justificación:** Preferencia explícita del usuario — 22 LTS es la versión LTS más reciente disponible, compatible con TypeScript 5.x (ADR-021) y Prisma (ADR-008).
- **Impacto:** Fase 10 (Dockerfiles: `node:22-alpine`).
- **Estado:** Vigente.

---

### ADR-042 — Arquitectura hexagonal (Ports & Adapters) por módulo en el backend
- **Fecha:** 2026-07-07
- **Origen:** Fase 1 (sección 10) y Fase 6 (sección 1), corrección solicitada explícitamente por el usuario.
- **Decisión:** Cada módulo del backend (Bounded Context, Fase 2) se organiza en 3 capas hexagonales — `domain/` (entidades, VOs, eventos, puertos de salida), `application/` (casos de uso que orquestan el dominio vía puertos) e `infrastructure/` (adaptadores: Prisma/Mongoose para persistencia, Express para HTTP de entrada, Claude/Cloudinary/Mapas/n8n para servicios externos) — en lugar de las capas técnicas simples `routes/controllers/services/repositories`.
- **Justificación:** Formaliza un patrón que ya existía implícitamente (los "adapters" de integración de Fase 6 ya se llamaban así); el dominio y los casos de uso quedan libres de dependencias de framework, lo que permite probarlos (Fase 6, sección 9) sustituyendo adaptadores por dobles de prueba sin levantar Postgres/MongoDB/Claude reales. No contradice el monolito modular (ADR-007) ni el diseño DDD de Fase 2 — es un patrón complementario y frecuente junto a DDD.
- **Impacto:** Fase 1 (sección 10), Fase 6 (sección 1, y reencuadre terminológico de secciones 3/4/6 — sin cambio de responsabilidades, solo de ubicación en el árbol de carpetas).
- **Estado:** Refinado por ADR-044 (4 capas explícitas de Clean Architecture, a pedido del usuario).

### ADR-043 — Arquitectura frontend funcional + modular (feature-based), con TanStack Query
- **Fecha:** 2026-07-07
- **Origen:** Fase 1 (sección 9), corrección solicitada explícitamente por el usuario. Cierra además la "decisión diferida" de librería de data-fetching que Fase 1 había pospuesto a Fase 6.
- **Decisión:** El frontend se organiza por `features/<dominio>` (un módulo por Bounded Context, espejo del backend), cada uno con sus propios `components/hooks/api/types` — en vez de carpetas técnicas globales (`components/`, `hooks/`, `services/`). Dentro de cada módulo, estilo funcional: solo function components, lógica de negocio extraída a hooks puros, composición sobre herencia. Para estado de servidor se adopta **TanStack Query**; estado de UI puramente local usa `useState`/`useReducer`, sin librería global adicional (no se justifica Redux/Zustand para este MVP).
- **Justificación:** Coherente con la estructura modular ya usada en el backend (mismos nombres de módulo en ambos lados del stack); el estilo funcional con hooks puros es el estándar de facto de React moderno y encaja naturalmente con TanStack Query.
- **Impacto:** Fase 1 (sección 9), Fase 5 (los componentes ya inventariados se ubican dentro de esta estructura, sin cambios de diseño visual).
- **Estado:** Refinado por ADR-045 (componentes reutilizables como pilar explícito, a pedido del usuario).

---

### ADR-044 — 4 capas explícitas de Clean Architecture, combinando DDD + Hexagonal (refina ADR-042)
- **Fecha:** 2026-07-07
- **Origen:** Fase 1 (sección 10) y Fase 6 (sección 1), a pedido explícito del usuario: "Arquitectura Hexagonal + DDD + Clean Architecture PARA EL API".
- **Decisión:** Cada módulo del backend se organiza en 4 capas explícitas de Clean Architecture — `domain/` (Entities: entidades DDD, VOs, eventos, Domain Services y puertos de salida), `application/` (Use Cases: casos de uso), `adapters/` (Interface Adapters = Adaptadores Hexagonales: controllers, repositorios, clientes externos) — más `main/` como **composition root único a nivel de aplicación** (Frameworks & Drivers: Express app, cliente Prisma/Mongoose, contenedor de inyección de dependencias, registro de rutas), reemplazando el `infrastructure/` de ADR-042 que mezclaba adaptadores y arranque de framework en una sola carpeta.
- **Justificación:** DDD, Hexagonal y Clean Architecture no compiten — resuelven problemas distintos y se combinan de forma estándar en la industria (DDD = qué modelar; Clean Architecture = cómo organizar capas y la regla de dependencia; Hexagonal = cómo el núcleo se conecta con el exterior). Separar explícitamente "Interface Adapters" de "Frameworks & Drivers" (en vez de un único `infrastructure/`) evita que la configuración de Express/Prisma se duplique por módulo — se centraliza en `main/`.
- **Impacto:** Fase 1 (sección 10, tabla de mapeo DDD↔Clean↔Hexagonal), Fase 6 (sección 1 y referencias de carpeta en secciones 3, 4, 6). No afecta el modelo de dominio de Fase 2 (Aggregates, VOs, eventos) ni los contratos de API de Fase 4 — es una reorganización de carpetas y reglas de dependencia, no un cambio de comportamiento.
- **Estado:** Refinado por ADR-046 (estructura layer-first, a pedido del usuario tras revisar el código de Sprint 0).

### ADR-046 — Estructura layer-first: capas al tope de `backend/`, Bounded Context como subcarpeta
- **Fecha:** 2026-07-08
- **Origen:** Fase 1 (sección 10) y Fase 6 (sección 1), a pedido explícito del usuario tras revisar el código de Sprint 0: "no esperaba esa estructura necesito esta backend/domain, backend/application, backend/adapters".
- **Decisión:** Las 4 capas de Clean Architecture (`domain`, `application`, `adapters`, `main`) van directamente al tope de `backend/` (sin envoltorio `src/`). Cada Bounded Context (Fase 2) es una subcarpeta *dentro* de cada capa (`domain/identidad/`, `application/identidad/`, `adapters/identidad/`), en vez de que cada módulo contenga sus propias subcarpetas `domain/application/adapters` (ADR-044, patrón anterior). Los imports que cruzan de capa usan path aliases de TypeScript (`@domain/*`, `@application/*`, `@adapters/*`, `@main/*`) resueltos en build con `tsc-alias`, en vez de rutas relativas largas (`../../../domain/...`).
- **Justificación:** Preferencia explícita del usuario — con capas al tope, la arquitectura es visible de inmediato al abrir el proyecto, sin tener que entrar a un módulo específico. Los path aliases evitan que cruzar de capa (ahora bajo raíces de carpeta distintas) degrade en rutas relativas frágiles y difíciles de leer.
- **Impacto:** Fase 1 (sección 10 — árbol de carpetas y tabla de mapeo), Fase 6 (sección 1). Código de Sprint 0 (`backend/domain`, `backend/application`, `backend/adapters`, `backend/main`) migrado y re-verificado end-to-end (typecheck, build, lint, Docker, registro/login).
- **Estado:** Vigente.

---

### ADR-045 — Componentes reutilizables como pilar explícito de la arquitectura frontend (refina ADR-043)
- **Fecha:** 2026-07-07
- **Origen:** Fase 1 (sección 9.3) y Fase 5 (sección 3), a pedido explícito del usuario: "Frontend: arquitectura funcional + feature-based architecture + componentes reutilizables".
- **Decisión:** `shared/components/` se organiza en 3 niveles atómicos (`atoms/`, `molecules/`, `organisms/`, ya usados informalmente en el inventario de Fase 5). Se fija una **regla de reutilización** explícita: un componente vive en `shared/` solo si es puramente presentacional (recibe todo por props, no importa hooks/API de ningún `features/*`); si depende de la lógica de un solo dominio, vive en `features/<dominio>/components/` aunque internamente componga piezas compartidas.
- **Justificación:** Antes "componentes reutilizables" era solo una mención de paso dentro de la sección de arquitectura funcional/modular; el usuario pidió elevarlo a pilar propio. La regla explícita evita ambigüedad futura sobre dónde ubicar un componente nuevo (ej. `PublicacionCard` es compartido porque 3 dominios la usan con la misma forma; `DonacionWizard` es específico porque orquesta pasos y validaciones propias de RF-005/006/007).
- **Impacto:** Fase 1 (sección 9.3), Fase 5 (sección 3 — tabla de componentes con columna de ubicación).
- **Estado:** Vigente.

---

### ADR-048 — Perfiles funcionales independientes del rol de seguridad (Opción D)
- **Fecha:** 2026-07-15
- **Origen:** `docs/AUDITORIA_FUNCIONAL_MARKETPLACE.md` (auditoría del 2026-07-10, a raíz de una pregunta del usuario sobre filtrar el menú de navegación por rol) + `docs/DISENO_MODELO_PERFILES.md` (propuesta de 4 opciones, Opción D aprobada explícitamente por el usuario: "continua con la opcion D"). Tracker de ejecución en `docs/PLAN_PERFILES.md`.
- **Decisión:** `usuarios.rol` se reduce de 4 valores (`ADMINISTRADOR|DONANTE|BENEFICIARIO|USUARIO_COMUNIDAD`) a 2 (`ADMINISTRADOR|USUARIO`) — queda exclusivamente como rol de seguridad. Se agrega un concepto nuevo e independiente, `PerfilFuncional` (`DONANTE|SOLICITANTE|TRUEQUE|COMUNIDAD`), en una tabla 1-a-muchos (`usuarios_perfiles`, mismo patrón relacional que `Ubicacion`) — un usuario puede tener 0, 1 o los 4 perfiles simultáneamente, resolviendo "múltiples perfiles sin múltiples cuentas". `rbacMiddleware` se conserva sin cambios, acotado exclusivamente a `ADMINISTRADOR` (`admin.routes.ts`, `categorias.routes.ts`); las rutas de Donaciones/Solicitudes/Trueques migran a un `perfilMiddleware` nuevo (mismo patrón, verifica pertenencia a un array). Los perfiles se embeben en el JWT en cada login (igual que `rol`, evita una consulta extra por request). "Comunidad" se modela como un Perfil más en el corto plazo, no como una entidad `Organizacion` independiente (esa sigue siendo una extensión futura, condicional, fuera de este ADR).
- **Justificación:** el modelo de un solo `rol` por usuario no podía representar "Donante + Solicitante + Trueque" simultáneos sin un enum combinatorio (hasta 15 valores no vacíos con 4 perfiles). `USUARIO_COMUNIDAD` ya era, en la práctica, "el rol que puede todo" — evidencia de que el modelo de un solo valor ya se había quedado corto. Se descartaron: Opción A (permisos sobre el rol actual — no resuelve el problema de fondo, repite el mismo parche), Opción B (renombrar roles — mismo problema si son de un solo valor, o ya es la Opción D con otro nombre si son multivaluados), Opción C (motor de permisos genérico — alcance mayor al problema real, que son 4 perfiles concretos y conocidos de antemano, no decenas de permisos finos). Los 3 módulos de marketplace (Donaciones/Solicitudes/Trueques) se mantienen separados, no se fusionan en una entidad `Publicacion` genérica — la reutilización real (`PublicacionCard`, `FiltroPanel`, wizard de 5 pasos) ya está resuelta en el frontend; fusionar el backend sería reescribir 3 Bounded Contexts completos por un beneficio de reutilización que el frontend ya captura.
- **Impacto:** `domain/identidad/value-objects/Rol.ts` (4→2 valores), `PerfilFuncional.ts` (nuevo), `IUsuarioPerfilRepository`/`PrismaUsuarioPerfilRepository` (nuevo), `ITokenService.TokenPayload` (+`perfiles`), `perfilMiddleware` (nuevo, reemplaza `rbacMiddleware` en 3 archivos de rutas), `RegistrarUsuarioUseCase` (input `rol`→`perfiles[]`, corrige de paso que el registro público podía crear `ADMINISTRADOR` sin ninguna verificación), `AsignarPerfilesUseCase`+`PATCH /usuarios/me/perfiles` (nuevo), `DashboardQueryService` (cuenta por perfil en vez de por rol). Migraciones Prisma `20260715022617_add_usuarios_perfiles` (aditiva) y `20260715030000_reduce_rol_enum` (expand-and-contract, sin cast directo — 23 usuarios reales migrados: 5 ADMINISTRADOR sin cambio, 18 USUARIO). Frontend: `RegistroForm.tsx` (selección múltiple de perfiles), `PerfilPage.tsx` (activar/desactivar perfiles propios), guards `ROLES_PUEDEN_*`→`PERFILES_PUEDEN_*` en 5 páginas. El menú de navegación **no** se filtra por perfil (decisión explícita del usuario en esta misma sesión): Donaciones/Solicitudes/Trueques son navegación pública, los perfiles solo gatean los botones de acción. Ningún caso de uso, repositorio o controller de Donaciones/Solicitudes/Trueques se modificó — nunca conocieron el concepto de rol (la autorización siempre vivió en `main/routes/*.ts`).
- **Estado:** Vigente. Fase 5 del diseño (`Organizacion` con beneficiarios propios, `publicaciones_index` para historial/mis-publicaciones, negociación real en Trueques, evidencia fotográfica de entrega) queda fuera de este ADR — independiente y priorizable por separado.

### ADR-049 — Perfil COMUNIDAD removido del modelo (queda separado hasta priorizarse como Organización)
- **Fecha:** 2026-07-16
- **Origen:** Decisión explícita del usuario tras evaluar el impacto de construir `Organizacion` (agregado de Fase 5, ver ADR-048): "necesito que quede separado comunidad por ahora no va esto hay que quitar todo lo relacionado en este proyecto".
- **Decisión:** El valor `COMUNIDAD` se elimina del enum `PerfilFuncional` (queda `DONANTE|SOLICITANTE|TRUEQUE`, 3 valores). Se elimina toda referencia activa a `COMUNIDAD` en backend y frontend: middlewares de las 3 rutas de marketplace (`donaciones.routes.ts`, `solicitudes.routes.ts`, `trueques.routes.ts`, variables renombradas de `donanteOComunidad`/`beneficiarioOComunidad` a `soloDonante`/`soloSolicitante`/`soloTrueque`), `DashboardQueryService` (campo `usuariosComunidad` removido de `DashboardImpacto`, ambos lados), formularios de registro/perfil (`RegistroForm.tsx`, `PerfilPage.tsx`), y los 5 guards `PERFILES_PUEDEN_*` del frontend. De paso se corrigió un remanente roto de ADR-048 no detectado en su momento: `RolUsuario` (frontend, panel admin) todavía declaraba los 4 roles viejos (`ADMINISTRADOR|DONANTE|BENEFICIARIO|USUARIO_COMUNIDAD`) — se redujo a `ADMINISTRADOR|USUARIO`, alineado con el `Rol` real del backend.
- **Justificación:** Construir `Organizacion` (miembros, beneficiarios propios, necesidades colectivas, indicadores de impacto) es un Bounded Context nuevo completo, estimado en el propio diseño (`docs/DISENO_MODELO_PERFILES.md` sección 7, Fase 5) en 2-3 semanas — fuera de alcance por ahora. Mantener el perfil `COMUNIDAD` sin ninguna funcionalidad real detrás (organización, no solo una etiqueta) generaba una opción visible en el registro que no representaba ninguna capacidad adicional distinta de tener los otros 3 perfiles a la vez. Se prefirió contraer el enum en vez de dejarlo sin uso, evitando confusión futura sobre si "Comunidad" ya estaba implementado.
- **Impacto:** `PerfilFuncional.ts` (4→3 valores), migración Prisma `20260716210000_remove_comunidad_perfil` (expand-and-contract — no se puede hacer `DROP VALUE` directo sobre un enum de Postgres; se eliminaron previamente las filas `usuarios_perfiles` con `perfil = 'COMUNIDAD'`, ninguna con contenido de marketplace asociado), `schema.prisma`, 3 archivos de rutas, `DashboardQueryService.ts` + `dashboard/types/index.ts` (frontend), `RegistroForm.tsx`, `PerfilPage.tsx`, `DonacionesPage.tsx`/`TruequesPage.tsx`/`TruequeDetallePage.tsx`/`SolicitudesPage.tsx`/`SolicitudDetallePage.tsx`, `features/identidad/types/index.ts`, `features/administracion/types/index.ts` + `AdminPage.tsx` (remanente de ADR-048). Tests: `helpers.ts` (persona `USUARIO_COMUNIDAD` ya no incluye el perfil `COMUNIDAD`, sigue representando "los 3 perfiles a la vez"), `perfiles.test.ts` (assert actualizado + test nuevo: `POST /auth/registro` con `perfiles: ['COMUNIDAD']` debe responder 400). El script histórico `scripts/backfill-usuarios-perfiles.ts` no se modifica — documenta una migración de datos ya ejecutada sobre una columna `rol` que ya no existe en ese estado, no vuelve a correr.
- **Estado:** Vigente. La vía queda abierta: si se prioriza `Organizacion` en el futuro, `Organizacion.propietarioId` puede referenciar un `Usuario` normal sin depender de reintroducir este perfil (docs/DISENO_MODELO_PERFILES.md sección 7).

---

## Cómo se usa este archivo
- Cada decisión nueva se agrega al final con su propio ID `ADR-XXX`, nunca se borra una entrada existente.
- Si una decisión se corrige más adelante, se agrega una entrada nueva que referencia el ADR anterior y marca el antiguo como "Reemplazado por ADR-XXX".
- Este archivo es la fuente de verdad de trade-offs y justificaciones técnicas, complementario al SRS original (que no se modifica).
