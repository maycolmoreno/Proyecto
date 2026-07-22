# 20 — Banco de Preguntas para Defensa — DonaConnect Ecuador

80 preguntas con respuesta corta argumentada. Cada respuesta remite al documento con la evidencia completa — memorizar la referencia, no solo la respuesta, para poder profundizar si el docente repregunta.

---

## Proyecto y ODS (1-5)

1. **¿Qué problema social resuelve DonaConnect?** Conecta donantes, personas con necesidades y comunidad para donaciones, solicitudes de ayuda y trueque, sin intermediar dinero — apunta a ODS 1 (pobreza), 10 (desigualdad), 12 (consumo responsable).
2. **¿Por qué no incluye pagos electrónicos?** Fuera de alcance explícito del SRS — el objetivo es redistribuir bienes/ayuda, no ser un marketplace comercial; incluir pagos añadiría regulación financiera fuera del alcance académico.
3. **¿El sistema certifica la condición socioeconómica de los beneficiarios?** No, explícitamente — es información declarativa, con disclaimer obligatorio (regla de negocio #9, Fase 0).
4. **¿Qué son los "perfiles funcionales" y por qué reemplazaron al modelo de roles?** `PerfilFuncional` (DONANTE/SOLICITANTE/TRUEQUE) es la capacidad de marketplace, separada del `Rol` de seguridad — un usuario puede tener 0 a 3 a la vez. Antes, un solo campo `rol` no podía representar "Donante + Solicitante" sin un enum combinatorio (`02_TRAZABILIDAD_SRS_CODIGO.md` fila ADR-048).
5. **¿Qué porcentaje de los 16 casos de uso está implementado?** 13 completos, 3 con matices documentados (CU-004 asimétrico, CU-006/CU-012 "de forma distinta") — ver la matriz completa en `02_TRAZABILIDAD_SRS_CODIGO.md §1`.

## Requisitos (6-10)

6. **¿Qué es RNF-011 y cómo se cumple?** Ubicación exacta no se muestra públicamente sin autorización — implementado a nivel de DTO (`Donacion.toJSON({incluirUbicacionExacta})`), con el matiz real de revelación puntual documentado en `13_SEGURIDAD.md §3`.
7. **¿Qué invariantes de negocio no estaban en el SRS y quién las definió?** ADR-011: una oferta/propuesta activa a la vez por solicitud/trueque, 3 niveles de urgencia — confirmadas directamente por el usuario (Product Owner) ante ambigüedad real del SRS.
8. **¿Por qué se agregaron 4 casos de uso nuevos (CU-013 a CU-016)?** El SRS mapeaba mal RF-014 a RF-020 en su matriz de trazabilidad original (ADR-005) — se corrigió y se formalizaron como casos de uso propios.
9. **¿Qué es RNF-002 y dónde se ve aplicado?** Disponibilidad — ningún fallo de un servicio externo (IA, Cloudinary) debe tumbar el resto de la API; verificado en `IAProviderNoConfiguradoError`/`CloudinaryNoConfiguradoError` → `503` puntual, nunca `500` global.
10. **¿Qué requisito de retención de datos exige el proyecto y cómo se cumple?** 2 años en Postgres (dato transaccional, sin borrado automático); en Mongo, TTL de 90 días solo para `eventos_sistema` — el resto sin expiración por valor histórico (ADR-014).

## Arquitectura (11-20)

11. **¿Qué arquitectura usa el backend y por qué combinarlas?** DDD + Clean Architecture + Hexagonal — DDD decide qué modelar, Clean Architecture cómo organizar capas y la regla de dependencia, Hexagonal cómo el núcleo habla con el exterior. No compiten, se combinan (ver `03_ARQUITECTURA.md §2`).
12. **¿Dónde está la lógica de negocio?** En `domain/` (entidades con sus métodos de transición) y `application/` (casos de uso que orquestan) — nunca en controllers ni repositorios.
13. **¿Cómo se comunican las capas?** Siempre a través de interfaces (puertos) — `application` nunca importa una clase concreta de `adapters`, solo tipos de `domain`.
14. **¿Qué pasaría si se elimina la capa `adapters`?** Los casos de uso compilarían (las interfaces siguen en `domain`) pero no habría forma de correr la aplicación — es la capa que conecta el dominio con el mundo real.
15. **¿Por qué "layer-first" (capas al tope) y no "module-first" (módulo con sus propias subcarpetas)?** Decisión explícita del usuario tras revisar el código de Sprint 0 (ADR-046) — con capas al tope, la arquitectura es visible de inmediato al abrir el proyecto.
16. **¿Qué es el composition root y por qué solo hay uno?** `main/di-container.ts` — único archivo que conoce las 4 capas y decide qué adaptador concreto va en cada puerto; centralizar el cableado evita que la decisión de "qué implementación usar" se disperse por el código.
17. **¿Por qué no microservicios?** Monolito modular — microservicios exigirían orquestación y comunicación de red que no se justifica para un MVP académico de 6 semanas en `localhost` (ADR-007).
18. **¿Qué se sacrifica al no usar microservicios?** Escalado y despliegue independientes por módulo — no son requisitos reales aquí.
19. **Dame una prueba concreta de que la arquitectura hexagonal no es solo teoría en este proyecto.** El cambio de proveedor de IA de Claude a Gemini fue una línea en `di-container.ts` — ningún caso de uso se tocó, porque ambos adaptadores implementan el mismo puerto `IIAProvider`.
20. **¿Dónde se rompe un poco la arquitectura?** `error-handler.middleware.ts` importa una clase de error desde `ClaudeAdapter.ts` (el adaptador no cableado) en vez del puerto directamente — funciona por una re-exportación, pero es acoplamiento residual (`03_ARQUITECTURA.md §1.2`).

## Backend / Node.js / TypeScript (21-30)

21. **¿Por qué TypeScript y no JavaScript plano?** El SRS solo exige Node+Express; TypeScript combina con Prisma para tipado end-to-end, reduce errores de integración en un plazo corto (ADR-021).
22. **¿Qué es `noUncheckedIndexedAccess` y por qué está activado?** Fuerza a tratar cualquier acceso indexado (incluidos `req.params`) como posiblemente `undefined` — explica el uso de `!` en `req.params.id!` en todos los controllers (aserción deliberada, no descuido).
23. **¿Por qué Zod y no otra librería de validación?** Reutiliza los tipos TS inferidos, se integra naturalmente con TypeScript sin duplicar definiciones (ADR-022).
24. **¿Qué hace `tsc-alias` y por qué es necesario?** Reescribe los path aliases (`@domain/*`) a rutas relativas reales tras compilar — sin él, Node no sabría resolver esos imports en el build de producción.
25. **¿Por qué el proyecto usa arrow functions como propiedades de clase en los controllers, en vez de métodos tradicionales?** Fija el valor de `this` automáticamente por closure — evita el bug clásico de perder el contexto `this` cuando Express invoca el método como callback suelto (`05_EXPLICACION_CODIGO.md §4`).
26. **¿Qué es un Value Object y dónde se usa?** Objeto inmutable definido por su valor, sin identidad propia — `Rol`, `PerfilFuncional`, `Urgencia`, todos los enums de estado.
27. **¿Por qué los constructores de las entidades son privados?** Fuerza a que la única forma de crear una instancia sea vía `crear()`/`reconstituir()` — invariantes garantizadas desde el nacimiento del objeto.
28. **¿Qué diferencia hay entre `crear()` y `reconstituir()` en una entidad?** `crear()` valida invariantes de creación y fija valores por defecto (estado inicial, fecha actual); `reconstituir()` reconstruye desde datos que ya existen en BD, sin repetir esas validaciones.
29. **¿Cómo maneja el proyecto los errores de dominio vs. errores técnicos?** Clases de error específicas por regla de negocio (`DonacionYaFinalizadaError`, etc.), todas mapeadas explícitamente en `error-handler.middleware.ts` a un código HTTP — cualquier error no reconocido cae a `500` genérico.
30. **¿Qué pasa si Zod recibe un body inválido?** Lanza `ZodError`, capturado por el `catch` del controller, delegado a `next(error)`, mapeado a `400 VALIDATION_ERROR` con `err.flatten()` como detalle.

## Frontend (31-38)

31. **¿Por qué React y no otro framework?** No documentado con alternativas explícitas en ningún ADR — es el estándar de facto, coherente con TypeScript end-to-end.
32. **¿Por qué TanStack Query y no Redux/Zustand?** Casi todo el estado de la app es estado de servidor (datos del API) — TanStack Query ya resuelve cache/invalidación/refetch mejor que una store manual; el estado verdaderamente local no necesita una librería global (ADR-043).
33. **¿Cómo protege el frontend las rutas privadas?** `RutaProtegida` solo exige sesión (token presente) — no valida rol ni perfil; eso es solo UX, la autorización real vive en el backend.
34. **¿El menú de navegación cambia según el rol del usuario?** No — decisión explícita, los 7 ítems son iguales para cualquier autenticado; solo los *botones de acción* dentro de cada página se condicionan por perfil.
35. **¿Qué pasa si el chatbot falla?** Nada visible — es el único flujo sin manejo de error en todo el frontend (`14_FRONTEND_Y_ROLES.md §5`), hallazgo real de esta auditoría.
36. **¿Qué regla decide si un componente va en `shared/` o en `features/<dominio>/`?** Vive en `shared/` solo si recibe todo por props y no importa hooks/API de ningún dominio (ADR-045).
37. **¿Cómo sube imágenes el frontend sin pasar por el backend?** Pide una firma al backend (`POST .../imagenes/firma`), sube el binario directo a Cloudinary con esa firma, y recién entonces registra la URL resultante en el backend.
38. **¿Por qué Solicitudes no tiene el mismo flujo de imágenes que Donaciones/Trueques?** No hay una explicación documentada — es una asimetría real encontrada en esta auditoría (`02_TRAZABILIDAD_SRS_CODIGO.md` CU-004), Solicitud usa un campo de texto libre en su lugar.

## API REST (39-45)

39. **¿Por qué versionar la API con `/api/v1` en la URL y no por cabecera?** Simple, cacheable, no aporta valor adicional versionar por header cuando el único cliente es el propio frontend (ADR-017).
40. **¿Qué envelope usan los listados y por qué?** `{ data, meta: { page, limit, total, totalPages } }` — formato consistente y predecible para el cliente React (ADR-018).
41. **¿Cuántos códigos de error usa la API y cuáles?** 8: `400/401/403/404/409/422/503/500` — el mapeo completo está en `error-handler.middleware.ts`, catalogado en `12_API_ENDPOINTS.md §13`.
42. **¿Por qué `422` para "ya finalizado" y no `409`?** `409` se reserva para conflictos de duplicado (correo ya registrado, oferta duplicada); `422` para "la entidad existe pero la operación es semánticamente inválida en su estado actual" — distinción deliberada.
43. **¿Hay algún endpoint con un diseño de URL inconsistente?** Sí — `POST /conversaciones/:id/mensajes` usa `:id` como destinatario, pero `GET /conversaciones/:id/mensajes` lo usa como id de conversación (decisión documentada en el propio código, no un bug, `12_API_ENDPOINTS.md §7`).
44. **¿Cómo se crea una Entrega? ¿Hay un endpoint `POST /entregas`?** No — se crea automáticamente al aceptar una oferta o propuesta, dentro del mismo caso de uso (síncrono, no vía Event Bus).
45. **¿Qué status code devuelve cancelar una donación?** `204 No Content` — sin cuerpo, por convención HTTP para una operación exitosa sin nada que devolver.

## PostgreSQL (46-52)

46. **¿Por qué UUID y no enteros autoincrementales?** Evita enumeración de recursos por la API (`/donaciones/1`, `/donaciones/2`) — mitiga Broken Access Control, relevante porque hay datos de ubicación sensibles (ADR-013).
47. **¿Cómo se modelan las referencias polimórficas sin FK nativa?** `imagenes.tipoEntidad`+`idEntidad`, `entregas.tipoOperacion`+`idReferencia` — Postgres no soporta FK polimórfica; se valida en la capa de aplicación, documentado como trade-off consciente (ADR-015).
48. **¿Qué invariante de unicidad tiene `usuarios_perfiles`?** `@@unique([usuarioId, perfil])` — un usuario no puede tener el mismo perfil duplicado.
49. **¿Todos los valores del enum `EstadoDonacion` se usan en código?** No — solo 3 de 6 (`PUBLICADA`, `ENTREGADA`, `CANCELADA`); `SOLICITADA`/`APROBADA`/`EN_RETIRO` son remanentes de Fase 3 nunca cableados.
50. **¿Cómo se migró el enum `Rol` de 4 a 2 valores sin romper datos existentes?** Patrón *expand-and-contract* — columna temporal + `CASE` explícito + rename, no un cast directo (que rompería con filas de valores a eliminar). 23 usuarios reales migrados sin incidentes.
51. **¿Por qué Prisma y no otro ORM?** Migraciones versionadas + tipado fuerte, útil para las FK exigidas por el modelo relacional en un plazo corto (ADR-008).
52. **¿Dónde vive la lógica de auditoría y qué se audita?** Tabla `auditoria` + `audit.middleware.ts` — 6 acciones (`CREAR/APROBAR/CANCELAR/BLOQUEAR/ELIMINAR/LOGIN_FALLIDO`), 10 de ~38 endpoints cubiertos.

## MongoDB (53-58)

53. **¿Por qué Mongoose y no el driver nativo de MongoDB?** Estándar de facto en Node.js, mencionado explícitamente en el SRS.
54. **¿Qué colecciones tienen TTL y cuál es el valor?** Solo `eventos_sistema`, 90 días — el resto no expira por tener valor histórico (mejorar clasificación/matching, ADR-014).
55. **¿Por qué mensajería/notificaciones están en Mongo y no en Postgres?** Son datos conversacionales/append-only, sin máquina de estado ni invariante de integridad estricta — perder un mensaje no corrompe el negocio, a diferencia de una fila de `donaciones` (ADR-012).
56. **¿Qué pasa si una escritura Postgres se confirma pero la reacción Mongo falla?** El estado de negocio ya quedó correcto (Postgres no depende de Mongo); en el peor caso falta una notificación o el índice de "mis publicaciones" queda desactualizado — nunca se corrompe una máquina de estado real (`10_POSTGRESQL_Y_MONGODB.md §6`).
57. **¿Existe algún campo en Mongo que nunca se usa?** Sí — `mensajes.entregaIdReferencia`, siempre `null`, preparado para una funcionalidad nunca completada.
58. **¿Cuántas colecciones Mongo hay realmente, y coincide con la documentación previa del proyecto?** 6 — un documento de auditoría anterior (`AUDITORIA_FUNCIONAL_MARKETPLACE.md`, 2026-07-10) decía 5, porque `publicaciones_index` es código nuevo posterior a ese documento.

## Docker (59-64)

59. **¿Por qué Docker si el proyecto corre en localhost?** Localhost es el *lugar de acceso*, no la *forma de ejecución* — Docker da consistencia (mismas versiones exactas de Postgres/Mongo/Node en cualquier máquina) y reproducibilidad (`docker compose up` sin instalar nada manualmente) (`09_DOCKER.md §6`).
60. **¿Qué pasa con `docker compose down -v`?** Elimina también los volúmenes nombrados — próximo `up` arranca con bases de datos vacías (el esquema se recrea solo vía `migrate deploy` en el entrypoint del backend, pero los datos se pierden).
61. **¿Por qué el puerto de Postgres está remapeado a 5433?** Para no chocar con un PostgreSQL nativo que el desarrollador pudiera tener corriendo en el 5432 de su máquina — dentro de la red Docker, sigue siendo 5432.
62. **¿Por qué el `Dockerfile` del backend corre `prisma generate` y `migrate deploy` en cada arranque, no solo en el build?** Porque `node_modules` vive en un volumen anónimo separado del bind mount del código — un cambio de `schema.prisma` en el host no se refleja en el cliente generado hasta que algo lo regenera.
63. **¿El frontend tiene un build de producción en Docker?** No — corre el dev server de Vite directamente, coherente con que el entorno objetivo es `localhost` (ADR-000); sería el siguiente paso si el alcance creciera.
64. **¿Hay algún problema real con los Dockerfiles?** Sí — ninguno copia `package-lock.json` antes de `npm install`, así que esa capa no usa versiones exactas pineadas ni `npm ci` (`17_DEUDA_TECNICA.md #20`).

## Inteligencia Artificial (65-72)

65. **¿Qué proveedor de IA usa el proyecto realmente?** Google Gemini (`@google/genai`) — el diseño original (ADR-024) eligió Claude/Anthropic, pero se cambió por acceso a una API key gratuita; ambos adaptadores coexisten en el código, implementando el mismo puerto.
66. **¿Cómo se garantiza que la IA nunca sugiera una categoría inexistente?** El `enum` del JSON Schema para clasificación se construye en vivo desde las categorías `ACTIVA` reales de Postgres, no una lista hardcodeada.
67. **¿Qué pasa si Gemini no responde o la key no está configurada?** `503 SERVICE_UNAVAILABLE` puntual en esa llamada — el resto de la API sigue funcionando (RNF-002).
68. **¿La IA decide algo por sí misma?** No — human-in-the-loop explícito (ADR-010/027): clasificación y matching son sugerencias, moderación solo marca riesgo, nunca bloquea ni elimina automáticamente.
69. **¿Cómo se controla el costo de usar Gemini?** Modelos diferenciados por tarea (el más barato para clasificación/matching/moderación, el mejor solo para el chatbot) y `maxOutputTokens` acotado — pero **sin rate limiting**, así que no hay control real de *frecuencia* de llamadas (`13_SEGURIDAD.md §6`).
70. **¿Qué riesgo de seguridad tiene la integración de IA?** Prompt injection — el texto de usuario se interpola directo en el prompt sin delimitador defensivo; mitigado parcialmente porque la salida está constreñida a JSON Schema (`13_SEGURIDAD.md §5`).
71. **¿Cómo se maneja el historial del chatbot?** Un documento Mongo por usuario, acotado a los últimos 15 mensajes al armar cada prompt — el historial completo se persiste igual, solo se recorta lo que se envía al modelo.
72. **¿Por qué no se usó RAG para el chatbot?** El corpus de conocimiento es pequeño y estático — se embebe directo en el `systemInstruction`, RAG agregaría infraestructura sin beneficio real a esta escala (ADR-026).

## Seguridad (73-78)

73. **¿Cómo se hashean las contraseñas?** bcrypt, 10 rondas de sal — nunca texto plano ni reversible.
74. **¿Por qué JWT en `sessionStorage` y no cookies httpOnly?** Trade-off documentado (ADR-032) — cookies httpOnly+CSRF es más seguro en teoría, pero reabriría una fase de diseño ya cerrada; se mitiga el riesgo de XSS con CSP (Helmet), expiración corta (8h) y `sessionStorage` en vez de `localStorage`.
75. **¿Cuál es el hallazgo de seguridad más importante de esta auditoría?** Rate limiting documentado (ADR-034) que no existe en código — sin fricción real contra fuerza bruta en login, sin control de costo de IA (`13_SEGURIDAD.md §6`, prioridad Alta en `17_DEUDA_TECNICA.md`).
76. **¿Cómo se protege la ubicación exacta de un usuario?** Oculta por defecto en endpoints públicos, visible solo al dueño/admin, con una revelación puntual adicional al donante en el momento de aceptar una oferta (ADR-019, matiz real documentado en `13_SEGURIDAD.md §3`).
77. **¿El sistema es vulnerable a inyección SQL o NoSQL?** No se encontró superficie real — Prisma parametriza todas las queries, el único `$queryRaw` es un healthcheck sin interpolación; sin construcción dinámica de queries Mongoose desde input crudo.
78. **¿Qué pasa si el correo no existe en un intento de login?** No se audita (`LOGIN_FALLIDO` requiere un `usuario.id` para `auditoria.id_entidad`, `NOT NULL`) — ambigüedad documentada desde Fase 9, confirmada en esta auditoría (`13_SEGURIDAD.md §8`).

## Escalabilidad y mejoras futuras (79-80+)

79. **¿Qué cambiarías antes de llevar esto a producción real?** En orden: implementar rate limiting (hallazgo #1), resolver la revelación de ubicación exacta de forma persistente en vez de puntual (hallazgo #2), agregar tests de frontend y de los módulos sin cobertura backend (Identidad, Entregas), y decidir formalmente el mecanismo de imágenes para Solicitudes.
80. **¿Qué parte del proyecto está mejor resuelta y por qué la elegirías para explicar en detalle?** La migración Rol↔PerfilFuncional (ADR-048/049) — nació de una auditoría real, se ejecutó con `expand-and-contract` sobre datos reales sin incidentes, y de paso corrigió un hallazgo de seguridad genuino (registro público podía crear administradores).

---

## Preguntas trampa comunes (extra, para no sorprenderse)

- **"¿Por qué no usaron microservicios si hablan tanto de arquitectura?"** — Confundir modularidad (real, por Bounded Context) con distribución física (deliberadamente descartada, ADR-007). Responder distinguiendo ambos conceptos.
- **"Si la arquitectura es tan desacoplada, ¿por qué cambiar de IA fue tan fácil pero cambiar de rol tan difícil (ADR-048)?"** — Porque son cambios de naturaleza distinta: sustituir un adaptador detrás de un puerto ya definido es barato; cambiar el *modelo de dominio* (qué es un Rol) es un cambio de diseño real, no de infraestructura — la arquitectura no vuelve gratis los cambios de negocio, solo los de infraestructura.
- **"¿Está todo probado?"** — No, con evidencia: `16_PRUEBAS.md` documenta exactamente qué sí y qué no, sin exagerar la cobertura real.

---

## Qué sigue

`19_GUION_EXPOSICION.md` organiza una selección de estas preguntas dentro de un guion de presentación de 20 minutos.
