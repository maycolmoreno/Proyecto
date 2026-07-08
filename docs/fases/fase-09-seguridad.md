# Fase 9 — Seguridad

**Estado:** ✅ Aprobada
**Fecha de creación:** 2026-07-07
**Última actualización:** 2026-07-07
**Fuente:** `SRS_DonaConnect_Ecuador_ISO29148.docx` (§2.5, §3.2.2, §5.2, RNF-004/005/006) + Fases 1, 3, 4, 6, 8 + `docs/DECISIONES.md`

## Historial de cambios
| Fecha | Descripción |
|---|---|
| 2026-07-07 | Versión inicial. Consolida las decisiones de seguridad ya tomadas en fases previas (RBAC/ADR-016, auditoría/Fase 3, HTTPS/ADR-006, exposición de ubicación/ADR-019) y cierra lo que faltaba: parámetros concretos de JWT, mapeo completo a OWASP Top 10 2021, y rate limiting por endpoint. |
| 2026-07-07 | Aprobada por el usuario sin cambios. Se avanza a Fase 10. |

---

## 1. JWT

| Parámetro | Valor | Justificación |
|---|---|---|
| Algoritmo | HS256 | Backend único (monolito modular, ADR-007) — no hay múltiples servicios que necesiten verificar con clave pública separada; HS256 con secreto fuerte es suficiente y más simple que RS256 |
| Claims | `{ sub: usuarioId, rol, iat, exp }` | Mínimo necesario para autorización; nunca incluye datos sensibles (correo, ubicación) |
| Expiración | 8 horas, sin refresh token | Suficiente para una sesión de trabajo/evaluación; implementar rotación de refresh tokens es complejidad no justificada para un MVP de 6 semanas — el usuario vuelve a iniciar sesión al expirar |
| Secreto | `JWT_SECRET` (§7.3, ya definido) | Variable de entorno, nunca en el código |

**Almacenamiento en el cliente:** el contrato de Fase 4 (`Authorization: Bearer <token>`) **se mantiene sin cambios** — no se migra a cookies `httpOnly` para no reabrir esa fase ya aprobada. En su lugar, se mitiga el riesgo de robo vía XSS con controles adicionales:
- El token se guarda en `sessionStorage` (no `localStorage`) — se limita al ciclo de vida de la pestaña, reduce la ventana de exposición.
- Content-Security-Policy restrictiva (sección 4, A03/A07) reduce la probabilidad de que un XSS logre ejecutarse en primer lugar.
- Expiración corta (8h) acota el daño de un token robado.

→ **ADR-032** (decisión documentada de no migrar a cookies `httpOnly`, con la razón explícita de no reabrir Fase 4).

---

## 2. Roles y Permisos

Ya resueltos en Fase 4 (ADR-016, matriz RBAC estricta) y Fase 2 (Bounded Contexts). Esta fase no los rediseña — solo confirma el mecanismo de aplicación:

`authMiddleware` (verifica JWT) → `rbacMiddleware(rolesPermitidos[])` (valida contra la matriz de Fase 4) → `ownershipMiddleware` (valida que el usuario sea dueño del recurso, o ADMINISTRADOR) → `controller`.

`ownershipMiddleware` es genérico y reutilizable: recibe el nombre del repositorio y el campo de propietario (`donanteId`, `beneficiarioId`, `usuarioId`, `usuarioProponenteId` según el recurso) y compara contra `req.usuario.sub`.

---

## 3. Auditoría (RNF-006)

Tabla `auditoria` ya modelada en Fase 3. Se especifica aquí **qué acciones concretas** se auditan, disparadas automáticamente por `auditMiddleware` (Fase 6) en las rutas marcadas como sensibles:

| Acción | Entidades |
|---|---|
| `CREAR` | Usuario (registro), Donación, Solicitud, Trueque |
| `APROBAR` | Oferta (aceptar), PropuestaTrueque (aceptar), Moderación (aprobar publicación) |
| `CANCELAR` | Donación, Solicitud, Trueque |
| `BLOQUEAR` | Usuario, Donación, Solicitud, Trueque (vía moderación, RF-018) |
| `ELIMINAR` | Usuario, publicación (solo ADMINISTRADOR) |
| `LOGIN_FALLIDO` | Usuario (no es un RF explícito, pero alimenta el rate limiting de la sección 5 y es buena práctica de seguridad — OWASP A09) |

Cada registro captura `id_usuario` (o `null` si es del sistema), `accion`, `entidad`, `id_entidad`, `detalle` (JSONB, snapshot opcional) y `fecha` (ya en el esquema de Fase 3).

---

## 4. OWASP Top 10 (2021) — mapeo a mitigaciones concretas

| # | Categoría | Mitigación en DonaConnect |
|---|---|---|
| A01 | Broken Access Control | RBAC estricto (ADR-016) + `ownershipMiddleware` (sección 2) + ocultamiento de ubicación exacta salvo autorización (ADR-019) |
| A02 | Cryptographic Failures | bcrypt para contraseñas (RNF-005) + HTTPS obligatorio en producción, excepción documentada en localhost (ADR-006) + `JWT_SECRET` fuera del código |
| A03 | Injection | Prisma/Mongoose con queries parametrizadas (ADR-008) — nunca concatenación de SQL; validación de entrada con Zod antes de tocar la capa de datos (ADR-022) |
| A04 | Insecure Design | Modelado de amenazas implícito en el diseño DDD (Fase 2) — invariantes de negocio a nivel de aggregate, no solo de UI; principio human-in-the-loop para IA (ADR-010) |
| A05 | Security Misconfiguration | `helmet` para cabeceras HTTP seguras, CORS restringido al origen del frontend (`http://localhost:5173`), no exponer stack traces en respuestas de error (`error.details` solo en entorno de desarrollo) |
| A06 | Vulnerable and Outdated Components | `npm audit` como parte del pipeline de Fase 10 (DevOps) — no se agrega Dependabot/Renovate por ser proyecto académico de corta duración, pero se ejecuta manualmente antes de cada entrega |
| A07 | Identification and Authentication Failures | Rate limiting en login/registro (sección 5), bcrypt, expiración de JWT de 8h, sin reutilización de contraseñas validada (fuera de alcance verificar contra bases de contraseñas filtradas — MVP académico) |
| A08 | Software and Data Integrity Failures | Firma de subida a Cloudinary valida tipo/tamaño antes de aceptar el archivo (ADR-009); el payload del webhook a n8n no otorga escritura hacia el backend (ADR-031, n8n es consumidor pasivo) |
| A09 | Security Logging and Monitoring Failures | Tabla `auditoria` (sección 3) + colección `eventos_sistema` (Mongo, Fase 3) — cobertura de operaciones sensibles y eventos de dominio |
| A10 | Server-Side Request Forgery (SSRF) | `MapsAdapter` e `IAProviderAdapter` llaman siempre a endpoints fijos y conocidos del proveedor, nunca a una URL provista por el usuario; las referencias polimórficas (`entregas.id_referencia`, `imagenes.id_entidad`, ADR-015) se validan contra tipos/tablas permitidos en la capa de servicio, no se usan para construir URLs |

---

## 5. Rate Limiting

| Endpoint / grupo | Límite | Motivo |
|---|---|---|
| `POST /auth/login` | 5 intentos / 15 min por IP | Previene fuerza bruta (OWASP A07) |
| `POST /auth/registro` | 10 solicitudes / hora por IP | Previene creación masiva de cuentas falsas |
| `POST /chatbot/mensajes` | 20 mensajes / minuto por usuario | Control de costo de IA (Fase 7) — evita abuso que dispare gasto excesivo del proveedor |
| `POST /ia/clasificar`, `POST /ia/matching` | 30 solicitudes / minuto por usuario | Mismo motivo — estas rutas ya se disparan automáticamente en el flujo normal, el límite es para detectar abuso, no para el uso legítimo |
| Resto de la API | 100 solicitudes / minuto por IP | Límite general contra abuso/scraping, generoso para no afectar el uso normal de la SPA |

Excedido el límite → `429` con `error.code: "RATE_LIMITED"` (envelope de Fase 4, ADR-018).

→ **ADR-034**.

---

## Nuevas decisiones de esta fase (ver `docs/DECISIONES.md`)
- ADR-032 — JWT se mantiene como Bearer token en `sessionStorage` (no se migra a cookies `httpOnly`); mitigación de XSS vía CSP + expiración corta en vez de cambio arquitectónico.
- ADR-033 — Expiración de JWT de 8 horas, sin mecanismo de refresh token.
- ADR-034 — Límites de rate limiting concretos por grupo de endpoints.

---

**Aprobación:** Aprobada por el usuario (2026-07-07). Fase cerrada.
