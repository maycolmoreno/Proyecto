# Fase 8 — Automatizaciones (n8n)

**Estado:** ✅ Aprobada
**Fecha de creación:** 2026-07-07
**Última actualización:** 2026-07-07
**Fuente:** Fases 1, 2, 6 + `docs/DECISIONES.md` (ADR-001, ADR-002, ADR-023)

## Historial de cambios
| Fecha | Descripción |
|---|---|
| 2026-07-07 | Versión inicial. Se resuelve la pregunta abierta de Fase 1 sobre el canal de notificaciones: in-app se resuelve en el backend sin n8n; n8n se reserva exclusivamente para correo (y futuros canales externos). Se define el workflow genérico, el contrato de webhook y los 7 eventos que disparan correo. |
| 2026-07-07 | Aprobada por el usuario sin cambios. Se avanza a Fase 9. |

---

## 1. Rol de n8n en la arquitectura

Recapitulando decisiones previas: n8n corre en Docker Compose junto al resto del stack (ADR-000), sin RF propio porque es infraestructura de automatización transversal, no funcionalidad visible al usuario (ADR-001). El backend le habla exclusivamente vía **webhooks salientes** — n8n nunca llama al backend ni tiene acceso directo a Postgres/MongoDB.

**Decisión que resuelve la pregunta abierta de Fase 1** ("¿cuál es el canal real de notificaciones?"):

- **Notificación in-app** ya está resuelta desde Fase 6: `NotificacionDispatchService` (listener del Event Bus in-process) escribe directamente en la colección `notificaciones` (MongoDB, Fase 3) cuando ocurre un evento de dominio. **No depende de n8n.**
- **n8n se reserva exclusivamente para el canal de correo electrónico** (y, en una fase futura no cubierta por este MVP, otros canales externos como SMS o Slack) — tareas que el backend delega a un orquestador externo en vez de implementar un cliente SMTP propio.

→ **ADR-028**.

---

## 2. Webhooks

**Contrato del webhook saliente** (`N8nWebhookAdapter.emitir`, Fase 6):

```json
{
  "evento": "OfertaRecibida",
  "entidad": "SOLICITUD",
  "entidadId": "uuid",
  "usuarioDestinoId": "uuid",
  "usuarioDestinoCorreo": "correo@resuelto-por-el-backend.com",
  "datos": { "...campos relevantes específicos del evento" },
  "timestamp": "2026-07-07T12:00:00Z"
}
```

**Decisión de seguridad/simplicidad:** el backend resuelve y **incluye el correo del destinatario directamente en el payload**, en lugar de que n8n tenga que consultar la API del backend para obtenerlo. Esto evita exponer un endpoint interno sin autenticación hacia n8n y mantiene a n8n como un consumidor puramente pasivo del evento. → **ADR-031**.

**Endpoint único en n8n:** un solo Webhook Trigger (`POST /webhook/donaconnect-eventos`, mapeado a `N8N_WEBHOOK_URL`, §7.3) recibe todos los eventos; un nodo *Switch* interno enruta por el campo `evento` — evita gestionar 12 URLs de webhook distintas.

**Manejo de fallos:** coherente con Fase 6 ("las integraciones externas fallan de forma no bloqueante") — si n8n no responde, la operación principal en el backend ya se completó (el webhook se dispara *después* de confirmar el cambio de estado en Postgres), y el backend registra el resultado en `logs_n8n` (Fase 3) sin reintentar de forma síncrona. n8n puede configurarse con reintento interno (`Retry on Fail`) para el envío de correo específicamente.

---

## 3. Notificaciones

| Canal | Mecanismo | Cobertura |
|---|---|---|
| In-app | `NotificacionDispatchService` → Mongo `notificaciones` (Fase 6, sin n8n) | Los 12 eventos de dominio (Fase 2) + `RiesgoDetectado` (Fase 7) |
| Correo | n8n (Webhook → Switch → Send Email) | Solo 7 eventos de "alto valor" (sección 5) — evita saturar al usuario con correo por cada evento menor |

---

## 4. Correos

**Configuración de credenciales SMTP:** se configuran **dentro de n8n** (su propio sistema de credenciales, gestionado desde la UI de n8n), no como variable de entorno del backend — el backend no necesita saber nada sobre el proveedor de correo. Para el entorno académico local se recomienda un proveedor de pruebas (ej. Mailtrap) o una cuenta Gmail con contraseña de aplicación. → **ADR-030**.

**Plantillas** (cuerpo armado por un nodo *Set*/*Function* en n8n a partir de `datos` del payload, texto simple, sin diseño HTML elaborado — apropiado para el alcance académico):

| Evento | Asunto | Destinatario |
|---|---|---|
| `OfertaRecibida` | "Un donante quiere ayudarte con tu solicitud" | Beneficiario |
| `SolicitudAceptadaPorDonante` | "Tu solicitud fue aceptada" | Beneficiario |
| `PropuestaTruequeRecibida` | "Recibiste una propuesta de trueque" | Dueño del trueque origen |
| `TruequeAceptadoBilateralmente` | "Tu trueque fue confirmado" | Ambas partes (2 envíos) |
| `EntregaProgramada` | "Coordinación de entrega/retiro programada" | Ambas partes involucradas |
| `PublicacionModerada` | "Tu publicación fue revisada por un administrador" | Autor de la publicación |
| `RiesgoDetectado` (Fase 7) | "Publicación marcada para revisión" | Administradores (lista fija configurada en n8n) |

---

## 5. Flujos automáticos (mapeo evento → acción)

| Evento (Fase 2) | In-app | Correo (n8n) |
|---|:---:|:---:|
| `UsuarioRegistrado` | ✅ | ❌ |
| `DonacionPublicada` | ✅ | ❌ |
| `OfertaRecibida` | ✅ | ✅ |
| `SolicitudAceptadaPorDonante` | ✅ | ✅ |
| `SolicitudAtendida` | ✅ | ❌ |
| `TruequePublicado` | ✅ | ❌ |
| `PropuestaTruequeRecibida` | ✅ | ✅ |
| `TruequeAceptadoBilateralmente` | ✅ | ✅ |
| `TruequeIntercambiado` | ✅ | ❌ |
| `EntregaProgramada` | ✅ | ✅ |
| `EntregaConfirmada` | ✅ | ❌ |
| `PublicacionModerada` | ✅ | ✅ |
| `RiesgoDetectado` (Fase 7) | ✅ (a administradores) | ✅ |

→ **ADR-029** — criterio: solo eventos que requieren atención del usuario **fuera de su sesión activa** (coordinar, revisar una oferta, saber que algo fue bloqueado) disparan correo; los de solo valor informativo/KPI quedan en el feed in-app.

**Estructura del workflow n8n** (uno solo, reutilizado por Switch):
```
Webhook Trigger (POST /webhook/donaconnect-eventos)
        │
        ▼
Switch (por campo "evento")
        │
   ┌────┴────┬─────────┬───...
   ▼         ▼         ▼
[Set: asunto/cuerpo]  (uno por rama, 7 ramas — sección 4)
   │
   ▼
Send Email (SMTP configurado en n8n)
```

El backend registra el resultado (éxito/error del webhook) en `logs_n8n` (Fase 3) a través del propio `N8nWebhookAdapter`, no requiere un nodo adicional en n8n para esto.

---

## Nuevas decisiones de esta fase (ver `docs/DECISIONES.md`)
- ADR-028 — Notificación in-app resuelta en el backend (sin n8n); n8n reservado exclusivamente para correo y futuros canales externos.
- ADR-029 — Solo 7 eventos de "alto valor" disparan correo; el resto queda solo in-app.
- ADR-030 — Credenciales SMTP configuradas dentro de n8n, no como variable de entorno del backend.
- ADR-031 — El payload del webhook incluye el correo del destinatario resuelto por el backend, para que n8n no necesite autenticarse contra la API.

---

**Aprobación:** Aprobada por el usuario (2026-07-07). Fase cerrada.
