# 14 — Frontend y Roles — DonaConnect Ecuador

Verificado contra `frontend/src/app/App.tsx` (61 líneas, completo) y las 17 páginas de `app/pages/`.

---

## 1. Rutas — tabla completa (`App.tsx`)

| Path | Página | Dentro de `RutaProtegida` | Guard adicional |
|---|---|---|---|
| `/login`, `/registro` | `LoginPage`, `RegistroPage` | No | — |
| `/` | `HomePage` | No | — (dashboard visible solo si hay sesión, condicional interno) |
| `/donaciones`, `/donaciones/:id` | `DonacionesPage`, `DonacionDetallePage` | No | pública — botón "Publicar" condicionado por perfil |
| `/solicitudes`, `/solicitudes/:id` | `SolicitudesPage`, `SolicitudDetallePage` | No | ídem |
| `/trueques`, `/trueques/:id` | `TruequesPage`, `TruequeDetallePage` | No | ídem |
| `/donaciones/nueva`, `/solicitudes/nueva`, `/trueques/nuevo` | `Nueva*Page` (wrappers de wizard) | **Sí** | solo sesión |
| `/chatbot` | `ChatbotPage` | **Sí** | solo sesión |
| `/conversaciones`, `/conversaciones/:id` | `ConversacionesPage` | **Sí** | solo sesión |
| `/perfil` | `PerfilPage` | **Sí** | solo sesión |
| `/publicaciones/mias` | `MisPublicacionesPage` | **Sí** | solo sesión (sin ítem de nav, solo por URL) |
| `/admin` | `AdminPage` | **Sí** | solo sesión a nivel de ruta — el guard de `ADMINISTRADOR` vive **dentro** de `AdminPage`, no en el router |

`RutaProtegida.tsx:7-16` solo verifica `Boolean(obtenerToken())` — nunca valida rol ni perfil. La protección real de "quién puede ver qué" está en 3 capas distintas según el caso: (a) el backend siempre (autoridad real), (b) `RutaProtegida` solo para "¿hay sesión?", (c) constantes `PERFILES_PUEDEN_*` inline en cada página para condicionar botones de acción, no el acceso a la página en sí.

---

## 2. Guards de perfil — las 5 ubicaciones reales

| Archivo:línea | Constante | Valor | Condiciona |
|---|---|---|---|
| `DonacionesPage.tsx:14` | `PERFILES_PUEDEN_PUBLICAR` | `['DONANTE']` | botón "+Publicar" |
| `SolicitudesPage.tsx:14` | `PERFILES_PUEDEN_PUBLICAR` | `['SOLICITANTE']` | botón "+Publicar" |
| `TruequesPage.tsx:14` | `PERFILES_PUEDEN_PUBLICAR` | `['TRUEQUE']` | botón "+Publicar" |
| `SolicitudDetallePage.tsx:20` | `PERFILES_PUEDEN_OFERTAR` | `['DONANTE']` | botón "Ofertar" (+ `!esDueño` + estado `ABIERTA`) |
| `TruequeDetallePage.tsx:22` | `PERFILES_PUEDEN_PROPONER` | `['TRUEQUE']` | botón "Proponer" (+ `!esDueño` + estado receptivo) |

Todas leen `sesion.data.perfiles` (array) — nunca `sesion.data.rol`. No existe un componente `RoleGuard`/`PerfilGuard` reutilizable — cada guard es una constante local + condicional inline, repetido 5 veces con el mismo patrón. `AdminPage.tsx` es la excepción: usa `RolUsuario` (`ADMINISTRADOR`\|`USUARIO`), no `PerfilFuncional` — correcto, porque el panel admin es autorización de seguridad, no de marketplace.

**Importante para la defensa:** estos guards son **solo UX** — ocultan un botón, no protegen nada. La autorización real vive en el backend (`perfilMiddleware`/`rbacMiddleware`, `11_REGLAS_DE_NEGOCIO.md §6`). Si alguien llama `POST /donaciones` directamente sin el perfil `DONANTE`, el backend responde `403` sin importar qué mostraba el frontend.

---

## 3. Navegación — no se filtra por rol/perfil (decisión explícita)

`shared/lib/nav-items.ts` (22 líneas): 7 ítems fijos (Inicio, Donaciones, Solicitudes, Trueque, Chatbot IA, Mensajes, Perfil), idénticos para cualquier usuario autenticado. `AppShell.tsx` pasa el array completo a `Sidebar`/`BottomTabBar` sin leer la sesión — ambos componentes son puramente presentacionales, no tienen lógica condicional interna.

**No están en el menú:** `/admin` (decisión explícita, ADR-020 — vive fuera de la navegación principal, accesible solo vía menú de perfil) y `/publicaciones/mias` (sin decisión documentada — simplemente no se agregó, ver `17_DEUDA_TECNICA.md #10`).

---

## 4. Componentes reutilizables (`shared/components/`) — regla de ADR-045

Un componente vive en `shared/` **solo si** recibe todo por props y no importa hooks/API de ningún `features/*`. Confirmados en esta categoría: `PublicacionCard`, `FiltroPanel`, `Stepper`, `ImageUploader`, `LocationPicker`, `Modal`, `StatusBadge`, `IASuggestionBox`. Los 3 wizards (`DonacionWizard`, `SolicitudWizard`, `TruequeWizard`) son específicos de dominio (`features/*/components/`) porque orquestan pasos y validaciones propias, aunque internamente componen piezas compartidas.

---

## 5. Chatbot — el único punto sin manejo de errores

`ChatWidget.tsx` y `ChatbotPage.tsx` llaman `chatbot.enviar()` dentro de un `try { ... } finally { ... }` — **sin `catch`**. `useChatbot.ts` tampoco define `onError` en su `useMutation` (solo `onSuccess`). Un fallo del backend (`503` si Gemini no está configurado, error de red, etc.) se traduce en que el widget simplemente deja de mostrar "…" — sin ningún mensaje visible. Es el único flujo del frontend sin manejo de error, pese a que `ToastProvider` (usado en el resto de la app) ya resolvería esto con una línea (`mostrarToast(mensaje, 'error')`).

---

## 6. Diferencia entre las 4 capas de protección (para responder "¿cómo se sabe que X está realmente protegido?")

| Capa | Qué hace | Ejemplo | Basta por sí sola? |
|---|---|---|---|
| Ocultar una opción visualmente | No renderiza un botón/link | `PERFILES_PUEDEN_PUBLICAR` | No — cualquiera puede llamar el endpoint directo |
| Proteger una ruta del frontend | Redirige si no hay sesión | `RutaProtegida` | No — solo exige *estar* logueado, no *quién* |
| Proteger un endpoint del backend | Middleware de ruta | `perfilMiddleware`/`rbacMiddleware` | Sí, para "qué tipo de acción" |
| Validar permisos en el caso de uso | Verifica dueño del recurso específico | `NoEsDueñoDeLa*Error` | Sí, para "sobre qué recurso concreto" |

Las primeras dos son UX; las últimas dos son la autorización real. El proyecto tiene las 4, correctamente separadas.

---

## 7. Qué sigue

`16_PRUEBAS.md` cubre qué de todo esto (frontend y backend) tiene cobertura de test real — spoiler: nada del frontend, incluyendo estos guards de perfil.
