# Plataforma de aula

Base ejecutable local: frontend React, API Fastify, worker inactivo, PostgreSQL y límite interno de GitHub. No contiene funciones académicas, migraciones, trabajos de cola ni llamadas a GitHub.

## Requisitos e instalación

Node **24.21.0** y npm **11.19.0**. Las dependencias directas están fijadas y npm exige engines y peers compatibles.

```sh
npm ci
npm run typecheck
npm run build
npm test
npx playwright install chromium
npm run test:e2e
```

En esta máquina, seleccione el runtime verificado antes de los comandos anteriores:

```powershell
$env:PATH = (Resolve-Path .local/runtimes/node-v24.21.0-win-x64).Path + [IO.Path]::PathSeparator + $env:PATH
node --version
npm --version
```

Deben mostrar `v24.21.0` y `11.19.0`. `.local` y su caché npm no se versionan; en otro equipo instale esas versiones.

## Ejecutar

En terminales separadas:

```sh
npm run dev:api
npm run dev:web
npm run dev:worker
```

Abra http://127.0.0.1:5173. La API escucha únicamente en loopback, puerto 3001 por defecto. `PORT` acepta enteros 1–65535; el proxy de desarrollo apunta al puerto 3001. `GET /health/live` solo declara que el proceso responde; no representa disponibilidad de PostgreSQL, cola o GitHub. El worker acepta únicamente `WORKER_MODE=idle` y `--smoke` para salir inmediatamente. Ctrl+C detiene cada proceso. Tras `npm run build`, use `npm run start:api` y `npm run start:worker -- --smoke` para probar Node ESM emitido.

## PostgreSQL local

Copie `.env.example` a `.env`; elija `POSTGRES_PASSWORD` y construya `DATABASE_URL` con usuario/database `classroom`, host `127.0.0.1`, puerto `5432` y contraseña codificada para URL. No comparta ese archivo. Compose lee `.env`; los procesos Node cargan `.env` si existe; las variables de su shell tienen prioridad.

```sh
docker compose up -d postgres
npm run db:check
docker compose stop postgres
```

Configure `DATABASE_URL` en `.env` o expórtela antes del check. El check ejecuta solamente `SELECT 1`, limita tiempos y cierra el pool incluso ante errores. Importar el paquete de base de datos no abre conexiones. Compose requiere contraseña, publica solo loopback y conserva datos en volumen; no se incluyen órdenes destructivas.

Esta máquina también tiene un PostgreSQL portátil ya inicializado en el puerto 54329:

```powershell
pwsh scripts/local-postgres.ps1 Start
$env:DATABASE_URL = (Get-Content .local/postgres/connection.env | Where-Object { $_ -like 'DATABASE_URL=*' }) -replace '^DATABASE_URL=', ''
npm run db:check
pwsh scripts/local-postgres.ps1 Status
pwsh scripts/local-postgres.ps1 Stop
```

Ese runtime y sus credenciales son locales, no forman parte del checkout.

## Límites y verificación

Vitest comprueba liveness/404, validación y limpieza del worker. Playwright inicia API y Vite y comprueba la página real y el estado de API. Sus puertos deben estar libres. No requiere credenciales de proveedores. `packages/github` construye Octokit sin efectuar peticiones; pg-boss está instalado pero nunca se inicia. No hay esquema académico ni paquete de dominio vacío.

La auditoría RR-01 identificó cuatro avisos moderados en la cadena de desarrollo Drizzle Kit → esbuild-kit → esbuild. No ejecutar Studio/esbuild serve ni `audit fix --force`. Una instalación offline no sustituye la auditoría online; los riesgos de producción se auditan por separado. Los gates RR-02–08, OQ-10–13, las decisiones propuestas AD-12–18 y R-01 siguen pendientes.


En esta máquina el navegador de Playwright está en el caché del proyecto. Antes de instalarlo o ejecutar E2E en PowerShell: ` $env:PLAYWRIGHT_BROWSERS_PATH = (Join-Path $PWD '.local/playwright') `. En un checkout nuevo puede usar el caché predeterminado con las órdenes de instalación anteriores.


## RR-02 operational proof

The isolated PostgreSQL/pg-boss proof is available through `npm run rr02:proof` after starting the existing local PostgreSQL server and selecting the pinned Node runtime. It creates only uniquely named disposable databases/roles; it does not migrate `classroom_dev` or start business jobs. See [run instructions and limits](packages/database/rr02/README.md) and the [RR-02 PASS report](_bmad-output/planning-artifacts/architecture/architecture-Proyecto-Desarrollo-2026-09-11/reviews/RR-02.md). Proof data and failed runs are retained under ignored `.local/rr02`; no automatic destructive cleanup occurs.
