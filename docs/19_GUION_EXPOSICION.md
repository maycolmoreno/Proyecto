# 19 — Guion de Exposición — DonaConnect Ecuador

Guion de ~20 minutos, 20 secciones cortas. Cada una: qué decir, qué archivo mostrar en pantalla, qué pregunta probable del docente y su respuesta corta (detalle completo en `20_PREGUNTAS_DEFENSA.md`).

---

## 1. Presentación (1 min)
**Decir:** "DonaConnect Ecuador es una plataforma de donaciones, solicitudes de ayuda y trueque comunitario, con un chatbot de IA de apoyo — proyecto académico diseñado en 14 fases documentadas antes de escribir código."
**Mostrar:** `docs/INDEX.md` (el índice completo del proceso de diseño).
**Dominar:** que el diseño quedó cerrado (49 ADR) antes del Sprint 0 — no se improvisó sobre la marcha.

## 2. Problema social y ODS (1 min)
**Decir:** conecta a quien tiene con quien necesita, sin intermediar dinero — ODS 1/10/12.
**Pregunta probable:** "¿por qué no pagos electrónicos?" → fuera de alcance explícito, ver `20_PREGUNTAS_DEFENSA.md` #2.

## 3. Objetivos y alcance (1 min)
**Decir:** dentro de alcance: donaciones/solicitudes/trueques/chatbot/moderación/dashboard; fuera: pagos, certificación legal, logística profesional.
**Mostrar:** `docs/fases/fase-00-comprension-proyecto.md`.

## 4. Roles y perfiles (2 min)
**Decir:** separación reciente entre `Rol` (seguridad: Administrador/Usuario) y `PerfilFuncional` (marketplace: Donante/Solicitante/Trueque) — un usuario puede tener los 3 perfiles a la vez.
**Mostrar:** `PerfilPage.tsx` en el navegador (activar/desactivar perfiles) + `schema.prisma` líneas 22-53.
**Dominar:** por qué se separó (ADR-048) y qué corrigió de paso (registro público ya no podía crear administradores).

## 5. Arquitectura — las 4 capas (3 min, la sección más importante)
**Decir:** DDD (qué modelar) + Clean Architecture (cómo organizar capas) + Hexagonal (cómo el núcleo habla con el exterior) — combinadas, no en competencia.
**Mostrar:** el árbol de `backend/` (domain/application/adapters/main) + el diagrama Mermaid de `03_ARQUITECTURA.md §3`.
**Demostrar en vivo si hay tiempo:** abrir `di-container.ts:295` y mostrar la línea exacta donde se decide Gemini vs. Claude — "cambiar de proveedor de IA fue una línea, no un refactor".
**Pregunta probable:** "¿dónde está la lógica de negocio?" → `domain/` y `application/`, nunca en controllers.

## 6. Comunicación entre capas (2 min)
**Decir:** ejemplo real, publicar una donación — HTTP → middleware → controller → caso de uso → dominio → repositorio → Postgres, con moderación IA reaccionando en paralelo vía Event Bus sin bloquear la respuesta.
**Mostrar:** el diagrama de secuencia de `04_COMUNICACION_ENTRE_CAPAS.md §3`.

## 7. Node.js y TypeScript (1 min)
**Decir:** Node 22 LTS, TypeScript con `strict` + `noUncheckedIndexedAccess` — tipado end-to-end con Prisma.
**Pregunta probable:** "¿por qué TypeScript?" → `20_PREGUNTAS_DEFENSA.md` #21.

## 8. Frontend (2 min)
**Decir:** React + Vite, feature-based (espejo del backend), TanStack Query en vez de Redux porque casi todo es estado de servidor.
**Mostrar:** `frontend/src/features/` en el explorador de archivos, señalando el espejo con `backend/domain/`.
**Demostrar en vivo:** navegar `localhost:5173`, publicar una donación con el wizard de 5 pasos, mostrar la sugerencia de IA.

## 9. API REST (1 min)
**Decir:** `/api/v1`, envelope `{data}`/`{data,meta}`, 8 códigos de error mapeados centralmente.
**Mostrar:** `12_API_ENDPOINTS.md` (catálogo completo) — un ejemplo con Postman o `curl` en vivo si el entorno lo permite.

## 10. PostgreSQL (2 min)
**Decir:** 11 tablas, UUID como PK (evita enumeración de recursos), FK reales, invariantes en las máquinas de estado.
**Mostrar:** `npx prisma studio` en vivo, o el diagrama ER de `10_POSTGRESQL_Y_MONGODB.md §3`.

## 11. MongoDB (1 min)
**Decir:** 6 colecciones, datos conversacionales/append-only — mensajería, notificaciones, historial IA.
**Pregunta probable:** "¿por qué dos bases de datos?" → `20_PREGUNTAS_DEFENSA.md` #55-56.

## 12. Chatbot e IA (3 min)
**Decir:** Google Gemini (no Claude como el diseño original — cambio pragmático, adaptador intercambiable), 4 usos: chatbot, clasificación, matching, moderación asistida — siempre human-in-the-loop, nunca decide.
**Mostrar:** `ChatbotPage.tsx` en vivo, hacer una pregunta real al chatbot; luego `GeminiAdapter.ts` mostrando el `responseSchema` de clasificación.
**Dominar:** la diferencia entre las 4 llamadas (structured output vs. texto libre) y por qué.

## 13. Docker (2 min)
**Decir:** localhost es el lugar de acceso, no la forma de ejecución — Docker da consistencia y reproducibilidad sin exigir Postgres/Mongo instalados nativamente.
**Mostrar:** `docker compose ps` en vivo, `docker-compose.yml`.
**Pregunta obligatoria:** "¿por qué Docker si es localhost?" → respuesta completa armada en `09_DOCKER.md §6`.

## 14. Seguridad (2 min)
**Decir:** bcrypt, JWT de 8h, autorización en 2 niveles (perfil de marketplace + rol de seguridad), ubicación exacta oculta por defecto.
**Ser honesto sobre el hallazgo principal:** rate limiting documentado pero no implementado — mostrar que se identificó y priorizó, no ocultarlo.
**Mostrar:** `13_SEGURIDAD.md §10` (tabla de hallazgos por severidad).

## 15. Demostración en vivo (3-4 min)
**Flujo sugerido:** registro con 2 perfiles → login → publicar una donación (con sugerencia IA) → crear una solicitud con otro usuario → ofertar → confirmar entrega → ver el dashboard actualizado.
**Tener preparado:** un usuario admin ya creado, categorías activas, `.env` completo con Gemini/Cloudinary configurados.

## 16. Pruebas (1 min)
**Decir con honestidad:** 6 archivos de test de integración real (Vitest+Supertest, contra Postgres/Mongo reales), cubren los flujos core de Donaciones/Solicitudes/Trueques/Perfiles; sin tests de frontend, con huecos identificados en backend (Identidad, Entregas, IA).
**Mostrar:** `16_PRUEBAS.md §5` (prioridad recomendada).

## 17. Limitaciones (1 min)
**Decir sin rodeos:** rate limiting ausente, ubicación exacta con revelación puntual no persistente, Solicitudes sin subida real de imágenes, módulo "mis publicaciones" sin commitear.
**Por qué mencionarlas proactivamente:** demuestra que la auditoría fue real, no un ejercicio de marketing — el docente valora más una autoevaluación honesta que un "todo está perfecto".

## 18. Conclusiones (1 min)
**Decir:** el MVP cubre los 16 casos de uso del SRS, con una extensión post-MVP (perfiles funcionales) ya cerrada; la arquitectura elegida demostró su valor en un cambio real (Claude→Gemini); quedan mejoras concretas y acotadas, no rediseños.

## 19. Preguntas del docente (tiempo restante)
Usar `20_PREGUNTAS_DEFENSA.md` como referencia mental — está organizado por las mismas categorías de este guion.

## 20. Cierre
**Decir:** agradecer, ofrecer mostrar cualquier parte del código en vivo si el docente quiere profundizar en algo puntual — tener el proyecto corriendo (`docker compose up`) durante toda la exposición, no solo al inicio.

---

## Checklist de material a tener abierto antes de empezar

- [ ] `docker compose up` corriendo, 4 contenedores healthy
- [ ] Navegador en `localhost:5173`, sesión de prueba lista
- [ ] Editor con `di-container.ts`, `Donacion.ts`, `GeminiAdapter.ts` abiertos en pestañas
- [ ] `docs/03_ARQUITECTURA.md` y `docs/13_SEGURIDAD.md` a mano para citar hallazgos exactos
- [ ] Un usuario `ADMINISTRADOR` de prueba y credenciales anotadas
- [ ] `npx prisma studio` probado de antemano (a veces tarda en abrir)

## Qué sigue

`18_INFORME_TECNICO.md` consolida todo esto en un documento único de entrega formal.
