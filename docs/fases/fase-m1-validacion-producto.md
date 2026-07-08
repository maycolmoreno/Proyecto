# Fase -1 — Validación del Producto

**Estado:** ✅ Aprobada
**Fecha de creación:** 2026-07-07
**Última actualización:** 2026-07-07
**Fuente:** `SRS_DonaConnect_Ecuador_ISO29148.docx` v1.0 (única fuente; sin supuestos externos)

## Historial de cambios
| Fecha | Descripción |
|---|---|
| 2026-07-07 | Versión inicial. Analizado el SRS completo. Detectadas 5 inconsistencias documentales (ver `docs/DECISIONES.md` ADR-001 a ADR-005). Aprobado MVP con 16 RF "Must" en MoSCoW. |

---

## Objetivo del negocio
Plataforma comunitaria digital que conecta donantes, beneficiarios y comunidad para gestionar **donaciones**, **solicitudes de ayuda** y **trueques**, con apoyo de IA. Contribuye principalmente a **ODS 1 (Fin de la pobreza)** y secundariamente a ODS 10 y ODS 12. Proyecto académico (versión 1.0, responsable: Ronald Moreno).

## Problema que resuelve
Personas/familias en situación de necesidad (silla de ruedas, laptop, útiles escolares, ropa, alimentos, electrodomésticos) no tienen un canal accesible para obtener bienes esenciales sin dinero, mientras que objetos reutilizables permanecen ociosos en manos de otros usuarios. No existe un mecanismo comunitario que intermedie donación, solicitud y trueque con clasificación y priorización asistida por IA — y explícitamente **no** sustituye a entidades gubernamentales ni verifica legalmente la condición socioeconómica (§1.2, §5.2).

## MVP (restricción explícita: 6 semanas — §2.5)

**Must have** (núcleo transaccional, todos "Alta" en el SRS):
RF-001 a RF-015, RF-018 — registro, login, roles, perfil beneficiario, publicar donación, fotos, ubicación de retiro, crear/aceptar solicitud, estados de solicitud, publicar/proponer/aceptar trueque, chatbot IA básico, clasificación IA, panel admin de moderación.

**Should have** ("Media" en el SRS, valor alto pero postergable si el plazo aprieta):
RF-016 (matching inteligente), RF-017 (mensajería interna), RF-019 (dashboard), RF-020 (notificaciones).

**Won't have** (§1.2 "Fuera de alcance"): pagos electrónicos, sustitución de entidades formales, verificación legal socioeconómica, logística profesional de transporte.

⚠️ **Riesgo de alcance aceptado por el usuario**: 16 RF "Must" en 6 semanas académicas es ambicioso; se revisa formalmente el dimensionamiento en Fase 11 (Roadmap).

## Riesgos identificados
1. **Dependencia de terceros**: IA, Cloudinary y mapas son servicios externos; el propio SRS admite degradación (RNF-002). Sin fallback definido aún.
2. **Alcance vs. tiempo**: 6 semanas para 16 RF "Must" + arquitectura dual de BD.
3. **Privacidad de ubicación**: RNF-011 exige que la ubicación exacta del donante no sea pública sin autorización — debe implementarse desde el diseño inicial.
4. **Confianza/fraude**: el sistema no verifica legalmente necesidad ni condición económica (§5.2); RF-018 (panel admin) es el único control.
5. **Frontera Postgres/MongoDB**: BD-005 exige relacionar por IDs de referencia, no join directo; riesgo de inconsistencia si no se define bien en Fase 3.

## KPIs (derivados de §2.2, RF-019 y sección 6 ISO 25010)
- Donaciones publicadas vs. entregadas
- Tasa de atención de solicitudes (atendidas / totales)
- Trueques completados
- Beneficiarios/familias atendidas
- Objetos reutilizados (indicador ambiental, ODS 12)
- Tiempo de respuesta ≤ 3s P95 (RNF-001), chatbot ≤ 10s (RNF-002)
- Disponibilidad ≥ 95% (RNF-003)
- Pasos para crear publicación ≤ 5 (RNF-010 / RNF-014 consolidado)

## Inconsistencias detectadas en el SRS
Resueltas y documentadas como decisiones de arquitectura en `docs/DECISIONES.md` (ADR-001 a ADR-005):
1. n8n sin RF ni caso de uso propio.
2. Salto de numeración IF-001 → IF-003 (falta IF-002).
3. Doble numeración conflictiva de RNF entre tabla §3.2 y detalle §3.2.1–3.2.5.
4. "Postgres 8.x" no es una versión real de PostgreSQL.
5. Matriz de trazabilidad (Apéndice C) con error de copy-paste en RF-014 a RF-020.

---

**Aprobación:** Usuario aprobó el MVP propuesto y delegó la resolución de inconsistencias al arquitecto (2026-07-07). Fase cerrada.
