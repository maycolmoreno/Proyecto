# DonaConnect

Plataforma de donaciones, solicitudes y trueques. Backend en Node.js/TypeScript (Express + Prisma), frontend en React (Vite), PostgreSQL y MongoDB, todo orquestado con Docker Compose.

## Requisitos previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo (incluye Docker Compose).
- No necesitas instalar Node.js, PostgreSQL ni MongoDB en tu máquina — todo corre dentro de los contenedores.

## Configuración inicial

1. Clona/copia el repositorio.
2. Copia la plantilla de variables de entorno:

   ```bash
   cp .env.example .env
   ```

3. Completa `.env` con los valores reales. Los de base de datos y puertos ya vienen listos para Docker; estos otros son credenciales que debes obtener/pedir:
   - `JWT_SECRET`: cualquier string largo y aleatorio.
   - `IA_API_KEY`: clave de la API de Claude/Anthropic (funcionalidad de chatbot).
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_UPLOAD_PRESET`: credenciales de Cloudinary (subida de imágenes).
   - `MAPS_API_KEY`: clave del proveedor de mapas.

   Sin estas claves el sistema levanta igual, pero las funcionalidades correspondientes (IA, imágenes, mapas) no funcionarán.

## Levantar el proyecto

```bash
docker compose up -d --build
```

Esto crea y arranca 4 contenedores:

| Servicio | Descripción | Puerto (host) |
|---|---|---|
| `postgres` | PostgreSQL 18.3 | `5433` → 5432 interno |
| `mongo` | MongoDB 8.3.4 | `27017` |
| `api` | Backend Express | `4000` |
| `web` | Frontend Vite | `5173` |

El contenedor `api` aplica las migraciones de Prisma automáticamente en cada arranque (`prisma generate && prisma migrate deploy`) — no hace falta correr nada a mano.

## Verificar que todo esté arriba

```bash
docker compose ps
```

Todos los servicios deben aparecer `Up` (postgres y mongo además como `healthy`).

- Frontend: http://localhost:5173
- API: http://localhost:4000/api/v1
- Health check del backend: http://localhost:4000/health

## Acceder a la base de datos con pgAdmin

| Campo | Valor |
|---|---|
| Host | `localhost` |
| Puerto | `5433` |
| Usuario | `donaconnect` |
| Password | `donaconnect` |
| Base de datos | `donaconnect` |

En pgAdmin: clic derecho en **Servers** → **Register → Server...** → completa **General** (nombre) y **Connection** con los datos de arriba.

> Nota: el puerto expuesto al host es `5433` (no el 5432 estándar) para evitar conflicto si ya tienes un PostgreSQL nativo instalado.

## Empezar con datos limpios

```bash
docker compose down -v
docker compose up -d --build
```

`down -v` borra los volúmenes (`postgres_data`, `mongo_data`), útil para probar un arranque desde cero.

## Comandos útiles

```bash
docker compose logs -f api      # logs del backend en vivo
docker compose logs -f web      # logs del frontend en vivo
docker compose down             # detener todo (conserva los datos)
```

## Documentación del proyecto

Ver [docs/INDEX.md](docs/INDEX.md) para las decisiones de arquitectura (ADRs) y documentos de fase.
