# Guía de Repaso Final — Defensa DonaConnect Ecuador

Destilado de los 22 documentos de auditoría (`00`-`21`) en material de estudio práctico. No repite evidencia completa — cada sección remite al documento fuente si necesitás el archivo:línea exacto.

---

## 1. Los 5 hallazgos que definen la auditoría

| Hallazgo | Diseño esperado | Implementación real | Impacto | Cómo defenderlo |
|---|---|---|---|---|
| **Rate limiting** | ADR-034: login 5/15min, IA 20-30/min/usuario, general 100/min/IP | No existe ninguna implementación — cero `rate-limit` en todo el backend | Alto — sin fricción real contra fuerza bruta en login, sin control de costo de IA | "Lo identificamos en la auditoría, es el hallazgo de mayor prioridad, y la solución es acotada: `express-rate-limit` con los 3 perfiles ya documentados." Evitar decir "está protegido contra fuerza bruta" — no lo está a nivel de frecuencia (sí a nivel de costo computacional de bcrypt). Evidencia: ausencia total en `backend/package.json` y en el código. |
| **Ubicación exacta de Solicitud** | ADR-019: visible para dueño, admin, o beneficiario/donante con oferta aceptada | Se revela **una sola vez**, en la respuesta puntual de `POST /solicitudes/:id/ofertas` — no en consultas `GET` posteriores. El sentido inverso (ver la ubicación de la Donación) no tiene ningún mecanismo | Medio — funcional, no de seguridad (es más restrictivo de lo documentado, no menos) | "El diseño documentado prometía 3 condiciones, el código implementa 2 más una revelación puntual que cubre el caso principal. Si preguntan por el caso inverso, hay que reconocer que no está resuelto." Evidencia: `CrearOfertaUseCase.ts:89` vs. `ObtenerSolicitudUseCase.ts:22-23`. |
| **Solicitudes sin subida real de fotos** | Los 3 wizards (Donación/Solicitud/Trueque) con subida de imágenes a Cloudinary | Donación y Trueque sí suben fotos reales; Solicitud usa un campo de texto libre ("Enlace de evidencia") | Alto (funcional) — asimetría real entre los 3 módulos de marketplace | "Es una limitación real, no un bug oculto — el esquema de datos ya contempla `TipoEntidadImagen.SOLICITUD`, falta cablear el mismo flujo que ya existe en los otros dos módulos." |
| **Módulo "mis publicaciones" sin commitear** | No estaba en el SRS original — surgió como respuesta a un gap identificado en una auditoría anterior del propio proyecto | Implementado y funcionando end-to-end (`GET /publicaciones/mias`, proyección Mongo, 8 listeners del Event Bus) pero sin `git commit` ni ADR propio al momento de auditar | Bajo técnico, riesgo real de pérdida de trabajo | "Es trabajo terminado y probado, pendiente solo de formalizar (commit + ADR retroactivo) — no es deuda de diseño, es deuda de proceso." |
| **Documentación desactualizada, incluso la reciente** | `MANUAL_DEFENSA_PROYECTO.md` (2026-07-16) se declaraba "verificado contra el código real" | Ya estaba desalineado el mismo día por ADR-049 (removió el perfil `COMUNIDAD`) | Bajo técnico, alto metodológico | "Es la lección más importante de toda la auditoría: el código evoluciona más rápido que cualquier documento estático — por eso esta auditoría verifica archivo:línea en el momento, no confía en documentación previa por reciente que sea." |

---

## 2. Arquitectura — 3 niveles de profundidad

### Nivel 1 (20 segundos)
"DonaConnect usa Clean Architecture con Hexagonal y DDD combinados: 4 capas (dominio, aplicación, adaptadores, composición) organizadas en 12 módulos de negocio. El dominio nunca depende de frameworks — Express y Prisma son detalles reemplazables detrás de interfaces."

### Nivel 2 (1 minuto)
"El dominio (`domain/`) contiene las entidades con sus reglas de negocio y las interfaces (puertos) que necesita del exterior — nunca importa Express ni Prisma. La aplicación (`application/`) tiene los casos de uso, que orquestan el dominio hablando solo contra esas interfaces. Los adaptadores (`adapters/`) son las implementaciones concretas: controllers que traducen HTTP, repositorios que implementan la persistencia con Prisma o Mongoose, clientes que hablan con Gemini o Cloudinary. Y `main/` es el único lugar que conoce las 4 capas — decide, en un archivo (`di-container.ts`), qué implementación concreta va en cada interfaz. Esto se repite igual en los 12 módulos de negocio: identidad, donaciones, solicitudes, trueques, entregas, IA, etc."

### Nivel 3 (respuesta técnica completa)
- **Evidencia real:** el cambio de proveedor de IA de Claude a Gemini fue una sola línea en `di-container.ts:295` — ningún caso de uso se tocó, porque ambos adaptadores (`GeminiAdapter`, `ClaudeAdapter`) implementan el mismo puerto `IIAProvider`. Es la prueba práctica, no solo teórica, de que el desacoplamiento funciona.
- **Diferencia con arquitectura por capas simple (MVC):** en MVC clásico, el modelo suele tener acceso directo a la BD y mezclarse con validación; acá el dominio ni sabe que existe una base de datos — solo conoce una interfaz `IDonacionRepository`.
- **Diferencia entre DDD, Hexagonal y Clean Architecture:** DDD decide *qué modelar* (Bounded Contexts como Donaciones, Solicitudes, Trueques, cada uno con su propio lenguaje); Clean Architecture decide *cómo se organizan las capas y la regla de dependencia* (de afuera hacia adentro); Hexagonal decide *cómo el núcleo se conecta con el exterior* (puertos y adaptadores). No compiten, se combinan.
- **Qué cumple correctamente:** la regla de dependencia se respeta en el 100% de los casos de uso revisados — ninguno importa Prisma/Express directamente.
- **Dónde hay acoplamiento/desviación:** `error-handler.middleware.ts` importa una clase de error desde `ClaudeAdapter.ts` (el adaptador *no* cableado) en vez de desde el puerto directamente — funciona porque ambos re-exportan el mismo símbolo, pero es un olvido de limpieza, no una violación grave.
- **Por qué era adecuada para DonaConnect:** permite testear casos de uso sustituyendo adaptadores por dobles, sin levantar Postgres/Mongo/Gemini reales; y demostró su valor real en el cambio de proveedor de IA.
- **Qué complejidad introdujo:** un archivo de composición grande (~460 líneas) y la necesidad de definir una interfaz antes de poder usar cualquier dependencia externa nueva — overhead real para un proyecto de este tamaño, aceptado como trade-off consciente (documentado en ADR-042/044).

**Ejemplo completo con flujo real:** ver sección 3 de esta guía, flujo de "Publicar donación" — muestra las 4 capas + el Event Bus reaccionando en paralelo.

---

## 3. Los 5 flujos que hay que dominar

### 3.1 Registro e inicio de sesión

**Registro:** `RegistroForm.tsx` → `POST /auth/registro` (público, sin auth) → `identidad.routes.ts:11` (audita como `CREAR USUARIO`) → `AuthController.registro` valida con `registroSchema` (Zod: nombre, correo, password 8-72 caracteres, `perfiles[]` con al menos 1, `aceptaTerminos: true` obligatorio) → `RegistrarUsuarioUseCase`: verifica correo no duplicado (409 si ya existe) → hashea con bcrypt (10 rondas) → crea el `Usuario` con `rol: 'USUARIO'` hardcodeado (nunca lo elige el cliente) → guarda en Postgres (`usuarios` + `usuarios_perfiles`) → emite evento `UsuarioRegistrado` → responde `201`.

**Login:** `LoginPage.tsx` → `POST /auth/login` → `IniciarSesionUseCase`: busca por correo (401 si no existe, sin auditar) → compara password con bcrypt (401 si falla, sí se audita `LOGIN_FALLIDO`) → verifica usuario activo (403 si no) → lee los perfiles del usuario → firma un JWT (HS256, 8 horas, con `sub`/`rol`/`perfiles` embebidos) → responde `200` con `{token, usuario}` → frontend guarda el token en `sessionStorage`.

**Dato clave:** cambiar los perfiles de un usuario (`PATCH /usuarios/me/perfiles`) no tiene efecto hasta el siguiente login, porque los perfiles ya están "horneados" dentro del JWT viejo.

### 3.2 Publicar una donación

`DonacionWizard.tsx` (5 pasos, sugerencia IA opcional en el último) → `POST /donaciones` → `authMiddleware` (¿hay sesión?) → `perfilMiddleware(['DONANTE'])` (¿tiene ese perfil?) → `auditarCreacion` → `DonacionesController.crear` valida con Zod → `PublicarDonacionUseCase`: valida la categoría contra Postgres, crea la entidad `Donacion` (estado inicial `PUBLICADA`), guarda vía `PrismaDonacionRepository`, emite `DonacionPublicada` → responde `201`.

**En paralelo, sin bloquear la respuesta ya enviada:** el Event Bus dispara 2 listeners — `ModeracionIAService` (llama a Gemini para evaluar riesgo, registra en Mongo, nunca bloquea la publicación) y `PublicacionIndexService` (indexa en la proyección "mis publicaciones").

### 3.3 Crear y atender una solicitud

**Crear:** mismo patrón que la donación, con perfil `SOLICITANTE`.

**Atender (= aceptar oferta, 1 solo paso):** un `DONANTE` hace `POST /solicitudes/:id/ofertas` → `CrearOfertaUseCase` valida que no sea su propia solicitud ni una donación ajena → la oferta nace **ya aceptada** (no hay negociación previa, decisión de diseño documentada, no un bug) → la Solicitud pasa a `ACEPTADA_POR_DONANTE` → se crea automáticamente una `Entrega` → la respuesta de esta llamada puntual incluye la ubicación exacta de la solicitud (ver hallazgo #2 de la sección 1).

### 3.4 Publicar y proponer trueque

**Publicar:** mismo patrón, perfil `TRUEQUE`.

**Proponer (2 pasos, a diferencia de Solicitud):** `POST /trueques/:id/propuestas` crea una propuesta **pendiente** (no auto-acepta) → el dueño del trueque origen responde con `PATCH /trueques/:id/propuestas/:id { aceptar: true }` → `ResponderPropuestaUseCase` transiciona **ambos** trueques (origen y ofrecido — dos aggregates distintos) a `EN_COORDINACION`, crea la `Entrega`.

### 3.5 Consultar al chatbot con Gemini

`ChatWidget.tsx`/`ChatbotPage.tsx` → `POST /chatbot/mensajes { texto, sesionId }` → `authMiddleware` → `ChatearUseCase` → `ChatbotOrquestacionService`: busca o crea la conversación del usuario en Mongo (1 documento por usuario), arma un historial acotado a los últimos 15 mensajes, llama `GeminiAdapter.chat()` (modelo `gemini-3.5-flash`, `systemInstruction` fijo acotando el alcance del bot, sin JSON Schema — texto libre) → persiste ambos mensajes → responde `200`.

**Dato para no olvidar decir:** este es el único flujo del frontend sin manejo de errores — si Gemini falla, el usuario no ve ningún mensaje, solo el widget deja de mostrar "…".

---

## 4. Perfiles funcionales

- **Usuario:** la persona registrada.
- **Rol (seguridad):** `ADMINISTRADOR` o `USUARIO` — controla acceso al panel admin. Nunca lo elige el usuario en el registro (siempre `USUARIO`).
- **Perfil funcional (marketplace):** `DONANTE`, `SOLICITANTE`, `TRUEQUE` — capacidad de publicar/ofertar/proponer. Un usuario puede tener 0 a 3 simultáneamente.
- **Permiso:** en este proyecto no existe un cuarto concepto de "permiso fino" — la autorización se resuelve con Rol + Perfil + "es dueño del recurso" (verificado dentro de cada caso de uso).

**Por qué se modificó el modelo original (20s):** "Antes había un solo campo `rol` con 4 valores que mezclaba seguridad con capacidad de negocio — un usuario no podía ser Donante y Solicitante a la vez sin usar un valor especial. Lo separamos en dos conceptos independientes."

**Técnica (1 min):** "El modelo viejo (`ADMINISTRADOR|DONANTE|BENEFICIARIO|USUARIO_COMUNIDAD`) hubiera necesitado un enum combinatorio de hasta 15 valores para representar todas las combinaciones posibles de capacidades. Separamos `Rol` (2 valores, seguridad pura) de `PerfilFuncional` (3 valores, en una tabla 1-a-muchos `usuarios_perfiles`), así un usuario puede tener cualquier combinación sin explotar el enum. De paso corregimos un hallazgo de seguridad real: el registro público antes aceptaba `rol: 'ADMINISTRADOR'` sin ninguna verificación — ahora el rol de seguridad nunca lo elige el usuario."

**Qué puede hacer cada uno:**
- Donante: publicar donaciones, ofertar sobre solicitudes ajenas.
- Solicitante: publicar solicitudes.
- Trueque: publicar objetos de trueque, proponer intercambios.
- Comunidad: **ya no existe** — se removió (ADR-049) porque no representaba ninguna capacidad real distinta de tener los otros 3 perfiles a la vez, y construir una verdadera "Organización con beneficiarios propios" quedó fuera de alcance.

**Cómo se adapta el menú:** no se adapta — decisión explícita, los 7 ítems de navegación son iguales para cualquier usuario autenticado. Solo los *botones de acción* dentro de cada página se condicionan por perfil.

**Cómo se protegen los endpoints:** `perfilMiddleware(['DONANTE'])` a nivel de ruta (qué tipo de acción) + verificación de dueño dentro del caso de uso (sobre qué recurso concreto).

**Por qué ocultar un botón en el frontend no alcanza:** porque cualquiera puede llamar `POST /donaciones` directo con `curl` o Postman, sin pasar por la UI — la única protección real está en el backend (`perfilMiddleware`), el frontend es solo UX.

---

## 5. Gemini y el chatbot

- **Qué es:** la familia de modelos de IA generativa de Google.
- **Modelo real:** `gemini-3.5-flash` para el chatbot, `gemini-2.5-flash-lite` para clasificación/matching/moderación (más barato, tareas de alto volumen).
- **Dónde se configura:** una variable `IA_API_KEY` (genérica, no específica de proveedor).
- **Cómo se protege la key:** solo vive en el backend — el frontend nunca la ve, ni siquiera indirectamente (no hay ningún import de `@google/genai` en el frontend).
- **Cómo llega una pregunta hasta Gemini:** `ChatWidget.tsx` → `POST /chatbot/mensajes` → `ChatearUseCase` → `ChatbotOrquestacionService` → `GeminiAdapter.chat()` → SDK `@google/genai` → API de Gemini.
- **Cómo se construye el prompt:** un `systemInstruction` fijo (acota el rol del bot) + los últimos 15 mensajes de historial + el mensaje nuevo.
- **¿Se almacena historial?** Sí, completo, en Mongo (1 documento por usuario) — el recorte a 15 es solo al leer para enviar a Gemini, no se borra nada.
- **¿Qué información se envía?** El texto de los mensajes del usuario y, para clasificación/moderación/matching, el título/descripción de las publicaciones (información que de todas formas será pública).
- **¿Qué pasa si Gemini no responde o la key falta?** `503 Service Unavailable` en esa llamada puntual — el resto de la API sigue funcionando.
- **¿Qué sigue funcionando sin Gemini?** Todo lo demás: publicar, ofertar, coordinar entregas, mensajería, notificaciones, dashboard, administración.
- **¿Cómo se controlan alucinaciones?** Solo estructuralmente en clasificación/matching/moderación (JSON Schema con `enum` cerrado tomado en vivo de la base de datos real) — el chatbot (texto libre) no tiene ningún control de este tipo.
- **¿Cómo se mitiga prompt injection?** Parcialmente — el texto de usuario se interpola sin delimitador defensivo, mitigado porque la salida está forzada a un formato JSON fijo (no puede "escaparse" del schema, aunque sí podría intentar influir en el *valor* de un campo).
- **¿Por qué Gemini y no un chatbot desde cero (reglas)?** Un chatbot de reglas cubre solo preguntas anticipadas; un modelo generativo entiende variaciones de fraseo sin anticipar cada árbol de conversación.
- **¿Podría reemplazarse por OpenAI/Claude/local?** Sí, en teoría de forma barata — el puerto `IIAProvider` ya lo permite, y `ClaudeAdapter.ts` existe implementándolo (aunque no está cableado hoy). OpenAI/local no tienen adaptador construido.

**Distinciones a tener claras:** el *chatbot* es 1 de 4 usos del modelo generativo (los otros 3 son clasificación, matching, moderación) — todos comparten el mismo proveedor pero con prompts y formatos de salida distintos. El *contexto* es lo que se envía en cada llamada (historial + mensaje); el *historial* es lo que se persiste completo en Mongo.

**No atribuir a Gemini:** cálculo de distancia geográfica (no existe, el matching solo filtra por categoría+estado), moderación automática que bloquea publicaciones (nunca bloquea, solo marca para revisión humana), reintentos automáticos ante fallo (no hay retry configurado).

---

## 6. Cloudinary

**Simple:** "Las fotos no se guardan en la base de datos — se suben directo desde el navegador a Cloudinary, un servicio externo especializado en imágenes. El backend solo guarda la URL resultante."

**Técnica:** El backend calcula una firma (SHA1 de los parámetros ordenados alfabéticamente + el secreto de la cuenta) sin recibir el archivo — `CloudinariaAdapter.firmarSubida()`, síncrono, sin llamada de red. El navegador usa esa firma para subir el binario directo a la API de Cloudinary. El backend nunca ve el archivo, solo recibe de vuelta `{url, publicId}` para persistirlos en Postgres.

- **Por qué no BLOB en Postgres:** requisito explícito del SRS — evita que la base de datos crezca sin control con binarios, y saca ese tráfico del backend.
- **Qué se almacena en BD:** solo `url` y `publicId` (para poder borrar la imagen en Cloudinary después si hiciera falta).
- **Qué variables deben ser secretas:** `CLOUDINARY_API_SECRET` (usado para firmar) — `CLOUDINARY_API_KEY`/`CLOUD_NAME`/`UPLOAD_PRESET` sí viajan al cliente (son necesarios para que el navegador arme el request).
- **Qué ocurre si falla:** `503` al pedir la firma (si no está configurado); si falla la subida en sí (red, límite de Cloudinary), el frontend muestra un mensaje genérico de error.
- **Riesgos:** la validación de tipo/tamaño (5MB, JPEG/PNG/WEBP) se hace sobre lo que el *cliente declara* (`mimeType`/`tamanoBytes`), no sobre el binario real — el backend nunca lo inspecciona porque nunca lo recibe. Por eso no hay que confiar solo en la validación del frontend: la del backend repite la misma verificación (defensa en profundidad, aunque ambas confían en metadatos declarados).

---

## 7. OpenStreetMap (geolocalización)

- **Para qué se usa:** autocompletar provincia/ciudad cuando el usuario presiona "Usar mi ubicación actual" en el formulario de publicación.
- **Qué procesa:** latitud/longitud del navegador → los envía a la API pública y gratuita de Nominatim (OpenStreetMap) → recibe una dirección estructurada, que se normaliza contra la lista fija de provincias de Ecuador.
- **Cómo se protege la ubicación exacta:** por diseño de DTO en el backend (ADR-019) — nunca se expone en los endpoints públicos de listado/detalle, salvo al dueño/admin/la revelación puntual ya explicada.
- **Cuándo se pide la dirección del donante:** solo si la donación requiere retiro en domicilio.
- **Diferencia entre coordenadas aproximadas y ubicación exacta:** las coordenadas GPS son solo referencia opcional que el usuario puede agregar; "ubicación exacta" en el sentido de ADR-019 se refiere a `latitud`/`longitud`/`referencia` en el registro de `Ubicacion`.
- **Riesgos de privacidad:** el uso de Nominatim es 100% del lado del navegador, sin pasar por el backend — no hay ningún control propio de qué se envía a ese servicio externo más allá de las coordenadas mismas.
- **Qué pasa si no responde:** el usuario completa provincia/ciudad manualmente, el flujo nunca se bloquea.
- **Diferencia con Google Maps:** Nominatim es gratuito y sin necesidad de API key; Google Maps requeriría facturación y clave — y de hecho, el proyecto **declara** una variable `MAPS_API_KEY` (para un supuesto "servicio de Mapas" pago) que **nunca se usa en ningún lado del código** — es una variable de entorno muerta.

**No atribuir:** cálculo de distancia/radio geográfico entre usuarios (no existe en ningún lado del proyecto, ni en matching ni en listados).

---

## 8. n8n — removido

- **Por qué aparecía en el diseño inicial:** planeado como capa de automatización para enviar correos electrónicos de notificación (login/registro no tenían nada que ver, era solo el canal de correo de eventos como "te aceptaron una oferta").
- **Qué iba a automatizar:** el envío de 7 tipos de correo para eventos de "alto valor".
- **Por qué se eliminó:** el workflow nunca se terminó de configurar en la interfaz de n8n (la petición devolvía 404) — en vez de dejarlo a medio construir indefinidamente, se decidió (ADR-047) eliminarlo por completo: el contenedor Docker, el adaptador, las variables de entorno.
- **Qué lo reemplazó:** nada — las notificaciones quedaron **solo in-app** (feed dentro de la plataforma, Mongo), sin canal de correo.
- **Qué documentos podrían mencionarlo todavía:** `docs/fases/fase-08-automatizaciones.md` (marcada como removida en su propio historial) y ADR-001/002/028-031 en `DECISIONES.md` (marcados como "revertidos" o "sin objeto", no borrados — la política del log de decisiones es nunca borrar entradas, solo marcar reemplazos).
- **Por qué eliminar algo mejora el proyecto:** mantener una integración a medio construir es peor que no tenerla — genera falsa expectativa de que "el correo funciona" cuando no es así. Es un buen ejemplo de manejo honesto de deuda técnica.
- **Qué habría aportado:** notificaciones fuera de la sesión activa (el usuario se entera aunque no tenga la app abierta).
- **Qué complejidad habría introducido:** un servicio más para operar, credenciales SMTP que gestionar, un flujo de configuración manual (n8n UI) fuera del control de versiones del código.

---

## 9. Docker

### 20 segundos
"Localhost es *dónde* accedemos al sistema; Docker es *cómo* lo ejecutamos — corremos Postgres, MongoDB, el backend y el frontend en contenedores, todos accesibles desde `localhost`, para tener las mismas versiones exactas en cualquier máquina sin instalar nada manualmente."

### 1 minuto
"Docker Compose orquesta 4 servicios en una red interna: `postgres` (18.3), `mongo` (8.3.4), `api` (el backend Express) y `web` (el frontend Vite). Cada uno corre en su propio contenedor, aislado, pero se comunican entre sí por nombre de servicio dentro de la red Docker — el backend le habla a Postgres como `postgres:5432`, no como `localhost`. Los datos persisten en volúmenes nombrados que sobreviven a reiniciar los contenedores. `postgres`/`mongo` tienen healthchecks reales, así que `api` espera a que Postgres esté *realmente* listo antes de arrancar, no solo a que el contenedor exista."

### Nivel técnico completo
- **Imagen:** plantilla de solo lectura (`postgres:18.3-alpine`, `node:22-alpine` para backend/frontend con `Dockerfile` propio).
- **Contenedor:** instancia en ejecución de una imagen.
- **Red:** `donaconnect-network`, bridge, resuelve nombres de servicio como hostname DNS interno.
- **Puertos:** Postgres remapeado a 5433 en el host (evita chocar con un Postgres nativo del desarrollador); Mongo, backend y frontend en sus puertos estándar (27017, 4000, 5173).
- **Volúmenes:** `postgres_data`/`mongo_data` (nombrados, persistentes) + bind mounts del código (`./backend:/app`, hot-reload) + volúmenes anónimos de `node_modules` (separados del bind mount para no taparlo).
- **Dockerfile del backend:** en cada arranque (no solo en el build) regenera el cliente Prisma y aplica migraciones pendientes automáticamente — porque `node_modules` vive en un volumen separado del código montado.
- **Dockerfile del frontend:** corre el dev server de Vite, sin build de producción — coherente con que el entorno objetivo es `localhost`.
- **Comunicación por nombre de servicio:** `DB_POSTGRES_URL` dentro del contenedor `api` usa `postgres:5432`; el frontend (que corre en el navegador, fuera de la red Docker) usa `http://localhost:4000`.
- **Desventajas reales:** overhead de recursos (4 contenedores vs. procesos nativos), curva de aprendizaje si el evaluador no conoce Docker, y ningún `Dockerfile` copia `package-lock.json` antes de `npm install` — la build no es tan reproducible como podría ser (hallazgo de la auditoría).

---

## 10. PostgreSQL y MongoDB

- **Qué almacena Postgres:** estado transaccional del negocio — usuarios, perfiles, ubicaciones, categorías, donaciones, solicitudes, ofertas, trueques, propuestas, entregas, imágenes (metadatos), auditoría. 11 tablas.
- **Qué almacena Mongo:** datos conversacionales/append-only — análisis de IA, conversaciones del chatbot, mensajes usuario↔usuario, eventos de sistema (KPI), notificaciones, y el índice de "mis publicaciones". 6 colecciones.
- **Cómo se relacionan:** solo por IDs de string guardados en ambos lados — nunca una FK real entre motores distintos (técnicamente imposible).
- **Por qué no hay join entre ambos:** son motores distintos, sin ningún mecanismo nativo de join cruzado — se resuelve haciendo 2 consultas separadas cuando hace falta combinar datos.
- **Ventajas de la persistencia políglota:** Postgres da integridad fuerte (FK, unicidad, transacciones) donde el negocio la necesita (una oferta no puede duplicarse); Mongo da flexibilidad de esquema y escritura rápida donde perder un dato no corrompe nada (un mensaje perdido no rompe una máquina de estado).
- **Complejidad introducida real:** 2 clientes de BD que mantener (Prisma + Mongoose), 2 formas de migrar esquema (migraciones versionadas vs. esquema flexible sin versión), sin transacciones cruzadas.
- **Riesgo de inconsistencia:** si una escritura Mongo falla después de que Postgres ya se confirmó, el estado de negocio queda correcto pero puede faltar una notificación o el índice de "mis publicaciones" queda desactualizado — nunca se corrompe una máquina de estado real, porque las escrituras Mongo siempre son "de segundo orden" (reacciones, no la fuente de verdad).
- **Qué pasa si una base falla:** si cae Postgres, casi toda la API deja de funcionar (es la fuente de verdad del negocio); si cae Mongo, fallan chatbot/mensajería/notificaciones/dashboard, pero publicar/ofertar/aceptar en Postgres sigue funcionando.

**Crítica honesta que el docente podría hacer, y cómo responder:** "¿Era realmente necesario usar dos motores para un proyecto de este tamaño?" — Respuesta honesta: "El volumen de datos real de este proyecto académico probablemente cabría cómodo en un solo Postgres con JSON columns para lo conversacional. La justificación real no es volumen, es separación de responsabilidades y práctica de un patrón de la industria (persistencia políglota) — es una decisión defendible pero no estrictamente necesaria a esta escala; en un proyecto más chico, un solo motor hubiera sido más simple de operar."

---

## 11. Construcción desde cero — lo que hay que saber vs. lo que es solo referencia

**Obligatorio dominar:**
- `npm install` (backend y frontend) — desde `backend/`/`frontend/` respectivamente.
- `npx prisma migrate dev` / `npx prisma generate` — desde `backend/`, después de tocar `schema.prisma`.
- `docker compose up` / `docker compose down` — desde la raíz del repo.
- `npm run dev` (backend: `tsx watch`; frontend: `vite`).
- `npm test` (backend, `vitest run`) — desde `backend/`.

**Importante reconocer (poder explicar qué hace, sin necesitar teclearlo de memoria):**
- `npx prisma studio` — UI de inspección de datos.
- `npm run build` (`tsc -p ... && tsc-alias -p ...` en backend — dos pasos, no uno).
- `docker compose logs -f api` — ver logs en vivo.
- `docker compose exec api sh` — entrar a un contenedor corriendo.

**Solo referencia (saber que existe, no hace falta memorizar el comando exacto):**
- `prisma migrate deploy` (usado automáticamente por el `Dockerfile`, no se corre a mano normalmente).
- `tsc --init` / configuración inicial de `tsconfig.json`.
- `npm create vite@latest`.

**Errores frecuentes documentados:**
- Olvidar `tsc-alias` en el build → los path aliases (`@domain/*`) no se resuelven en producción.
- Migrar un enum que remueve valores con datos existentes usando un cast directo → falla; hace falta el patrón *expand-and-contract*.
- Olvidar completar `.env` → el backend arranca igual, pero IA/Cloudinary responden `503` en vez de crashear (degradación intencional).

---

## 12. Las 15 librerías más importantes

**Backend:**
1. `express` — framework HTTP, base de toda la capa de entrada.
2. `@prisma/client` + `prisma` — ORM tipado para Postgres, migraciones versionadas.
3. `mongoose` — ODM para MongoDB.
4. `zod` — validación de DTOs con inferencia de tipos TS, usada en el 100% de los endpoints con body/query.
5. `bcrypt` — hash de contraseñas (10 rondas), sin el cual se violaría directamente un requisito de seguridad.
6. `jsonwebtoken` — firma/verificación de JWT, base de toda la autenticación stateless.
7. `helmet` — cabeceras HTTP seguras (CSP, etc.).
8. `cors` — controla qué orígenes pueden llamar la API.
9. `pino`/`pino-http` — logging estructurado con trazabilidad por request.
10. `@google/genai` — SDK oficial de Gemini, el proveedor de IA realmente cableado.

**Frontend:**
11. `react`/`react-dom` — base de la SPA.
12. `react-router-dom` — enrutamiento, 18 rutas declaradas.
13. `@tanstack/react-query` — cache/invalidación de estado de servidor, reemplaza a Redux/Zustand por decisión explícita.

**Testing/build:**
14. `vitest` + `supertest` — pruebas de integración reales contra Postgres/Mongo.
15. `typescript` (ambos proyectos) — tipado end-to-end, combinado con Prisma para reducir errores de integración.

Detalle de cada una (alternativas consideradas, qué pasaría si se elimina) en `07_LIBRERIAS.md`.

---

## 13. Los 6 archivos de código que hay que poder explicar

Orden recomendado para mostrar en la exposición (de lo más simple a lo más rico):

1. **`auth.middleware.ts`** (37 líneas) — el más corto, buen punto de entrada. Responsabilidad: verificar el JWT. Entrada: `req.headers.authorization`. Salida: `req.usuario` poblado o `401`. Pregunta probable: "¿por qué es una factory function (`crearAuthMiddleware`) y no el middleware directo?" → Respuesta: para inyectar el `tokenService` concreto desde `di-container.ts` sin acoplarse a una implementación específica dentro de `main/middlewares`. Error común al explicarlo: confundir `authMiddleware` (rechaza sin token) con `authOpcionalMiddleware` (permite anónimo).

2. **`perfil.middleware.ts`** (18 líneas) — mismo patrón, autorización por perfil funcional. Entrada: array de perfiles permitidos. Salida: `next()` o `403`. Pregunta probable: "¿por qué recibe un array y no un solo perfil?" → Reutilizable para rutas que acepten cualquiera de varios perfiles.

3. **`donaciones.controller.ts`** (98 líneas) — el controller más representativo. Responsabilidad: traducir HTTP a invocación de caso de uso, sin lógica de negocio. Entrada: `Request` de Express. Salida: `Response` con el envelope estándar. Dependencias: 7 casos de uso inyectados por constructor. 5 bloques clave: el patrón `parse→ejecutar→responder` repetido en cada método; el uso de arrow functions como propiedades de clase (evita perder `this`); `req.usuario!.sub` (aserción no-nula, TS no puede saber que `authMiddleware` ya lo garantizó); `204` sin body en `cancelar`; desestructuración con rest (`...filtros`) en `listar`. Error común: pensar que el controller valida reglas de negocio — no, solo forma de los datos (Zod).

4. **`CrearOfertaUseCase.ts`** (92 líneas) — el caso de uso más rico (orquesta 2 entidades + 1 domain service + 2 eventos). Responsabilidad: aceptar una oferta en un solo paso y disparar la coordinación de entrega. Entrada: IDs + mensaje opcional. Salida: la `Solicitud` actualizada, serializada con ubicación exacta forzada. Pregunta probable: "¿por qué emite 2 eventos en vez de 1?" → Cada evento tiene un propósito semántico distinto, permite que listeners futuros reaccionen selectivamente.

5. **`PrismaDonacionRepository.ts`** (132 líneas) — el repositorio más completo. Responsabilidad: traducir entre la entidad de dominio y las tablas Postgres. Entrada: entidad `Donacion` o filtros primitivos. Salida: filas SQL o entidades reconstruidas. 5 bloques clave: `implements IDonacionRepository` (el compilador obliga a cumplir el contrato); consulta separada para imágenes (relación polimórfica sin FK); `Promise.all` para paralelizar `findMany`+`count`; conversión explícita de `Decimal` (Postgres) a `number` (JS); el patrón N+1 aceptado como trade-off (una consulta de imágenes por fila listada). Error común: no notar que es un patrón N+1 real, aunque paralelizado.

6. **`Donacion.ts`** (191 líneas, la entidad) — el corazón del dominio. Responsabilidad: reglas de negocio e invariantes de una donación. Entrada: ninguna externa — solo se construye vía `crear()`/`reconstituir()`. Salida: la propia instancia + errores de dominio si se viola una regla. 5 bloques clave: constructor privado (fuerza pasar por los factory methods); `crear()` valida la regla "retiro exige ubicación" antes de construir; `estaFinalizada()` como guarda reutilizada en 3 métodos; `toJSON({incluirUbicacionExacta})` con spread condicional (implementa ADR-019 al nivel del dominio, no del controller); getters de solo lectura (nunca asignación directa). Error común: pensar que el `estadoDonacion` se puede asignar directo — no, siempre a través de un método con guarda.

**Detalle línea por línea completo:** `05_EXPLICACION_CODIGO.md`.

---

## 14. Lo que NO debo afirmar

- Que hay rate limiting implementado — no lo hay.
- Que la ubicación exacta de una donación se revela al beneficiario que la recibe — no hay mecanismo verificado para eso.
- Que Solicitudes tiene el mismo flujo de fotos que Donaciones/Trueques — no, usa un campo de texto.
- Que el chatbot maneja errores con un mensaje visible — no, falla en silencio.
- Que existe el perfil "Comunidad" — fue removido (ADR-049).
- Que n8n o el envío de correo funcionan — fueron eliminados por completo.
- Que hay tests de frontend — no existe ni uno.
- Que Gemini calcula distancia geográfica para el matching — no, solo filtra por categoría/estado.
- Que `MAPS_API_KEY` se usa para algo — es una variable muerta.
- Que el proyecto está listo para producción sin cambios — hay hallazgos de prioridad Alta sin resolver.
- Que todo cambio de perfil tiene efecto inmediato — requiere re-login (el JWT ya emitido no se actualiza solo).

## 15. Lo que SÍ puedo demostrar con evidencia

- Los 16 casos de uso del SRS, 13 completos y 3 con matices documentados con precisión.
- Arquitectura Clean+DDD+Hexagonal aplicada consistentemente, con una prueba práctica real (cambio de proveedor de IA en 1 línea).
- Autenticación real (bcrypt+JWT), autorización en 2 niveles (perfil+rol), auditoría de 10 tipos de acción.
- Integración real y funcional con Gemini (4 usos distintos), Cloudinary (subida firmada) y OpenStreetMap (geolocalización gratuita).
- 6 archivos de test de integración real, contra bases de datos reales, corriendo en CI.
- Los 4 contenedores Docker levantando el sistema completo con un solo comando.
- 11 tablas Postgres + 6 colecciones Mongo, con un diccionario de datos completo y verificado.
- Una migración de datos real ejecutada sin incidentes (23 usuarios, patrón expand-and-contract).
- 20 hallazgos de deuda técnica identificados y priorizados con honestidad, no ocultados.
