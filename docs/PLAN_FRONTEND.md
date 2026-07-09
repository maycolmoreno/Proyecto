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
| F1 | Donaciones + Categorías | ✅ Código cerrado (2026-07-08) — ⚠️ pendiente de confirmación visual |
| F2 | Solicitudes + Ofertas + Entregas | ✅ Código cerrado (2026-07-08) — ⚠️ pendiente de confirmación visual |
| F3 | Trueques + Propuestas | ⏳ Pendiente |
| F4 | IA (chatbot + sugerencias) + Administración | ⏳ Pendiente |
| F5 | Mensajería + Notificaciones + Dashboard + QA final | ⏳ Pendiente |

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
- [ ] **Verificación visual — pendiente de confirmación del usuario** (mismo motivo que F0: sin acceso a navegador real).

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
- [ ] **Verificación visual — pendiente de confirmación del usuario.**

---

## Sprint F3 — Trueques + Propuestas

**DoD:** publicar objeto para trueque, proponer intercambio (NO se auto-acepta), el dueño del origen acepta/rechaza, aparece Entrega.

**`features/trueques/`:**
- [ ] `types/`, `api/trueques.api.ts` (listar, obtener, crear, actualizar, proponer, responder propuesta, firmar/registrar imagen)
- [ ] `hooks/` — `useTrueques`, `useTrueque`, `useCrearTrueque`, `useProponerTrueque`, `useResponderPropuesta`
- [ ] `components/TruequeWizard.tsx` — pasos de Fase 5 sección 2.4 (categoría+título → descripción+estado → fotos → "¿qué buscas a cambio?" → revisión+publicar)
- [ ] Vista de propuestas recibidas dentro del detalle (filtradas por proponente si no es el dueño, mismo patrón de visibilidad que ofertas) + acción de aceptar/rechazar
- [ ] `app/pages/TruequesPage.tsx`, `TruequeDetallePage.tsx`

---

## Sprint F4 — Inteligencia Artificial + Administración

**DoD:** sugerencia de IA aparece y es editable en el paso 5 de los 3 wizards; chatbot responde; admin modera desde el panel.

**`features/chatbot/`:**
- [ ] `types/`, `api/chatbot.api.ts` (`POST /chatbot/mensajes`, `GET /chatbot/conversaciones/:id`)
- [ ] `hooks/useChatbot` — mantiene `conversacionId` de la primera respuesta, envía sesionId
- [ ] `components/ChatWidget.tsx` (organismo específico, Fase 5 sección 3) — ícono flotante en todas las páginas (navbar) + vista completa en `/chatbot`
- [ ] `app/pages/ChatbotPage.tsx`

**`features/ia/` (clasificación + matching, sin página propia — se integran en flujos existentes):**
- [ ] `api/ia.api.ts` (`POST /ia/clasificar`, `GET /ia/matching`)
- [ ] `hooks/useClasificar`, `useMatches`
- [ ] `shared/components/molecules/IASuggestionBox.tsx` — sugerencia editable, nunca autoaplicada (ADR-010); se conecta al paso 5 de `DonacionWizard`/`SolicitudWizard`/`TruequeWizard` (pendiente desde F1-F3)
- [ ] Sección "coincidencias sugeridas" en el detalle de publicación (RF-016), usando `PublicacionCard` para mostrar cada match

**`features/administracion/`:**
- [ ] `types/`, `api/administracion.api.ts` (moderar donación/solicitud/trueque/usuario, obtener reportes)
- [ ] `hooks/useModerarPublicacion`, `useModerarUsuario`, `useReportes`
- [ ] `app/pages/AdminPage.tsx` — tabs Usuarios/Publicaciones/Reportes (Fase 5 sección 2.7), tabla con acciones Aprobar/Bloquear, solo visible/accesible a ADMINISTRADOR (oculto de la nav principal, ADR-020, acceso vía menú de perfil)

---

## Sprint F5 — Mensajería + Notificaciones + Dashboard + QA final

**DoD:** enviar/leer mensajes, ver notificaciones, Inicio muestra KPIs reales, responsive verificado en los 5 breakpoints de Fase 5 sección 5.

**`features/mensajeria/`:**
- [ ] `types/`, `api/mensajeria.api.ts` (listar conversaciones, listar/enviar mensajes — recordar: `:id` de ruta es el otro participante, no un id de conversación, ver `fase-06-backend.md` historial Sprint 5)
- [ ] `hooks/useConversaciones`, `useConversacion`, `useEnviarMensaje`
- [ ] `components/ConversationThread.tsx` (organismo específico) + botón "Enviar mensaje al publicador" en el detalle de cada publicación (Fase 5 sección 2.5)
- [ ] `app/pages/ConversacionesPage.tsx`

**`features/notificaciones/`:**
- [ ] `types/`, `api/notificaciones.api.ts` (listar, marcar leído)
- [ ] `hooks/useNotificaciones`, `useMarcarLeido`
- [ ] Ícono de campana en `Navbar` con contador de no leídas + panel desplegable

**`features/dashboard/`:**
- [ ] `types/`, `api/dashboard.api.ts` (`GET /dashboard/impacto`)
- [ ] `hooks/useDashboard`
- [ ] `components/DashboardStatTile.tsx` (organismo específico) — tarjetas de KPI integradas en `HomePage` (Fase 5 sección 2.2, no un ítem de nav aparte — ADR-020), incluye "objetos reutilizados" como indicador ODS 12

**QA / Cierre:**
- [ ] Verificar los 5 breakpoints de Fase 5 sección 5 en cada pantalla nueva (mobile pequeño/grande, tablet, desktop, desktop ancho)
- [ ] Verificar estados `loading`/`empty`/`error` en cada listado (no solo `success` — Fase 5 sección 4.1)
- [ ] Accesibilidad: objetivo táctil ≥44×44px, `StatusBadge` nunca solo color, labels visibles siempre (RNF-008)
- [ ] Confirmar `docker compose up web` sin intervención manual (ya debería funcionar — verificar igual que se hizo con `api` en el backend)
- [ ] Decidir si se agrega testing automatizado de frontend (Vitest + Testing Library) o se documenta como fuera de alcance del MVP académico

---

## Fuera del alcance de este documento

- **Backend:** ya completo (`docs/PLAN_IMPLEMENTACION.md`, 5 sprints cerrados) — este documento solo consume su API.
- **Configuración del workflow de n8n** (UI de n8n, correo) — pendiente, documentado en `docs/fases/fase-08-automatizaciones.md`, no es trabajo de frontend.
- **Diseño visual de alta fidelidad** (paleta exacta con contraste verificado, tipografía, iconografía) — Fase 5 lo deja explícitamente para el momento de implementar ("Los tonos exactos... se definen al implementar en Fase 6, no en esta fase de especificación"); se resuelven decisiones puntuales de esta naturaleza sprint a sprint, documentando cualquier elección no trivial.
