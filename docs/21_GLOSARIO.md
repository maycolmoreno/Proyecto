# 21 — Glosario — DonaConnect Ecuador

Términos usados en toda la serie de auditoría, con la definición aplicada a este proyecto específico (no genérica).

## Arquitectura

- **Bounded Context (DDD):** módulo de negocio con su propio lenguaje y reglas. Este proyecto tiene 12: identidad, categorías, donaciones, solicitudes, trueques, entregas, ia, administración, notificaciones, mensajería, dashboard, publicaciones.
- **Entidad (DDD):** objeto con identidad propia y ciclo de vida (`Donacion`, `Solicitud`, `Trueque`, `Entrega`, `Usuario`).
- **Value Object (DDD):** objeto definido por su valor, inmutable (`Rol`, `PerfilFuncional`, `Urgencia`, los enums de estado).
- **Aggregate:** entidad raíz que agrupa su propia consistencia — `Solicitud` es aggregate root de sus `OfertaSolicitud` embebidas; `Trueque` de sus `PropuestaTrueque`.
- **Puerto (Hexagonal):** interfaz que el dominio define para algo que necesita del exterior (`IDonacionRepository`, `ITokenService`, `IIAProvider`, `IEventBus`).
- **Adaptador (Hexagonal):** implementación concreta de un puerto (`PrismaDonacionRepository`, `JwtTokenService`, `GeminiAdapter`).
- **Caso de uso (Clean Architecture):** una acción de negocio completa que orquesta el dominio a través de puertos (`PublicarDonacionUseCase`).
- **Composition Root:** el único archivo que sabe qué adaptador concreto va en cada puerto (`main/di-container.ts`).
- **Regla de dependencia:** las capas internas (`domain`) nunca conocen a las externas (`adapters`, `main`); las flechas de import siempre apuntan hacia adentro o pasan por una interfaz.
- **Event Bus:** mecanismo pub/sub que desacopla quién genera un evento de negocio de quién reacciona — `node:events.EventEmitter` envuelto en `NodeEventBus` (`main/event-bus.ts`), 14 eventos de dominio, 3 listeners reales (`ModeracionIAService`, `NotificacionDispatchService`, `PublicacionIndexService`).
- **Domain Service:** lógica de dominio que no pertenece naturalmente a una sola entidad (`EntregaCoordinacionService`, `EntregaCierreOrigenService`, los 4 servicios de IA).
- **Repository (patrón):** abstrae el acceso a datos detrás de una interfaz orientada al dominio.

## Modelo de negocio específico de este proyecto

- **Rol (seguridad):** `ADMINISTRADOR`\|`USUARIO` — 2 valores desde ADR-048, controla acceso al panel admin.
- **PerfilFuncional (marketplace):** `DONANTE`\|`SOLICITANTE`\|`TRUEQUE` — 3 valores desde ADR-049, un usuario puede tener 0 a 3 simultáneamente, controla qué puede publicar/ofertar/proponer.
- **Oferta:** propuesta de un `DONANTE` sobre una `Solicitud` ajena — nace ya `ACEPTADA` (1 solo paso, RF-009).
- **Propuesta:** propuesta de intercambio entre dos `Trueque` — sí admite negociación de 2 pasos (pendiente→aceptada/rechazada).
- **Entrega:** entidad polimórfica que coordina el cierre físico de una Donación o un Trueque (`tipoOperacion`+`idReferencia`).
- **Cierre en cascada:** al confirmar una Entrega, el aggregate origen (Donación/Solicitud/Trueque) transiciona automáticamente a su estado terminal — síncrono, no vía Event Bus (`EntregaCierreOrigenService`).
- **Moderación asistida por IA (human-in-the-loop):** la IA marca riesgo, nunca bloquea ni decide — el administrador humano siempre tiene la última palabra (ADR-010/027).

## Infraestructura

- **JWT (JSON Web Token):** token firmado (HS256, 8h) que lleva `sub`/`rol`/`perfiles` embebidos — evita una consulta a BD en cada request protegido, a costa de que un cambio de perfil no se refleje hasta el siguiente login.
- **UUID v4:** identificador único aleatorio usado como PK en las 11 tablas de Postgres (ADR-013) — evita enumerar recursos por la API.
- **TTL Index (MongoDB):** índice que expira documentos automáticamente — solo usado en `eventos_sistema` (90 días).
- **Referencia polimórfica:** columna que apunta a distintas tablas según otro campo (`imagenes.tipoEntidad`+`idEntidad`, `entregas.tipoOperacion`+`idReferencia`) — sin FK física, validada en código (ADR-015).
- **Upload firmado:** patrón donde el backend genera una firma criptográfica (SHA1) sin recibir el archivo, y el navegador sube directo al proveedor externo (Cloudinary) — el binario nunca toca el servidor propio (ADR-009).
- **Structured output / JSON Schema (IA):** forzar a un modelo generativo a responder en un formato JSON fijo y validable, en vez de texto libre — usado en clasificación, matching y moderación IA (no en el chatbot).

## Seguridad

- **RBAC (Role-Based Access Control):** autorización según el rol de seguridad — en este proyecto, acotado exclusivamente al panel de administración (`rbacMiddleware`).
- **Rate limiting:** límite de frecuencia de requests — **documentado (ADR-034) pero no implementado** en este proyecto (`13_SEGURIDAD.md §6`).
- **CSRF (Cross-Site Request Forgery):** ataque que aprovecha cookies enviadas automáticamente — no aplica aquí porque la auth usa `Authorization: Bearer` sin cookies.
- **Prompt injection:** intento de manipular un modelo de IA insertando instrucciones dentro del contenido que se le envía como dato — riesgo real identificado en clasificación/moderación/matching (`13_SEGURIDAD.md §5`).

## DevOps

- **Imagen / Contenedor / Volumen / Red (Docker):** ver definiciones completas en `09_DOCKER.md §1`.
- **Healthcheck:** comando que Docker corre periódicamente para saber si un servicio está realmente listo, no solo "arrancado" — usado en `postgres`/`mongo`, ausente en `api`/`web`.
- **CI (Integración Continua) sin CD:** el pipeline (`install→lint→typecheck→test→build`) corre en cada push, pero no hay un destino de despliegue automático — coherente con el entorno objetivo `localhost` (ADR-000/036).

## Siglas del proyecto

- **ADR:** Architecture Decision Record — entrada en `docs/DECISIONES.md`.
- **RF / RNF:** Requisito Funcional / No Funcional (del SRS original).
- **CU:** Caso de Uso (16 en total, del SRS + 4 agregados por ADR-005).
- **BC:** Bounded Context.
- **SRS:** Software Requirements Specification (`SRS_DonaConnect_Ecuador_ISO29148.docx`).
- **MVP:** Minimum Viable Product.

---

## Qué sigue

`01_RESUMEN_EJECUTIVO.md` sintetiza todo lo auditado hasta ahora en una vista de una página.
