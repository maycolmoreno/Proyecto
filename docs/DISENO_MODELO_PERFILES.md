# Diseño — Modelo de Perfiles Funcionales Múltiples por Usuario

**Tipo de documento:** propuesta de arquitectura evolutiva (solo diseño conceptual, sin código). Responde a la pregunta: ¿cómo permitir que un mismo usuario sea Donante + Solicitante + Participante de Trueque + Comunidad simultáneamente, sin crear varias cuentas, reutilizando al máximo la arquitectura Clean/Hexagonal ya construida?
**Fuente:** `docs/AUDITORIA_FUNCIONAL_MARKETPLACE.md` (auditoría previa, no se repite aquí) + inspección directa del código real citado abajo.
**Principio rector:** minimizar cambios, no reescribir, no romper compatibilidad, no cambiar de arquitectura.

---

## 1. Recomendación (resumen ejecutivo)

**Opción D — RBAC solo para seguridad + sistema de Perfiles funcionales independiente**, con "Comunidad" modelada como un **Perfil** en el corto plazo (misma mecánica que Donante/Solicitante/Trueque) y como candidato a **Agregado independiente** (`Organizacion`) solo si más adelante se prioriza "administrar beneficiarios" — decisión desacoplada, no bloqueante.

**Los 3 módulos (Donaciones/Solicitudes/Trueques) se mantienen separados** — no se recomienda unificar en una entidad `Publicacion` genérica. El problema real que motivaría la unificación ("ver todas mis publicaciones juntas") se resuelve con un **modelo de lectura agregado** (proyección, no reescritura del modelo de escritura), reutilizando el Event Bus que ya existe.

Justificación completa de cada punto, abajo.

---

## 2. Análisis de las 4 opciones

### Opción A — Mantener roles actuales, agregar solo permisos funcionales

**Cómo funcionaría:** `usuarios.rol` (`domain/identidad/value-objects/Rol.ts`, enum de Prisma `schema.prisma:18-25`) sigue siendo un único valor por usuario; se añade una capa de permisos que amplía lo que cada rol puede hacer.

**Ventajas:** cero migración de datos, cambio más pequeño posible.

**Desventajas — por qué no alcanza:** `rol` es **un solo valor por fila** (`usuarios.rol Rol` — no es un array). Un usuario no puede "ser" `DONANTE` y `BENEFICIARIO` a la vez sin que el enum crezca combinatoriamente (`DONANTE_BENEFICIARIO`, `DONANTE_TRUEQUE`, `DONANTE_BENEFICIARIO_TRUEQUE`...). Con 4 perfiles posibles eso son hasta 15 combinaciones no vacías — inmanejable como enum. **Dato revelador ya confirmado en la auditoría:** `USUARIO_COMUNIDAD` hoy YA es, en la práctica, "el rol que puede todo" (dona + solicita + truequea) — es la prueba de que el modelo de un-solo-valor ya se quedó corto y se resolvió creando un rol-comodín en vez de perfiles reales. Opción A repetiría ese mismo parche.

### Opción B — Eliminar roles actuales, crear nuevos roles

**Cómo funcionaría:** reemplazar el enum `Rol` completo.

**Desventajas:** mismo problema estructural que A si los roles nuevos también son de un solo valor (no resuelve "múltiples perfiles simultáneos", solo les cambia el nombre). Si en cambio los roles nuevos SÍ fueran multi-valor, entonces ya es funcionalmente la Opción D con otro nombre. Además: **alto riesgo de datos** — hay usuarios reales ya persistidos con `rol` asignado (creados durante todo este proyecto, incluidos los de prueba y el `ADMINISTRADOR` real del usuario). Eliminar el enum exige migrar cada fila y tocar los 5 archivos de rutas que usan `rbacMiddleware` (`admin.routes.ts:9`, `categorias.routes.ts:8`, `donaciones.routes.ts:10`, `solicitudes.routes.ts:10-11`, `trueques.routes.ts:10`) simultáneamente — ventana de cambio grande, sin beneficio adicional sobre D.

### Opción C — Un único rol autenticado, todo por permisos granulares

**Cómo funcionaría:** colapsar `ADMINISTRADOR`/`DONANTE`/`BENEFICIARIO`/`USUARIO_COMUNIDAD` a un solo "USUARIO", y construir un motor de permisos genérico (tabla `permisos`, tabla `usuario_permisos`, verificación por clave de permiso en vez de por rol).

**Desventajas:** es la opción de mayor alcance y mayor complejidad nueva. Requiere diseñar un catálogo de permisos, una entidad `Permiso`, relaciones muchos-a-muchos, y **reescribir la autorización de administración** (`ADMINISTRADOR` deja de ser un valor simple verificable con `===`, pasa a depender de qué permisos tenga asignados esa cuenta) — esto es exactamente lo que el principio obligatorio pide evitar ("no reescribir el sistema"). Es la respuesta correcta si el negocio esperara decenas de permisos finos e independientes (ej. "puede moderar pero no banear", "puede ver reportes pero no editar categorías") — no es el problema que describe el usuario, que son 4 perfiles concretos y conocidos de antemano.

### Opción D — RBAC solo para seguridad + Perfiles funcionales independientes ✅ Recomendada

**Cómo funcionaría:**
- `usuarios.rol` **se reduce** (no se elimina) a `ADMINISTRADOR | USUARIO` — dos valores, uno de seguridad real (acceso a moderación, panel admin, gestión de usuarios) y un valor por defecto para todos los demás. `rbacMiddleware` (`main/middlewares/rbac.middleware.ts`) **sigue existiendo tal cual**, pero solo se usa ya para verificar `ADMINISTRADOR` (`admin.routes.ts`, `categorias.routes.ts`) — su propósito original.
- Se agrega un concepto **nuevo e independiente**: `PerfilFuncional` (`DONANTE | SOLICITANTE | TRUEQUE | COMUNIDAD`), relacionado con `Usuario` en una relación **1-a-muchos** (un usuario puede tener 0, 1, o los 4 perfiles a la vez). Un `perfilMiddleware([...])` nuevo, estructuralmente idéntico a `rbacMiddleware` (mismo patrón, mismo archivo de tipo, verificación de pertenencia a un array en vez de igualdad), reemplaza los usos de `rbacMiddleware` que hoy verifican `DONANTE`/`BENEFICIARIO`/`USUARIO_COMUNIDAD` en `donaciones.routes.ts:10`, `solicitudes.routes.ts:10-11`, `trueques.routes.ts:10`.

**Ventajas:**
- Separa dos preocupaciones que hoy están mezcladas en un solo enum: *seguridad/privilegio administrativo* (¿puede moderar?) vs. *capacidad funcional de marketplace* (¿puede donar/pedir/truequear?). Es la separación estándar en sistemas con roles de seguridad + perfiles de negocio.
- Resuelve exactamente "múltiples perfiles sin múltiples cuentas" — agregar/quitar un perfil es una fila más/menos en una tabla, no un nuevo valor de enum.
- **Blast radius mínimo:** el patrón de middleware (`(roles: Rol[]) => (req,res,next)`) ya existe y se reutiliza literalmente, solo cambia contra qué compara. Los casos de uso, controllers, repositorios, entidades de Donación/Solicitud/Trueque **no se tocan en absoluto** — ellos nunca supieron de roles, la autorización siempre vivió en la capa de rutas (`main/`), no en `domain/`.
- Migración de datos acotada y verificable 1-a-1: cada `rol` actual mapea a un conjunto de perfiles conocido de antemano (ver sección 6), sin ambigüedad.

**Desventajas (aceptadas):** dos tablas para consultar en vez de una (`usuarios` + `usuarios_perfiles`) al resolver autorización — costo bajo, ya hay precedente de este patrón en el proyecto (`Ubicacion` ya es 1-a-muchos sobre `Usuario`, `schema.prisma:64-82`).

---

## 3. "Comunidad" — cómo modelarla

Pregunta explícita: ¿rol, perfil, organización, entidad independiente, o agregado de dominio?

**Respuesta en dos capas, deliberadamente desacopladas:**

**Capa de autorización (ahora):** Comunidad es un **Perfil** — el mismo mecanismo que Donante/Solicitante/Trueque (`PerfilFuncional.COMUNIDAD`). Habilita las mismas acciones que tener los otros 3 perfiles combinados (una cuenta con perfil Comunidad puede publicar donaciones, solicitudes y trueques) más, opcionalmente, una etiqueta visual ("Cuenta verificada como organización") en el frontend. Esto por sí solo **ya resuelve** lo que pide el modelo de 4 perfiles del prompt actual, sin construir nada nuevo en el dominio.

**Capa de dominio (futuro, condicional):** la auditoría (`AUDITORIA_FUNCIONAL_MARKETPLACE.md`, sección 9) encontró que "administrar beneficiarios", "necesidades colectivas" y "evidencia de entrega" **no tienen ningún equivalente hoy** — son capacidades genuinamente nuevas, no una extensión de algo existente. Si esas capacidades se priorizan, "Comunidad" necesitará crecer a un **agregado de dominio independiente** (`Organizacion`, nuevo Bounded Context `domain/organizaciones/`), con su propia relación a una lista de beneficiarios (`Usuario`s con rol `USUARIO`/perfil `SOLICITANTE` asociados a esa organización). Esto seguiría el mismo patrón de referencia ligera ya usado en `Entrega`/`Imagen` (`idReferencia`/`idEntidad` sin FK física, Fase 3) — `Organizacion.propietarioId` apuntando a un `Usuario`.

**Por qué esta separación es la opción más escalable:** no se paga el costo de diseñar un agregado nuevo (tabla, casos de uso, endpoints, UI de administración de beneficiarios) hasta que de verdad se necesite. El Perfil "Comunidad" de hoy no se descarta ni se reescribe cuando eventualmente se construya `Organizacion` — simplemente `Organizacion.propietarioId` referenciaría a un `Usuario` que ya tiene el perfil `COMUNIDAD`. Es crecimiento aditivo, no un rediseño.

---

## 4. Modelo conceptual: Usuario → Perfiles → Permisos → Publicaciones

```
Usuario                                    (agregado existente, sin cambios de identidad)
  │  nombre, correo, passwordHash, telefono, estado, fechaCreacion  — igual que hoy
  │
  ├─ rol: ADMINISTRADOR | USUARIO           (seguridad — reducido de 4 a 2 valores)
  │
  └─ Perfiles: PerfilFuncional[]            (NUEVO — relación 1-a-muchos, tabla usuarios_perfiles)
        │
        ├─ DONANTE      ─┐
        ├─ SOLICITANTE   ─┼─→ Permisos (NO es una tabla — es una función pura de mapeo)
        ├─ TRUEQUE       ─┤        perfilRequerido(accion) → boolean,
        └─ COMUNIDAD     ─┘        evaluada contra Perfiles[] del usuario en el middleware

                                    │
                                    ▼
                              Publicaciones                (sin cambios estructurales)
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
                Donacion        Solicitud        Trueque
             (requiere perfil (requiere perfil (requiere perfil
              DONANTE o        SOLICITANTE o     TRUEQUE o
              COMUNIDAD)       COMUNIDAD)        COMUNIDAD)
```

**Punto de diseño clave:** "Permisos" **no se persiste** como tabla. Es una función de mapeo (`Perfil → acción permitida`), igual de simple que el `rbacMiddleware(['DONANTE','USUARIO_COMUNIDAD'])` que ya existe hoy — el cambio es que ahora compara contra un array de perfiles del usuario en vez de un único valor de rol. Esto evita construir el motor de permisos genérico de la Opción C, que el principio obligatorio pide evitar.

---

## 5. Marketplace — ¿3 módulos separados o una entidad `Publicacion` genérica?

**Recomendación: mantener los 3 módulos separados.** Análisis por eje, basado únicamente en lo encontrado en la auditoría:

| Eje | 3 módulos (actual) | `Publicacion` genérica |
|---|---|---|
| **Mantenibilidad** | Cada módulo ya sigue un molde idéntico (`domain/application/adapters` × BC) — modificar uno no arriesga a los otros 2. | Una entidad con campos opcionales por tipo (`urgencia` solo aplica a ex-Solicitud, `requiereRetiro` solo a ex-Donación) reintroduce acoplamiento: un cambio de regla en "trueque" puede romper una validación compartida de "publicación". |
| **Reutilización** | Ya está resuelta **donde importa de verdad**: `PublicacionCard.tsx`, `FiltroPanel.tsx`, `Stepper.tsx`, `ImageUploader.tsx`, wizard de 5 pasos — todos genéricos y ya usados por los 3 módulos hoy. Unificar el backend no añade reutilización donde el frontend ya la tiene. | Elimina la duplicación de los ~7 casos de uso por módulo (publicar/listar/obtener/actualizar/cancelar/firmar imagen/registrar imagen) — el único beneficio real de reutilización que SÍ aportaría, a cambio de un rediseño completo. |
| **Consultas** | Cross-tipo (ej. "todas mis publicaciones", feed único ordenado por fecha) requiere 3 queries + merge en memoria — no existe hoy ningún endpoint así (gap confirmado en la auditoría). | Resuelve esto nativamente con un solo `SELECT`. |
| **Escalabilidad** | Un tipo nuevo de publicación en el futuro = un Bounded Context nuevo, siguiendo el molde ya probado 3 veces — predecible, ya "documentado" por el propio código existente. | Un tipo nuevo = evaluar si sus campos encajan en la tabla genérica o si rompe el modelo — menos predecible con el tiempo. |
| **Complejidad** | 3 aggregates con estados propios, ya modelados con enums fuertemente tipados (`EstadoDonacion`, `EstadoSolicitud`, `EstadoTrueque` — 6 valores cada uno, con transiciones **deliberadamente distintas**: Solicitud auto-acepta una oferta en un paso, Trueque exige aceptación explícita en dos pasos — es una regla de negocio real, no una duplicación accidental). | Forzar un `estado` único obliga a un enum combinado de hasta 18 valores (muchos inválidos según el tipo) o a validación condicional adicional por tipo — exactamente lo que Clean/DDD busca evitar ("hacer los estados inválidos irrepresentables"), que hoy sí se logra. |
| **Impacto en BD** | Ninguno. | Alto: fusionar `donaciones`+`solicitudes`+`trueques` en una tabla exige o bien muchas columnas nulas por tipo (denormalización), o bien tablas de detalle por tipo (herencia de tablas, joins adicionales en cada lectura) — ninguna es gratis. |
| **Impacto en frontend** | Ninguno — ya está unificado donde importa. | Bajo-medio, pero el beneficio ya está capturado hoy sin este cambio — inversión sin retorno adicional claro. |
| **Impacto en backend** | Ninguno. | **Alto** — reescribe 3 de los 11 Bounded Contexts existentes (todos los casos de uso, repositorios, controllers de Donaciones/Solicitudes/Trueques). Esto es literalmente "reescribir el sistema", que el principio obligatorio prohíbe. |

**Alternativa que sí se recomienda para resolver el problema real ("quiero ver todo junto"):** un **modelo de lectura agregado** (proyección), no una fusión del modelo de escritura. `DonacionPublicada`, `SolicitudCreada` y `TruequePublicado` **ya son eventos reales del Event Bus** (`domain/eventos/ports/IEventBus.ts`, ya consumidos hoy por `ModeracionIAService` y `NotificacionDispatchService`). Un **tercer listener** (ej. `PublicacionIndexService`, mismo patrón de wiring que los otros 2 en `main/di-container.ts`) podría escribir una fila liviana `{id, tipo, titulo, estado, categoriaId, usuarioId, imagenUrl, fecha}` en una colección Mongo nueva (`publicaciones_index`) cada vez que se publica/cambia de estado cualquiera de los 3 tipos — sin tocar ninguno de los 3 aggregates existentes. Resuelve "historial"/"mis publicaciones"/"feed único" con impacto y riesgo bajos, reutilizando infraestructura que ya existe y ya está probada (2 listeners reales funcionando). Se detalla como ítem opcional de Fase 5 en el roadmap.

---

## 6. Modelo de dominio — qué cambia

**Permanecen exactamente iguales (cero cambios):**
`Donacion`, `Solicitud`, `OfertaSolicitud`, `Trueque`, `PropuestaTrueque`, `Entrega`, `Categoria`, `Imagen`, `Ubicacion`, `Auditoria` — y todos sus casos de uso, repositorios y controllers. Ninguno de ellos conoce hoy el concepto de "rol" directamente (la autorización vive en `main/routes/*.ts`, no en `domain/`), así que no hay nada que tocar ahí.

**Se modifican:**
| Elemento | Cambio | Archivo |
|---|---|---|
| `Rol` (value object + enum Prisma) | De 4 valores a 2 (`ADMINISTRADOR`\|`USUARIO`) | `domain/identidad/value-objects/Rol.ts`, `schema.prisma:18-25` |
| Middleware de autorización en rutas de dominio | `rbacMiddleware(['DONANTE',...])` → `perfilMiddleware(['DONANTE',...])` | `donaciones.routes.ts:10`, `solicitudes.routes.ts:10-11`, `trueques.routes.ts:10` |
| `Usuario` (entidad) | Gana un método de consulta `tienePerfil(perfil)` (lectura, no cambia invariantes existentes) | `domain/identidad/entities/Usuario.ts` |
| `RegistroForm.tsx` (frontend) | El selector de "rol" al registrarse pasa a ser una selección múltiple de perfiles | `frontend/src/features/identidad/components/RegistroForm.tsx` |

**Nuevas (aditivas, no reemplazan nada):**
| Elemento | Propósito |
|---|---|
| `PerfilFuncional` (value object: `DONANTE\|SOLICITANTE\|TRUEQUE\|COMUNIDAD`) | Espejo de cómo ya se modelan los demás value objects del proyecto (`domain/identidad/value-objects/`) |
| `usuarios_perfiles` (tabla Postgres nueva) | `usuarioId` + `perfil`, único compuesto — mismo patrón relacional que `Ubicacion` (1-a-muchos sobre `Usuario`) |
| `IUsuarioPerfilRepository` (o extensión de `IUsuarioRepository`) | `asignarPerfil`, `listarPerfiles`, `tienePerfil` — mismo molde que `listarPorRol` ya existente |
| `perfilMiddleware` | Mismo patrón que `rbacMiddleware`, verificación contra array de perfiles |
| `AsignarPerfilUseCase` / `PATCH /usuarios/me/perfiles` | Permite a un usuario activar/desactivar sus propios perfiles sin re-registrarse |

**Conviene eliminar:** nada a nivel de tabla o entidad. Los 3 valores retirados de `Rol` (`DONANTE`/`BENEFICIARIO`/`USUARIO_COMUNIDAD`) no se "eliminan" como concepto — se **trasladan** a `PerfilFuncional`, preservando el significado, solo cambiando dónde viven.

---

## 7. Roadmap técnico

### Fase 1 — Cambios de bajo riesgo (preparación aditiva)
- Crear `PerfilFuncional` (value object) + tabla `usuarios_perfiles` (migración Prisma, no toca columnas existentes de `usuarios`).
- Script de backfill: puebla `usuarios_perfiles` a partir del `rol` actual de cada usuario **sin cambiar ningún comportamiento**:
  - `DONANTE` → `[DONANTE, TRUEQUE]` (ya puede ambas cosas hoy, confirmado en la auditoría sección 3.2)
  - `BENEFICIARIO` → `[SOLICITANTE]`
  - `USUARIO_COMUNIDAD` → `[DONANTE, SOLICITANTE, TRUEQUE, COMUNIDAD]`
  - `ADMINISTRADOR` → sin perfiles (sigue siendo únicamente un rol de seguridad)
- `rbacMiddleware` y todo el comportamiento actual **no se tocan** — el sistema de perfiles se construye "en paralelo", sin activarse.
- **Impacto:** bajo (100% aditivo). **Riesgo:** bajo. **Dependencias:** ninguna. **Tiempo estimado:** 2-3 días.

### Fase 2 — Refactorización del dominio (activar Perfiles)
- `perfilMiddleware` nuevo, reemplaza `rbacMiddleware(['DONANTE',...])` en los 3 módulos de dominio (Donaciones/Solicitudes/Trueques), módulo por módulo, verificable independientemente.
- `rbacMiddleware` se conserva, ahora exclusivo de `ADMINISTRADOR` (`admin.routes.ts`, `categorias.routes.ts`).
- Migración de Postgres: `usuarios.rol` reduce su enum a `ADMINISTRADOR | USUARIO` — se ejecuta **después** de confirmar que ningún endpoint depende ya del valor viejo.
- Endpoint nuevo `PATCH /usuarios/me/perfiles` (`AsignarPerfilUseCase`).
- **Impacto:** medio (toca autorización real, pero incremental y verificable por módulo). **Riesgo:** medio — mitigado por hacerlo módulo por módulo con los tests de integración ya existentes (`backend/tests/`) como red de seguridad. **Dependencias:** Fase 1 completa y backfill verificado contra datos reales. **Tiempo estimado:** 1 semana.

### Fase 3 — Adaptación del frontend
- `useSesion()` expone `perfiles: PerfilFuncional[]`.
- Reemplazar guards inline (`ROLES_PUEDEN_PUBLICAR`, `ROLES_PUEDEN_OFERTAR`, `ROLES_PUEDEN_PROPONER` en `DonacionesPage.tsx`/`SolicitudDetallePage.tsx`/`TruequeDetallePage.tsx`) por chequeo de perfiles — mismo patrón, distinta fuente de datos.
- `nav-items.ts`/`Sidebar.tsx`/`BottomTabBar.tsx` filtran ítems según perfiles activos (resuelve la pregunta de navegación por rol de la conversación previa).
- `RegistroForm.tsx`: selección múltiple de perfiles en vez de un único rol.
- `PerfilPage.tsx`: nueva sección para activar/desactivar perfiles propios.
- **Impacto:** medio (varias páginas, pero patrón mecánico ya repetido). **Riesgo:** bajo (frontend, reversible, no toca datos persistidos). **Dependencias:** Fase 2 (API de perfiles ya expuesta y estable). **Tiempo estimado:** 1 semana.

### Fase 4 — Migraciones y cierre
- Suite de tests de integración ampliada: usuarios con combinaciones de perfiles (ej. Donante+Trueque sin Solicitante) verificando que cada endpoint respeta exactamente los perfiles asignados.
- Confirmar cero regresión funcional contra el comportamiento pre-cambio (mismo usuario, misma capacidad).
- Actualizar `docs/DECISIONES.md` (ADR nuevo), `docs/fases/fase-02-diseno-dominio.md` (historial de desviación del diseño original).
- **Impacto:** bajo (cierre y documentación, no funcionalidad nueva). **Riesgo:** bajo. **Dependencias:** Fases 1-3 verificadas de punta a punta. **Tiempo estimado:** 2-3 días.

### Fase 5 — Nuevas funcionalidades habilitadas (independientes entre sí, priorizables por separado)
| Funcionalidad | Depende de | Impacto | Riesgo | Tiempo estimado |
|---|---|---|---|---|
| `Organizacion` (agregado nuevo) — Comunidad administra beneficiarios | Fase 4 | Alto (BC nuevo completo) | Medio | 2-3 semanas |
| `publicaciones_index` (proyección) — historial/"mis publicaciones"/feed único | Fase 4 (perfiles ya no es requisito estricto, podría adelantarse) | Medio | Bajo (aditivo, no toca aggregates) | 1 semana |
| Evidencia fotográfica de entrega (`TipoEntidadImagen` + `ENTREGA`) | Fase 4 | Bajo-medio | Bajo | 3-5 días |
| Negociación real en Trueques (contraoferta) | Fase 4 | Medio (nueva transición de estado en `Trueque.ts`) | Medio | 1 semana |

---

## 8. Cumplimiento del principio obligatorio

| Exigencia | Cómo se cumple |
|---|---|
| Reutilizar el máximo posible | `rbacMiddleware` se conserva (solo se acota su uso); los 3 módulos de dominio no se tocan; los componentes de frontend ya reutilizables se mantienen intactos; el Event Bus (Fase 5 opcional) reutiliza 2 listeners ya probados como precedente. |
| No reescribir el sistema | Ningún caso de uso, repositorio o controller de Donaciones/Solicitudes/Trueques cambia. Solo se añade una tabla nueva y se ajusta el middleware de autorización. |
| No cambiar la arquitectura | Se mantiene Clean/Hexagonal por capas + Bounded Context; `PerfilFuncional` sigue el mismo molde que cualquier value object existente; `usuarios_perfiles` sigue el mismo patrón relacional que `Ubicacion`. |
| No perder compatibilidad | El backfill de Fase 1 preserva exactamente las capacidades actuales de cada usuario existente antes de activar nada; `ADMINISTRADOR` no cambia en ningún momento. |
