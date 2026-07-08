# Fase 11 — Roadmap

**Estado:** ✅ Aprobada
**Fecha de creación:** 2026-07-07
**Última actualización:** 2026-07-07
**Fuente:** SRS §2.5 (MVP en 6 semanas) + Fases 0-10 completas

## Historial de cambios
| Fecha | Descripción |
|---|---|
| 2026-07-07 | Versión inicial. 6 sprints de 1 semana (coherente con el plazo de MVP de §2.5), cada uno con objetivo, historias de usuario, dependencias, riesgos, entregables y Definition of Done. Se revisa formalmente el riesgo de cronograma identificado en Fase -1. |
| 2026-07-07 | Aprobada por el usuario sin cambios. Se avanza a Fase 12 (última fase del Plan Maestro). |

---

## Principio de secuenciación

El orden de los sprints sigue las dependencias técnicas ya establecidas en el diseño (Fase 2 Bounded Contexts, Fase 6 módulos): primero la base técnica y la identidad (todo depende de autenticación y RBAC), luego los 3 dominios Core en el orden que permite reutilizar patrones (Donaciones → Solicitudes/Ofertas → Trueques/Propuestas, ya que Ofertas y Propuestas comparten la misma forma de invariante, ADR-011), después IA y Administración (necesitan datos reales para tener sentido), y al final lo que es explícitamente "Should have" (Fase -1: mensajería, notificaciones, dashboard) junto con el pulido y las pruebas de integración.

**Regla de recorte si hay atraso:** los RF "Should have" del Sprint 5 son los primeros candidatos a recortarse — el MVP "Must have" (16 RF) se completa en los Sprints 0-4.

---

## Sprint 0 (Semana 1) — Fundación técnica e Identidad

**Objetivo:** tener el stack completo corriendo end-to-end en localhost y el flujo de autenticación funcional.

**Historias de usuario:**
- Como desarrollador, quiero levantar todo el stack con `docker compose up` para poder desarrollar de forma reproducible (Fase 10).
- Como usuario, quiero registrarme con nombre, correo, contraseña y rol para poder usar la plataforma (RF-001).
- Como usuario, quiero iniciar sesión y recibir un token para acceder a funciones protegidas (RF-002).
- Como administrador, quiero que el sistema controle permisos según mi rol desde el primer endpoint protegido (RF-003).

**Dependencias:** ninguna — es la base de todo lo demás.

**Riesgos:** una configuración de Docker Compose mal resuelta bloquea el resto del roadmap. *Mitigación:* dedicar la semana completa a esto antes de tocar cualquier feature de negocio; no avanzar al Sprint 1 sin `docker compose up` estable.

**Entregables:** `docker-compose.yml` funcional (Fase 10), esquema Prisma inicial (`usuarios`, `ubicaciones`), endpoints `/auth/registro`, `/auth/login`, `/usuarios/me`, middlewares `auth`/`rbac` (Fase 9), CI verde (Fase 10).

**Definition of Done:** los 5 servicios levantan sin error; un usuario puede registrarse e iniciar sesión vía cliente HTTP (Postman/curl); un endpoint protegido rechaza peticiones sin JWT válido; CI pasa en la rama principal.

---

## Sprint 1 (Semana 2) — Donaciones y Categorías

**Objetivo:** flujo completo de publicación de donaciones con imágenes.

**Historias de usuario:**
- Como beneficiario, quiero registrar mi ubicación establecida y necesidades principales en mi perfil (RF-004).
- Como donante, quiero publicar un objeto disponible con título, descripción, categoría, estado, fotos y condiciones de entrega (RF-005).
- Como donante, quiero subir una o varias fotografías de mi donación (RF-006).
- Como donante, quiero que el sistema me pida mi ubicación solo si elijo retiro en domicilio (RF-007).
- Como administrador, quiero gestionar el catálogo de categorías.

**Dependencias:** Sprint 0 (autenticación, roles).

**Riesgos:** la integración de firma de subida a Cloudinary (ADR-009) puede tomar más tiempo del estimado si hay fricción con el SDK. *Mitigación:* probarla de forma aislada (un endpoint mínimo) antes de integrarla al wizard completo.

**Entregables:** CRUD de `donaciones` y `categorias`, endpoint de firma de subida, wizard de publicación (Fase 5, 5 pasos) funcional para donaciones.

**Definition of Done:** un usuario con rol DONANTE o USUARIO_COMUNIDAD publica una donación con al menos una foto y la ve reflejada en `GET /donaciones`.

---

## Sprint 2 (Semana 3) — Solicitudes y Ofertas

**Objetivo:** flujo completo de solicitud de ayuda y su aceptación por un donante.

**Historias de usuario:**
- Como beneficiario, quiero crear una solicitud indicando objeto requerido, urgencia, ubicación y evidencia opcional (RF-008).
- Como donante, quiero aceptar una solicitud de ayuda y ofrecer un objeto relacionado (RF-009).
- Como beneficiario, quiero ver el estado de mi solicitud avanzar según el flujo definido (RF-010).

**Dependencias:** Sprint 1 (categorías y donaciones ya existen para poder vincular una oferta a una donación real).

**Riesgos:** la invariante "una sola oferta activa por solicitud" (índice único parcial, ADR-011) debe probarse con casos de dos donantes ofertando casi simultáneamente. *Mitigación:* la restricción ya vive en la base de datos (Fase 3), no solo en la capa de aplicación — el peor caso es un 409 controlado (Fase 4), no un dato corrupto.

**Entregables:** CRUD de `solicitudes`, endpoint `POST /solicitudes/:id/ofertas`, `EntregaCoordinacionService` disparando la creación automática de una `Entrega` al aceptar.

**Definition of Done:** un beneficiario crea una solicitud; un donante la acepta; el estado pasa a `ACEPTADA_POR_DONANTE`; se crea automáticamente un registro en `entregas`.

---

## Sprint 3 (Semana 4) — Trueques y Propuestas

**Objetivo:** flujo completo de trueque con aceptación bilateral.

**Historias de usuario:**
- Como donante/usuario comunidad, quiero publicar un objeto para trueque indicando qué busco a cambio (RF-011).
- Como usuario, quiero proponer un intercambio entre mi objeto y el de otro usuario (RF-012).
- Como usuario, quiero que ambas partes deban aceptar antes de coordinar la entrega (RF-013).

**Dependencias:** Sprint 0 (autenticación). Reutiliza el patrón de "oferta con estado" ya construido en Sprint 2 (Propuesta de trueque es estructuralmente análoga a Oferta) — riesgo técnico bajo.

**Riesgos:** bajo — la mayor parte del patrón ya se validó en Sprint 2.

**Entregables:** CRUD de `trueques`, endpoint `POST /trueques/:id/propuestas`, aceptación bilateral (`PATCH .../propuestas/:id`), pantalla de coordinación de entrega (CU-010) reutilizada para ambos flujos (donación y trueque).

**Definition of Done:** dos usuarios completan un trueque de extremo a extremo: publicar → proponer → aceptar → coordinar entrega → estado `INTERCAMBIADO`.

---

## Sprint 4 (Semana 5) — Inteligencia Artificial y Administración

**Objetivo:** chatbot, clasificación, matching básico y panel de moderación operativos.

**Historias de usuario:**
- Como usuario, quiero conversar con un chatbot que me oriente sobre la plataforma (RF-014).
- Como usuario, quiero recibir una sugerencia editable de categoría/título/descripción al publicar (RF-015).
- Como administrador, quiero revisar, aprobar, bloquear o eliminar publicaciones y usuarios sospechosos (RF-018).

**Dependencias:** Sprints 1-3 (la clasificación y la moderación necesitan publicaciones reales sobre las cuales operar).

**Riesgos:** ⚠️ **el mayor riesgo del roadmap** — la integración con el proveedor de IA externo (latencia, disponibilidad, costo) ya identificada en Fase -1 y Fase 7. *Mitigación:* el diseño ya contempla fallos no bloqueantes (Fase 6, sección 6) — si la IA no responde, la publicación se crea igual sin sugerencia; probar la integración real con el proveedor lo antes posible dentro de la semana, no al final.

**Entregables:** `ChatbotOrquestacionService`, `ClasificacionService` integrados con Claude (Fase 7), panel de administración (Fase 5) con badges de riesgo (moderación asistida por IA, ADR-027).

**Definition of Done:** el chatbot responde en menos de 10 segundos (RNF-002); al publicar, aparece una sugerencia de IA que el usuario puede aceptar o editar; un administrador puede aprobar/bloquear una publicación desde el panel.

---

## Sprint 5 (Semana 6) — Should haves, integración final y QA

**Objetivo:** completar las capacidades "Should have", cerrar pruebas de integración y dejar el sistema listo para evaluación.

**Historias de usuario:**
- Como usuario, quiero enviar mensajes a otro usuario para coordinar entrega o retiro (RF-017).
- Como usuario, quiero ver un dashboard con indicadores de impacto (RF-019).
- Como usuario, quiero recibir notificaciones cuando cambie el estado de algo relevante para mí (RF-020).
- Como usuario, quiero recibir un correo para los eventos que requieren mi atención fuera de la sesión activa (Fase 8).

**Dependencias:** todos los sprints anteriores — es la fase de integración final.

**Riesgos:** acumulación de atraso de sprints previos. *Mitigación:* este sprint tiene margen de reserva intencional — si hay atraso, RF-017/019/020 (todos "Should have", Fase -1) se recortan primero, priorizando que los 16 RF "Must have" queden completos y probados.

**Entregables:** mensajería (`BC-Mensajería`), feed de notificaciones in-app, workflow de correo en n8n (Fase 8), dashboard de impacto, pruebas de integración de los flujos core (Fase 6, sección 9) corriendo en CI, ajustes finales de responsive (Fase 5).

**Definition of Done:** sistema completo corriendo en `docker compose up` sin intervención manual; pruebas de integración de los 3 flujos core (donación, solicitud, trueque) pasando en CI; dashboard muestra KPIs reales de los datos generados durante las pruebas; los 16 RF "Must have" verificables end-to-end.

---

## Dependencias entre sprints (resumen)

```
Sprint 0 (Identidad)
   │
   ▼
Sprint 1 (Donaciones) ──► Sprint 2 (Solicitudes/Ofertas) ──┐
   │                                                        ▼
   └──────────────────────► Sprint 3 (Trueques/Propuestas) ─┤
                                                             ▼
                                              Sprint 4 (IA + Administración)
                                                             │
                                                             ▼
                                              Sprint 5 (Should haves + QA final)
```

## Riesgos consolidados del roadmap

| # | Riesgo | Sprint | Severidad | Mitigación |
|---|---|---|---|---|
| 1 | Integración con proveedor de IA (latencia/costo/disponibilidad) | 4 | Alta | Diseño no-bloqueante ya implementado (Fase 6); probar temprano en la semana |
| 2 | Firma de subida a Cloudinary más lenta de integrar | 1 | Media | Probar aislada antes del wizard completo |
| 3 | Concurrencia en invariantes únicas (oferta/propuesta activa) | 2, 3 | Media | Constraint a nivel de BD (Fase 3), no solo aplicación |
| 4 | 16 RF "Must" en 6 semanas es ambicioso (ya identificado en Fase -1) | Todos | Alta | RF "Should" (Sprint 5) son el primer recorte si hay atraso |
| 5 | Capacidad del equipo (tamaño no confirmado por el usuario) | Todos | Media | Genérico — a monitorear sprint a sprint |

## Definition of Done — criterios transversales (aplican a toda historia)

- Pasa lint + typecheck + build en CI (Fase 10).
- Sigue el contrato de API de Fase 4 (DTOs, envelope de error, versionado).
- Respeta la matriz RBAC de Fase 4 (ADR-016) y las reglas de ownership.
- Las acciones sensibles quedan auditadas (Fase 9, sección 3).
- Ninguna credencial hardcodeada — todo vía variables de entorno (Fase 10).
- Probado manualmente o con prueba de integración antes de cerrarse.

---

**Aprobación:** Aprobada por el usuario (2026-07-07). Fase cerrada.
