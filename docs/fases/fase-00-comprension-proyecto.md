# Fase 0 — Comprensión del Proyecto

**Estado:** ✅ Aprobada
**Fecha de creación:** 2026-07-07
**Última actualización:** 2026-07-07
**Fuente:** `SRS_DonaConnect_Ecuador_ISO29148.docx` v1.0 + decisiones de `docs/DECISIONES.md`

## Historial de cambios
| Fecha | Descripción |
|---|---|
| 2026-07-07 | Versión inicial: objetivos, alcance, actores, casos de uso (12 originales + 4 nuevos por ADR-005), reglas de negocio y dependencias. |
| 2026-07-07 | Aprobada por el usuario sin cambios. Se avanza a Fase 1. |

---

## Objetivos
Conectar donantes, beneficiarios y comunidad para gestionar donaciones, solicitudes de ayuda y trueques, con orientación y clasificación asistida por IA, contribuyendo a ODS 1 (principal), ODS 10 y ODS 12 (§1.2, §2.1).

## Alcance

**Dentro de alcance** (§1.2, §2.2): gestión de usuarios/roles/autenticación; publicación de donaciones con fotos/categoría/ubicación; solicitudes de ayuda; aceptación de solicitudes; trueques bilaterales; chatbot IA (orientación, clasificación, generación de descripciones, matching); gestión de ubicación (establecida vs. retiro); panel administrativo de moderación; dashboard de impacto social.

**Fuera de alcance** (§1.2): pagos electrónicos o transacciones monetarias; sustitución de entidades gubernamentales/fundaciones; verificación legal de condición socioeconómica (solo información declarativa); logística profesional de transporte (solo coordinación entre usuarios).

**Entorno objetivo:** ejecución local (localhost) vía Docker Compose — ver ADR-000.

## Actores

| Actor | Tipo | Rol |
|---|---|---|
| Administrador | Primario (humano) | Modera usuarios, publicaciones, reportes (§2.3) |
| Donante | Primario (humano) | Publica objetos, acepta solicitudes, participa en trueques |
| Beneficiario | Primario (humano) | Registra necesidades y ubicación, solicita ayuda |
| Usuario Comunidad | Primario (humano) | Dona, solicita e intercambia según permisos |
| Chatbot IA | Secundario (sistema) | Orienta, clasifica, sugiere, prioriza (§2.3) |
| Proveedor de IA externo | Soporte (sistema) | OpenAI/Claude — clasificación y matching (IF-001) |
| Cloudinary / Storage | Soporte (sistema) | Almacenamiento de imágenes (IF-003) |
| Servicio de Mapas | Soporte (sistema) | Geolocalización y distancia (IF-006) |
| n8n | Soporte (sistema) | Automatización/orquestación (IF-002, ver ADR-001/ADR-002) |

## Casos de uso

Originales del SRS (Apéndice B.2): CU-001 Registrarse · CU-002 Iniciar sesión · CU-003 Publicar donación · CU-004 Subir fotografías · CU-005 Crear solicitud de ayuda · CU-006 Aceptar solicitud como donante · CU-007 Publicar objeto para trueque · CU-008 Proponer trueque · CU-009 Conversar con chatbot IA · CU-010 Coordinar entrega o retiro · CU-011 Administrar publicaciones · CU-012 Ver dashboard de impacto.

Nuevos, agregados por ADR-005 (cubren RF que la matriz original dejaba sin caso de uso propio):
- **CU-013** Recibir sugerencia de clasificación IA (cubre RF-015; se dispara dentro de CU-003/CU-005/CU-007)
- **CU-014** Recibir recomendaciones de coincidencia (cubre RF-016 Matching)
- **CU-015** Enviar mensaje a otro usuario (cubre RF-017 Mensajería; se activa dentro de CU-010)
- **CU-016** Recibir notificación del sistema (cubre RF-020)

## Reglas de negocio (extraídas explícitamente del SRS)

1. Una solicitud transita únicamente por: `ABIERTA → EN_REVISION → ACEPTADA_POR_DONANTE → EN_ENTREGA → ATENDIDA`, con `CANCELADA` como salida en cualquier punto (§3.1.1).
2. Una donación transita por: `PUBLICADA → SOLICITADA → APROBADA → EN_RETIRO → ENTREGADA`, con `CANCELADA` como salida (§3.1.1).
3. Un trueque transita por: `PUBLICADO → PROPUESTA_RECIBIDA → ACEPTADO → EN_COORDINACION → INTERCAMBIADO`, con `CANCELADO` como salida (§3.1.1).
4. Un trueque requiere **aceptación bilateral** antes de coordinar entrega (RF-013).
5. La ubicación **exacta** del donante solo se solicita si eligió retiro en domicilio (§2.5, RF-007); nunca se publica sin autorización expresa (RNF-011, §5.2).
6. Las imágenes **no se almacenan como BLOB** en Postgres, solo la URL (IF-SW-006); tamaño máximo configurable, ej. 5 MB (§5.4).
7. Las contraseñas se almacenan únicamente con bcrypt, nunca en texto plano (RNF-005).
8. Toda operación sensible (creación, aprobación, cancelación, eliminación) queda auditada con usuario, fecha, acción y entidad (RNF-006).
9. El sistema debe declarar explícitamente que no certifica legalmente la condición económica del usuario (§5.2) — disclaimer obligatorio en el flujo de registro/solicitud.
10. Retención mínima de datos transaccionales: 2 años en ambiente productivo referencial (BD-003).
11. MongoDB solo se relaciona con Postgres por IDs de referencia, nunca por join directo (BD-005).

## Dependencias (§2.6.2)
Proveedor de IA externo (chatbot/clasificación) · Cloudinary o equivalente (imágenes) · OpenStreetMap/Google Maps (ubicación) · Postgres + MongoDB como motores de persistencia · n8n para automatización (ADR-001).

## Riesgos
Ver `fase-m1-validacion-producto.md` — sin cambios en esta fase; se retoman en Fase 11 (Roadmap) para dimensionar sprints.

---

**Aprobación:** Aprobada por el usuario (2026-07-07). Fase cerrada.
