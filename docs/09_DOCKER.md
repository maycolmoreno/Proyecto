# 09 — Docker — DonaConnect Ecuador

Explicación línea por línea de `docker-compose.yml` (raíz, 80 líneas) y de los 2 `Dockerfile` (`backend/`, `frontend/`), más los conceptos base para defender por qué el proyecto usa Docker corriendo en `localhost`.

---

## 1. Conceptos base (para responder preguntas de fundamentos)

- **Imagen:** una plantilla de solo lectura con un sistema de archivos + metadata (qué proceso correr, qué puertos exponer). Se construye una vez (`docker build`) a partir de un `Dockerfile` y se reutiliza para crear cualquier número de contenedores.
- **Contenedor:** una instancia en ejecución de una imagen — tiene su propio sistema de archivos (capa de escritura encima de la imagen), procesos y, salvo que se le diga lo contrario, su propia red aislada.
- **Volumen:** almacenamiento que persiste fuera del ciclo de vida del contenedor. Este proyecto usa 2 tipos: **volúmenes nombrados** (`postgres_data`, `mongo_data` — gestionados por Docker, sobreviven a `docker compose down`) y **bind mounts** (`./backend:/app` — el código del host se monta directo dentro del contenedor, así los cambios en el editor se reflejan sin reconstruir la imagen).
- **Red:** este proyecto declara una red bridge propia (`donaconnect-network`) en vez de usar la red `default` implícita de Compose — funcionalmente equivalente aquí (4 servicios, un solo compose file), pero explícita.
- **Docker Compose:** orquesta múltiples contenedores relacionados (imagen a construir o usar, variables de entorno, puertos, dependencias de arranque) desde un solo archivo declarativo, en vez de 4 `docker run` manuales con las flags sincronizadas a mano.

---

## 2. `docker-compose.yml` — línea por línea

```yaml
1   name: donaconnect
```
Nombre del proyecto Compose — prefija los nombres de red/volumen/contenedor generados (`donaconnect_postgres_data`, etc.) para no chocar con otros proyectos en la misma máquina.

```yaml
3-5  networks:
       donaconnect-network:
         driver: bridge
```
Declara la red bridge explícita que usan los 4 servicios — Docker resuelve el nombre del servicio (`postgres`, `mongo`, `api`) como hostname DNS interno dentro de esta red; por eso `DB_POSTGRES_URL` usa `postgres:5432` (nombre de servicio), no `localhost:5432`.

```yaml
7-9  volumes:
       postgres_data:
       mongo_data:
```
Declara los 2 volúmenes nombrados a nivel de proyecto (deben declararse aquí antes de poder referenciarlos en un servicio).

```yaml
12-31 postgres:
        image: postgres:18.3-alpine
        restart: unless-stopped
        environment:
          POSTGRES_USER: donaconnect
          POSTGRES_PASSWORD: donaconnect
          POSTGRES_DB: donaconnect
        ports:
          - "5433:5432"
        volumes:
          - postgres_data:/var/lib/postgresql
        healthcheck:
          test: ["CMD-SHELL", "pg_isready -U donaconnect"]
          interval: 5s
          timeout: 5s
          retries: 10
        networks:
          - donaconnect-network
```
- `image`: usa la imagen oficial `postgres:18.3-alpine` (Alpine = base mínima, imagen más chica) — no hay `Dockerfile` propio para Postgres, no hace falta.
- `restart: unless-stopped`: si el proceso de Postgres crashea, Docker lo reinicia automáticamente; si el usuario lo detiene explícitamente (`docker stop`), no se reinicia solo.
- Credenciales hardcodeadas en el compose (`donaconnect`/`donaconnect`) — aceptable para un entorno académico local (ADR-000/006), sería un hallazgo de seguridad real en cualquier despliegue expuesto a red pública.
- `ports: "5433:5432"`: mapea el puerto 5433 del **host** al 5432 del **contenedor** — el comentario del propio archivo explica que es para no chocar con un Postgres nativo que el desarrollador pudiera tener corriendo en el 5432 de su máquina. Dentro de la red Docker, otros contenedores siguen usando el 5432 estándar.
- `healthcheck`: `pg_isready` cada 5s, hasta 10 reintentos (50s de margen) — es lo que permite que `api` espere a que Postgres esté realmente listo, no solo "arrancado" (ver `depends_on` de `api`).

```yaml
33-46 mongo:
        image: mongo:8.3.4
        ...
        ports:
          - "27017:27017"
        volumes:
          - mongo_data:/data/db
        healthcheck:
          test: ["CMD", "mongosh", "--quiet", "--eval", "db.adminCommand('ping')"]
```
Mismo patrón que Postgres. Sin remapeo de puerto (27017 es el default de MongoDB, con menor probabilidad de choque que el 5432 de Postgres, que muchos desarrolladores tienen instalado nativamente).

```yaml
48-64 api:
        build: ./backend
        restart: unless-stopped
        env_file:
          - .env
        environment:
          DB_POSTGRES_URL: postgresql://donaconnect:donaconnect@postgres:5432/donaconnect
        ports:
          - "4000:4000"
        volumes:
          - ./backend:/app
          - /app/node_modules
        depends_on:
          postgres:
            condition: service_healthy
        networks:
          - donaconnect-network
```
- `build: ./backend`: construye la imagen desde `backend/Dockerfile` (no usa una imagen ya publicada).
- `env_file: .env`: carga todas las variables del `.env` real del desarrollador (no versionado, distinto de `.env.example`).
- `environment.DB_POSTGRES_URL`: **sobrescribe** cualquier valor del `.env` con el hostname de red Docker (`postgres`, no `localhost`) — necesario porque el `.env.example` documenta el valor para correr Prisma *desde el host* (`localhost:5433`), pero el contenedor `api` debe hablarle a `postgres:5432` (nombre de servicio, puerto interno). Es la única variable sobrescrita así; el resto viene tal cual del `.env`.
- `volumes`: **bind mount** del código (`./backend:/app`, hot-reload sin reconstruir la imagen) + **volumen anónimo** `/app/node_modules` — este segundo volumen es clave: sin él, el bind mount del host (que probablemente no tiene `node_modules` instalado para Linux/Alpine, o directamente no lo tiene) taparía el `node_modules` ya instalado dentro de la imagen durante el build. El volumen anónimo preserva el `node_modules` de la imagen por separado del bind mount del código fuente.
- `depends_on.postgres.condition: service_healthy`: **espera activamente** a que el healthcheck de Postgres pase (no solo a que el contenedor exista) antes de arrancar `api` — evita el error clásico de "conexión rechazada" en el primer intento de conexión de Prisma.

```yaml
66-79 web:
        build: ./frontend
        ...
        environment:
          VITE_API_URL: http://localhost:4000/api/v1
        ports:
          - "5173:5173"
        volumes:
          - ./frontend:/app
          - /app/node_modules
        depends_on:
          - api
```
- `VITE_API_URL` apunta a `http://localhost:4000`, **no** `http://api:4000` — a diferencia del backend, el frontend corre en el **navegador del desarrollador** (fuera de la red Docker), así que debe usar la URL accesible desde el host, no el hostname interno de Compose.
- `depends_on: [api]` (forma corta, sin `condition`) — solo espera a que el contenedor `api` exista/arranque, no a que su proceso esté realmente listo para responder (no hay healthcheck definido en `api` ni en `web`).

---

## 3. `backend/Dockerfile` — línea por línea

```dockerfile
2   FROM node:22-alpine
```
Imagen base oficial de Node 22 LTS (ADR-041), variante Alpine (~40MB base vs. cientos de MB de la imagen `node:22` completa).

```dockerfile
4   WORKDIR /app
```
Todas las instrucciones siguientes (`COPY`, `RUN`, `CMD`) se ejecutan relativas a `/app` dentro del contenedor.

```dockerfile
6-7  COPY package.json ./
     RUN npm install
```
**Hallazgo de esta auditoría:** copia solo `package.json`, **no** `package-lock.json` (que sí existe en el repo, `backend/package-lock.json`) antes de este paso. Dos consecuencias reales: (1) `npm install` en esta capa no tiene el lockfile disponible todavía, así que no puede aprovecharlo para instalar versiones exactas — resuelve por los rangos semver de `package.json`; (2) no se usa `npm ci` (instalación determinística desde lockfile), sino `npm install`. El lockfile sí termina copiado más abajo (`COPY . .`, línea 12) pero ya tarde para esta capa. Efecto práctico: el cacheo de capas de Docker sigue funcionando (esta capa solo se invalida si cambia `package.json`), pero la build no es tan reproducible como podría ser.

```dockerfile
9-10 COPY prisma ./prisma
     RUN npx prisma generate
```
Copia solo la carpeta `prisma/` (schema + migraciones) antes del resto del código, y genera el cliente Prisma en esta capa — separado de `COPY . .` para que cambiar código de aplicación (sin tocar el schema) no invalide esta capa costosa.

```dockerfile
12  COPY . .
```
Copia el resto del código fuente (en la práctica, esta capa queda mayormente reemplazada en desarrollo por el bind mount de `docker-compose.yml`, pero es necesaria para que la imagen sea autosuficiente si se corriera sin Compose).

```dockerfile
14  EXPOSE 4000
```
Documenta el puerto que el proceso escuchará — no publica el puerto por sí sola (eso lo hace `ports:` en Compose), es metadata informativa.

```dockerfile
24  CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && npm run dev"]
```
El comando que corre **cada vez que arranca el contenedor** (no solo en el build): regenera el cliente Prisma (porque `node_modules` vive en el volumen anónimo, separado del bind mount — un cambio de `schema.prisma` en el host no se refleja ahí hasta que algo lo regenera) y aplica migraciones pendientes con `migrate deploy` (no interactivo, a diferencia de `migrate dev`) antes de arrancar el dev server. Automatiza lo que, según el propio comentario del archivo, antes requería pasos manuales dentro del contenedor tras cada sprint.

---

## 4. `frontend/Dockerfile` — línea por línea

```dockerfile
2   FROM node:22-alpine
4   WORKDIR /app
6-7 COPY package.json ./
    RUN npm install
9   COPY . .
11  EXPOSE 5173
13  CMD ["npm", "run", "dev"]
```
Mismo patrón que el backend (y el mismo hallazgo del lockfile no copiado antes de `npm install`), pero **sin build de producción** — corre `vite --host 0.0.0.0` directo (dev server), nunca `vite build` ni un servidor estático (Nginx, `serve`). Coherente con ADR-000 (entorno objetivo: `localhost`) — no hay ninguna etapa multi-stage ni imagen final optimizada para producción real, sería necesario agregarla si el proyecto saliera de este alcance académico.

---

## 5. Qué pasa con cada comando (para la demostración en vivo)

| Comando | Qué ocurre |
|---|---|
| `docker compose up` | Crea la red y los 2 volúmenes si no existen; construye `api`/`web` si no hay imagen o cambió el `Dockerfile`/contexto; arranca `postgres`/`mongo`, espera su healthcheck; arranca `api` (espera healthy de `postgres`); arranca `web` (espera que `api` exista) |
| `docker compose up -d` | Igual, pero en segundo plano (detached) |
| `docker compose down` | Detiene y elimina los 4 contenedores y la red; **conserva** los volúmenes nombrados (los datos de Postgres/Mongo sobreviven) |
| `docker compose down -v` | Igual que arriba, pero **también elimina los volúmenes** — próximo `up` arranca con bases de datos vacías (el `Dockerfile` del backend corre `migrate deploy` automáticamente, así que el esquema se recrea solo, pero los datos se pierden) |
| `docker compose logs -f api` | Sigue el log en vivo de un servicio específico |
| `docker compose exec api sh` | Abre una shell dentro del contenedor `api` en ejecución (útil para correr `npx prisma studio`, revisar `node_modules`, etc.) |
| `docker compose build --no-cache api` | Reconstruye la imagen de `api` ignorando el cache de capas — útil si se sospecha una capa corrupta o para forzar `npm install` limpio |
| `docker compose ps` | Lista los 4 servicios con su estado (`running`, `healthy`, etc.) |

---

## 6. La pregunta obligatoria de defensa: "¿por qué Docker si el proyecto corre en localhost?"

**Localhost es el lugar de acceso, no la forma de ejecución.** Hay 3 formas distintas de "correr en localhost" y el proyecto eligió la tercera a propósito:

1. **Ejecución local directa:** Node, Postgres y MongoDB instalados nativamente en la máquina del desarrollador. Funciona, pero cada máquina termina con versiones distintas de cada motor, configuraciones manuales distintas, y "en mi máquina funciona" es un riesgo real.
2. **Ejecución local dentro de contenedores (lo que hace este proyecto):** los mismos binarios exactos (`postgres:18.3-alpine`, `mongo:8.3.4`, `node:22-alpine`) corren en cualquier máquina que tenga Docker, accedidos igual desde `localhost` en el navegador/cliente HTTP — la diferencia es invisible para quien lo usa, pero elimina la deriva de configuración entre máquinas.
3. **Despliegue remoto real:** fuera de alcance aquí (ADR-000), pero la containerización ya deja el proyecto a un paso de eso si se decide extenderlo.

**Justificación concreta para DonaConnect:**
- **Consistencia:** Postgres 18.3 y MongoDB 8.3.4 exactos, sin depender de qué versión tenga cada evaluador instalada.
- **Reproducibilidad:** `docker compose up` deja el sistema completo funcionando sin instalar Postgres/Mongo/Node manualmente.
- **Aislamiento:** un Postgres nativo en el puerto 5432 del evaluador (caso real, motivó el remapeo a 5433) no choca con el del proyecto.
- **4 servicios coordinados** (red, healthchecks, orden de arranque) sin tener que documentar 4 comandos manuales sincronizados.

**Desventajas reales, honestas para la defensa:** overhead de recursos (4 contenedores vs. procesos nativos), curva de aprendizaje de Docker si el evaluador no lo conoce, y en este proyecto específico — el `Dockerfile` del frontend sin build de producción significa que **no** se está demostrando cómo se serviría en un entorno real fuera de `localhost` (sería el siguiente paso lógico si el alcance creciera).

---

## 7. Qué sigue

`08_INTELIGENCIA_ARTIFICIAL.md` cubre la integración de Gemini en detalle; el hallazgo del lockfile no copiado antes de `npm install` (§3) se puede sumar a `17_DEUDA_TECNICA.md` si se quiere consolidar ahí también.
