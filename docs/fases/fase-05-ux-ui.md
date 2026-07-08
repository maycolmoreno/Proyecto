# Fase 5 — UX/UI

**Estado:** ✅ Aprobada
**Fecha de creación:** 2026-07-07
**Última actualización:** 2026-07-07
**Fuente:** `SRS_DonaConnect_Ecuador_ISO29148.docx` §4.1 (IF-USR-001 a 005), RNF-007, RNF-008, RNF-010/RNF-014 + Fases 0-4

## Historial de cambios
| Fecha | Descripción |
|---|---|
| 2026-07-07 | Versión inicial. Navegación, wireframes de baja fidelidad (ASCII), inventario de componentes, mapeo de estados de negocio a color, estrategia responsive y mobile-first. Sin código — solo especificación de diseño. |
| 2026-07-07 | Aprobada por el usuario sin cambios. Se avanza a Fase 6. |
| 2026-07-07 | Corrección a pedido del usuario (refinamiento de arquitectura frontend, Fase 1 sección 9.3): se agrega columna "Ubicación" a la tabla de componentes, clasificando cada uno como Compartido (`shared/components/`) o Específico de módulo (`features/<dominio>/components/`) según la regla de reutilización de ADR-045. Se agregan `DonacionWizard`/`SolicitudWizard`/`TruequeWizard` como organismos específicos que componen piezas compartidas. |

---

## 1. Navegación

El SRS ya fija los 8 ítems de navegación principal (IF-USR-003): **Inicio, Donaciones, Solicitudes, Trueque, Chatbot IA, Mensajes, Ubicación, Perfil**. Se respetan tal cual y se filtran según la matriz RBAC de Fase 4 (ADR-016):

| Ítem de nav | Ruta | Visible para |
|---|---|---|
| Inicio | `/` | Todos (incluye resumen de impacto, RF-019) |
| Donaciones | `/donaciones` | Todos (botón "Publicar" solo DONANTE/USUARIO_COMUNIDAD) |
| Solicitudes | `/solicitudes` | Todos (botón "Publicar" solo BENEFICIARIO/USUARIO_COMUNIDAD) |
| Trueque | `/trueques` | Todos (botón "Publicar" solo DONANTE/USUARIO_COMUNIDAD) |
| Chatbot IA | `/chatbot` | Autenticado |
| Mensajes | `/conversaciones` | Autenticado |
| Ubicación | dentro de `/perfil` (tab) | Autenticado |
| Perfil | `/perfil` | Autenticado |

**Adiciones justificadas más allá de los 8 ítems literales** (RF-018/RF-019 necesitan una superficie de UI que el SRS no ubica explícitamente en la navegación):
- **Panel de Administración** (`/admin`) — no aparece en la nav principal; accesible solo para ADMINISTRADOR vía menú de perfil, como área separada (patrón estándar: el panel admin no compite por espacio en la navegación de usuarios regulares). → **ADR-020**.
- **Dashboard de impacto** (RF-019) se integra en `/` (Inicio) en vez de crear un 9º ítem de nav, evitando saturar la navegación principal ya fijada por el SRS.

**Estructura de navegación por dispositivo:**
- **Mobile (< 768px):** bottom tab bar con los 5 ítems más frecuentes (Inicio, Donaciones, Solicitudes, Trueque, Chatbot) + menú hamburguesa para Mensajes/Ubicación/Perfil.
- **Desktop (≥ 1024px):** barra lateral fija con los 8 ítems visibles simultáneamente.

---

## 2. Wireframes (baja fidelidad)

### 2.1 Shell general
```
┌─────────────────────────────────────────────┐
│ [Logo] DonaConnect      🔔  💬  [Avatar ▾]   │  ← Navbar superior (todas las pantallas)
├───────────┬─────────────────────────────────┤
│ Inicio    │                                 │
│ Donaciones│         Contenido de página      │
│ Solicitudes│        (según ruta activa)      │
│ Trueque   │                                 │
│ Chatbot IA│                                 │
│ Mensajes  │                                 │
│ Ubicación │                                 │
│ Perfil    │                                 │
└───────────┴─────────────────────────────────┘
Desktop ≥1024px: sidebar fija (como arriba).
Mobile <768px: sidebar colapsa a bottom tab bar de 5 íconos + FAB "+" para publicar.
```

### 2.2 Inicio (`/`) — incluye Dashboard de impacto (RF-019)
```
┌─────────────────────────────────────────────┐
│  Bienvenida, {nombre}                        │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐  │
│  │Donaciones │ │Solicitudes│ │ Trueques  │  │
│  │entregadas │ │ atendidas │ │completados│  │
│  │    123    │ │    87     │ │    45     │  │
│  └───────────┘ └───────────┘ └───────────┘  │
│  Objetos reutilizados: 255  (indicador ODS12)│
│  ───────────────────────────────────────────│
│  Publicaciones recientes cerca de ti          │
│  [Card] [Card] [Card] [Card]                  │
└─────────────────────────────────────────────┘
```

### 2.3 Listado (`/donaciones`, `/solicitudes`, `/trueques` — patrón compartido)
```
┌─────────────────────────────────────────────┐
│ Donaciones         [+ Publicar] (según RBAC) │
│ ┌─ Filtros ─────────────────────────────────┐│
│ │ Categoría ▾  Provincia ▾  Estado ▾  🔍     ││
│ └───────────────────────────────────────────┘│
│ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│ │ [foto]  │ │ [foto]  │ │ [foto]  │  ← Card  │
│ │ Título  │ │ Título  │ │ Título  │          │
│ │[Badge:  │ │[Badge:  │ │[Badge:  │          │
│ │PUBLICADA│ │SOLICITADA│ │APROBADA│          │
│ │ Ciudad  │ │ Ciudad  │ │ Ciudad  │          │
│ └─────────┘ └─────────┘ └─────────┘          │
│              « 1 2 3 4 … »  (paginación)      │
└─────────────────────────────────────────────┘
Mobile: grid 1 columna. Tablet: 2 columnas. Desktop: 3-4 columnas.
```

### 2.4 Wizard de publicación (≤ 5 pasos — RNF-014)
```
┌─────────────────────────────────────────────┐
│  ● ─ ● ─ ○ ─ ○ ─ ○   Paso 2 de 5              │  ← Stepper
│  Descripción y estado del objeto              │
│  ┌───────────────────────────────────────┐   │
│  │  [campos del paso actual]              │   │
│  │  💡 Sugerencia IA: "Laptop usada en    │   │
│  │     buen estado — categoría: Tecnología"│   │  ← RF-015/CU-013, editable
│  │     [Usar sugerencia] [Editar]         │   │
│  └───────────────────────────────────────┘   │
│              [Atrás]         [Siguiente]      │
└─────────────────────────────────────────────┘
```
Pasos por tipo de publicación (los 3 flujos respetan el límite de 5 — RNF-014):

| # | Donación | Solicitud | Trueque |
|---|---|---|---|
| 1 | Categoría + título | Categoría + título | Categoría + título |
| 2 | Descripción + estado del objeto | Descripción + urgencia | Descripción + estado del objeto |
| 3 | Fotos | Evidencia (opcional) | Fotos |
| 4 | Ubicación (retiro si aplica) | Confirmar ubicación (perfil) | ¿Qué buscas a cambio? |
| 5 | Revisión + sugerencia IA + publicar | Revisión + sugerencia IA + publicar | Revisión + sugerencia IA + publicar |

### 2.5 Detalle de publicación
```
┌─────────────────────────────────────────────┐
│ [Galería de fotos]      [Badge: estado]      │
│ Título                                       │
│ Descripción...                               │
│ Categoría: Tecnología   Ciudad: Quito         │
│ (ubicación exacta oculta salvo ADR-019)      │
│ [Botón de acción según rol/estado]            │
│  - DONANTE viendo solicitud → "Aceptar y ofrecer"│
│  - BENEFICIARIO viendo su solicitud → ver ofertas│
│ ───────────────────────────────────────────  │
│ 💬 [Enviar mensaje al publicador]             │
└─────────────────────────────────────────────┘
```

### 2.6 Chatbot IA (`/chatbot`)
```
┌─────────────────────────────────────────────┐
│  Chatbot DonaConnect                          │
│  ┌───────────────────────────────────────┐   │
│  │ Bot: ¿En qué puedo ayudarte hoy?       │   │
│  │                    Tú: quiero donar ropa│   │
│  │ Bot: Te ayudo a categorizarla...       │   │
│  └───────────────────────────────────────┘   │
│  [Escribe tu mensaje...........] [Enviar]     │
└─────────────────────────────────────────────┘
Widget flotante disponible en todas las páginas (icono 💬 en navbar) + vista de página completa en `/chatbot`.
```

### 2.7 Panel de Administración (`/admin`, solo ADMINISTRADOR)
```
┌─────────────────────────────────────────────┐
│ Moderación        [Usuarios][Publicaciones][Reportes]│
│ ┌───────────────────────────────────────┐   │
│ │ Tabla: título | usuario | estado | ⚠️  │   │
│ │ ...          | ...     | ...    | [Aprobar][Bloquear]│
│ └───────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

## 3. Componentes (inventario de sistema de diseño)

**Ubicación en el árbol de carpetas (2026-07-07, alineado con Fase 1 sección 9.3):** cada componente se clasifica como **Compartido** (`shared/components/<nivel>/`, puramente presentacional, recibe todo por props) o **Específico** (`features/<dominio>/components/`, conoce la lógica/hooks de un solo dominio) según la regla de reutilización de Fase 1.

| Componente | Tipo | Ubicación | Descripción / estados |
|---|---|---|---|
| `Button` | Átomo | Compartido | variantes: primario, secundario, peligro (cancelar/rechazar), deshabilitado |
| `Input` / `TextArea` / `Select` | Átomo | Compartido | con label visible siempre (no solo placeholder — accesibilidad RNF-008), estado de error inline |
| `StatusBadge` | Átomo | Compartido | color semántico según estado de negocio (ver sección 4) |
| `Avatar` | Átomo | Compartido | iniciales o foto de usuario |
| `FormField` | Molécula | Compartido | Label + Input + mensaje de error (RNF-015) |
| `PublicacionCard` | Molécula | Compartido | usada en los 3 listados (donación/solicitud/trueque), foto + título + badge + ubicación aproximada — recibe los datos por props, no sabe de qué dominio vienen |
| `Stepper` | Molécula | Compartido | indicador de progreso del wizard de publicación (máx. 5 pasos), genérico a los 3 wizards |
| `ImageUploader` | Molécula | Compartido | selector de archivo o cámara (IF-HW-001), preview, validación de tamaño/tipo antes de firmar subida (Fase 4) |
| `LocationPicker` | Molécula | Compartido | mapa + campos provincia/ciudad/sector, solicita geolocalización con autorización previa (IF-HW-002) |
| `IASuggestionBox` | Molécula | Compartido | muestra sugerencia de IA editable (RF-015), nunca autoaplicada (ADR-010, Fase 1) |
| `Navbar` / `Sidebar` / `BottomTabBar` | Organismo | Compartido | navegación responsiva (sección 1) |
| `FiltroPanel` | Organismo | Compartido | filtros de listado (Fase 4, sección 8), configurable por dominio vía props |
| `ChatWidget` | Organismo | Específico (`features/chatbot/`) | flotante + vista completa, usa `useChatbot` (hook del módulo IA) |
| `ConversationThread` | Organismo | Específico (`features/mensajeria/`) | lista de mensajes + input, usa `useConversacion` (BC-Mensajería) |
| `Modal` / `Toast` | Organismo | Compartido | confirmaciones destructivas (cancelar publicación) y notificaciones efímeras |
| `DashboardStatTile` | Organismo | Específico (`features/dashboard/`) | tarjetas de KPI en Inicio (RF-019), usa `useDashboard` |
| `DonacionWizard` / `SolicitudWizard` / `TruequeWizard` | Organismo | Específico (`features/<dominio>/`) | orquestan los pasos de la sección 2.4 usando `Stepper` + `FormField` + `ImageUploader`/`LocationPicker`/`IASuggestionBox` compartidos, pero con la lógica de envío propia de cada dominio |

---

## 4. Estados

### 4.1 Estados de interfaz (por pantalla/componente)
`loading` (skeleton, no spinner bloqueante en listados) · `empty` (mensaje + CTA, ej. "Aún no tienes solicitudes — crea la primera") · `error` (mensaje claro en español + reintentar, RNF-015) · `success` (toast o confirmación inline).

### 4.2 Estados de negocio → color semántico (cumple IF-USR-005: diferenciar visualmente estados, urgencias y tipos)

| Grupo | Estados | Color semántico |
|---|---|---|
| Neutral/Informativo | `PUBLICADA`, `ABIERTA`, `PUBLICADO` | Azul |
| En progreso | `SOLICITADA`, `EN_REVISION`, `ACEPTADA_POR_DONANTE`, `EN_RETIRO`, `EN_ENTREGA`, `PROPUESTA_RECIBIDA`, `ACEPTADO`, `EN_COORDINACION`, `PENDIENTE` | Ámbar |
| Éxito/Completado | `APROBADA`, `ENTREGADA`, `ATENDIDA`, `INTERCAMBIADO`, `ACEPTADA` | Verde |
| Cancelado/Rechazado | `CANCELADA`, `CANCELADO`, `RECHAZADA` | Rojo |

| Urgencia (Solicitud) | Color |
|---|---|
| BAJA | Gris/Azul |
| MEDIA | Ámbar |
| ALTA | Rojo |

**Nota de accesibilidad:** el color nunca es el único indicador — cada `StatusBadge` incluye texto (no solo color), cumpliendo WCAG 2.1 AA (RNF-008, no depender del color exclusivamente). Los tonos exactos (paleta accesible con contraste ≥ 4.5:1) se definen al implementar en Fase 6, no en esta fase de especificación.

---

## 5. Responsive

Breakpoints dentro del rango exigido por RNF-007 (320px–2560px):

| Breakpoint | Rango | Layout |
|---|---|---|
| Mobile pequeño | 320–479px | 1 columna, bottom tab bar, wizard a pantalla completa |
| Mobile grande | 480–767px | 1 columna, más espaciado |
| Tablet | 768–1023px | 2 columnas en listados, sidebar colapsable |
| Desktop | 1024–1439px | 3 columnas, sidebar fija |
| Desktop ancho | 1440–2560px | 4 columnas, contenido centrado con `max-width` (evita líneas de texto excesivamente largas) |

## 6. Mobile First

Se diseña primero para 320px y se mejora progresivamente (`min-width` media queries), no al revés:
- Formularios del wizard ocupan pantalla completa en mobile (un campo/grupo por vista), se compactan en desktop.
- Botón primario de acción siempre accesible sin scroll (sticky bottom en mobile).
- Objetivo táctil mínimo 44×44px en todos los elementos interactivos.
- El `ChatWidget` es un ícono flotante en mobile (no ocupa espacio permanente) y puede anclarse como panel lateral en desktop.

---

## Nuevas decisiones de esta fase (ver `docs/DECISIONES.md`)
- ADR-020 — Panel de Administración fuera de la navegación principal de 8 ítems; Dashboard integrado en Inicio en vez de un 9º ítem.

---

**Aprobación:** Aprobada por el usuario (2026-07-07). Fase cerrada.
