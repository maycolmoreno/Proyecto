# 18 — Informe Técnico Consolidado — DonaConnect Ecuador

Documento de entrega formal, síntesis de toda la auditoría (`00`-`21`). Cada sección remite al documento fuente con la evidencia completa (archivo:línea) — este informe no repite esa evidencia en detalle, la organiza narrativamente.

---

## 1. Portada

**DonaConnect Ecuador** — Plataforma de donaciones, solicitudes de ayuda y trueque comunitario con asistencia de inteligencia artificial. Auditoría técnica de defensa, generada 2026-07-18 contra el código real del repositorio.

## 2. Resumen ejecutivo

Ver `01_RESUMEN_EJECUTIVO.md` — versión de una página de este mismo informe.

## 3. Introducción

DonaConnect Ecuador nace de un SRS académico (`SRS_DonaConnect_Ecuador_ISO29148.docx`) y se diseñó en 14 fases documentadas (`docs/fases/`) antes de escribir código, con 49 decisiones de arquitectura registradas (`docs/DECISIONES.md`). Esta auditoría verifica, contra el código real (no contra la documentación de diseño), qué de todo eso efectivamente existe y funciona.

## 4. Problema

Personas y comunidades en Ecuador con objetos/recursos disponibles no tienen un canal directo, sin intermediación monetaria, para conectarse con quienes tienen necesidades concretas — ni un espacio de trueque comunitario asistido por tecnología.

## 5. Justificación

Relación directa con ODS 1 (fin de la pobreza), ODS 10 (reducción de desigualdades) y ODS 12 (producción y consumo responsables) — redistribuir bienes existentes en vez de solo producir/comprar nuevos.

## 6. Objetivo general

Conectar donantes, beneficiarios y comunidad para gestionar donaciones, solicitudes de ayuda y trueques, con orientación y clasificación asistida por IA.

## 7. Objetivos específicos

Los 16 casos de uso del SRS (`02_TRAZABILIDAD_SRS_CODIGO.md §1`): registro/login, publicar donación, subir fotos, crear solicitud, aceptar solicitud, publicar/proponer trueque, chatbot, coordinar entrega, administrar publicaciones, ver dashboard, clasificación IA, matching IA, mensajería, notificaciones.

## 8. Alcance

**Dentro:** gestión de usuarios/perfiles, publicación de donaciones/solicitudes/trueques, chatbot IA, moderación, dashboard. **Fuera:** pagos electrónicos, certificación legal de condición socioeconómica, logística profesional de transporte. Entorno objetivo: `localhost` vía Docker Compose (ADR-000).

## 9. Actores

Administrador, Donante, Solicitante, Usuario con perfil de Trueque (los 3 últimos, un mismo usuario puede serlo simultáneamente vía `PerfilFuncional`), Chatbot IA, Proveedor de IA externo (Gemini), Cloudinary, OpenStreetMap (geolocalización). n8n fue actor planeado y removido (ADR-047).

## 10. Casos de uso

Matriz completa con evidencia archivo:línea en `02_TRAZABILIDAD_SRS_CODIGO.md §1` — 13 de 16 completamente implementados, 3 con matices documentados (CU-004, CU-006, CU-012, CU-016 catalogados como "de forma distinta" o "parcial").

## 11. Requisitos

RF-001 a RF-020 (SRS) + RNF-001 a RNF-015 (consolidados en ADR-003). Los más relevantes verificados en esta auditoría: RNF-005 (bcrypt, cumplido), RNF-006 (auditoría, cumplido parcialmente — 10/~38 endpoints), RNF-011 (ubicación exacta oculta, cumplido con matiz — `13_SEGURIDAD.md §3`), RNF-002 (disponibilidad ante fallo de IA/Cloudinary, cumplido).

## 12. Tecnologías

Node 22 + TypeScript 5.7 + Express 4.21 + Prisma 6.1 (Postgres 18.3) + Mongoose 9.7 (MongoDB 8.3.4) + Zod + bcrypt + jsonwebtoken; React 18.3 + Vite 6.0 + TanStack Query 5.62 + React Router 7.1; Google Gemini (`@google/genai`); Cloudinary; Docker Compose. Catálogo completo con versiones exactas y uso confirmado en `07_LIBRERIAS.md`.

## 13. Arquitectura

DDD + Clean Architecture + Hexagonal, monolito modular, 4 capas × 12 Bounded Contexts. Regla de dependencia verificada (no asumida): el dominio nunca importa Express/Prisma; el cambio de proveedor de IA (Claude→Gemini) fue 1 línea en el composition root. Detalle completo, diagrama Mermaid y dónde se rompe la arquitectura en `03_ARQUITECTURA.md`.

## 14. Comunicación entre capas

Los 16 flujos de punta a punta, con línea exacta en cada salto, en `04_COMUNICACION_ENTRE_CAPAS.md`. El más ilustrativo: publicar una donación dispara moderación IA y proyección de "mis publicaciones" en paralelo (Event Bus in-process), sin bloquear la respuesta HTTP ya enviada.

## 15. Backend

12 Bounded Contexts, ~30 casos de uso, patrón repetido: `domain → application → adapters → main` (ver `00_INVENTARIO_PROYECTO.md §2`). Explicación línea por línea de los archivos más centrales (entidad, caso de uso, repositorio, controller, middlewares) en `05_EXPLICACION_CODIGO.md`.

## 16. Frontend

Arquitectura feature-based, 17 páginas, 5 guards de perfil reales (solo UX, la autorización real vive en el backend), navegación sin filtrar por rol (decisión explícita). Detalle en `14_FRONTEND_Y_ROLES.md`.

## 17. PostgreSQL

11 tablas, UUID v4 como PK, referencias polimórficas sin FK declarativa donde corresponde (ADR-015). Diccionario de datos completo y diagrama ER en `10_POSTGRESQL_Y_MONGODB.md §2-3`.

## 18. MongoDB

6 colecciones (una más de lo que documentaba la auditoría previa del proyecto — `publicaciones_index`, código nuevo). Solo `eventos_sistema` tiene TTL (90 días). Detalle completo en `10_POSTGRESQL_Y_MONGODB.md §4`.

## 19. Inteligencia Artificial

Google Gemini, no Claude/Anthropic como documentaba el diseño original (ADR-024) — cambio pragmático, arquitectónicamente transparente. 4 usos (chatbot, clasificación, matching, moderación), siempre human-in-the-loop. Análisis completo, incluyendo riesgos de prompt injection y alucinación, en `08_INTELIGENCIA_ARTIFICIAL.md`.

## 20. Docker

4 servicios (`postgres`, `mongo`, `api`, `web`), healthchecks en las 2 bases de datos, `depends_on` con condición de salud real en `api`. Justificación completa de "por qué Docker en localhost" y explicación línea por línea en `09_DOCKER.md`.

## 21. Servicios externos

Gemini (IA), Cloudinary (imágenes, firma local sin exponer el binario al backend), OpenStreetMap Nominatim (geolocalización, 100% cliente, sin usar la `MAPS_API_KEY` documentada), n8n (removido por completo, ADR-047). Detalle en `15_SERVICIOS_EXTERNOS.md`.

## 22. Seguridad

bcrypt + JWT (8h, sin refresh) + autorización en 2 niveles (perfil de marketplace + rol de seguridad) + ubicación exacta oculta por defecto. **Hallazgo principal: rate limiting documentado (ADR-034) no implementado** — prioridad Alta. Revisión completa por categoría con severidad en `13_SEGURIDAD.md`.

## 23. Pruebas

6 archivos de integración real (Vitest + Supertest contra Postgres/Mongo reales) cubriendo Donaciones, Solicitudes, Trueques, Perfiles y el nuevo módulo Publicaciones. Sin tests de frontend; huecos en backend (Identidad, Entregas, Mensajería, Notificaciones, IA, Categorías, Dashboard, Administración). Plan de pruebas para los huecos en `16_PRUEBAS.md`.

## 24. Resultados

MVP funcional verificado end-to-end, extensión de Perfiles Funcionales (ADR-048/049) cerrada, módulo adicional de historial ("mis publicaciones") funcionando pero pendiente de commit. 14 documentos de auditoría generados con evidencia archivo:línea verificable.

## 25. Limitaciones

- Rate limiting ausente (Alto).
- Ubicación exacta: revelación puntual, no persistente, y solo en un sentido (donante ve la de la solicitud; el inverso no tiene mecanismo) (Medio).
- Solicitudes sin subida real de imágenes (Alto, funcional).
- 6 valores de enum de Prisma sin uso real en código (Media, cosmética).
- Sin tests de frontend (Media).
- Ver las 20 filas completas en `17_DEUDA_TECNICA.md`.

## 26. Deuda técnica

Consolidado completo, priorizado, con evidencia y recomendación por hallazgo en `17_DEUDA_TECNICA.md` — 3 hallazgos de prioridad Alta, 5 Media, 12 Baja/Informativa.

## 27. Mejoras futuras

En orden de prioridad recomendada: (1) implementar rate limiting real, (2) persistir la ubicación de coordinación en el registro de `Entrega` en vez de una respuesta HTTP transitoria, (3) decidir el mecanismo de imágenes para Solicitudes, (4) cerrar los huecos de test más críticos (Identidad, Entregas), (5) commitear y documentar formalmente el módulo `publicaciones`, (6) evaluar la extensión de "Comunidad/Organización" ya diseñada pero fuera de alcance (`docs/DISENO_MODELO_PERFILES.md` sección 7).

## 28. Conclusiones

El proyecto demuestra una arquitectura consistentemente aplicada (verificada, no solo declarada) con al menos una prueba práctica real de su valor (el cambio de proveedor de IA). La brecha entre documentación y código —incluso en el documento de defensa más reciente del propio proyecto— es la lección metodológica más importante de esta auditoría: cualquier afirmación sobre el sistema debe verificarse contra el código en el momento, no asumirse de un documento previo por reciente que sea.

## 29. Glosario

Ver `21_GLOSARIO.md` — términos aplicados específicamente a este proyecto, no definiciones genéricas.

## 30. Anexos

- SRS original: `SRS_DonaConnect_Ecuador_ISO29148.docx`.
- Log de decisiones: `docs/DECISIONES.md` (49 ADR).
- Fases de diseño: `docs/fases/` (14 archivos).
- Los 14 documentos de esta auditoría técnica (`00` a `21`, listados completos en `README_TECNICO.md`).

---

## Qué sigue

`README_TECNICO.md` es el índice final de toda la serie — el punto de entrada para navegar cualquiera de los 21 documentos generados.
