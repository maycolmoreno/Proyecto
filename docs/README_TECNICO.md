# README Técnico — Auditoría de Defensa DonaConnect Ecuador

Índice de los 22 documentos de auditoría técnica generados 2026-07-18, verificados contra el código real del repositorio (incluye ~65 archivos sin commitear al momento de la auditoría). Cada documento cita evidencia archivo:línea — nada se afirma sin verificar contra el código en el momento de escribirlo.

**Cómo se generó:** lectura directa de código + 3 agentes de exploración en paralelo para las primeras fases, contrastando contra la documentación de diseño previa (`docs/fases/`, `docs/DECISIONES.md`) y contra dos documentos de auditoría/defensa anteriores del propio proyecto — ambos resultaron parcialmente desactualizados, lo cual es en sí mismo el hallazgo metodológico más importante de toda la serie (ver `18_INFORME_TECNICO.md §28`).

---

## Por dónde empezar

- **¿Vas a estudiar para la defensa?** Empieza por `01_RESUMEN_EJECUTIVO.md`, luego `19_GUION_EXPOSICION.md`, y ten `20_PREGUNTAS_DEFENSA.md` a mano.
- **¿Necesitas entender la arquitectura rápido?** `03_ARQUITECTURA.md` + `04_COMUNICACION_ENTRE_CAPAS.md`.
- **¿Vas a arreglar algo antes de la entrega?** `17_DEUDA_TECNICA.md` — 20 hallazgos priorizados con recomendación concreta.
- **¿El docente pregunta por un archivo específico?** `05_EXPLICACION_CODIGO.md` tiene 6 archivos centrales línea por línea; `12_API_ENDPOINTS.md` el catálogo completo de la API.

## Índice completo

| # | Documento | Contenido |
|---|---|---|
| 00 | [`00_INVENTARIO_PROYECTO.md`](00_INVENTARIO_PROYECTO.md) | Mapa técnico completo: backend (4 capas × 12 Bounded Contexts), frontend, persistencia, Docker, testing |
| 01 | [`01_RESUMEN_EJECUTIVO.md`](01_RESUMEN_EJECUTIVO.md) | Síntesis de una página de toda la auditoría |
| 02 | [`02_TRAZABILIDAD_SRS_CODIGO.md`](02_TRAZABILIDAD_SRS_CODIGO.md) | Matriz de los 16 casos de uso + comparación SRS/ADR/código + inconsistencias |
| 03 | [`03_ARQUITECTURA.md`](03_ARQUITECTURA.md) | Arquitectura real verificada, diagrama de dependencias, diagrama de estados |
| 04 | [`04_COMUNICACION_ENTRE_CAPAS.md`](04_COMUNICACION_ENTRE_CAPAS.md) | Los 16 flujos de punta a punta, con diagramas de secuencia |
| 05 | [`05_EXPLICACION_CODIGO.md`](05_EXPLICACION_CODIGO.md) | 6 archivos centrales explicados línea por línea |
| 06 | [`06_CONSTRUCCION_DESDE_CERO.md`](06_CONSTRUCCION_DESDE_CERO.md) | Cómo reconstruir el proyecto paso a paso, comandos reales |
| 07 | [`07_LIBRERIAS.md`](07_LIBRERIAS.md) | Cada dependencia backend/frontend, para qué sirve, dónde se usa |
| 08 | [`08_INTELIGENCIA_ARTIFICIAL.md`](08_INTELIGENCIA_ARTIFICIAL.md) | Google Gemini en profundidad — prompts reales, riesgos, Q&A |
| 09 | [`09_DOCKER.md`](09_DOCKER.md) | `docker-compose.yml` y Dockerfiles línea por línea |
| 10 | [`10_POSTGRESQL_Y_MONGODB.md`](10_POSTGRESQL_Y_MONGODB.md) | Diccionario de datos completo, diagrama ER, diagrama de colecciones |
| 11 | [`11_REGLAS_DE_NEGOCIO.md`](11_REGLAS_DE_NEGOCIO.md) | Las 4 máquinas de estado método por método, invariantes, matriz de autorización |
| 12 | [`12_API_ENDPOINTS.md`](12_API_ENDPOINTS.md) | Catálogo completo (~38 endpoints), DTOs, códigos de error |
| 13 | [`13_SEGURIDAD.md`](13_SEGURIDAD.md) | Revisión de seguridad por categoría, con severidad |
| 14 | [`14_FRONTEND_Y_ROLES.md`](14_FRONTEND_Y_ROLES.md) | Rutas, guards de perfil, navegación, las 4 capas de protección |
| 15 | [`15_SERVICIOS_EXTERNOS.md`](15_SERVICIOS_EXTERNOS.md) | Gemini, Cloudinary, OpenStreetMap, n8n (removido) |
| 16 | [`16_PRUEBAS.md`](16_PRUEBAS.md) | Inventario real de tests + plan de pruebas para los huecos |
| 17 | [`17_DEUDA_TECNICA.md`](17_DEUDA_TECNICA.md) | 20 hallazgos consolidados y priorizados |
| 18 | [`18_INFORME_TECNICO.md`](18_INFORME_TECNICO.md) | Informe consolidado, 30 secciones, para entrega formal |
| 19 | [`19_GUION_EXPOSICION.md`](19_GUION_EXPOSICION.md) | Guion de presentación de 20 minutos |
| 20 | [`20_PREGUNTAS_DEFENSA.md`](20_PREGUNTAS_DEFENSA.md) | 80 preguntas con respuesta corta argumentada |
| 21 | [`21_GLOSARIO.md`](21_GLOSARIO.md) | Términos aplicados específicamente a este proyecto |

## Documentos previos del proyecto (contexto, no parte de esta auditoría)

- `docs/fases/` — 14 fases de diseño, aprobadas 2026-07-07, previas al código.
- `docs/DECISIONES.md` — 49 ADR, fuente de verdad de trade-offs.
- `docs/MANUAL_DEFENSA_PROYECTO.md` — manual de defensa previo (2026-07-16), **parcialmente desactualizado**, ver `02_TRAZABILIDAD_SRS_CODIGO.md §2`.
- `docs/AUDITORIA_FUNCIONAL_MARKETPLACE.md` — auditoría previa (2026-07-10), **desactualizada** respecto al modelo de roles actual, útil como snapshot histórico del razonamiento detrás de ADR-048.

## Los 5 hallazgos que más vale tener presentes

1. **Rate limiting documentado (ADR-034) no existe en código** — `13_SEGURIDAD.md §6`, prioridad Alta.
2. **Ubicación exacta de una Solicitud: revelación puntual, no persistente** — `13_SEGURIDAD.md §3`.
3. **Solicitudes no tienen subida real de imágenes** (a diferencia de Donaciones/Trueques) — `02_TRAZABILIDAD_SRS_CODIGO.md` CU-004.
4. **Módulo "mis publicaciones" implementado y funcionando, sin commitear ni ADR** — `00_INVENTARIO_PROYECTO.md §2`.
5. **La documentación de defensa más reciente del propio proyecto (2026-07-16) ya estaba desactualizada 2 días después** — la razón por la que cada documento de esta serie verifica contra el código, no contra documentación previa.

## Cómo mantener esta serie actualizada

Si el código cambia después del 2026-07-18, estos documentos empiezan a envejecer igual que le pasó a `MANUAL_DEFENSA_PROYECTO.md`. Antes de citar cualquier archivo:línea de esta serie en una situación donde importa la exactitud (ej. responder una pregunta técnica precisa), verificar contra el código actual — no asumir que sigue igual.
