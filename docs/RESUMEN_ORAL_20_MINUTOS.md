# Resumen Oral — 20 Minutos — DonaConnect Ecuador

Escrito para hablar, no para leer. Frases cortas, lenguaje natural. Cada bloque tiene duración aproximada, qué mostrar, y qué esperar del docente.

---

### 1. Problema social — 45s

"Buenas tardes. Voy a presentar DonaConnect Ecuador. La idea nace de un problema simple: hay personas y familias con objetos que ya no usan, y hay otras con necesidades concretas — y no existe un canal directo entre ambas, sin plata de por medio. DonaConnect conecta a esas dos puntas, y agrega un tercer modo: el trueque comunitario, para intercambiar directamente entre vecinos."

*(No mostrar nada todavía, solo hablar.)*

---

### 2. ODS — 30s

"Esto conecta directo con tres Objetivos de Desarrollo Sostenible: el 1, fin de la pobreza; el 10, reducción de las desigualdades; y el 12, consumo y producción responsables — porque estamos redistribuyendo cosas que ya existen, no fomentando comprar más."

---

### 3. Objetivo — 30s

"El objetivo central es simple: que publicar una donación, pedir ayuda, o proponer un trueque sea rápido y confiable, con un chatbot de apoyo que oriente al usuario, y con moderación asistida por IA para cuidar la calidad del contenido."

---

### 4. Alcance — 45s

"Dejamos afuera, a propósito, cualquier cosa que tenga que ver con plata — no hay pagos electrónicos. Tampoco certificamos legalmente si alguien realmente necesita ayuda, eso queda como información declarativa, con un disclaimer claro. Y no hacemos logística de transporte, solo coordinamos el contacto entre las partes."

*Mostrar:* `docs/fases/fase-00-comprension-proyecto.md` un segundo, para que se vea que hubo un proceso de diseño documentado.

---

### 5. Usuarios y perfiles — 1min 30s

"Acá quiero detenerme un poco porque es lo más interesante del proyecto en términos de decisiones de diseño. Un usuario puede tener hasta tres 'perfiles funcionales' a la vez: Donante, Solicitante, o participante de Trueque — y estos son independientes del rol de seguridad, que solo distingue entre Usuario normal y Administrador.

¿Por qué separamos esto? Porque al principio teníamos un solo campo 'rol' que mezclaba las dos cosas, y no alcanzaba — un usuario no podía ser donante y solicitante a la vez sin usar una categoría especial rara. Lo separamos en dos conceptos, y de paso corregimos algo que encontramos en una auditoría: el registro público antes permitía, técnicamente, crear un usuario administrador sin ninguna verificación. Ahora eso es imposible — el rol de seguridad nunca lo elige el que se registra."

*Mostrar:* `PerfilPage.tsx` en el navegador, activando/desactivando un perfil en vivo si es posible.

---

### 6. Arquitectura — 2min (la sección más importante, no apurarse)

"El backend está construido combinando tres ideas de arquitectura que suenan complicadas juntas pero resuelven problemas distintos: Domain-Driven Design decide *qué* modelamos — tenemos doce módulos de negocio, como Donaciones, Solicitudes, Trueques, cada uno con su propio lenguaje. Clean Architecture decide *cómo* organizamos las capas — tenemos cuatro: el dominio en el centro, con las reglas de negocio puras; los casos de uso alrededor, que orquestan esas reglas; los adaptadores, que son las implementaciones concretas — Prisma para la base de datos, Gemini para la IA; y finalmente un único punto de composición que conecta todo. Y la arquitectura Hexagonal decide *cómo* ese núcleo habla con el exterior — a través de interfaces, nunca directo.

Les puedo dar una prueba concreta de que esto no es solo teoría: originalmente el proyecto iba a usar Claude de Anthropic para la inteligencia artificial. En algún momento cambiamos a Gemini de Google, por acceso a una clave gratuita. Ese cambio fue *una línea* de código, en un solo archivo. Ningún caso de uso, ningún controlador, se tocó — porque ambos proveedores implementan la misma interfaz."

*Mostrar:* el árbol de carpetas `backend/domain`, `application`, `adapters`, `main` + abrir `di-container.ts` en la línea donde se instancia el adaptador de IA.

*Pregunta esperable:* "¿No es demasiada arquitectura para un proyecto universitario?" → tengo la respuesta lista en `FICHAS_PREGUNTAS_DIFICILES.md`.

---

### 7. Comunicación entre capas — 1min

"Para que quede concreto: cuando alguien publica una donación, el flujo pasa por el controlador, que valida los datos con Zod; el caso de uso, que aplica las reglas de negocio y guarda en la base; y ahí se dispara un evento interno — sin bloquear la respuesta al usuario — que activa dos cosas en paralelo: la moderación asistida por IA, que evalúa si hay contenido riesgoso, y la indexación para que esa publicación aparezca en 'mis publicaciones'."

*Mostrar:* el diagrama de secuencia de `04_COMUNICACION_ENTRE_CAPAS.md §3` si hay proyector.

---

### 8. Backend — 1min

"El backend es Node con TypeScript, Express para las rutas, Prisma para hablar con PostgreSQL, Mongoose para MongoDB. Doce módulos, cada uno siguiendo el mismo patrón de capas."

---

### 9. Frontend — 1min

"El frontend es React con Vite, organizado por dominio — cada módulo de negocio tiene su espejo en el frontend. Para el estado que viene del servidor usamos TanStack Query en vez de Redux, porque casi todo nuestro estado es justamente eso: datos que vienen de la API, no estado propio de la interfaz."

*Mostrar (demo en vivo si el tiempo alcanza):* navegar la app, mostrar el wizard de publicar donación.

---

### 10. PostgreSQL y MongoDB — 1min 30s

"Usamos dos motores de base de datos, con un criterio claro: todo lo que tiene una máquina de estado — una donación, una solicitud, una oferta — vive en PostgreSQL, porque necesita integridad fuerte: relaciones, unicidad, que no se pueda duplicar una oferta. Todo lo conversacional — mensajes, notificaciones, el historial del chatbot — vive en MongoDB, porque si se pierde un mensaje no se rompe ninguna regla de negocio.

Y para ser honesto: en un proyecto de este tamaño, probablemente un solo motor hubiera alcanzado. La justificación real no es que el volumen de datos lo exigiera, es aplicar un patrón de la industria — persistencia políglota — donde cada motor hace lo que mejor sabe hacer."

---

### 11. Gemini — 1min 30s

"Para la inteligencia artificial usamos Gemini de Google, con cuatro usos distintos: el chatbot de orientación, sugerencia de categoría al publicar, matching entre publicaciones parecidas, y moderación asistida de contenido. Un principio que respetamos en los cuatro: la IA nunca decide sola — solo sugiere o marca para revisión humana. Nunca bloquea una publicación por sí misma."

---

### 12. Cloudinary — 45s

"Las fotos no pasan por nuestro servidor — el backend calcula una firma digital, y el navegador sube la imagen directo a Cloudinary con esa firma. Así cumplimos con no guardar binarios en la base de datos, y aliviamos la carga del backend."

---

### 13. OpenStreetMap — 45s

"Para completar automáticamente provincia y ciudad cuando alguien usa su ubicación actual, usamos la API pública y gratuita de OpenStreetMap — sin necesidad de una clave paga de Google Maps."

---

### 14. Docker — 1min 30s

"Todo el sistema corre en cuatro contenedores Docker: PostgreSQL, MongoDB, el backend y el frontend, coordinados con Docker Compose. Y acá quiero adelantarme a una pregunta que seguro surge: '¿para qué Docker si esto corre en localhost?' — localhost es *dónde* accedemos, no *cómo* lo ejecutamos. Con Docker, cualquiera que evalúe este proyecto tiene exactamente las mismas versiones de Postgres y Mongo que usamos nosotros, sin instalar nada a mano — con un solo comando, `docker compose up`, el sistema completo está funcionando."

*Mostrar:* `docker compose ps` en la terminal, 4 contenedores healthy.

---

### 15. Seguridad — 1min 30s

"Las contraseñas se guardan con bcrypt, nunca en texto plano. La sesión usa JWT de ocho horas. La autorización tiene dos niveles: qué *tipo* de acción puede hacer un usuario según su perfil, y si es *dueño* del recurso específico que intenta modificar.

Siendo honesto: hicimos una auditoría de seguridad completa, y el hallazgo más importante es que no implementamos límite de frecuencia de peticiones — lo que en inglés se llama rate limiting. Estaba documentado como una decisión de diseño, pero nunca llegó a construirse. Lo identificamos, lo priorizamos, y la solución es acotada — no es un rediseño."

---

### 16. Demostración — 3-4min

"Ahora les muestro el sistema funcionando en vivo." *(Flujo sugerido: login → publicar donación con sugerencia de IA → crear una solicitud desde otro usuario → ofertar → confirmar entrega → dashboard actualizado.)*

---

### 17. Hallazgos técnicos — 1min

"Como parte de esta defensa hicimos una auditoría completa del proyecto contra el código real, no solo contra la documentación de diseño. Encontramos, entre otras cosas, que incluso nuestro propio manual de defensa, escrito dos días antes de esta auditoría, ya estaba desactualizado en un detalle — porque el código sigue cambiando más rápido de lo que cualquier documento puede seguirle el paso. Es la lección más importante que nos deja este proceso."

---

### 18. Limitaciones — 1min

"Para ser transparentes: falta el límite de frecuencia de peticiones que mencioné; la ubicación exacta de una solicitud se revela solo una vez, en el momento de aceptar una oferta, y no queda accesible después; y el módulo de solicitudes todavía no tiene el mismo flujo de subida de fotos que donaciones y trueques — usa un campo de texto en su lugar."

---

### 19. Mejoras futuras — 45s

"Los próximos pasos claros son: implementar el límite de peticiones, resolver de forma más robusta la ubicación de coordinación de entrega, completar el flujo de fotos en solicitudes, y sumar pruebas automatizadas en las áreas que todavía no las tienen, como el módulo de identidad."

---

### 20. Conclusión — 30s

"En resumen: DonaConnect cubre los dieciséis casos de uso planteados originalmente, con una arquitectura que no solo se diseñó bien sino que demostró su valor en un cambio real de proveedor de IA. Quedan mejoras concretas, ya identificadas y priorizadas — no sorpresas. Gracias, quedo abierto a preguntas."

---

## Notas de ritmo

- Si vas corto de tiempo: comprimí las secciones 8, 9, 12, 13 (backend/frontend/Cloudinary/OSM) a una frase cada una — son secundarias frente a arquitectura (6), IA (11) y seguridad (15).
- Si el docente interrumpe temprano con una pregunta de arquitectura, está bien — es la sección más preparada, dejate llevar ahí.
- La sección 16 (demo) es la que más se puede recortar si el tiempo aprieta — con mostrar publicar una donación y el chatbot alcanza.
