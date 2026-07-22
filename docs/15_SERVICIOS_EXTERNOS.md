# 15 — Servicios Externos — DonaConnect Ecuador

Las 3 integraciones externas reales del proyecto (más una removida por completo). La IA (Gemini) ya se cubrió en profundidad en `08_INTELIGENCIA_ARTIFICIAL.md` — aquí solo el resumen de integración; el resto se desarrolla completo.

---

## 1. Google Gemini (IA) — resumen, detalle completo en `08_INTELIGENCIA_ARTIFICIAL.md`

Server-side únicamente (ADR-010), SDK `@google/genai`, `IA_API_KEY` genérica, degrada a `503` sin tumbar el resto de la API. Sin rate limiting ni reintentos propios (riesgo de costo, `13_SEGURIDAD.md §6`).

---

## 2. Cloudinary (almacenamiento de imágenes)

**Propósito:** almacenar las fotos de Donaciones/Trueques sin que el binario pase nunca por el backend (ADR-009, cumple la restricción del SRS de no guardar imágenes como BLOB).

**Configuración:** 4 variables (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_UPLOAD_PRESET`), todas opcionales con default `''` en `env.ts:21-24` — si faltan, `CloudinariaAdapter.firmarSubida()` lanza `CloudinaryNoConfiguradoError` → `503`.

**Punto de entrada:** `CloudinariaAdapter.ts` implementa `ICloudStorage`, instanciado en `di-container.ts` e inyectado en `FirmarSubidaImagenUseCase` de Donaciones y de Trueques (Solicitudes no tiene esta integración, `02_TRAZABILIDAD_SRS_CODIGO.md` CU-004).

**Flujo real (firma local, sin llamar a la API de Cloudinary desde el backend):**
```
timestamp = ahora (segundos)
folder = "donaconnect/{tipoEntidad}/{idEntidad}"
paramsParaFirmar = "folder={folder}&timestamp={timestamp}&upload_preset={uploadPreset}"
signature = SHA1(paramsParaFirmar + apiSecret)
```
Es el esquema de firma estándar documentado por Cloudinary (parámetros ordenados alfabéticamente + secreto, hash SHA1) — `CloudinariaAdapter.ts:22-42`, síncrono, no hace ninguna petición de red; solo calcula la firma que el navegador usará para subir directo a `https://api.cloudinary.com/v1_1/{cloudName}/image/upload` (`frontend/src/shared/lib/cloudinary.ts:25`).

**Datos enviados:** el backend nunca ve el binario — solo `mimeType`/`tamanoBytes` declarados por el cliente (validados antes de firmar, `FirmarSubidaImagenUseCase.ts:30-35`, ver `13_SEGURIDAD.md §4`). El navegador sube el archivo real directo a Cloudinary con la firma.

**Datos recibidos:** el navegador recibe `{secure_url, public_id}` de Cloudinary y se los pasa al backend vía `POST /donaciones/:id/imagenes` (`RegistrarImagenUseCase`), que solo persiste la URL en Postgres (`imagenes.url`/`imagenes.public_id`) — nunca el binario.

**Errores:** `CloudinaryNoConfiguradoError` → `503`; error de red al subir (frontend) → mensaje genérico en `ImageUploader.tsx:43`.

**Costos:** plan gratuito de Cloudinary tiene límites de almacenamiento/transformaciones — no hay ningún control de cuota propio en el proyecto; si se excede, el error vendría directo de la API de Cloudinary al navegador (no capturado específicamente, cae en el catch genérico de `ImageUploader.tsx`).

**Riesgos:** el folder (`donaconnect/{tipo}/{id}`) organiza por entidad pero no impide que alguien con una firma válida suba múltiples imágenes al mismo folder — no hay límite de cantidad de imágenes por publicación verificado en esta auditoría.

**Alternativa/contingencia:** ninguna configurada — sin Cloudinary, la funcionalidad de imágenes queda inoperante (`503`), el resto de la API sigue funcionando (RNF-002).

---

## 3. OpenStreetMap Nominatim (geolocalización) — implementación real, distinta de lo documentado

**Lo que dice el SRS/ADR-038:** una interfaz de "Servicio de Mapas" respaldada por `MAPS_API_KEY`.

**Lo que existe en código:** `frontend/src/shared/lib/ubicacion.ts` — función `geocodificarInversa(latitud, longitud)` que llama directo a la API pública y gratuita de **OpenStreetMap Nominatim** (`https://nominatim.openstreetmap.org/reverse`) **desde el navegador**, sin pasar por el backend y sin usar `MAPS_API_KEY` en absoluto (confirmado por grep exhaustivo, `13_SEGURIDAD.md §9`).

**Propósito real:** autocompletar provincia/ciudad al usar "Usar mi ubicación actual" en `LocationPicker.tsx` (`shared/components/molecules/`), usado en los 3 wizards de publicación.

**Datos enviados:** latitud/longitud del navegador (API de geolocalización del navegador, `navigator.geolocation`) → Nominatim.

**Datos recibidos:** dirección estructurada (`address.state`/`address.city`/etc.); la función normaliza el resultado contra la lista fija de provincias de Ecuador (`normalizar()`, maneja tildes y el caso real encontrado de que Pichincha a veces viene bajo `address.plot` en vez de `address.state`, ver la implementación de esta misma sesión).

**Errores:** si Nominatim falla o no matchea ninguna provincia conocida, el campo queda vacío y el usuario completa manualmente — nunca bloquea el flujo de publicación (los campos de ubicación siguen editables).

**Por qué esto es una desviación real de ADR-038, no solo un detalle menor:** el diseño original (Fase 7 sección 4, `MatchingService.ts:22` lo confirma explícitamente) contemplaba un `MapsAdapter` server-side con clave paga — nunca se construyó. Lo que sí se construyó (geocodificación inversa gratuita, cliente) resuelve un problema distinto y más acotado (autocompletar un formulario), no lo que el SRS/ADR describían (ej. no hay cálculo de distancia/radio geográfico en el Matching de IA, que sigue filtrando solo por categoría+estado).

**Costos:** ninguno — Nominatim es gratuito para uso liviano, sujeto a su política de uso justo (rate limit propio de Nominatim, no controlado por este proyecto).

**Contingencia:** si Nominatim no responde, el usuario simplemente escribe provincia/ciudad a mano — no hay dependencia dura.

---

## 4. n8n — removido por completo (ADR-047)

**Estado:** **no existe en el proyecto actual.** Estaba planeado (ADR-001, Fase 8) como capa de automatización para el canal de correo electrónico de notificaciones. El workflow nunca se terminó de configurar en la UI de n8n (la petición devolvía 404, según el propio historial documentado) y el 2026-07-10 el usuario decidió eliminarlo por completo en vez de dejarlo a medio construir.

**Qué se eliminó (confirmado — cero referencias en el código actual):** el servicio `n8n` de `docker-compose.yml` (contenedor + volumen), `N8nWebhookAdapter`, `IWebhookNotifier`, `MongooseLogsN8nRepository`, `ILogsN8nRepository`, `N8N_WEBHOOK_URL` de `.env`/`.env.example`/`env.ts`. `NotificacionDispatchService` perdió el canal de correo — todos los eventos quedan solo in-app.

**Por qué es relevante para la defensa:** es la decisión más honesta del proyecto en cuanto a manejo de deuda técnica — en vez de dejar una integración a medias documentada como "pendiente" indefinidamente, se removió por completo y se documentó la razón (ADR-047). Es un buen ejemplo para responder "¿qué cambiarían antes de producción?" mostrando que ya se aplicó ese criterio una vez.

---

## 5. Resumen comparativo

| Servicio | Configurado vía | Server-side u.o cliente | Degradación si falla | Costo real |
|---|---|---|---|---|
| Gemini | `IA_API_KEY` | Server-side (ADR-010) | `503`, resto de API viva | Por token, sin límite propio de gasto |
| Cloudinary | 4 variables `CLOUDINARY_*` | Firma server-side, subida cliente-directo | `503` al firmar; resto de API viva | Plan gratuito, sin control de cuota propio |
| OpenStreetMap Nominatim | Ninguna (público) | 100% cliente | Silencioso — el usuario completa a mano | Gratis |
| n8n | — | **Removido (ADR-047)** | N/A | N/A |

---

## 6. Qué sigue

`06_CONSTRUCCION_DESDE_CERO.md` retoma estas 3 integraciones dentro de los pasos de configuración del entorno.
