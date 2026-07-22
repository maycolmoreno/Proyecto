# Fichas de Preguntas Difíciles — DonaConnect Ecuador

20 fichas, priorizadas hacia las preguntas que cuestionan decisiones (no las que solo piden describir). Formato: pregunta → respuesta corta (20s) → respuesta técnica → evidencia → error a evitar.

---

### Ficha 1 — "¿No es excesiva la arquitectura para un proyecto universitario?"

**Corta:** "Es más de lo estrictamente necesario para 6 semanas, sí — pero la elegimos a propósito para demostrar el patrón, y tuvo un retorno real: nos permitió cambiar de proveedor de IA sin tocar lógica de negocio."
**Técnica:** El costo real es un archivo de composición grande (~460 líneas) y la necesidad de definir una interfaz antes de poder usar cualquier dependencia externa nueva. Es honesto reconocer que para un CRUD simple esto es sobre-ingeniería — pero el proyecto no es un CRUD simple, tiene 12 módulos con reglas de negocio reales (máquinas de estado, invariantes) y una integración de IA que efectivamente cambió de proveedor durante el desarrollo.
**Evidencia:** `di-container.ts:295` (1 línea para cambiar Claude→Gemini).
**Evitar decir:** "No, la arquitectura es perfecta para este tamaño" — suena a que no se pensó el trade-off. Mejor reconocer el costo y justificar por qué se aceptó.

---

### Ficha 2 — "¿Por qué usar dos bases de datos?"

**Corta:** "Separamos por tipo de dato: lo que tiene reglas de negocio estrictas va a Postgres, lo conversacional a Mongo."
**Técnica:** Postgres protege máquinas de estado con FK/unicidad (una oferta no puede duplicarse, por constraint de negocio en la entidad — no hay constraint de BD para eso específicamente, pero sí para otras invariantes). Mongo es append-only para mensajes/notificaciones/historial de IA, donde perder un documento no corrompe el negocio.
**Evidencia:** `10_POSTGRESQL_Y_MONGODB.md §1,§6` — qué pasa si una escritura Mongo falla después de que Postgres ya confirmó (el negocio queda íntegro, solo falta una notificación).
**Evitar decir:** que era estrictamente necesario por volumen de datos — no lo es a esta escala; la justificación real es de patrón/separación de responsabilidades, no de performance.

---

### Ficha 3 — "¿Por qué depender de Gemini? ¿Qué pasa si Google cambia los términos o el servicio se cae?"

**Corta:** "El puerto que definimos (`IIAProvider`) hace que cambiar de proveedor sea barato — ya lo demostramos una vez, cambiando de Claude a Gemini."
**Técnica:** Sin Gemini configurado, el sistema responde `503` solo en las llamadas que necesitan IA — el resto de la API (publicar, ofertar, coordinar entregas) sigue funcionando. No hay proveedor de respaldo automático en runtime, sería un cambio manual de una línea.
**Evidencia:** `IAProviderNoConfiguradoError` → `503`, `08_INTELIGENCIA_ARTIFICIAL.md §19`.
**Evitar decir:** que hay failover automático — no lo hay, es manual.

---

### Ficha 4 — "¿Por qué Docker si solamente se ejecuta en una computadora?"

**Corta:** "Localhost es dónde accedemos, Docker es cómo lo ejecutamos — no son opuestos."
**Técnica:** Sin Docker, cada evaluador necesitaría instalar Node 22, Postgres 18.3 y MongoDB 8.3.4 exactos a mano, con el riesgo de versiones distintas causando comportamientos distintos ("en mi máquina funciona"). Con Docker, `docker compose up` deja el sistema idéntico funcionando en cualquier máquina con Docker instalado.
**Evidencia:** `09_DOCKER.md §6` (tiene la respuesta completa armada).
**Evitar decir:** que Docker es obligatorio para que el proyecto funcione — técnicamente podría correr sin él, instalando todo nativo; el argumento es de consistencia y reproducibilidad, no de necesidad absoluta.

---

### Ficha 5 — "¿Por qué ocultar módulos por perfil? ¿No sería más simple mostrar todo a todos?"

**Corta:** "No ocultamos módulos — el menú es igual para todos; solo condicionamos los botones de *acción* según lo que ese perfil puede hacer."
**Técnica:** Decisión explícita: Donaciones/Solicitudes/Trueques son navegación pública para cualquier autenticado (se puede *ver* todo); los perfiles solo gatean poder *publicar/ofertar/proponer*. Es una decisión de UX, no de seguridad — la seguridad real está en el backend.
**Evidencia:** `14_FRONTEND_Y_ROLES.md §3`.
**Evitar decir:** que el menú se filtra por rol — no es cierto, es uniforme.

---

### Ficha 6 — "¿Cómo garantiza el sistema que un usuario no llame directamente al endpoint saltándose el frontend?"

**Corta:** "El frontend no protege nada — la autorización real vive en el backend, en middlewares que se ejecutan sin importar cómo llegue la petición."
**Técnica:** `perfilMiddleware`/`rbacMiddleware` a nivel de ruta Express verifican el JWT y el perfil/rol *antes* de que la petición llegue al controlador, sin importar si vino del navegador, de Postman o de un script. La ocultación de un botón en React es solo UX, nunca la única barrera.
**Evidencia:** `donaciones.routes.ts:12,22` — `perfilMiddleware(['DONANTE'])` antes del controller.
**Evitar decir:** que "el frontend valida los permisos" como si fuera suficiente — nunca lo es.

---

### Ficha 7 — "¿Qué pasa si Cloudinary falla después de crear la publicación?"

**Corta:** "La publicación ya existe sin fotos — el usuario puede reintentar subir la imagen después, el registro de la donación no depende de que la imagen se suba con éxito."
**Técnica:** `POST /donaciones` crea la entidad primero; la firma y subida de imágenes son endpoints separados (`POST .../imagenes/firma`, `POST .../imagenes`), llamados después desde el frontend. Si Cloudinary falla en el medio, la donación queda publicada sin imágenes — no hay rollback automático de la publicación.
**Evidencia:** `04_COMUNICACION_ENTRE_CAPAS.md` (flujo de publicar donación, la creación de imagen es una llamada aparte); `12_API_ENDPOINTS.md §2`.
**Evitar decir:** que hay una transacción que revierte todo si falla la imagen — no existe eso, son pasos independientes.

---

### Ficha 8 — "¿Qué evidencia concreta demuestra que aplicaron DDD, y no solo carpetas con nombres bonitos?"

**Corta:** "Cada entidad tiene sus propias reglas de negocio como métodos, no solo como datos — y hay Domain Services para lógica que cruza entidades."
**Técnica:** `Donacion.marcarEntregada()`, `Solicitud.agregarOfertaAceptada()`, `Trueque.aceptarPropuesta()` — cada uno con guardas que lanzan excepciones de dominio si se viola una invariante (`DonacionYaFinalizadaError`, etc.), no solo setters. `EntregaCierreOrigenService` es un Domain Service real que orquesta 3 entidades distintas para cerrar un flujo completo.
**Evidencia:** `05_EXPLICACION_CODIGO.md §1` (la entidad `Donacion` completa, línea por línea) y `11_REGLAS_DE_NEGOCIO.md` (las 4 máquinas de estado con guardas reales).
**Evitar decir:** "usamos DDD porque las carpetas se llaman `domain`" — eso no es evidencia, la evidencia es el comportamiento dentro de las entidades.

---

### Ficha 9 — "¿Qué parte del diseño original no llegó a implementarse?"

**Corta:** "El concepto de 'Comunidad/Organización' con beneficiarios propios, la negociación con contraoferta en trueques, y evidencia fotográfica de entrega cumplida."
**Técnica:** Todos quedaron documentados como Fase 5 del diseño de perfiles (`DISENO_MODELO_PERFILES.md` sección 7), evaluados y conscientemente pospuestos — no son un descuido, son alcance recortado a propósito para el plazo académico.
**Evidencia:** ADR-049 (removió el perfil `COMUNIDAD` en vez de dejarlo sin funcionalidad real detrás).
**Evitar decir:** que "Comunidad" existe como funcionalidad — fue removido explícitamente.

---

### Ficha 10 — "¿Cuál fue el mayor error técnico que encontró la auditoría?"

**Corta:** "Que documentamos límites de frecuencia de peticiones (rate limiting) que nunca llegamos a implementar — es el hallazgo de mayor prioridad."
**Técnica:** Cero referencias a `rate-limit`/`express-rate-limit` en todo el backend, pese a que ADR-034 especifica límites concretos por endpoint. Impacto real: sin fricción técnica contra fuerza bruta en login, sin control de costo de las llamadas a Gemini.
**Evidencia:** `13_SEGURIDAD.md §6`, `17_DEUDA_TECNICA.md` hallazgo #2.
**Evitar decir:** que no hay ningún riesgo de seguridad — bcrypt sí hace cada intento de login costoso en CPU, pero eso no reemplaza un límite de frecuencia.

---

### Ficha 11 — "¿Por qué el rol de seguridad y el perfil funcional son cosas distintas? ¿No complica innecesariamente el modelo?"

**Corta:** "Porque mezclarlos hubiera necesitado un enum combinatorio de hasta 15 valores para representar todas las combinaciones de capacidades — separarlos con una tabla 1-a-muchos es más simple, no más complejo."
**Técnica:** El modelo anterior (`ADMINISTRADOR|DONANTE|BENEFICIARIO|USUARIO_COMUNIDAD`) ya mostraba el problema: `USUARIO_COMUNIDAD` era, en la práctica, "el que puede todo" — evidencia de que un solo campo se había quedado corto. `usuarios_perfiles` (1-a-muchos) resuelve "0 a 3 perfiles simultáneos" sin tocar el modelo de seguridad.
**Evidencia:** ADR-048 en `DECISIONES.md`, migración real ejecutada sobre 23 usuarios sin incidentes.
**Evitar decir:** que siempre fue así — fue un refactor real, motivado por una auditoría, no el diseño original del SRS.

---

### Ficha 12 — "Si la IA solo sugiere y nunca decide, ¿para qué sirve realmente?"

**Corta:** "Ahorra trabajo manual sin quitarle el control a la persona — sugiere una categoría, el usuario la confirma o la cambia; marca riesgo, el administrador decide si actúa."
**Técnica:** Es el principio *human-in-the-loop* (ADR-010/027) — deliberado, no una limitación técnica del modelo. Se podría dejar que la IA decidiera automáticamente, pero se eligió no hacerlo para no delegar decisiones de moderación de contenido a un sistema que puede alucinar o ser manipulado (prompt injection).
**Evidencia:** `ModeracionIAService.ts` nunca cambia el estado de una publicación, solo registra y notifica.
**Evitar decir:** que la IA "revisa" el contenido en el sentido de aprobarlo/rechazarlo — solo marca para que un humano revise.

---

### Ficha 13 — "¿Cómo saben que la arquitectura hexagonal realmente ayuda, y no es solo una moda que copiaron?"

**Corta:** "Porque tuvimos un cambio real de proveedor externo (IA) durante el desarrollo, y costó una línea de código gracias a esa arquitectura."
**Técnica:** Sin el puerto `IIAProvider`, cambiar de Claude a Gemini hubiera significado buscar y reemplazar cada llamada al SDK de Anthropic en cada caso de uso que usara IA (4 servicios de dominio). Con el puerto, fue cambiar qué clase se instancia en `di-container.ts`.
**Evidencia:** `GeminiAdapter.ts` y `ClaudeAdapter.ts` ambos implementan `IIAProvider`, coexisten en el código.
**Evitar decir:** que se planificó desde el inicio tener 2 proveedores — no, `ClaudeAdapter` quedó ahí después del cambio, no fue diseñado como "opción A/B" desde el principio.

---

### Ficha 14 — "¿Qué garantiza que un administrador no pueda hacerse pasar por un usuario común, o viceversa?"

**Corta:** "El rol va embebido y firmado dentro del JWT — no se puede falsificar sin la clave secreta del servidor."
**Técnica:** `JwtTokenService` firma con HS256 usando `JWT_SECRET` (solo el backend la conoce); cualquier alteración del payload invalida la firma y `tokenService.verificar()` la rechaza. El rol se fija en el login, leído de Postgres — nunca lo envía el cliente en cada request.
**Evidencia:** `ITokenService.ts:4-11` (payload), `JwtTokenService.ts` (firma/verificación).
**Evitar decir:** que el rol viaja "en texto plano sin protección" — viaja legible (JWT no está encriptado, solo firmado) pero no es modificable sin invalidar la firma.

---

### Ficha 15 — "¿Qué pasaría si dos personas ofertan sobre la misma solicitud al mismo tiempo?"

**Corta:** "La primera oferta que se procese gana — la segunda recibe un error claro porque la solicitud ya no acepta más ofertas."
**Técnica:** `Solicitud.agregarOfertaAceptada()` valida `puedeRecibirOferta()` (solo estados `ABIERTA`/`EN_REVISION`) antes de aceptar — una vez que la primera oferta la pone en `ACEPTADA_POR_DONANTE`, la segunda petición (si llega después en el tiempo) recibe `422 SolicitudNoAceptaOfertasError`. Si llegaran verdaderamente simultáneas, la garantía real depende de que Postgres serialice las escrituras sobre la misma fila — no se auditó específicamente una condición de carrera a nivel de base de datos en esta pasada.
**Evidencia:** `11_REGLAS_DE_NEGOCIO.md §2`.
**Evitar decir:** con total certeza que "es imposible" una condición de carrera — el diseño la previene en el caso normal, pero no se verificó con una prueba de concurrencia real.

---

### Ficha 16 — "¿Por qué eligieron TypeScript y no simplemente JavaScript, si igual iban a usar Node?"

**Corta:** "Porque combinado con Prisma nos da tipado de punta a punta — desde la base de datos hasta el frontend — y eso reduce errores de integración."
**Técnica:** El cliente Prisma se genera con tipos exactos de cada tabla; los DTOs de Zod infieren tipos TS automáticamente; el frontend comparte el mismo lenguaje. El costo es una curva de aprendizaje mayor y tiempo de compilación.
**Evidencia:** ADR-021.
**Evitar decir:** que TypeScript "previene todos los bugs" — solo errores de tipo, no de lógica.

---

### Ficha 17 — "¿No hubiera sido más simple usar un solo modelo `Publicacion` en vez de 3 entidades casi idénticas (Donación/Solicitud/Trueque)?"

**Corta:** "Se evaluó, y se descartó a propósito — fusionar el backend hubiera significado reescribir 3 Bounded Contexts completos por un beneficio de reutilización que el frontend ya resuelve con componentes compartidos."
**Técnica:** `PublicacionCard`, `FiltroPanel`, el patrón de wizard de 5 pasos — ya son genéricos y compartidos en el frontend, sin necesitar fusionar el modelo de datos. Fusionar en el backend complicaría las máquinas de estado, que son genuinamente distintas entre las 3 (Solicitud auto-acepta en 1 paso, Trueque negocia en 2, Donación no tiene negociación en absoluto).
**Evidencia:** ADR-048 (justificación explícita de por qué NO se fusionaron).
**Evitar decir:** que las 3 entidades son "iguales" — comparten forma pero tienen comportamiento genuinamente distinto.

---

### Ficha 18 — "¿Qué tan production-ready está este proyecto realmente?"

**Corta:** "No lo está del todo, y lo decimos con evidencia: falta rate limiting, HTTPS (por diseño, para localhost), y hay módulos sin tests — pero el MVP funcional y la arquitectura sí están sólidas."
**Técnica:** Ver la lista completa y priorizada en `17_DEUDA_TECNICA.md` — 3 hallazgos de prioridad Alta, ninguno es un rediseño, todos son extensiones acotadas.
**Evidencia:** `17_DEUDA_TECNICA.md`.
**Evitar decir:** "sí, está listo para producción" — no lo está, y decirlo sin matices sería una afirmación que el propio código contradice.

---

### Ficha 19 — "¿Cómo defienden la decisión de guardar el JWT en sessionStorage en vez de una cookie httpOnly, que es lo que recomienda OWASP?"

**Corta:** "Es un trade-off consciente, no un descuido — cookies httpOnly hubiera exigido reabrir una fase de diseño ya cerrada y agregar protección CSRF."
**Técnica:** Se mitiga el riesgo de XSS (el principal argumento a favor de httpOnly) con CSP vía Helmet, expiración corta (8h, sin refresh) y `sessionStorage` en vez de `localStorage` (no persiste entre pestañas cerradas). Es más vulnerable en teoría que httpOnly, pero las mitigaciones compensan parcialmente para el alcance académico.
**Evidencia:** ADR-032.
**Evitar decir:** que sessionStorage es "igual de seguro" que httpOnly — no lo es, es una decisión de trade-off con desventaja reconocida.

---

### Ficha 20 — "Si tuvieran una semana más, ¿qué arreglarían primero?"

**Corta:** "Rate limiting — es el hallazgo de mayor impacto real y la solución más acotada de toda la lista."
**Técnica:** En orden: (1) `express-rate-limit` con los 3 perfiles ya documentados en ADR-034; (2) persistir la ubicación de coordinación en el registro de `Entrega` en vez de depender de una respuesta HTTP puntual; (3) parejar el flujo de imágenes de Solicitudes con Donaciones/Trueques.
**Evidencia:** `17_DEUDA_TECNICA.md §1` (tabla de prioridad Alta).
**Evitar decir:** una respuesta vaga tipo "mejoraríamos el rendimiento" — tener siempre 2-3 ítems concretos y priorizados listos.
