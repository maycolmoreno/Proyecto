# Fase 3 — Modelo de Datos

**Estado:** ✅ Aprobada
**Fecha de creación:** 2026-07-07
**Última actualización:** 2026-07-07
**Fuente:** `SRS_DonaConnect_Ecuador_ISO29148.docx` §5.4, §7.1 + `docs/fases/fase-02-diseno-dominio.md` + `docs/DECISIONES.md` (ADR-004, ADR-008, ADR-009, ADR-011)

## Historial de cambios
| Fecha | Descripción |
|---|---|
| 2026-07-07 | Versión inicial. Modelo ER, modelo lógico, modelo físico completo (PostgreSQL 18.3 + MongoDB 8.3.4), índices, restricciones y optimización. Se agregan tablas/colecciones no explícitas en el SRS (auditoría, mensajes, notificaciones) y se resuelven ambigüedades de tipos con supuestos documentados de bajo riesgo. |
| 2026-07-07 | Aprobada por el usuario sin cambios. Se avanza a Fase 4. |
| 2026-07-07 | Corrección de versiones a pedido del usuario: PostgreSQL 16.x → 18.3, MongoDB 6.x → 8.3.4 (ver ADR-039/ADR-040). |

---

## 1. Modelo ER (PostgreSQL — núcleo transaccional)

```
usuarios ──1:N── ubicaciones
   │
   ├─1:N─ donaciones ──N:1── categorias
   │           │
   │           └─1:N─ ofertas_solicitud ──N:1── solicitudes ──N:1── usuarios (beneficiario)
   │                                                  │
   │                                                  └─N:1── categorias
   │
   ├─1:N─ trueques ──N:1── categorias
   │           │
   │           └─1:N─ propuestas_trueque (auto-referencia: trueque_origen / trueque_ofrecido)
   │
   ├─1:N─ auditoria
   │
   └─1:N─ (donante en ofertas_solicitud / proponente en propuestas_trueque)

entregas ──(referencia polimórfica)──► donaciones | trueques
imagenes ──(referencia polimórfica)──► donaciones | solicitudes | trueques
```

**Nota de diseño:** `entregas.id_referencia` e `imagenes.id_entidad` son **referencias polimórficas** (apuntan a distintas tablas según un discriminador `tipo_operacion`/`tipo_entidad`). PostgreSQL no soporta FK polimórficas nativas; se valida a nivel de aplicación (capa `service`, Fase 6). Es un trade-off consciente: se prioriza reutilizar una sola tabla de imágenes/entregas (evita duplicación de estructura) a cambio de perder integridad referencial declarativa en ese punto. → **ADR-015**.

## 2. Modelo lógico

Mapeo directo de los Aggregate Roots de Fase 2 a tablas relacionales, más 3 tablas/colecciones no contempladas explícitamente en el SRS pero requeridas por RNF-006 (auditoría) y por los casos de uso CU-015/CU-016 confirmados en Fase 0/2 (mensajería, notificaciones):

| Aggregate (Fase 2) | Tabla/Colección | Motor |
|---|---|---|
| Usuario | `usuarios`, `ubicaciones` | PostgreSQL |
| Categoría | `categorias` | PostgreSQL |
| Donación | `donaciones` | PostgreSQL |
| Solicitud (+ Oferta) | `solicitudes`, `ofertas_solicitud` | PostgreSQL |
| Trueque (+ PropuestaTrueque) | `trueques`, `propuestas_trueque` | PostgreSQL |
| Entrega | `entregas` | PostgreSQL |
| (transversal) | `imagenes` | PostgreSQL |
| (RNF-006) | `auditoria` | PostgreSQL — **nueva**, no listada en §7.1.1 pero exigida por el requisito de auditoría |
| Conversación (BC-Mensajería) | `mensajes` | MongoDB — **nueva** |
| Notificación (BC-Notificaciones) | `notificaciones` | MongoDB — **nueva** |
| — (IA, logs, eventos) | `chatbot_conversaciones`, `analisis_ia`, `logs_n8n`, `eventos_sistema`, `analisis_imagenes` | MongoDB (según §7.1.2) |

**Decisión — Mensajería y Notificaciones en MongoDB, no PostgreSQL:** su contenido es conversacional/append-only y no participa de las máquinas de estado transaccionales (Donación/Solicitud/Trueque); perderlas no corrompe el negocio, a diferencia de las tablas core. Es coherente con el principio de frontera de Fase 1 (Postgres = estado del negocio, Mongo = todo lo demás). → **ADR-012**.

## 3. Modelo físico — PostgreSQL 18.3

**Estrategia de clave primaria:** `UUID v4` en todas las tablas (no enteros autoincrementales). Motivo: evita enumeración de recursos en la API (ej. `/donaciones/5` → `/donaciones/6`), relevante para OWASP (Broken Access Control) dado que hay datos sensibles de ubicación; es compatible con Prisma sin fricción. → **ADR-013**.

### `usuarios`
| Columna | Tipo | Restricción |
|---|---|---|
| id_usuario | UUID | PK, default `gen_random_uuid()` |
| nombre | VARCHAR(150) | NOT NULL |
| correo | VARCHAR(255) | NOT NULL, UNIQUE |
| password_hash | VARCHAR(255) | NOT NULL |
| telefono | VARCHAR(20) | NULL |
| rol | VARCHAR(20) | NOT NULL, CHECK IN (`ADMINISTRADOR`,`DONANTE`,`BENEFICIARIO`,`USUARIO_COMUNIDAD`) |
| estado | VARCHAR(20) | NOT NULL DEFAULT `ACTIVO`, CHECK IN (`ACTIVO`,`SUSPENDIDO`,`ELIMINADO`) |
| fecha_creacion | TIMESTAMPTZ | NOT NULL DEFAULT `now()` |

### `ubicaciones`
| Columna | Tipo | Restricción |
|---|---|---|
| id_ubicacion | UUID | PK |
| id_usuario | UUID | FK → usuarios, ON DELETE CASCADE |
| provincia | VARCHAR(100) | NOT NULL |
| ciudad | VARCHAR(100) | NOT NULL |
| sector | VARCHAR(150) | NULL |
| referencia | VARCHAR(255) | NULL |
| latitud | DECIMAL(9,6) | NULL |
| longitud | DECIMAL(9,6) | NULL |
| tipo | VARCHAR(20) | NOT NULL, CHECK IN (`ESTABLECIDA`,`RETIRO`) |

### `categorias`
| Columna | Tipo | Restricción |
|---|---|---|
| id_categoria | UUID | PK |
| nombre | VARCHAR(100) | NOT NULL |
| tipo | VARCHAR(50) | NOT NULL — agrupación temática (ej. "Tecnología", "Ropa", "Alimentos") |
| estado | VARCHAR(20) | NOT NULL DEFAULT `ACTIVA`, CHECK IN (`ACTIVA`,`INACTIVA`) |

> **Supuesto de bajo riesgo:** el SRS no define si `tipo` en `categorias` es una agrupación temática o el módulo de uso (donación/solicitud/trueque). Se interpreta como agrupación temática porque el catálogo es compartido por los 3 dominios (Fase 2, Shared Kernel). Fácil de corregir en Fase 6 si no es la lectura correcta.

### `donaciones`
| Columna | Tipo | Restricción |
|---|---|---|
| id_donacion | UUID | PK |
| id_donante | UUID | FK → usuarios |
| id_categoria | UUID | FK → categorias |
| titulo | VARCHAR(150) | NOT NULL |
| descripcion | TEXT | NOT NULL |
| estado_objeto | VARCHAR(25) | NOT NULL, CHECK IN (`NUEVO`,`BUEN_ESTADO`,`USADO`,`REQUIERE_REPARACION`) |
| estado_donacion | VARCHAR(20) | NOT NULL DEFAULT `PUBLICADA`, CHECK IN (`PUBLICADA`,`SOLICITADA`,`APROBADA`,`EN_RETIRO`,`ENTREGADA`,`CANCELADA`) |
| requiere_retiro | BOOLEAN | NOT NULL DEFAULT false |
| id_ubicacion_retiro | UUID | FK → ubicaciones, NULL |
| fecha | TIMESTAMPTZ | NOT NULL DEFAULT `now()` |

Constraint: `CHECK ((requiere_retiro = false) OR (id_ubicacion_retiro IS NOT NULL))` — aplica regla de negocio #5 de Fase 0 a nivel de BD.

> **Supuesto de bajo riesgo:** valores de `estado_objeto` no vienen definidos en el SRS; se proponen 4 valores estándar de plataformas de donación. Ajustable en Fase 6.

### `solicitudes`
| Columna | Tipo | Restricción |
|---|---|---|
| id_solicitud | UUID | PK |
| id_beneficiario | UUID | FK → usuarios |
| id_categoria | UUID | FK → categorias |
| titulo | VARCHAR(150) | NOT NULL |
| descripcion | TEXT | NOT NULL |
| urgencia | VARCHAR(10) | NOT NULL, CHECK IN (`BAJA`,`MEDIA`,`ALTA`) — ADR-011 |
| estado_solicitud | VARCHAR(25) | NOT NULL DEFAULT `ABIERTA`, CHECK IN (`ABIERTA`,`EN_REVISION`,`ACEPTADA_POR_DONANTE`,`EN_ENTREGA`,`ATENDIDA`,`CANCELADA`) |
| id_ubicacion | UUID | FK → ubicaciones, NOT NULL |
| evidencia_url | VARCHAR(500) | NULL |
| fecha | TIMESTAMPTZ | NOT NULL DEFAULT `now()` |

### `ofertas_solicitud`
| Columna | Tipo | Restricción |
|---|---|---|
| id_oferta | UUID | PK |
| id_solicitud | UUID | FK → solicitudes |
| id_donante | UUID | FK → usuarios |
| id_donacion | UUID | FK → donaciones |
| mensaje | TEXT | NULL |
| estado | VARCHAR(20) | NOT NULL DEFAULT `PENDIENTE`, CHECK IN (`PENDIENTE`,`ACEPTADA`,`RECHAZADA`) |
| fecha | TIMESTAMPTZ | NOT NULL DEFAULT `now()` |

**Constraint clave (ADR-011):**
```sql
CREATE UNIQUE INDEX uq_oferta_activa_por_solicitud
  ON ofertas_solicitud(id_solicitud) WHERE estado = 'ACEPTADA';
```

### `trueques`
| Columna | Tipo | Restricción |
|---|---|---|
| id_trueque | UUID | PK |
| id_usuario | UUID | FK → usuarios |
| id_categoria | UUID | FK → categorias |
| titulo | VARCHAR(150) | NOT NULL |
| descripcion | TEXT | NOT NULL |
| estado_objeto | VARCHAR(25) | NOT NULL, CHECK (mismos valores que donaciones) |
| estado_trueque | VARCHAR(20) | NOT NULL DEFAULT `PUBLICADO`, CHECK IN (`PUBLICADO`,`PROPUESTA_RECIBIDA`,`ACEPTADO`,`EN_COORDINACION`,`INTERCAMBIADO`,`CANCELADO`) |
| fecha | TIMESTAMPTZ | NOT NULL DEFAULT `now()` |

### `propuestas_trueque`
| Columna | Tipo | Restricción |
|---|---|---|
| id_propuesta | UUID | PK |
| id_trueque_origen | UUID | FK → trueques |
| id_trueque_ofrecido | UUID | FK → trueques |
| id_usuario_proponente | UUID | FK → usuarios |
| estado | VARCHAR(20) | NOT NULL DEFAULT `PENDIENTE`, CHECK IN (`PENDIENTE`,`ACEPTADA`,`RECHAZADA`) |
| fecha | TIMESTAMPTZ | NOT NULL DEFAULT `now()` |

Constraints: `CHECK (id_trueque_origen <> id_trueque_ofrecido)`. Clave (ADR-011):
```sql
CREATE UNIQUE INDEX uq_propuesta_activa_por_trueque
  ON propuestas_trueque(id_trueque_origen) WHERE estado = 'ACEPTADA';
```

### `entregas`
| Columna | Tipo | Restricción |
|---|---|---|
| id_entrega | UUID | PK |
| tipo_operacion | VARCHAR(10) | NOT NULL, CHECK IN (`DONACION`,`TRUEQUE`) |
| id_referencia | UUID | NOT NULL — polimórfico, sin FK (ver nota ER) |
| modalidad | VARCHAR(20) | NOT NULL, CHECK IN (`RETIRO_DOMICILIO`,`ENTREGA_DIRECTA`,`PUNTO_ENCUENTRO`) |
| estado | VARCHAR(20) | NOT NULL DEFAULT `PROGRAMADA`, CHECK IN (`PROGRAMADA`,`CONFIRMADA`,`CANCELADA`) |
| fecha_programada | TIMESTAMPTZ | NULL |

### `imagenes`
| Columna | Tipo | Restricción |
|---|---|---|
| id_imagen | UUID | PK |
| tipo_entidad | VARCHAR(20) | NOT NULL, CHECK IN (`DONACION`,`SOLICITUD`,`TRUEQUE`) |
| id_entidad | UUID | NOT NULL — polimórfico, sin FK |
| url | VARCHAR(500) | NOT NULL |
| public_id | VARCHAR(255) | NOT NULL — id de Cloudinary, permite borrar/gestionar (ADR-009) |
| fecha | TIMESTAMPTZ | NOT NULL DEFAULT `now()` |

Límite de 5 MB (§5.4) se valida en la firma de subida a Cloudinary (ADR-009), no en la BD.

### `auditoria` (nueva — RNF-006)
| Columna | Tipo | Restricción |
|---|---|---|
| id_auditoria | UUID | PK |
| id_usuario | UUID | FK → usuarios, NULL si acción del sistema |
| accion | VARCHAR(50) | NOT NULL — `CREAR`,`APROBAR`,`CANCELAR`,`ELIMINAR`,... |
| entidad | VARCHAR(50) | NOT NULL — `DONACION`,`SOLICITUD`,`TRUEQUE`,`USUARIO` |
| id_entidad | UUID | NOT NULL |
| detalle | JSONB | NULL — snapshot opcional del cambio |
| fecha | TIMESTAMPTZ | NOT NULL DEFAULT `now()` |

---

## 4. Modelo físico — MongoDB 8.3.4

Todas las colecciones referencian entidades de PostgreSQL exclusivamente por ID (BD-005, regla de negocio #11) — nunca por `$lookup`/join entre motores.

### `chatbot_conversaciones` (§7.1.2)
```json
{ "_id": ObjectId, "usuarioId": "uuid", "sesiones": [{ "sesionId": "string", "iniciadoEn": "date" }],
  "mensajes": [{ "rol": "usuario|bot", "texto": "string", "timestamp": "date" }],
  "intencion": "string", "fecha": "date", "canal": "string" }
```

### `analisis_ia` (§7.1.2)
```json
{ "_id": ObjectId, "tipoEntidad": "DONACION|SOLICITUD|TRUEQUE", "entidadId": "uuid",
  "prompt": "string", "respuestaIA": "string", "categoriaSugerida": "string",
  "prioridad": "string", "score": "number", "fecha": "date" }
```

### `logs_n8n` (§7.1.2)
```json
{ "_id": ObjectId, "workflowId": "string", "evento": "string", "payload": "object",
  "resultado": "string", "estado": "string", "fecha": "date" }
```

### `eventos_sistema` (§7.1.2)
```json
{ "_id": ObjectId, "usuarioId": "uuid", "tipoEvento": "string", "entidad": "string",
  "referenciaId": "uuid", "metadatos": "object", "fecha": "date" }
```
Alimenta también el dashboard de impacto (CU-012) mediante agregaciones (`$group`/`$count`).

### `analisis_imagenes` (§7.1.2)
```json
{ "_id": ObjectId, "entidadId": "uuid", "imagenUrl": "string",
  "objetosDetectados": ["string"], "estadoSugerido": "string",
  "observacionesIA": "string", "fecha": "date" }
```

### `mensajes` (nueva — ADR-012, BC-Mensajería, RF-017/CU-015)
```json
{ "_id": ObjectId, "conversacionId": "string", "participantes": ["uuid"],
  "entregaIdReferencia": "uuid|null",
  "mensajes": [{ "autorId": "uuid", "texto": "string", "fecha": "date", "leido": "boolean" }],
  "fecha": "date" }
```

### `notificaciones` (nueva — ADR-012, BC-Notificaciones, RF-020/CU-016)
```json
{ "_id": ObjectId, "usuarioId": "uuid", "tipo": "string", "entidadRelacionada": "uuid",
  "mensaje": "string", "leido": "boolean", "canal": "string", "fecha": "date" }
```

---

## 5. Índices

**PostgreSQL** (cumple §5.4 "índices por estado, categoría, ubicación y fecha"):
- `usuarios`: UNIQUE(correo); INDEX(rol)
- `ubicaciones`: INDEX(id_usuario, tipo); INDEX(provincia, ciudad)
- `donaciones`: INDEX(estado_donacion); INDEX(id_categoria); INDEX(id_donante); INDEX(fecha DESC)
- `solicitudes`: INDEX(estado_solicitud); INDEX(id_categoria); INDEX(urgencia); INDEX(fecha DESC)
- `ofertas_solicitud`: INDEX(id_solicitud); UNIQUE parcial (ver sección 3)
- `trueques`: INDEX(estado_trueque); INDEX(id_categoria); INDEX(fecha DESC)
- `propuestas_trueque`: INDEX(id_trueque_origen); UNIQUE parcial (ver sección 3)
- `entregas`: INDEX(tipo_operacion, id_referencia); INDEX(estado)
- `imagenes`: INDEX(tipo_entidad, id_entidad)
- `auditoria`: INDEX(entidad, id_entidad); INDEX(fecha DESC); INDEX(id_usuario)

**MongoDB:**
- `chatbot_conversaciones`: `{ usuarioId: 1, fecha: -1 }`
- `analisis_ia`: `{ entidadId: 1, tipoEntidad: 1 }`
- `eventos_sistema`: `{ usuarioId: 1, fecha: -1 }`, `{ tipoEvento: 1 }`
- `notificaciones`: `{ usuarioId: 1, leido: 1, fecha: -1 }`
- `mensajes`: `{ participantes: 1, fecha: -1 }`

## 6. Restricciones

- Integridad referencial completa en PostgreSQL vía FK (BD-004), excepto las dos referencias polimórficas documentadas (`entregas.id_referencia`, `imagenes.id_entidad`) validadas en capa de aplicación (ADR-015).
- Una sola oferta/propuesta activa por solicitud/trueque, vía índices únicos parciales (ADR-011).
- `requiere_retiro` obliga `id_ubicacion_retiro` (regla de negocio #5).
- Contraseñas siempre bcrypt (RNF-005) — no es un constraint de BD sino de capa de aplicación (Fase 6), documentado aquí por trazabilidad.
- Referencias entre MongoDB y PostgreSQL exclusivamente por ID (BD-005).

## 7. Optimización

- **Retención de datos:** transaccionales en Postgres ≥ 2 años (BD-003) — sin borrado automático. Para MongoDB, el SRS pide "política de retención definida" sin especificar valor (§5.4); se propone **TTL index de 90 días** para `logs_n8n` y `eventos_sistema` (datos operativos de corta vida útil), y **sin expiración automática** para `chatbot_conversaciones` y `analisis_ia` (tienen valor histórico/de negocio para mejorar matching). → **ADR-014**.
- Connection pooling gestionado por Prisma (valor por defecto, sin configuración adicional en escala académica).
- Sin particionamiento ni sharding — no se justifica al volumen de un proyecto universitario en localhost.
- Paginación obligatoria en listados (donaciones, solicitudes, trueques) para evitar full-scan innecesario — se detalla en Fase 4 (APIs).

---

## Nuevas decisiones de esta fase (ver `docs/DECISIONES.md`)
- ADR-012 — Mensajería y Notificaciones se modelan en MongoDB, no PostgreSQL.
- ADR-013 — UUID v4 como estrategia de clave primaria en PostgreSQL.
- ADR-014 — Política de retención en MongoDB: TTL 90 días para logs/eventos, sin expiración para conversaciones/análisis IA.
- ADR-015 — Referencias polimórficas (`entregas`, `imagenes`) sin FK de base de datos, validadas en capa de aplicación.

## Supuestos de bajo riesgo (documentados, no bloqueantes)
- `categorias.tipo` interpretado como agrupación temática, no módulo de uso.
- `estado_objeto` (donaciones/trueques): `NUEVO | BUEN_ESTADO | USADO | REQUIERE_REPARACION`.

---

**Aprobación:** Aprobada por el usuario (2026-07-07). Fase cerrada.
