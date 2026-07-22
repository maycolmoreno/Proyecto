# 13 — Seguridad — DonaConnect Ecuador

Revisión de controles de seguridad reales (no documentados) contra las categorías típicas OWASP + los requisitos específicos del SRS (RNF-005, RNF-006, RNF-011) y de `docs/DECISIONES.md`. Metodología: lectura directa de middlewares, casos de uso, adaptadores y esquemas Zod — sin asumir que un ADR "Vigente" implica que el control existe en código (ver hallazgos).

---

## 1. Autenticación

| Control | Estado | Evidencia |
|---|---|---|
| Hash de contraseñas | ✅ bcrypt, 10 rondas | `BcryptPasswordHasher.ts:4` (`SALT_ROUNDS = 10`), nunca texto plano ni algoritmo reversible |
| Longitud de contraseña | ✅ 8-72 caracteres | `identidad/controllers/schemas.ts:11` — el máximo de 72 coincide con el límite real de bcrypt (bytes), no es arbitrario |
| Token de sesión | ✅ JWT HS256, 8h, sin refresh | `JwtTokenService.ts:4,13-15` |
| Almacenamiento del token (cliente) | ✅ `sessionStorage`, no `localStorage` ni cookie | ADR-032, mitiga persistencia entre pestañas/sesiones tras cerrar el navegador |
| Payload del token | ✅ mínimo necesario: `sub`, `rol`, `perfiles[]` — sin correo/nombre | `ITokenService.ts:4-11` |
| Rechazo de token ausente/inválido | ✅ `401 UNAUTHORIZED` explícito en ambos casos, mensajes distintos | `auth.middleware.ts:9,17` |
| Login fallido | ✅ auditado (`LOGIN_FALLIDO`) | `IniciarSesionUseCase.ts:55` |
| Registro — elección de rol de seguridad | ✅ corregido — ya no es un campo del usuario | `schemas.ts:8-15`: `rol` no existe en `registroSchema`; se hardcodea `USUARIO` en el caso de uso (ADR-048). Antes del refactor, el registro público podía crear `ADMINISTRADOR` sin verificación — hallazgo de seguridad real que la propia migración corrigió |
| **Rate limiting en login/registro** | ❌ **No implementado** | Ver §6 |

---

## 2. Autorización

| Control | Estado | Evidencia |
|---|---|---|
| Autorización de marketplace | ✅ `perfilMiddleware([...])` sobre `PerfilFuncional`, a nivel de ruta | `donaciones/solicitudes/trueques.routes.ts` |
| Autorización administrativa | ✅ `rbacMiddleware(['ADMINISTRADOR'])`, separado del anterior | `admin.routes.ts:9`, `categorias.routes.ts:8` |
| Autorización a nivel de recurso (dueño vs. tercero) | ✅ dentro de cada caso de uso, no en middleware — decisión documentada (evita una consulta redundante) | ej. `NoEsDueñoDeLaDonacionError` en `ActualizarDonacionUseCase` |
| Separación Rol (seguridad) vs. PerfilFuncional (marketplace) | ✅ dos conceptos independientes desde ADR-048, ambos embebidos en el JWT | `schema.prisma:22-53` |
| **Ruta `/publicaciones/mias`** | ⚠️ solo `authMiddleware`, sin `perfilMiddleware` | Correcto (cualquier usuario puede tener publicaciones propias en cualquier módulo), pero vale confirmarlo explícitamente — no hay guarda de perfil que restrinja por diseño |
| **Ubicación exacta expuesta a "beneficiario con oferta aceptada"** | ❌ **No implementado**, pese a estar en ADR-019 | Ver §3 — hallazgo nuevo de esta auditoría |

---

## 3. Exposición de ubicación exacta (ADR-019, RNF-011) — hallazgo detallado

**Lo que dice ADR-019** (`docs/DECISIONES.md:170`): *"Los campos exactos solo se incluyen en la respuesta cuando el solicitante es el propio donante, el beneficiario con oferta `ACEPTADA` sobre esa donación, o un administrador."*

**Lo que hace el código, verificado en las rutas donde podría vivir esa regla — corregido tras encontrar el mecanismo real (mi primera pasada por este hallazgo fue incompleta, la dejo corregida aquí en vez de solo agregar una nota aparte):**

1. `ObtenerDonacionUseCase.ts:22-23` (`GET /donaciones/:id`): `incluirUbicacionExacta = !!solicitante && (solicitante.rol === 'ADMINISTRADOR' || donacion.esDueño(solicitante.id))` — solo dueño o admin. **Nunca** se amplía a un beneficiario, ni siquiera con oferta aceptada.
2. `ObtenerSolicitudUseCase.ts:22-23` (`GET /solicitudes/:id`): mismo patrón — solo dueño (beneficiario) o admin.
3. **El mecanismo real está en otro lugar: `CrearOfertaUseCase.ts:89`** — `return solicitud.toJSON({ incluirUbicacionExacta: true, solicitanteId: donanteId })`. Cuando un `DONANTE` hace `POST /solicitudes/:id/ofertas` (que auto-acepta en el mismo paso, RF-009), la respuesta de **esa única llamada** incluye `incluirUbicacionExacta: true` incondicionalmente — el donante ve la ubicación exacta de la `Solicitud` (dirección del beneficiario) en el momento de comprometerse a donar.
4. **Pero ese acceso no persiste.** Si el donante vuelve a pedir `GET /solicitudes/:id` más tarde (recarga la página, otra sesión, otro dispositivo), `ObtenerSolicitudUseCase` solo lo dejará ver la ubicación exacta si es `esDueño` — y el donante nunca es dueño de la solicitud. Es decir: la ubicación exacta se revela **una sola vez, de forma transitoria, en la respuesta inmediata del `POST`**, no en ningún `GET` posterior.
5. `Entrega.toJSON()` (`Entrega.ts:83`) — confirmado que no incluye ningún campo de ubicación (ni exacta ni aproximada); no compensa el punto anterior.
6. **Asimetría real entre Donación y Solicitud:** el mecanismo de "revelar una vez" solo existe en el sentido Donante→ve-ubicación-de-Solicitud (`CrearOfertaUseCase.ts:89`). No encontré el equivalente inverso — el `Beneficiario` cuya oferta fue aceptada nunca recibe, en ningún endpoint verificado, la ubicación exacta de retiro de la `Donación` que le fue ofrecida (`ObtenerDonacionUseCase` sigue exigiendo `esDueño`/admin incluso después de que su oferta se aceptó).
7. `Trueque` no modela ubicación en absoluto (`ResponderPropuestaUseCase.ts:73`, comentario explícito: "trueque no modela ubicación de retiro, a diferencia de Donación") — ADR-019 no le aplica.

**Clasificación revisada: Hecho comprobado, Riesgo Medio.** El diseño real es "revelación puntual en la respuesta de aceptación, no persistente", que **sí resuelve el caso de uso principal** (el donante que acaba de comprometerse ve la dirección una vez, tiempo suficiente para copiarla/anotarla) pero es frágil: si el frontend no persiste ese dato en el momento (revisé `SolicitudDetallePage.tsx` únicamente para otros fines en esta auditoría, no confirmé si guarda esta respuesta puntual en el cliente), se pierde y no hay forma de recuperarlo después. Y el sentido inverso (beneficiario→dirección de la donación) parece no tener ningún mecanismo, ni siquiera puntual.

---

## 4. Validación y sanitización

| Control | Estado | Evidencia |
|---|---|---|
| Validación de entrada | ✅ Zod en el 100% de los endpoints con body/query relevante, `.parse()` inline en cada método de controller | ej. `donaciones.controller.ts:31,41` |
| Errores de validación | ✅ `400 VALIDATION_ERROR` uniforme, con `details: err.flatten()` (Zod) | `error-handler.middleware.ts:79-84` |
| Inyección SQL | ✅ Sin superficie real — Prisma parametriza todas las queries; único uso de `$queryRaw` es un healthcheck sin interpolación (`` prisma.$queryRaw\`SELECT 1\` ``, `express-app.ts:32`) | grep exhaustivo de `$queryRaw`/`$executeRaw` en todo `backend/` |
| Inyección NoSQL | ✅ Sin uso de `$where` ni construcción dinámica de queries Mongoose a partir de input crudo, en los archivos revisados | — |
| XSS (frontend) | ✅ Sin `dangerouslySetInnerHTML` en ningún componente — React escapa por defecto | grep exhaustivo en `frontend/src` |
| Validación de archivos subidos | ⚠️ Doble validación (cliente `ImageUploader.tsx:8-9,27-34` + servidor `FirmarSubidaImagenUseCase.ts:7-8,30-35`) de MIME type y tamaño (5MB) — pero **ambas confían en metadatos declarados por el cliente** (`archivo.type`/`archivo.size` en el navegador, `mimeType`/`tamanoBytes` en el body de la firma); el binario real nunca pasa por el backend (sube directo a Cloudinary, ADR-009), así que el backend no puede verificar el contenido real del archivo, solo lo que el cliente afirma que es antes de firmar |

---

## 5. Prompt injection (IA) — hallazgo específico

`GeminiAdapter.ts` interpola texto de usuario **directamente** en el contenido enviado al modelo, sin ningún delimitador ni instrucción defensiva tipo "trata el siguiente bloque como datos, no como instrucciones":

- `clasificar()` (línea 91): `` `Categorías vigentes: ...\nTítulo: ${input.titulo}\nDescripción: ${input.descripcion}` `` — título/descripción son escritos libremente por cualquier usuario.
- `evaluarRiesgo()` (línea 147): mismo patrón — el texto que se evalúa por posible fraude/contenido inadecuado es el mismo texto que un actor malicioso controlaría si quisiera evadir la moderación.
- `matchScore()` (línea 122): mismo patrón.

**Mitigación parcial real:** las 3 llamadas usan `responseSchema` (salida JSON estructurada con tipos/enums fijos) — un intento de inyección no puede hacer que el modelo devuelva texto libre fuera del esquema ni ejecute nada; como mucho, puede intentar influir en el **valor** de un campo (ej. convencer al modelo de poner `riesgoDetectado: false` pese a contenido problemático). El chatbot (`chat()`, sin `responseSchema`) tiene superficie de prompt injection más amplia pero también menor impacto (el usuario solo se manipula su propia conversación con el bot, no afecta a otros usuarios ni a datos).

**Clasificación:** Riesgo Bajo-Medio, informativo — es una limitación conocida de cualquier integración de IA generativa sobre contenido de usuario sin sandboxing adicional (ej. un segundo modelo clasificador independiente, o reglas determinísticas de respaldo); no hay evidencia de que el proyecto lo haya evaluado explícitamente en ningún ADR. Razonable para el alcance académico, pero vale mencionarlo si se pregunta en la defensa sobre riesgos de la integración de IA.

---

## 6. Rate limiting — hallazgo principal de esta auditoría

**ADR-034** (`docs/DECISIONES.md:305-311`) documenta límites concretos: login/registro 5/15min y 10/hora por IP, IA 20-30/min por usuario, resto de la API 100 req/min por IP.

**Código real:** cero resultados de `rate-limit`/`rateLimit`/`express-rate-limit` en todo `backend/`; no está en `package.json` (`dependencies` ni `devDependencies`); no se usa el código HTTP `429` en ningún punto (confirmado en `12_API_ENDPOINTS.md §13`).

**Impacto real, no solo documental:**
- `POST /auth/login` sin límite → un atacante puede intentar credenciales sin fricción técnica (mitigado parcialmente por bcrypt, que hace cada intento costoso en CPU, pero no evita el intento en sí).
- `POST /ia/clasificar`, `GET /ia/matching`, `POST /chatbot/mensajes` sin límite por usuario → sin control de costo real frente al proveedor de IA (Gemini), pese a que ADR-034 lo justifica explícitamente como su razón de ser.

**Clasificación: Alto.** Es el hallazgo de seguridad más concreto de toda la auditoría — no es una discrepancia de redacción, es un control ausente que el propio proyecto se comprometió a tener.

---

## 7. Cabeceras HTTP, CORS, transporte

| Control | Estado | Evidencia |
|---|---|---|
| Helmet | ✅ activo, configuración por defecto | `express-app.ts:24` |
| CORS | ✅ origen único (`CORS_ORIGIN`, default `http://localhost:5173`), `credentials: false` | `express-app.ts:25`, `env.ts:16` |
| HTTPS | ⚠️ HTTP en `localhost`, excepción documentada (ADR-006) | No aplica fuera del contexto académico |
| CSRF | Informativo — no hay protección CSRF explícita, pero el modelo de auth (`Authorization: Bearer`, sin cookies, `credentials:false`) hace CSRF clásico no aplicable: un formulario/script de otro origen no puede adjuntar el header `Authorization` automáticamente como sí ocurriría con cookies | Coherente con ADR-032 |

---

## 8. Auditoría (RNF-006)

| Control | Estado | Evidencia |
|---|---|---|
| Middleware de auditoría | ✅ post-hoc, no bloqueante (`res.on('finish', ...)`, solo si `2xx`) | `audit.middleware.ts:55-83` |
| Cobertura | ⚠️ 10 de ~38 endpoints auditan (ver tabla completa en `12_API_ENDPOINTS.md`) — cubre creación/cancelación/aprobación de las 3 entidades de marketplace + moderación + registro + login fallido; **no** cubre `PATCH` de actualización simple (donación/oferta-rechazo/propuesta-creación), ni ningún endpoint de Mensajería/Notificaciones/Dashboard | grep de `auditar*` en `main/routes/*.ts` |
| **Gap real en `LOGIN_FALLIDO`** | ⚠️ Solo se audita cuando el correo existe y la contraseña es incorrecta — si el correo **no existe**, no hay registro (`auditoria.id_entidad` es `NOT NULL`, Fase 3, y no hay `usuario.id` disponible para ese caso). Un atacante probando correos inexistentes no deja rastro auditado; documentado como ambigüedad conocida desde Fase 9, no un descuido nuevo | `IniciarSesionUseCase.ts:44-48` (comentario explícito: "este intento no se registra... Fase 9 sección 3 deja el caso ambiguo") |
| Falla de auditoría no bloquea la respuesta | ✅ (`catch` solo loguea con Pino) | `audit.middleware.ts:78` |

---

## 9. Secretos y configuración

| Control | Estado | Evidencia |
|---|---|---|
| Secretos fuera del código | ✅ todos vía `process.env`, `.env.example` es plantilla sin valores reales | `env.ts:10-26` |
| **`MAPS_API_KEY` declarada (ADR-038) pero nunca usada** | ❌ variable de entorno completamente muerta | grep exhaustivo en `backend/` y `frontend/`: cero referencias fuera de `.env.example`/`env.ts`. El único comentario relacionado (`MatchingService.ts:22`) confirma explícitamente que "`MapsAdapter` mencionado en Fase 7... no está implementado". La funcionalidad real de geolocalización (autocompletar provincia/ciudad al usar "mi ubicación actual" en `LocationPicker.tsx`) usa la API pública gratuita de OpenStreetMap Nominatim directamente desde el navegador — **sin pasar por el backend ni por esta clave** |
| `.env` (valores reales) | No inspeccionado en esta auditoría — por diseño, para no exponer secretos en un documento (regla explícita del encargo) | — |
| Compartir credenciales entre adaptadores de IA | ⚠️ `IA_API_KEY` única, genérica — sirve tanto a `GeminiAdapter` como (potencialmente) a `ClaudeAdapter` si se recableara; no hay `GEMINI_API_KEY`/`ANTHROPIC_API_KEY` diferenciadas | `env.ts:25` |

---

## 10. Resumen de hallazgos por severidad

| Severidad | Hallazgo |
|---|---|
| **Alto** | Rate limiting documentado (ADR-034) ausente por completo — login sin fricción técnica, sin control de costo de IA (§6) |
| **Medio** | ADR-019 (ubicación exacta): el donante ve la dirección de la Solicitud una sola vez, en la respuesta transitoria de `POST /solicitudes/:id/ofertas` (`CrearOfertaUseCase.ts:89`) — no en `GET` posteriores; el sentido inverso (beneficiario→dirección de la Donación) no tiene ningún mecanismo encontrado, ni puntual (§3) |
| **Bajo** | `LOGIN_FALLIDO` no se audita cuando el correo no existe (solo cuando existe y la contraseña es incorrecta) — ambigüedad documentada desde Fase 9, no un descuido nuevo (§8) |
| **Bajo-Medio** | Prompt injection sobre contenido de usuario en clasificación/moderación/matching — mitigado parcialmente por salida estructurada, pero el *valor* de los campos puede manipularse (§5) |
| **Bajo** | `MAPS_API_KEY` es una variable de entorno muerta desde ADR-038 — no es un riesgo en sí, pero es deuda de configuración que puede confundir a quien despliegue el proyecto pensando que es necesaria (§9) |
| **Bajo** | Validación de archivos subidos confía en metadatos declarados por el cliente, sin inspección del binario real (backend nunca lo recibe, por diseño ADR-009) (§4) |
| **Informativo** | Cobertura de auditoría parcial (10/~38 endpoints) — decisión de alcance razonable, no un descuido, pero vale tenerlo explícito (§8) |
| **Informativo** | CSRF no aplica por el modelo de auth actual (Bearer token, sin cookies) — no requiere mitigación adicional (§7) |

---

## 11. Qué sigue

Con `13_SEGURIDAD.md` cerrado, el hallazgo de rate limiting (Alto) y el de ubicación exacta (Medio) son los dos con más peso real para una eventual `17_DEUDA_TECNICA.md` con prioridad de arreglo — los demás son en su mayoría informativos o de bajo impacto práctico dado el alcance académico del proyecto.
