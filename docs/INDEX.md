# DonaConnect Ecuador — Documentación del Plan Maestro

**✅ PLAN MAESTRO COMPLETO — las 14 fases (Fase -1 a Fase 12) están aprobadas.** El diseño integral del proyecto (arquitectura, dominio, datos, APIs, UX/UI, backend, IA, automatización, seguridad, DevOps, roadmap y backlog) queda cerrado a partir del 2026-07-07. El proyecto está listo para iniciar desarrollo — **pendiente de autorización explícita del usuario para empezar a generar código**, tal como se acordó desde el inicio de este proceso.

Índice vivo del proceso de diseño. Cada fase tiene su propio archivo en `fases/`, con estado, historial de cambios y contenido aprobado. Se actualiza a medida que avanzamos — nunca se sobreescribe sin dejar rastro en el "Historial de cambios" de cada archivo. Si en el futuro se corrige o amplía alguna fase, este índice y el archivo correspondiente se actualizan siguiendo el mismo patrón.

**Metodología de trabajo:** definida por el usuario en `Plan_Maestro_DonaConnect_Claude.md`. No se escribe código hasta autorización explícita. Cada fase espera aprobación antes de avanzar a la siguiente.

**Entorno objetivo:** localhost vía Docker Compose (proyecto universitario) — ver `DECISIONES.md` ADR-000.

**Fuente única de requisitos:** `SRS_DonaConnect_Ecuador_ISO29148.docx` v1.0.

## Otros documentos
- [`DECISIONES.md`](DECISIONES.md) — log de decisiones de arquitectura (ADR-lite), incluye correcciones a inconsistencias del SRS.
- [`PLAN_IMPLEMENTACION.md`](PLAN_IMPLEMENTACION.md) — tracker vivo de ejecución del backend (Sprint 2 en adelante), desglosado capa por capa para no saltarse pasos. Distinto de `fases/` (que es diseño ya congelado): este se actualiza con checkboxes a medida que se construye.
- [`PLAN_FRONTEND.md`](PLAN_FRONTEND.md) — tracker vivo de ejecución del frontend (Sprints F0-F5), mismo criterio que `PLAN_IMPLEMENTACION.md`.
- **Extensión post-MVP — Modelo de Perfiles Funcionales (Opción D, ADR-048):** [`AUDITORIA_FUNCIONAL_MARKETPLACE.md`](AUDITORIA_FUNCIONAL_MARKETPLACE.md) (auditoría de solo lectura, 2026-07-10 — **desactualizada**, describe el modelo de roles previo a ADR-048/049, ver nota abajo) → [`DISENO_MODELO_PERFILES.md`](DISENO_MODELO_PERFILES.md) (propuesta de 4 opciones, Opción D aprobada) → [`PLAN_PERFILES.md`](PLAN_PERFILES.md) (tracker vivo de ejecución, Fases 1-4 cerradas 2026-07-14/15).
- **Manual de defensa:** [`MANUAL_DEFENSA_PROYECTO.md`](MANUAL_DEFENSA_PROYECTO.md) (2026-07-16 — parcialmente desactualizado en el detalle de `PerfilFuncional`, ver `02_TRAZABILIDAD_SRS_CODIGO.md`).
- **Auditoría técnica para defensa (2026-07-18, COMPLETA — 22 de 22 documentos + índice):** ver [`README_TECNICO.md`](README_TECNICO.md), el índice dedicado de toda la serie (`00` a `21`, con guía de "por dónde empezar" según el propósito: estudiar para la defensa, entender la arquitectura, o corregir hallazgos antes de la entrega). Cada afirmación cita archivo:línea; verificado contra el código en disco (incluye cambios sin commitear), no solo contra documentación previa — de hecho, `MANUAL_DEFENSA_PROYECTO.md` y `AUDITORIA_FUNCIONAL_MARKETPLACE.md` resultaron ambos parcialmente desactualizados frente al código real, ver `18_INFORME_TECNICO.md §28`.

## Estado de las fases

| Fase | Nombre | Estado | Archivo |
|---|---|---|---|
| -1 | Validación del Producto | ✅ Aprobada | [fases/fase-m1-validacion-producto.md](fases/fase-m1-validacion-producto.md) |
| 0 | Comprensión del Proyecto | ✅ Aprobada | [fases/fase-00-comprension-proyecto.md](fases/fase-00-comprension-proyecto.md) |
| 1 | Arquitectura Empresarial | ✅ Aprobada | [fases/fase-01-arquitectura-empresarial.md](fases/fase-01-arquitectura-empresarial.md) |
| 2 | Diseño del Dominio (DDD) | ✅ Aprobada | [fases/fase-02-diseno-dominio.md](fases/fase-02-diseno-dominio.md) |
| 3 | Modelo de Datos | ✅ Aprobada | [fases/fase-03-modelo-datos.md](fases/fase-03-modelo-datos.md) |
| 4 | Diseño de APIs | ✅ Aprobada | [fases/fase-04-diseno-apis.md](fases/fase-04-diseno-apis.md) |
| 5 | UX/UI | ✅ Aprobada | [fases/fase-05-ux-ui.md](fases/fase-05-ux-ui.md) |
| 6 | Backend | ✅ Aprobada | [fases/fase-06-backend.md](fases/fase-06-backend.md) |
| 7 | Inteligencia Artificial | ✅ Aprobada | [fases/fase-07-inteligencia-artificial.md](fases/fase-07-inteligencia-artificial.md) |
| 8 | Automatizaciones (n8n) | ✅ Aprobada | [fases/fase-08-automatizaciones.md](fases/fase-08-automatizaciones.md) |
| 9 | Seguridad | ✅ Aprobada | [fases/fase-09-seguridad.md](fases/fase-09-seguridad.md) |
| 10 | DevOps | ✅ Aprobada | [fases/fase-10-devops.md](fases/fase-10-devops.md) |
| 11 | Roadmap | ✅ Aprobada | [fases/fase-11-roadmap.md](fases/fase-11-roadmap.md) |
| 12 | Backlog | ✅ Aprobada | [fases/fase-12-backlog.md](fases/fase-12-backlog.md) |

**Leyenda:** ✅ Aprobada · 🔄 En revisión (entregada, esperando aprobación) · ⏳ Pendiente (no iniciada)

## Cómo usar esta documentación
- Antes de cada fase nueva, se lee el estado aquí para saber dónde quedó el proyecto.
- Si corriges o pides cambios sobre una fase ya "Aprobada", se actualiza el archivo de esa fase y se agrega una entrada a su historial de cambios (no se pierde el contenido anterior, queda registrado el motivo del cambio).
- `DECISIONES.md` es la fuente de verdad de trade-offs técnicos; las fases individuales referencian los ADR en vez de repetir la justificación.
