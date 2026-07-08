# Fase 10 — DevOps

**Estado:** ✅ Aprobada
**Fecha de creación:** 2026-07-07
**Última actualización:** 2026-07-07
**Fuente:** `SRS_DonaConnect_Ecuador_ISO29148.docx` §7.3 + Fases 1, 6, 8, 9 + `docs/DECISIONES.md` (ADR-000, ADR-004, ADR-021)

## Historial de cambios
| Fecha | Descripción |
|---|---|
| 2026-07-07 | Versión inicial. Docker/Docker Compose concretos, pipeline de CI (sin CD real, coherente con el entorno localhost), variables de entorno completas (se detecta y corrige un faltante del SRS: `MAPS_API_KEY`), y una estrategia de observabilidad proporcional al alcance académico (logging estructurado + healthcheck, sin APM). |
| 2026-07-07 | Corrección de versiones a pedido del usuario: Node.js 20 LTS → 22 LTS, PostgreSQL 16.x → 18.3, MongoDB 6.x → 8.3.4 (ADR-039/ADR-040/ADR-041). |
| 2026-07-07 | Aprobada por el usuario. Se avanza a Fase 11. |

---

## 1. Docker

| Servicio | Imagen base | Notas |
|---|---|---|
| `web` | `node:22-alpine` | Vite dev server (no build de producción — el entorno objetivo es localhost, ADR-000) |
| `api` | `node:22-alpine` | TypeScript (ADR-021) con hot-reload en desarrollo (`tsx watch` o `ts-node-dev`) |
| `postgres` | `postgres:18.3-alpine` | Coherente con ADR-039 (PostgreSQL 18.3, corrige ADR-004) |
| `mongo` | `mongo:8.3.4` | Coherente con ADR-040 (MongoDB 8.3.4, corrige §7.1.2 del SRS) |
| `n8n` | `n8nio/n8n` (oficial) | Ya definido en Fase 1/8 |

**Node.js 22 LTS** como runtime — versión soportada a largo plazo, compatible con Prisma (ADR-008) y TypeScript 5.x.

Dockerfiles simples de una sola etapa (no multi-stage optimizado para producción) — coherente con el alcance: el sistema no se despliega a un entorno productivo real dentro de este proyecto académico.

---

## 2. Docker Compose

Un único `docker-compose.yml` (ya esbozado en Fase 1, sección 3), con:

- **Red:** `donaconnect-network` (bridge), todos los servicios en la misma red.
- **Volúmenes persistentes:** `postgres_data`, `mongo_data`, `n8n_data` — evita perder datos entre reinicios durante la evaluación.
- **Dependencias con healthcheck:** `api` espera a que `postgres` y `mongo` reporten `healthy` antes de iniciar (evita errores de conexión en el arranque).
- **Puertos** (ya fijados en Fase 1): `web:5173`, `api:4000`, `postgres:5432`, `mongo:27017`, `n8n:5678`.

```
services:
  web        → depende de: api
  api        → depende de: postgres (healthy), mongo (healthy)
  postgres   → volumen postgres_data
  mongo      → volumen mongo_data
  n8n        → volumen n8n_data, depende de: api (para recibir webhooks)
```

---

## 3. CI/CD

**Decisión:** CI sí, CD no. El entorno objetivo es localhost (ADR-000) — no existe un ambiente de staging/producción real hacia el cual desplegar continuamente. Sí tiene valor académico y de calidad un pipeline de **integración continua** en GitHub Actions:

```
on: push, pull_request
jobs:
  - install dependencias (backend y frontend)
  - lint (ESLint)
  - typecheck (tsc --noEmit)
  - test (pruebas de integración de Fase 6, sección 9)
  - build (verifica que compile, sin publicar artefacto)
```

No hay job de despliegue (`deploy`) — coherente con que no hay destino de despliegue continuo. → **ADR-036**.

---

## 4. Variables de entorno

Se retoma la lista del SRS (§7.3) y se completa con lo que las decisiones de fases posteriores requieren — **se detecta un faltante real del SRS**: define `IF-006 Mapas` como interfaz externa (§4) pero nunca la incluye en la lista de variables de entorno de §7.3.

| Variable | Origen | Notas |
|---|---|---|
| `JWT_SECRET` | SRS §7.3 | Fase 9 |
| `DB_POSTGRES_URL` | SRS §7.3 | Fase 3 |
| `MONGODB_URI` | SRS §7.3 | Fase 3 |
| `IA_API_KEY` | SRS §7.3 | Fase 7 (Claude/Anthropic) |
| `CLOUDINARY_CLOUD_NAME` | Desglose de `CLOUDINARY_KEYS` (SRS §7.3) | Fase 4 (ADR-009) |
| `CLOUDINARY_API_KEY` | ídem | |
| `CLOUDINARY_API_SECRET` | ídem | |
| `CLOUDINARY_UPLOAD_PRESET` | ídem | Necesario para el flujo de firma de subida |
| `MAPS_API_KEY` | **Faltante en el SRS — agregado aquí** | IF-006, requerido por `MapsAdapter` (Fase 6) |
| `N8N_WEBHOOK_URL` | SRS §7.3 | Fase 8 |
| `CORS_ORIGIN` | Nueva, Fase 9 | Restringe CORS al origen del frontend |
| `PORT` | Nueva, buena práctica | Puerto del backend (default 4000) |
| `NODE_ENV` | Nueva, buena práctica | `development` \| `production` |

→ **ADR-038** (completa la lista de variables de entorno del SRS, corrigiendo el faltante de `MAPS_API_KEY`).

Ninguna variable `SMTP_*` se agrega al backend — las credenciales de correo viven dentro de n8n (ADR-030).

---

## 5. Observabilidad, Logging y Monitoreo

**Principio de proporcionalidad:** una pila de observabilidad completa (Prometheus + Grafana + ELK) no se justifica para un proyecto académico en localhost — sería sobre-ingeniería frente al alcance de 6 semanas. Se aplica una estrategia mínima pero real:

- **Logging:** librería de logging estructurado **Pino** (JSON, rápida, estándar de facto en Node/Express) — salida a `stdout`, capturada por Docker (`docker compose logs`). Niveles `info`/`warn`/`error`; en `error` se incluye el `request_id` para correlacionar con la respuesta del envelope de error (Fase 4, ADR-018). → **ADR-037**.
- **Monitoreo:** endpoint `GET /health` en el backend, que verifica conexión activa a Postgres y MongoDB y responde `200`/`503`. Usado por el `healthcheck` de Docker Compose (sección 2) y disponible para que el evaluador confirme que el sistema está arriba.
- **Métricas:** fuera de alcance del MVP (marcado como posible extensión futura, no requerido por ningún RF/RNF del SRS).

---

## Nuevas decisiones de esta fase (ver `docs/DECISIONES.md`)
- ADR-035 — Node.js 20 LTS como runtime del backend y frontend (contenedores Docker) — **reemplazado por ADR-041 (Node.js 22 LTS)**.
- ADR-039 — Corrección de versión de PostgreSQL a 18.3 (reemplaza ADR-004).
- ADR-040 — Corrección de versión de MongoDB a 8.3.4 (corrige §7.1.2 del SRS).
- ADR-041 — Corrección de versión de Node.js a 22 LTS (reemplaza ADR-035).
- ADR-036 — CI vía GitHub Actions (lint/typecheck/test/build), sin CD real — coherente con el entorno objetivo localhost.
- ADR-037 — Pino como librería de logging estructurado.
- ADR-038 — Lista completa de variables de entorno, corrigiendo el faltante de `MAPS_API_KEY` en el SRS.

---

**Aprobación:** Aprobada por el usuario (2026-07-07), incluyendo la corrección de versiones (ADR-039/040/041). Fase cerrada.
