# Checklist — Demo de Defensa — DonaConnect Ecuador

Repasar la noche anterior y de nuevo 30 minutos antes de la defensa.

---

## 1. Contenedores que deben estar activos

```bash
docker compose up -d
docker compose ps
```
- [ ] `postgres` — estado `healthy` (no solo `running`)
- [ ] `mongo` — estado `healthy`
- [ ] `api` — `running`, revisar `docker compose logs api` sin errores de conexión
- [ ] `web` — `running`, sin errores de compilación de Vite

Si algo no está `healthy` tras 1 minuto: `docker compose logs -f <servicio>` para diagnosticar antes de seguir con el resto del checklist.

## 2. Servicios que debo comprobar (no asumir, probar cada uno)

- [ ] Backend responde: `curl http://localhost:4000/api/v1/categorias` → debe devolver `200` con al menos 1 categoría
- [ ] Frontend carga: abrir `http://localhost:5173` en el navegador, sin pantalla en blanco ni error de consola
- [ ] Login funciona con el usuario de prueba (ver sección 3)
- [ ] El chatbot responde algo real (no solo que no tire error 503) — probar con una pregunta simple
- [ ] Publicar una donación de prueba funciona end-to-end, incluida la subida de una imagen

## 3. Usuarios de demostración — tener las credenciales anotadas

| Usuario | Correo | Perfiles | Para qué |
|---|---|---|---|
| Admin | (anotar) | Rol `ADMINISTRADOR` | Mostrar el panel `/admin` |
| Donante+Solicitante | (anotar) | `DONANTE`, `SOLICITANTE` | Mostrar publicar donación y crear solicitud desde la misma cuenta |
| Usuario secundario | (anotar) | `DONANTE` o `SOLICITANTE` | Necesario para probar el flujo de ofertar (no se puede ofertar sobre la propia solicitud) |

**Importante (recordado de `16_PRUEBAS.md`):** si vas a cambiar los perfiles de un usuario en vivo durante la demo (`PerfilPage.tsx`), tené presente que el cambio **no tiene efecto hasta el siguiente login** — el JWT ya emitido conserva los perfiles viejos. Si vas a demostrar esto, hacé el cambio y el re-login *antes* de la demo, no en vivo, salvo que quieras mostrar justamente ese comportamiento a propósito.

## 4. Flujos que debo probar antes (no en vivo por primera vez)

- [ ] Registro con selección de 2+ perfiles
- [ ] Login
- [ ] Publicar una donación (con foto real, con sugerencia de IA aceptada)
- [ ] Crear una solicitud desde otro usuario
- [ ] Ofertar sobre esa solicitud desde el usuario donante
- [ ] Ver que la Entrega se creó automáticamente (`CoordinacionEntrega.tsx` en la página de detalle)
- [ ] Confirmar la entrega, verificar que la Solicitud pasa a `ATENDIDA` y la Donación a `ENTREGADA`
- [ ] Ver el Dashboard (`/`) reflejando el conteo actualizado
- [ ] Publicar un trueque y proponer un intercambio desde otro usuario
- [ ] Aceptar la propuesta de trueque, verificar que ambos lados pasan a `EN_COORDINACION`
- [ ] Enviar un mensaje entre 2 usuarios (`/conversaciones`)
- [ ] Ver una notificación generada por alguna de las acciones anteriores
- [ ] Entrar al panel `/admin` con el usuario administrador
- [ ] Probar el chatbot con al menos 2 preguntas distintas

## 5. Variables de entorno requeridas — verificar que `.env` las tenga completas

```bash
# Desde la raíz del repo
cat .env | grep -v '^#' | grep -v '^$'
```
- [ ] `JWT_SECRET` — cualquier valor largo, no vacío
- [ ] `DB_POSTGRES_URL` — apunta a `localhost:5433` (si se corre `prisma studio` desde el host)
- [ ] `MONGODB_URI`
- [ ] `IA_API_KEY` — **sin esto, el chatbot y las sugerencias de IA responden 503** — verificar que no esté vacía
- [ ] `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_UPLOAD_PRESET` — sin esto, subir fotos falla
- [ ] `CORS_ORIGIN` — debe ser `http://localhost:5173`

**No hace falta `MAPS_API_KEY`** — es una variable declarada pero nunca usada en el código; no completarla no rompe nada (hallazgo de la auditoría, `13_SEGURIDAD.md §9`).

## 6. Estado de cada servicio externo — verificar activamente, no asumir

- [ ] **Gemini:** hacer una pregunta al chatbot en vivo *antes* de la defensa — si responde `503`, la key está mal configurada o vencida
- [ ] **Cloudinary:** subir una imagen de prueba en un wizard — si falla, revisar las 4 variables y que el `upload_preset` exista en el dashboard de Cloudinary
- [ ] **PostgreSQL:** `docker compose exec postgres psql -U donaconnect -c '\dt'` — debe listar las 11 tablas
- [ ] **MongoDB:** `docker compose exec mongo mongosh --eval "db.adminCommand('ping')"` — debe responder `ok: 1`

## 7. Navegación por perfiles — qué mostrar y en qué orden

1. Login como usuario con perfil `SOLICITANTE` únicamente → mostrar que el botón "+Publicar" en Donaciones **no aparece**.
2. Intentar `POST /donaciones` con ese mismo token desde Postman/curl → mostrar que responde `403` — **esto es lo que realmente demuestra que la protección es del backend, no solo visual.**
3. Cambiar a un usuario con perfil `DONANTE` → mostrar que ahora sí aparece el botón y funciona.

## 8. Plan de contingencia

| Si falla... | Hacer esto |
|---|---|
| Internet cae | Todo corre local excepto Gemini/Cloudinary/OpenStreetMap — avisar que esas 3 partes específicas no van a responder, seguir con el resto de la demo (publicar sin foto, sin sugerencia IA) |
| Gemini no responde | Mostrar el manejo de degradación: la donación se publica igual, solo sin sugerencia — es RNF-002 en acción, un punto a favor, no solo un problema |
| Cloudinary no responde | Publicar sin foto, explicar que el flujo de imagen es independiente de la publicación |
| Docker no levanta a tiempo | Tener capturas de pantalla de los flujos clave ya preparadas como respaldo — no puede depender 100% de que todo funcione en vivo |
| Se pierde la sesión de un usuario de prueba | Tener las credenciales anotadas en un lugar accesible (no solo en `sessionStorage` del navegador que se puede cerrar) |
| El docente pide ver el código de algo puntual | Tener el editor abierto con `di-container.ts`, `Donacion.ts`, `GeminiAdapter.ts`, `donaciones.controller.ts` en pestañas — son los que más probablemente se pidan (ver `05_EXPLICACION_CODIGO.md`) |

## 9. Archivos y diagramas que debo tener abiertos antes de empezar

- [ ] Editor: `backend/main/di-container.ts` (línea ~295, el cableado de Gemini)
- [ ] Editor: `backend/domain/donaciones/entities/Donacion.ts`
- [ ] Editor: `backend/adapters/ia/external/GeminiAdapter.ts`
- [ ] Terminal: `docker compose ps` ya corrido, output visible
- [ ] Navegador: pestaña en `localhost:5173`, sesión de administrador lista en otra pestaña/perfil
- [ ] `docs/03_ARQUITECTURA.md` (el diagrama Mermaid) — impreso o en una pestaña aparte
- [ ] `docs/13_SEGURIDAD.md §10` (tabla de hallazgos) — para citar con precisión si preguntan por seguridad
- [ ] Este checklist y `FICHAS_PREGUNTAS_DIFICILES.md` — en el celular o impresos, no en la misma pantalla que vas a compartir

## 10. Últimos 10 minutos antes de entrar

- [ ] `docker compose ps` — confirmar los 4 healthy/running una vez más
- [ ] Cerrar pestañas del navegador que no vas a usar (evitar mostrar algo sin querer)
- [ ] Silenciar notificaciones del sistema operativo
- [ ] Tener el `RESUMEN_ORAL_20_MINUTOS.md` a mano, no para leer, para chequear el orden si te trabás
- [ ] Respirar — ya está todo probado, esto es solo repetir lo que ya funcionó antes
