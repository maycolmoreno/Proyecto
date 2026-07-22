# 01 — Resumen Ejecutivo — DonaConnect Ecuador

Síntesis de una página de toda la auditoría técnica (`00`-`21`). Cada afirmación tiene su evidencia completa en el documento referenciado — este resumen no introduce hechos nuevos.

---

## Qué es

Plataforma de donaciones, solicitudes de ayuda y trueque comunitario en Ecuador, con chatbot y asistencia de IA, orientada a ODS 1/10/12. Proyecto académico, diseñado en 14 fases documentadas antes de escribir código, con 49 ADR registrando cada decisión de trade-off.

## Estado real (2026-07-18)

**MVP funcional y verificado end-to-end**, incluyendo una extensión post-MVP recién completada (Perfiles Funcionales, ADR-048/049) — **con ~65 archivos aún sin commitear** en el working tree al momento de esta auditoría. Los 16 casos de uso del SRS están implementados (13 completos, 3 con matices — ver `02_TRAZABILIDAD_SRS_CODIGO.md`).

## Arquitectura (`03`)

Clean Architecture + DDD + Hexagonal, monolito modular, 4 capas (`domain/application/adapters/main`) × 12 Bounded Contexts. Verificado que la regla de dependencia se respeta: el cambio de proveedor de IA de Claude a Gemini fue una sola línea en el composition root, sin tocar ningún caso de uso — la prueba práctica de que el desacoplamiento no es solo teórico.

## Stack

Node 22 + TypeScript + Express + Prisma (Postgres 18.3) + Mongoose (MongoDB 8.3.4) en el backend; React 18 + Vite + TanStack Query en el frontend; Google Gemini para IA; Cloudinary para imágenes; Docker Compose con 4 servicios.

## Los 3 hallazgos más importantes para la defensa

1. **Rate limiting documentado (ADR-034) no existe en código** — riesgo de seguridad real, no solo desalineación de documentación (`13_SEGURIDAD.md §6`).
2. **La ubicación exacta de una Solicitud se revela una sola vez**, en la respuesta puntual de aceptar una oferta — no en consultas posteriores; el sentido inverso (beneficiario→dirección de la Donación) no tiene mecanismo (`13_SEGURIDAD.md §3`).
3. **Un módulo backend completo ("mis publicaciones") está implementado y funcionando, pero sin commitear y sin ADR** — cierra un gap que una auditoría anterior del propio proyecto había señalado como pendiente (`00_INVENTARIO_PROYECTO.md §2`).

## Deuda técnica consolidada

20 hallazgos priorizados en `17_DEUDA_TECNICA.md` — 3 de prioridad Alta, 5 Media, 12 Baja/Informativa. Ninguno es bloqueante para una demo o defensa; todos son mejoras concretas y acotadas, no rediseños.

## Documentación vs. código — la lección principal de esta auditoría

**Incluso la documentación más reciente del proyecto (2026-07-16) ya estaba desactualizada** al momento de auditar (2026-07-18) — el código evoluciona más rápido de lo que cualquier documento estático puede seguir. Por eso cada afirmación de esta serie cita archivo:línea verificado en el momento, no se apoya en documentación previa sin contrastarla.

## Mapa de los 14 documentos ya entregados

| # | Documento | Contenido en una línea |
|---|---|---|
| 00 | Inventario del Proyecto | Mapa técnico completo, backend+frontend+datos+Docker+tests |
| 02 | Trazabilidad SRS/Código | Los 16 CU con evidencia + comparación ADR vs. código |
| 03 | Arquitectura | Arquitectura real verificada, con diagramas |
| 04 | Comunicación entre Capas | Los 16 flujos de punta a punta |
| 06 | Construcción desde Cero | Cómo reconstruir el proyecto, paso a paso, comandos reales |
| 07 | Librerías | Cada dependencia, para qué sirve, dónde se usa |
| 08 | Inteligencia Artificial | Gemini en profundidad |
| 09 | Docker | `docker-compose.yml` y Dockerfiles línea por línea |
| 10 | PostgreSQL y MongoDB | Diccionario de datos completo + diagramas |
| 11 | Reglas de Negocio | Las 4 máquinas de estado, método por método |
| 12 | API Endpoints | Catálogo completo, ~38 endpoints |
| 13 | Seguridad | Revisión por categoría con severidad |
| 14 | Frontend y Roles | Rutas, guards, navegación |
| 15 | Servicios Externos | Gemini, Cloudinary, OpenStreetMap, n8n (removido) |
| 16 | Pruebas | Inventario real + plan de casos nuevos |
| 17 | Deuda Técnica | 20 hallazgos priorizados |
| 21 | Glosario | Términos aplicados a este proyecto específico |

Pendientes: explicación línea por línea de los archivos centrales (`05`), guion de exposición (`19`), banco de preguntas (`20`), informe técnico consolidado (`18`), README técnico índice.
