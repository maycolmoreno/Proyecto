# Plan de Ejecución — Frontend DonaConnect Ecuador

**Tipo de documento:** igual que `docs/PLAN_IMPLEMENTACION.md` (backend) — tracker vivo de implementación, distinto de `docs/fases/*` (diseño, ya aprobado y congelado). Cualquier desviación real del diseño aprobado se registra en el historial de la fase correspondiente (mismo patrón usado durante todo el backend).

**Fuente:** `docs/fases/fase-01` sección 9 (arquitectura frontend), `fase-04` (contrato de API — ya construido y probado end-to-end), `fase-05` (UX/UI) + el backend real (`backend/`, 5 sprints cerrados) como fuente de verdad de endpoints/DTOs/RBAC.

**Punto de partida:** el scaffold existente (`frontend/src/features/identidad/`) ya cubre registro/login/sesión y establece los patrones a replicar en cada sprint:
- `shared/lib/http-client.ts` — cliente HTTP único, envelope `{data}` ya parseado, token en `sessionStorage`, `ApiError` tipado.
- `features/<dominio>/api/<dominio>.api.ts` — un archivo por módulo, funciones delgadas sobre `httpClient`.
- `features/<dominio>/hooks/use<Acción>.ts` — un hook TanStack Query por acción (`useMutation`/`useQuery`), sin lógica de negocio en componentes.
- `features/<dominio>/types/index.ts` — tipos del módulo (input/output de cada endpoint).
- Path aliases `@features/*`, `@shared/*`, `@app/*` (`vite.config.ts` + `tsconfig.json`, ya configurados).
- CSS plano (`src/index.css`, clases BEM-like `.btn`, `.btn--primario`) — **sin librería de estilos** (no Tailwind/MUI/shadcn), decisión implícita del scaffold que se mantiene salvo que el usuario indique lo contrario.

---

## Secuencia fija por módulo (repetir en cada sprint)

1. **`features/<módulo>/types/`** — tipos de request/response, espejo exacto de los DTOs ya implementados en el backend (Fase 4 + código real).
2. **`features/<módulo>/api/`** — cliente API del módulo, funciones delgadas sobre `httpClient`.
3. **`features/<módulo>/hooks/`** — un hook por acción (query o mutation), sin lógica de negocio en componentes.
4. **`features/<módulo>/components/`** — específicos del dominio (wizards, tablas propias); **antes** de crear un componente nuevo, revisar si ya existe una versión compartida en `shared/components/` (regla de reutilización, Fase 1 sección 9.3 / ADR-045).
5. **`app/pages/`** + ruta en `App.tsx` — conecta el módulo a una URL navegable.
6. **Verificar** — `npm run typecheck && npm run lint && npm run build` (los tres).
7. **Probar en navegador real** (`docker compose up web`, o `npm run dev`) contra el backend real — flujo completo, no solo que compile. Cubrir estados `loading`/`empty`/`error`/`success` (Fase 5 sección 4.1) y al menos un breakpoint mobile y uno desktop.

⚠️ **Nota de alcance:** ningún sprint de este documento incluye pruebas automatizadas de frontend (no hay Vitest/Testing Library instalado todavía) — se decide si se agregan al llegar al Sprint F5 (QA final), igual que el backend decidió su stack de testing "al iniciar la implementación real" (Fase 6 sección 9).

---

## Estado

| Sprint | Módulo | Estado |
|---|---|---|
| F0 | Fundación (shell, design tokens, componentes base, perfil) | ✅ Cerrado (2026-07-08) — verificado visualmente por el usuario |
| F1 | Donaciones + Categorías | ✅ Cerrado (2026-07-09) — verificado por el usuario (publicación con foto, incluye fix de Cloudinary) |
| F2 | Solicitudes + Ofertas + Entregas | ✅ Cerrado (2026-07-10) — verificado por el usuario en navegador |
| F3 | Trueques + Propuestas | ✅ Cerrado (2026-07-10) — verificado end-to-end + confirmado por el usuario en navegador |
| F4 | IA (chatbot + sugerencias) + Administración | ✅ Cerrado (2026-07-10) — verificado end-to-end + confirmado por el usuario (chatbot, sugerencia IA, panel admin) |
| F5 | Mensajería + Notificaciones + Dashboard + QA final | ✅ Cerrado (2026-07-10) — verificado end-to-end + confirmado por el usuario; 3 bugs reales encontrados en la prueba y corregidos (ver sección de correcciones post-cierre) |

---

## Sprint F0 — Fundación (shell, design tokens, componentes base) ✅ Cerrado (2026-07-08)

**Por qué va primero:** todos los sprints siguientes dependen de esto — sin shell no hay dónde montar las páginas nuevas, sin tokens de color no se puede construir `StatusBadge` (usado en los 3 listados desde F1).

**Design tokens (Fase 5, secciones 4.2 y 5):**
- [x] Variables CSS para los 4 colores semánticos de estado (Neutral=azul, En progreso=ámbar, Éxito=verde, Cancelado=rojo) + 3 de urgencia (BAJA/MEDIA/ALTA) — `index.css` `:root`
- [x] Breakpoints aplicados directamente en media queries (320-479 default / 480 / 768 / 1024 / 1440, RNF-007) — CSS no tiene variables usables dentro de `@media`, se documentaron como comentario de referencia en vez de una "constante" real
- [x] `max-width: 480px` global de `body` movido a una clase `.pagina-angosta`, aplicada solo en `LoginPage`/`RegistroPage`; el resto del shell usa ancho completo con grid responsive

**Shell + routing (Fase 5 sección 1, Fase 1 sección 9.1):**
- [x] `shared/components/organisms/Navbar.tsx`, `Sidebar.tsx`, `BottomTabBar.tsx` — sidebar fija ≥1024px, bottom tab bar <768px con 5 ítems + botón "Más" (simplificación del menú hamburguesa de Fase 5: un modal simple en vez de un drawer, mismo componente `Modal`)
- [x] `app/layouts/AppShell.tsx` — única capa que usa `useSesion`/`useCerrarSesion` (BC-Identidad) y se los pasa a Navbar/Sidebar como props simples, para que esos sigan siendo puramente presentacionales (regla de reutilización, Fase 1 sección 9.3); `Navbar` recibe un tipo mínimo `{nombre}` en vez de `UsuarioPublico` de `features/identidad`, para no acoplar `shared/` a un dominio concreto
- [x] `app/layouts/RutaProtegida.tsx` — redirige a `/login` si no hay token; envuelve solo Chatbot/Mensajes/Perfil/Admin (Donaciones/Solicitudes/Trueques/Inicio son públicas, Fase 5 sección 1)
- [x] Rutas nuevas registradas con `PlaceholderPage` genérico: `/donaciones`, `/solicitudes`, `/trueques`, `/chatbot`, `/conversaciones`, `/admin` — `/admin` protegido solo por sesión en F0, el guard de rol ADMINISTRADOR se agrega en F4 junto con el contenido real (ADR-020)

**Componentes base compartidos (Fase 5 sección 3):**
- [x] `StatusBadge` (átomo) — usa función pura `grupoDeEstado()` (`shared/lib/estado-color.ts`, Fase 1 sección 9.2) para mapear los 21 valores de estado documentados en Fase 5 sección 4.2 a uno de 4 grupos de color
- [x] `Avatar`, `TextArea`, `Select` (átomos faltantes)
- [x] `Modal`, `ToastProvider`/`useToast` (organismos) — Toast implementado como Context Provider (no un componente aislado) para poder invocarse desde cualquier hook de mutación en sprints futuros; se monta una vez en `App.tsx`
- [ ] ~~`FormField`~~ — **no se construyó**: el `Input.tsx` ya existente (Sprint 0) ya fusiona label+campo+error en un solo átomo, y `TextArea`/`Select` replican ese mismo patrón; un `FormField` envolvente sería una capa redundante sobre una convención ya establecida por el código real. Desviación de Fase 5 sección 3 documentada aquí.

**Perfil (`/perfil`):**
- [x] `PerfilPage.tsx` — tabs Cuenta/Ubicación con `useSesion`. El tab Ubicación es un mensaje informativo, no un editor: el backend no expone un endpoint de ubicación de perfil editable (Fase 4 solo lista `GET /usuarios/me` para BC-Identidad) — gap real del backend, no una funcionalidad omitida por decisión de frontend.

**Verificación:**
- [x] `npm run typecheck && npm run lint && npm run build` — limpios
- [x] Servidor de desarrollo (`docker compose up web`) sirve los módulos nuevos sin error de compilación de Vite (verificado vía `curl` a `main.tsx`/`App.tsx`, HTTP 200, transformación JSX correcta)
- [x] **Verificación visual en navegador — confirmada por el usuario** (`http://127.0.0.1:5173`): shell, navegación y rutas se ven y funcionan correctamente.
- **Hallazgo operativo:** `http://localhost:5173` puede resolver a un proceso Vite **ajeno** ("practica-props") corriendo nativamente en el host de Windows, escuchando en `[::1]:5173` (IPv6) — compite con el contenedor Docker por el mismo puerto. Usar `http://127.0.0.1:5173` explícitamente evita el conflicto; alternativamente, cerrar ese otro proceso si ya no se usa.

---

## Sprint F1 — Donaciones + Categorías ✅ Código cerrado (2026-07-08)

**DoD:** listar/filtrar donaciones, ver detalle, publicar vía wizard de 5 pasos, cancelar — todo contra el backend real.

**Decisión de diseño no explícita en Fase 5, documentada por trazabilidad:** el backend exige que la Donación ya exista para firmar subida de fotos (`POST /donaciones/:id/imagenes/firma`) y que `ubicacionRetiro` esté completa si `requiereRetiro=true` (regla de negocio #5) — ambas condiciones solo se cumplen al final del wizard, no en el paso 3 ("Fotos") como sugiere el orden visual de Fase 5 sección 2.4. Se resolvió acumulando los archivos seleccionados en memoria durante el paso 3 (preview local vía `URL.createObjectURL`, sin tocar el backend) y subiéndolos recién al confirmar el paso 5: crear la Donación → firmar+subir+registrar cada archivo en cola → navegar al detalle. El componente compartido `ImageUploader` (que sube de inmediato) se reserva para agregar fotos a una publicación ya existente (usado en `DonacionDetallePage`); el wizard usa un selector de archivos local propio para la cola diferida.

**Compartidos nuevos (primera vez que se usan — múltiples dominios los consumirán después):**
- [x] `PublicacionCard` (molécula) — foto + título + `StatusBadge` + ubicación aproximada, recibe todo por props (Fase 5 sección 3: usado por los 3 listados)
- [x] `Stepper` (molécula) — indicador de progreso genérico, máx. 5 pasos (RNF-014)
- [x] `ImageUploader` (molécula) — preview + validación tamaño/tipo antes de firmar subida; recibe `onFirmar`/`onRegistrar` por props (inyección de dependencia) para no acoplarse a ningún dominio concreto
- [x] `LocationPicker` (molécula) — provincia (24 provincias de Ecuador, constante local)/ciudad/sector + geolocalización opcional (IF-HW-002) vía `navigator.geolocation`
- [x] `FiltroPanel` (organismo) — configurable por dominio vía props (`DefinicionFiltro[]`)

**`features/donaciones/`:**
- [x] `types/`, `api/donaciones.api.ts` (listar con filtros+paginación, obtener, crear, actualizar, cancelar, firmar imagen, registrar imagen)
- [x] `hooks/` — `useDonaciones` (listado+filtros), `useDonacion` (detalle), `useCrearDonacion`, `useCancelarDonacion`, `useImagenesDonacion` (expone firmar/registrar para `ImageUploader`)
- [x] `components/DonacionWizard.tsx` — 5 pasos (ver decisión de fotos diferidas arriba); paso 5 con placeholder de sugerencia IA (se conecta en F4)
- [x] `app/pages/DonacionesPage.tsx` (listado + `FiltroPanel` + paginación + botón "Publicar" solo DONANTE/USUARIO_COMUNIDAD), `NuevaDonacionPage.tsx` (wizard, ruta protegida), `DonacionDetallePage.tsx` (dueño ve `ImageUploader`+cancelar con `Modal` de confirmación; no-dueño ve placeholder de mensaje, F5)

**`features/categorias/`:**
- [x] `api/categorias.api.ts` (`GET /categorias?estado=ACTIVA`, público) — consumido por el wizard y `FiltroPanel`, sin página propia

**Verificación:**
- [x] `npm run typecheck && npm run lint && npm run build` — limpios
- [x] Servidor de desarrollo sirve el código nuevo sin error (`curl` a los módulos, HTTP 200)
- [x] **Verificación visual — confirmada por el usuario** (2026-07-10, publicación con foto, incluye fix de Cloudinary).

---

## Sprint F2 — Solicitudes + Ofertas + Entregas ✅ Código cerrado (2026-07-08)

**DoD:** crear solicitud, un donante la acepta con una oferta (un solo paso, ya así en backend), aparece la Entrega y se puede confirmar.

**⚠️ Extensión de backend real, no anticipada por el plan:** ninguna respuesta (`SolicitudResponse`/`DonacionResponse`/`TruequeResponse`) exponía el id de la Entrega asociada — el frontend no tenía forma de descubrirlo para mostrar/confirmar la coordinación. Se agregó `GET /entregas/por-referencia/:idReferencia` al backend (`IEntregaRepository.buscarPorReferencia`, `ObtenerEntregaUseCase.ejecutarPorReferencia`, misma autorización que `GET /entregas/:id`). Detalle completo en `docs/fases/fase-06-backend.md` historial. Verificado end-to-end contra la API real: crear donación → crear solicitud → ofertar (auto-acepta) → el endpoint nuevo devuelve la Entrega real correctamente.

**`features/solicitudes/`:**
- [x] `types/`, `api/solicitudes.api.ts` (listar, obtener, crear, crear oferta, rechazar oferta)
- [x] `hooks/` — `useSolicitudes`, `useSolicitud`, `useCrearSolicitud`, `useCrearOferta`, `useRechazarOferta`
- [x] `components/SolicitudWizard.tsx` — 5 pasos (más simple que `DonacionWizard`: la evidencia es solo una URL, no requiere subida, así que no hay problema de secuencia — se crea todo en el paso 5)
- [x] Vista de ofertas dentro del detalle (ya vienen filtradas por visibilidad desde el backend, ADR-019) + formulario "Aceptar y ofrecer" para donante viendo una solicitud ajena (lista sus propias donaciones publicadas de la misma categoría, filtradas client-side por `donanteId`) + botón "Rechazar" para el dueño sobre una oferta `ACEPTADA` (RF-010: no hay "aceptar" independiente, la oferta ya nace aceptada en un solo paso — `PATCH .../ofertas/:ofertaId` sin body siempre rechaza)
- [x] `app/pages/SolicitudesPage.tsx`, `NuevaSolicitudPage.tsx`, `SolicitudDetallePage.tsx`

**`features/entregas/`:**
- [x] `types/`, `api/entregas.api.ts` (`obtenerPorReferencia` — traduce un `404` a `null`, es un resultado válido cuando aún no hay oferta/propuesta aceptada, no un error; `actualizar` para confirmar/cancelar)
- [x] `hooks/useEntregaPorReferencia`, `useActualizarEntrega`
- [x] `components/CoordinacionEntrega.tsx` — específico de `features/entregas` (usa sus propios hooks), embebido retroactivamente también en `DonacionDetallePage` (F1) además de `SolicitudDetallePage` (F2); recibe `idReferencia` (el id de la Donación o el Trueque origen, **no** el id de la Solicitud) por prop

**Verificación:**
- [x] `npm run typecheck && npm run lint && npm run build` — limpios
- [x] Backend: typecheck/lint limpios tras la extensión; contenedor `api` reiniciado y probado
- [x] Frontend: contenedor `web` reiniciado, servidor sirve el código nuevo sin error
- [x] **Verificación visual — confirmada por el usuario** (2026-07-10, probando el flujo real detectó el bug de visibilidad de publicaciones canceladas, corregido en la sección de correcciones post-cierre).

---

## Sprint F3 — Trueques + Propuestas ✅ Código cerrado (2026-07-09)

**DoD:** publicar objeto para trueque, proponer intercambio (NO se auto-acepta), el dueño del origen acepta/rechaza, aparece Entrega. **Cumplido y verificado end-to-end contra la API real** (ver detalle abajo).

**`features/trueques/`:**
- [x] `types/index.ts` — espejo del backend real (`EstadoObjeto`/`EstadoTrueque`/`EstadoPropuesta`, `Trueque`, `Propuesta`, `CrearTruequeInput`, `ProponerTruequeInput`, `ListarTruequesFiltros`). Trueque no modela ubicación (confirmado en `crearTruequeSchema` del backend — a diferencia de Donación/Solicitud).
- [x] `api/trueques.api.ts` — listar, obtener, crear, cancelar (PATCH `{cancelar:true}`, no hay DELETE), proponer, aceptarPropuesta/rechazarPropuesta (PATCH `/trueques/:id/propuestas/:propuestaId`), firmar/registrar imagen.
- [x] `hooks/` — `useTrueques`, `useTrueque`, `useCrearTrueque`, `useCancelarTrueque`, `useProponerTrueque`, `useResponderPropuesta` (expone `{aceptar, rechazar}`, ambas mutaciones invalidan el mismo detalle), `useImagenesTrueque`.
- [x] `components/TruequeWizard.tsx` — mismo patrón de subida diferida que `DonacionWizard` (el Trueque debe existir antes de firmar imágenes). Sin paso de ubicación.
- [x] `app/pages/TruequesPage.tsx`, `TruequeDetallePage.tsx`, `NuevaTruequePage.tsx` + rutas en `App.tsx` (`/trueques`, `/trueques/:id` públicas; `/trueques/nuevo` protegida).

**⚠️ Desviación real del plan, documentada:** el paso 4 del wizard ("¿qué buscas a cambio?", Fase 5 sección 2.4) no tiene campo propio en el backend — `crearTruequeSchema` solo acepta `titulo`/`descripcion`/`categoriaId`/`estadoObjeto`. Se implementó como un `TextArea` opcional cuyo contenido se concatena al final de `descripcion` con un separador visible (`\n\n¿Qué busco a cambio?\n...`) antes de enviarlo al backend. No requiere cambio de backend — es una decisión de UI únicamente.

**Propuestas — vista y flujo, verificado end-to-end (curl contra la API real, dos usuarios reales):**
- [x] El backend ya filtra `propuestasRecibidas` por visibilidad (dueño ve todas, el resto solo la propia) — el frontend solo renderiza lo que llega, sin lógica de filtrado adicional.
- [x] Selector "Proponer intercambio" en `TruequeDetallePage`: lista los trueques `PUBLICADO` del usuario actual (sin restricción de categoría — a diferencia de las ofertas de Solicitud, `ProponerTruequeUseCase` no la exige).
- [x] Dueño del trueque origen ve botones Aceptar/Rechazar por propuesta `PENDIENTE`, y Rechazar (revierte) sobre la `ACEPTADA`.
- [x] Verificado real: crear trueque A (usuario A) → crear trueque B (usuario B) → B propone B contra A → A acepta → `estadoTrueque` de A pasa a `EN_COORDINACION`, propuesta `ACEPTADA`, se crea la Entrega (`tipoOperacion: TRUEQUE`, `idReferencia` = id del trueque **origen**).

**⚠️ Limitación real descubierta y documentada (no bloqueante):** `GET /entregas/por-referencia/:idReferencia` solo resuelve la Entrega cuando `idReferencia` es el trueque **origen** — confirmado con curl: consultar por el id del trueque **ofrecido** devuelve 404, incluso para el propio proponente. Causa: `Trueque` no guarda un back-reference al trueque origen cuando participa como "ofrecido" (`TruequeProps` solo tiene `propuestasRecibidas`, que registra propuestas *sobre sí mismo*, no las que *hizo*) — ver `EntregaAutorizacionService.resolverPartes` y `ResponderPropuestaUseCase` (backend, sin cambios). Agregar esa capacidad exigiría una extensión de backend real (nuevo campo o índice inverso), fuera de alcance de este sprint. **Mitigación en frontend:** `TruequeDetallePage` detecta este caso (`estadoTrueque` en `EN_COORDINACION`/`INTERCAMBIADO` sin ninguna `propuestasRecibidas` en estado `ACEPTADA`) y muestra un mensaje indicando al usuario que revise la coordinación desde el trueque con el que ofertó, en vez de fallar o mostrar datos incorrectos. Verificado con curl que este es exactamente el estado real del trueque ofrecido tras la aceptación.

**Verificación:**
- [x] `npm run typecheck && npm run lint && npm run build` — limpios.
- [x] Contenedor `web` reiniciado.
- [x] End-to-end contra la API real (curl, dos usuarios): registro, login, crear 2 trueques, proponer, aceptar, listar paginado, firmar imagen (Cloudinary) — todos con el status HTTP esperado.
- [x] **Verificación visual — confirmada por el usuario** (2026-07-10).

---

## Sprint F4 — Inteligencia Artificial + Administración ✅ Código cerrado (2026-07-09)

**DoD:** sugerencia de IA aparece y es editable en el paso 5 de los 3 wizards; chatbot responde; admin modera desde el panel. **Cumplido y verificado end-to-end contra la API real** (ver detalle abajo).

**`features/chatbot/`:**
- [x] `types/index.ts`, `api/chatbot.api.ts` (`POST /chatbot/mensajes`, `GET /chatbot/conversaciones/:id`)
- [x] `hooks/useChatbot` — un documento de conversación por usuario en el backend (no por sesión); `sesionId` se genera una vez por pestaña (`crypto.randomUUID()`) y se envía en cada mensaje; `conversacionId` se persiste en `sessionStorage` para restaurar historial entre `ChatWidget` y `/chatbot`.
- [x] `components/ChatWidget.tsx` — ícono flotante embebido en `AppShell` (solo con sesión activa, ya que `POST /chatbot/mensajes` exige `authMiddleware`), con buffer local de mensaje "pendiente" mientras espera la respuesta del servidor (evita jank del refetch de TanStack Query).
- [x] `app/pages/ChatbotPage.tsx` — vista completa en `/chatbot`, reutiliza el mismo hook.
- [x] Verificado real: `POST /chatbot/mensajes` responde con Gemini (~5s), `GET /chatbot/conversaciones/:id` devuelve el historial completo.

**`features/ia/`:**
- [x] `types/index.ts`, `api/ia.api.ts` (`POST /ia/clasificar`, `GET /ia/matching`)
- [x] `hooks/useClasificar`, `useMatches`
- [x] `shared/components/molecules/IASuggestionBox.tsx` — puramente presentacional (no importa `features/ia`, regla de `shared/`); conectado al paso 5 de `DonacionWizard`/`SolicitudWizard`/`TruequeWizard`. Sugerencia editable, nunca autoaplicada (ADR-010): el wizard mapea `categoriaSugerida` (nombre) → `categoriaId` contra su propia lista de categorías al aplicar.
- [x] `components/MatchesSugeridos.tsx` (específico de `features/ia`) — el backend (`MatchingService`) solo devuelve `{candidatoId, score, razon}` sin datos enriquecidos, así que el hook `useMatches` resuelve cada candidato con `useQueries` contra `donacionesApi`/`solicitudesApi`/`truequesApi` (tipo de candidato es el opuesto al de origen, salvo Trueque↔Trueque) y se renderiza con `PublicacionCard` en las 3 páginas de detalle.
- [x] Verificado real: `POST /ia/clasificar` devuelve sugerencia coherente contra Gemini. `GET /ia/matching` devolvió 500 en la verificación por cuota agotada del tier gratuito de Gemini (`gemini-2.5-flash-lite`, límite 20/día) — confirmado por el stack trace, que muestra el flujo llegando correctamente hasta `GeminiAdapter.matchScore` (`MatchingService.buscarCoincidencias` → candidatos resueltos → `Promise.all` de `matchScore`). No es un defecto del código nuevo; es el mismo tipo de limitación de tier gratuito ya documentada en Fase 7 (503/429 transitorios). Backend no traduce este error de proveedor a una respuesta tipada (a diferencia de `IAProviderNoConfiguradoError`) — gap conocido, no bloqueante, fuera de alcance de este sprint.

**`features/administracion/`:**
- [x] `types/index.ts`, `api/administracion.api.ts` (listar usuarios, moderar donación/solicitud/trueque/usuario, obtener reportes)
- [x] `hooks/useUsuariosAdmin`, `useModerarPublicacion`, `useModerarUsuario`, `useReportes`
- [x] `app/pages/AdminPage.tsx` — tabs Usuarios/Publicaciones/Reportes (Fase 5 sección 2.7); Publicaciones tiene un sub-selector Donaciones/Solicitudes/Trueques que reutiliza los hooks ya construidos en F1-F3 (`useDonaciones`/`useSolicitudes`/`useTrueques` sin filtro de estado ya listan todo, incluidas canceladas — confirmado en `PrismaDonacionRepository.listar`, sin filtro por defecto). Guard de rol `ADMINISTRADOR` implementado **dentro** de `AdminPage` (no en `RutaProtegida`, que solo exige sesión) — oculto de la nav principal (ADR-020), enlace agregado en `PerfilPage` solo visible para administradores.

**⚠️ Extensión de backend real, no anticipada por el plan:** no existía ningún endpoint para listar usuarios (`IUsuarioRepository` solo tenía `buscarPorId`/`buscarPorCorreo`/`listarPorRol`, y `listarPorRol` no estaba expuesto por HTTP) — la pestaña "Usuarios" del panel admin no tenía forma de poblarse. Confirmado con el usuario antes de construir (mismo criterio que la extensión de Entrega en F2): se agregó `GET /admin/usuarios` completo — `IUsuarioRepository.listar` (paginado, filtros `rol`/`estado`), `PrismaUsuarioRepository.listar`, `ListarUsuariosUseCase` nuevo (application/administracion, no pasa por `ModeracionService` que está scoped a acciones, no a listar), `AdminController.listarUsuarios`, ruta con `soloAdministrador`. Verificado con curl: 200 con datos reales para admin, 403 para no-admin. Detalle completo en `docs/fases/fase-06-backend.md` historial.

**Verificación:**
- [x] Backend: `npm run typecheck && npm run lint` limpios tras la extensión de `/admin/usuarios`; contenedor `api` reiniciado y probado.
- [x] Frontend: `npm run typecheck && npm run lint && npm run build` limpios; contenedor `web` reiniciado.
- [x] End-to-end contra la API real (curl): chatbot (mensaje + historial), clasificar, moderar trueque, moderar usuario (suspender confirmado con GET posterior), listar usuarios (200 admin / 403 no-admin).
- [x] **Verificación visual — confirmada por el usuario** (2026-07-10): chatbot flotante y "Sugerir con IA" probados y funcionando; panel de administración accedido y usado para crear la cuenta ADMINISTRADOR.

---

## Sprint F5 — Mensajería + Notificaciones + Dashboard + QA final ✅ Código cerrado (2026-07-09)

**DoD:** enviar/leer mensajes, ver notificaciones, Inicio muestra KPIs reales, responsive verificado en los 5 breakpoints de Fase 5 sección 5. **Cumplido y verificado end-to-end contra la API real** (ver detalle abajo); responsive/breakpoints queda como verificación visual pendiente (no automatizable sin navegador).

**⚠️ Extensión de backend real, no anticipada por el plan:** no existía ninguna forma de resolver el *nombre* de otro usuario — solo `GET /usuarios/me` (perfil propio) y `GET /admin/usuarios` (ADMINISTRADOR, Sprint F4). Sin esto, la lista de conversaciones y "Enviar mensaje al publicador" solo podían mostrar un ID crudo. Confirmado con el usuario antes de construir (mismo criterio que las extensiones de F2/F4): se agregó `GET /usuarios/:id`, deliberadamente mínimo — devuelve solo `{id, nombre}`, nunca correo/teléfono/rol/estado, para no exponer datos sensibles a cualquier autenticado que consulte a un desconocido. Nueva `ObtenerUsuarioPublicoUseCase` (application/identidad, reutiliza `UsuarioNoEncontradoError` de `ObtenerPerfilUseCase`), `UsuariosController.obtenerPorId`, ruta declarada **después** de `/usuarios/me` (mismo motivo que `entregas.routes.ts` en F2 — Express por orden de declaración). Verificado con curl: 200 con `{id,nombre}` real, 404 para id inexistente, `/usuarios/me` sigue funcionando sin cambios.

**`features/mensajeria/`:**
- [x] `types/index.ts`, `api/mensajeria.api.ts` (listar conversaciones, listar/enviar mensajes — `:id` de ruta es el OTRO participante, no un id de conversación; un 404 de `listarMensajes` es "aún no hay conversación", traducido a `null` como en `entregasApi.obtenerPorReferencia`, F2)
- [x] `hooks/useConversaciones`, `useConversacion`, `useEnviarMensaje`
- [x] `components/ConversationThread.tsx` (organismo específico, reutiliza el patrón de buffer "pendiente" de `ChatWidget` para evitar jank) + `features/identidad/hooks/useUsuarioPublico.ts` (nuevo, consume la extensión de arriba) para resolver el nombre del otro participante
- [x] "Enviar mensaje al publicador" real (antes placeholder "disponible en un sprint próximo") en `DonacionDetallePage`/`SolicitudDetallePage`/`TruequeDetallePage`, gateado a `sesion.data` (visible solo logueado)
- [x] `app/pages/ConversacionesPage.tsx` — layout lista+hilo, responsive (columna en mobile, dos columnas ≥768px)
- [x] **Decisión F3 resuelta:** `CoordinacionEntrega` ahora expone `fechaProgramada` (input `datetime-local`, ya existía en el dominio pero no en la UI) y un enlace "💬 Coordinar por mensaje" vía nuevo prop opcional `otroParticipanteId` — opcional porque no siempre es resoluble sin ambigüedad (ej. el donante de una Donación no puede saber quién aceptó sin una consulta adicional; documentado inline en cada Detalle page qué lado sí puede resolverlo y cuál no).

**`features/notificaciones/`:**
- [x] `types/index.ts`, `api/notificaciones.api.ts` (listar, marcar leído)
- [x] `hooks/useNotificaciones` (polling 30s, sin WebSockets en el proyecto; `enabled` para no golpear el endpoint sin sesión), `useMarcarLeido`
- [x] Campana en `Navbar` con contador de no leídas + `PanelNotificaciones` (organismo de `features/notificaciones`, montado por `AppShell` — mismo criterio de composition root que `ChatWidget`) — `Navbar` se mantiene puramente presentacional (recibe `contadorNotificaciones`/`onClickCampana` por props, no importa `features/*`)

**`features/dashboard/`:**
- [x] `types/index.ts`, `api/dashboard.api.ts` (`GET /dashboard/impacto`)
- [x] `hooks/useDashboard`
- [x] `components/DashboardStatTile.tsx` (organismo específico) — 4 tarjetas integradas en `HomePage` (Fase 5 sección 2.2, sin ítem de nav aparte, ADR-020): objetos reutilizados (ODS 12, derivado client-side de `donaciones.entregadas + trueques.intercambiados` — no es un campo propio del backend), donaciones publicadas, solicitudes atendidas, trueques intercambiados

**Verificación:**
- [x] Backend: `npm run typecheck && npm run lint` limpios tras la extensión de `/usuarios/:id`; contenedor `api` reiniciado y probado (nota operativa: Docker Desktop se cerró solo a mitad de sesión — reiniciado manualmente, los 5 contenedores volvieron arriba automáticamente).
- [x] Frontend: `npm run typecheck && npm run lint && npm run build` limpios; contenedor `web` reiniciado.
- [x] End-to-end contra la API real (curl): enviar mensaje (crea conversación implícita), listar conversaciones, obtener hilo con un participante (200) y con uno sin conversación previa (404 correcto), listar notificaciones, marcar leída (204, confirmado con GET posterior), `GET /dashboard/impacto` con conteos reales no triviales (13 donaciones publicadas, 2 trueques intercambiados, etc.).
- [x] **Verificación visual funcional — confirmada por el usuario** (2026-07-10): mensajería, notificaciones y dashboard probados en flujo real (los bugs de polling/navegación reportados en esta sesión salieron de esta prueba). Los 5 breakpoints específicos y la accesibilidad táctil ≥44×44px no se verificaron uno por uno — quedan como QA fino pendiente, no bloqueante.
- [ ] Testing automatizado de frontend (Vitest + Testing Library): **no agregado** — se documenta como fuera de alcance del MVP académico, mismo criterio que el backend aplicó en Sprint 0 antes de decidir su stack real en Sprint 5.

---

## Correcciones post-cierre (2026-07-10) — reportadas por el usuario tras probar F0-F5 en navegador

**1. Publicaciones canceladas visibles en el listado público (comportamiento de marketplace).** El usuario esperaba que, al cancelar/bloquear una Donación/Solicitud/Trueque desde el panel admin, dejara de aparecer en el listado público — como en cualquier marketplace real (Mercado Libre, eBay). Investigación: no había ningún filtro, ni en backend ni en frontend, que ocultara `CANCELADA`/`CANCELADO` — technically ya eran visibles y se mezclaban con las activas. Fix: `ListarDonacionesUseCase`/`ListarSolicitudesUseCase`/`ListarTruequesUseCase` ahora excluyen el estado cancelado por defecto **solo cuando no se filtra explícitamente por estado y el solicitante no es ADMINISTRADOR** (nuevo campo `estadoExcluido` en `DonacionFiltros`/`SolicitudFiltros`/`TruequeFiltros`, traducido a `{ not: ... }` en el `where` de Prisma). El panel de Administración (`AdminPage` → pestaña Publicaciones) sigue viendo todo porque su token trae `rol=ADMINISTRADOR`. `donaciones.controller.ts` no pasaba `solicitante` a su caso de uso de listar (a diferencia de Solicitudes/Trueques, que ya lo hacían) — corregido también. La vista de detalle (`GET /:id`) sigue siendo accesible por URL directa mostrando el badge "Cancelada" (no se oculta, solo el listado). Verificado con curl: donación visible antes de cancelar → invisible en listado sin filtro tras cancelar → visible de nuevo con `?estado=CANCELADA` explícito → visible para admin sin filtro → detalle accesible por id.

**2. Mensajes nuevos no aparecían sin recargar la página.** `useConversacion`/`useConversaciones` no tenían ningún mecanismo de actualización automática — solo se refrescaban cuando el propio usuario enviaba un mensaje (invalidación de su propia mutación). Si el otro participante escribía, nada lo reflejaba del lado del primero. Fix: mismo patrón de polling ya usado en `useNotificaciones` — `refetchInterval: 5000` en `useConversacion` (hilo abierto, más frecuente porque un chat activo necesita sentirse inmediato) y `refetchInterval: 15000` en `useConversaciones` (lista).

**3. Las notificaciones no llevaban a ningún lado al hacer click (solo "marcar leída").** `Notificacion.entidadRelacionada` existía pero `PanelNotificaciones` nunca lo usaba para navegar. Investigación más profunda reveló dos problemas reales, no solo uno: (a) el tipo de entidad (`DONACION`/`SOLICITUD`/`TRUEQUE`) nunca se persistía junto al id — ambiguo para `PublicacionModerada`/`RiesgoDetectado`, que pueden referirse a cualquiera de los 3 dominios; (b) **bug real preexistente, no reportado por el usuario pero encontrado al investigar**: `EntregaProgramada`/`EntregaConfirmada` emitían el id de la propia Entrega en vez de `idReferencia` (el id de la Donación/Trueque origen) — como `NotificacionDispatchService.resolverPartesOrigen` esperaba `idReferencia`, la búsqueda de partes involucradas siempre fallaba en silencio y **estas dos notificaciones nunca se generaron para ningún usuario desde que se construyeron en Sprint 5** (el `.catch(() => undefined)` de `notificar()` ocultaba el fallo). Fix: `EntregaCoordinacionService.crear` y `ActualizarEntregaUseCase.ejecutar` ahora incluyen `idReferencia` en el payload del evento; `NotificacionDispatchService.notificar()`/`notificarConCorreo()` ganan un parámetro `entidadTipo` persistido en cada notificación (`INotificacionRepository`, modelo Mongoose, campo nuevo con `default: null` — no rompe documentos viejos). Frontend: `PanelNotificaciones` mapea `entidadTipo` → ruta (`DONACION`→`/donaciones/:id`, etc.) y envuelve cada item en un `<Link>` cuando es resoluble; el click también marca como leída. Verificado con curl real: notificación `DonacionPublicada` con `entidadTipo:"DONACION"` correcto, y — la prueba clave — un flujo completo de oferta-aceptada generó por primera vez notificaciones `EntregaProgramada` reales para ambas partes con el `entidadRelacionada` correcto (el id de la Donación, no el de la Entrega).

**Verificación:** `npm run typecheck && npm run lint` limpios en backend; `npm run typecheck && npm run lint && npm run build` limpios en frontend; ambos contenedores (`api`, `web`) reiniciados; los 3 fixes verificados end-to-end contra la API real con datos de prueba nuevos (no solo lectura de datos viejos).

---

## Rediseño visual — dirección "marketplace" (2026-07-10)

El usuario pidió una interfaz más enfocada a marketplace (referencia: Mercado Libre/OLX — tarjetas grandes con foto protagonista, colores vivos, denso en información). Se presentó una vista previa (Artifact HTML) con la propuesta antes de tocar la app real; aprobada sin cambios.

**Tokens de diseño (`frontend/src/index.css`):**
- Paleta nueva: terracota cálido `#e85d2f` (primario) + verde jade `#1f6f5c` (secundario, conecta con el indicador ODS 12 del dashboard) + dorado `#ffc93c` (acento) sobre fondo marfil cálido `#fbf6ef` (no blanco frío de e-commerce genérico) — deliberadamente distinta de los colores de marca reales de Mercado Libre (azul/amarillo), para no ser una copia literal, manteniendo la densidad/funcionalidad de ese estilo.
- Tipografía: Sora (display, `h1`-`h3`, marca del Navbar) + Inter (todo lo demás) — autohospedadas vía `@fontsource/sora` y `@fontsource/inter` (npm, no Google Fonts por CDN), importadas en `main.tsx` con solo los pesos usados.
- `--radius-base` sube de 6px a 10px; nuevo `--radius-tarjeta: 14px` específico para `PublicacionCard`.

**Elemento de firma:** el `StatusBadge` dentro de `PublicacionCard` se renderiza como una "etiqueta de mercado" (forma de banderín con `clip-path`, muesca redonda, sombra) superpuesta sobre la foto — no como píldora debajo del título como antes. Fuera de las tarjetas (detalle, tablas de administración) `StatusBadge` sigue siendo una píldora normal; el cambio de forma ocurre solo por contexto CSS (`.publicacion-card__etiqueta .badge`), sin nueva prop en el componente.

**Filtro de categoría como chips:** `FiltroPanel` gana una `variante: 'chips'` opcional por definición de filtro (`DonacionesPage`/`SolicitudesPage`/`TruequesPage` la usan para `categoriaId`, fila horizontal desplazable de píldoras en vez de `<select>`) — el resto de filtros (estado, urgencia) se quedan como `<select>`.

**Verificación:** `npm run typecheck && npm run lint && npm run build` limpios. Cambio de dependencias (`@fontsource/*`) — contenedor `web` reconstruido con `docker compose build web && docker compose up -d --renew-anon-volumes web` (no alcanza con `restart`, `node_modules` vive en volumen anónimo separado del bind mount).
- [x] **Verificación visual — confirmada por el usuario** (2026-07-10): "esta bien", dirección aprobada sin cambios.

---

## Fuera del alcance de este documento

- **Backend:** ya completo (`docs/PLAN_IMPLEMENTACION.md`, 5 sprints cerrados) — este documento solo consume su API.
- **n8n** — removido del proyecto por completo (2026-07-10, ADR-047 en `docs/DECISIONES.md`, decisión explícita del usuario). Ya no existe canal de correo; solo notificaciones in-app. Ver `docs/fases/fase-08-automatizaciones.md` (marcada como removida).
- **Diseño visual de alta fidelidad** (paleta exacta con contraste verificado, tipografía, iconografía) — Fase 5 lo deja explícitamente para el momento de implementar ("Los tonos exactos... se definen al implementar en Fase 6, no en esta fase de especificación"); se resuelven decisiones puntuales de esta naturaleza sprint a sprint, documentando cualquier elección no trivial.
