# 06 — Construcción desde Cero — DonaConnect Ecuador

Reconstrucción del proceso técnico para levantar un proyecto equivalente desde una máquina limpia, basado exclusivamente en las tecnologías reales encontradas (no en un tutorial genérico). Sigue el orden real de dependencia: entorno → backend → frontend → Docker.

---

## 1-2. Instalar y verificar Node.js

```bash
# Instalar Node 22 LTS (nvm recomendado para tener varias versiones)
nvm install 22 && nvm use 22
node -v   # v22.x.x
npm -v
```
**Por qué 22 LTS y no otra versión:** ADR-041, preferencia explícita del usuario, compatible con Prisma 6.x y TypeScript 5.7. Error frecuente: usar Node 18/20 — Prisma 6 y algunas sintaxis de TS 5.7 funcionan, pero las imágenes Docker del proyecto (`node:22-alpine`) fuerzan 22 de todas formas en contenedor, así que un mismatch local solo afecta si se corre fuera de Docker.

---

## 3-5. Estructura de carpetas raíz e inicialización

```bash
mkdir donaconnect && cd donaconnect
mkdir backend frontend docs
cd backend && npm init -y && cd ../frontend && npm init -y && cd ..
```
**Resultado esperado:** `backend/package.json` y `frontend/package.json` independientes — **no** hay `package.json` en la raíz (confirmado, el proyecto real no usa monorepo/workspaces).

---

## 6-8. Backend — dependencias y TypeScript

```bash
cd backend
npm install express cors helmet pino pino-http zod bcrypt jsonwebtoken mongoose @prisma/client @google/genai
npm install -D typescript tsx tsc-alias prisma vitest supertest eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser @types/node @types/express @types/cors @types/bcrypt @types/jsonwebtoken
npx tsc --init
```
Configurar `tsconfig.json` con los path aliases reales del proyecto (`06_CONSTRUCCION_DESDE_CERO.md` reutiliza la config verificada en `backend/tsconfig.json`):
```json
{
  "compilerOptions": {
    "target": "ES2022", "module": "NodeNext", "moduleResolution": "NodeNext",
    "strict": true, "noUncheckedIndexedAccess": true, "baseUrl": ".",
    "paths": {
      "@domain/*": ["domain/*"], "@application/*": ["application/*"],
      "@adapters/*": ["adapters/*"], "@main/*": ["main/*"]
    }
  }
}
```
**`noUncheckedIndexedAccess: true` explica un patrón que se repite en todo el código real:** `req.params.id!` — con este flag, TypeScript trata cualquier acceso indexado (incluidos los params de Express) como potencialmente `undefined`; el proyecto usa el operador de aserción no-nula (`!`) porque Express ya garantiza en runtime que la ruta declarada `:id` siempre tiene ese param si el handler se ejecuta — es una aserción deliberada, no un descuido de tipos.

**Error frecuente:** olvidar `tsc-alias` en el build — sin él, `tsc` compila los path aliases (`@domain/*`) tal cual al JS de salida, y Node no sabe resolverlos en runtime (a diferencia de `tsx`, que sí los resuelve en desarrollo vía loader). Por eso `npm run build` real es `tsc -p tsconfig.json && tsc-alias -p tsconfig.json` (dos pasos, no uno).

---

## 9-14. Servidor, rutas, controladores, entidades, casos de uso, repositorios — orden de construcción real

El código real no se construyó "capa por capa horizontal" (todo `domain/` primero, luego todo `application/`) sino **módulo por módulo, de adentro hacia afuera dentro de cada módulo** (mismo patrón repetido 12 veces, uno por Bounded Context):

```
Por cada módulo (ej. Donaciones):
1. domain/donaciones/value-objects/*.ts       (enums: EstadoDonacion, EstadoObjeto)
2. domain/donaciones/entities/Donacion.ts     (entidad + métodos de transición + validaciones)
3. domain/donaciones/ports/IDonacionRepository.ts   (interfaz, sin implementación aún)
4. application/donaciones/use-cases/*.ts      (casos de uso, reciben el puerto por constructor)
5. adapters/donaciones/repositories/PrismaDonacionRepository.ts   (implementa el puerto)
6. adapters/donaciones/controllers/{schemas,donaciones.controller}.ts   (Zod + traducción HTTP)
7. main/routes/donaciones.routes.ts           (declara los endpoints, referencia el controller)
8. main/di-container.ts                        (cablea todo: instancia repositorio → casos de
                                                 uso → controller, en ese orden de dependencia)
```
**Por qué este orden y no routes→controllers→services→models (MVC clásico):** la Regla de Dependencia de Clean Architecture exige que el dominio se defina **antes** de saber cómo se va a persistir — si se empezara por el repositorio Prisma, el diseño terminaría acoplado al esquema de base de datos desde el principio, exactamente lo que la arquitectura hexagonal busca evitar (ver `03_ARQUITECTURA.md`).

**Error frecuente:** instanciar un caso de uso en `di-container.ts` antes que sus dependencias (el propio TypeScript lo detecta como "variable usada antes de asignación" si son `const` en el mismo archivo — el orden real en `di-container.ts` sigue estrictamente esta cadena).

---

## 15-16. Configurar PostgreSQL y MongoDB

```bash
# Dentro de backend/
npx prisma init          # crea prisma/schema.prisma + .env
# Editar schema.prisma con los 11 modelos reales (ver 10_POSTGRESQL_Y_MONGODB.md)
npx prisma migrate dev --name init
npx prisma generate
```
Para MongoDB no hay "migración" — los esquemas Mongoose (`mongoose.Schema`) se definen directo en cada `Mongoose*Repository.ts` y Mongo los aplica de forma flexible al primer documento insertado; no hace falta ningún comando de setup adicional más allá de tener el servidor corriendo y `MONGODB_URI` apuntando a él.

**Verificación:** `npx prisma studio` abre una UI local para inspeccionar las tablas creadas.

---

## 17. Autenticación

```bash
# Ya instalado: bcrypt, jsonwebtoken
```
Implementar en este orden: `IPasswordHasher`/`ITokenService` (puertos, `domain/identidad/ports/`) → `BcryptPasswordHasher`/`JwtTokenService` (adaptadores, `adapters/identidad/security/`) → `RegistrarUsuarioUseCase`/`IniciarSesionUseCase` (casos de uso, orquestan ambos puertos) → `auth.middleware.ts` (verifica el JWT en cada request protegido). **Error frecuente:** generar el JWT antes de tener el hash de la contraseña verificado — el orden real (`IniciarSesionUseCase.ts`) siempre valida credenciales primero, genera token al final.

## 18. Crear roles / perfiles

Definir el enum `Rol` (Prisma) + value object espejo en `domain/identidad/value-objects/Rol.ts`. En este proyecto real, el modelo evolucionó de 1 campo (`rol`, 4 valores) a 2 conceptos separados (`Rol` de seguridad + `PerfilFuncional` de marketplace, ADR-048) — si se reconstruyera desde cero hoy, conviene empezar directo con el modelo final (2+3 valores) en vez de repetir la migración.

## 19-20. Carga de imágenes y mapas

Cloudinary: implementar `ICloudStorage`/`CloudinariaAdapter` (firma SHA1 local, sin llamar a la API desde el backend, `15_SERVICIOS_EXTERNOS.md §2`). Mapas: **no hace falta backend** — la geolocalización real del proyecto es 100% cliente contra la API pública de OpenStreetMap Nominatim (`15_SERVICIOS_EXTERNOS.md §3`), sin clave ni configuración de servidor.

## 21. Configurar inteligencia artificial

```bash
npm install @google/genai
```
Crear el puerto `IIAProvider` primero (`domain/ia/ports/`), luego `GeminiAdapter` (`adapters/ia/external/`) implementándolo — nunca al revés, para que los 4 domain services de IA (`ChatbotOrquestacionService`, etc.) puedan escribirse y probarse contra el puerto sin necesitar una API key real. Obtener una API key gratuita en Google AI Studio, configurar `IA_API_KEY` en `.env`.

## 22-23. Docker y Docker Compose

Cubierto completo en `09_DOCKER.md` — orden real: `Dockerfile` de cada proyecto primero (para que `docker compose build` tenga algo que construir), luego `docker-compose.yml` orquestando los 4 servicios con sus healthchecks y `depends_on`.

## 24. Ejecución

```bash
cp .env.example .env   # completar credenciales reales
docker compose up
```
**Resultado esperado:** 4 contenedores healthy, backend en `localhost:4000`, frontend en `localhost:5173`. **Error frecuente:** olvidar completar `.env` (el backend arranca igual, pero `IA_API_KEY`/`CLOUDINARY_*` vacíos hacen que esas funcionalidades respondan `503` en vez de crashear — degradación explícita, RNF-002).

## 25. Pruebas

```bash
cd backend && npm test   # vitest run, contra Postgres/Mongo reales — deben estar corriendo
```
**Verificación:** los 6 archivos de `backend/tests/` deben pasar; no hay equivalente en frontend (`16_PRUEBAS.md`).

## 26. Construcción del frontend

```bash
cd frontend
npm install react react-dom react-router-dom @tanstack/react-query @fontsource/inter @fontsource/sora
npm install -D typescript vite @vitejs/plugin-react eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-react-hooks
npm create vite@latest . -- --template react-ts   # o configurar vite.config.ts a mano
```
Orden real: `shared/lib/http-client.ts` (cliente HTTP base) → `shared/components/` (atoms→molecules→organisms, regla de reutilización ADR-045) → `features/<dominio>/{types,api,hooks,components}` (uno por Bounded Context, espejo del backend) → `app/pages/` (compone piezas de `features/`) → `app/App.tsx` (rutas, al final, cuando ya existen las páginas a enrutar).

## 27. Preparación para demostración

```bash
docker compose up -d
# Verificar en el navegador: localhost:5173 (registro, login, publicar donación, chatbot)
docker compose logs -f api   # si algo falla, ver logs Pino estructurados en vivo
```
Checklist mínimo antes de una demo en vivo: `.env` completo (Gemini + Cloudinary configurados, no solo Postgres/Mongo), al menos 1 usuario admin creado, al menos 3-4 categorías activas (necesarias para publicar cualquier donación/solicitud/trueque), y tener presente el hallazgo de `16_PRUEBAS.md` sobre re-login tras cambiar perfiles.

---

## Qué sigue

`05_EXPLICACION_CODIGO.md` toma los archivos más centrales de este proceso (`di-container.ts`, una entidad de dominio, un caso de uso, un repositorio, un controller) y los explica línea por línea.
