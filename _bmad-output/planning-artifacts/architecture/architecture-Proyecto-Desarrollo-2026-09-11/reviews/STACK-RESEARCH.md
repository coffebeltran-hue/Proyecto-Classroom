# Verificación documental del stack

Fecha de corte y consulta: 2026-09-11. Estado: investigación documental; no instalación, resolución de lockfile, compilación, contenedor ni ensayo de base de datos ejecutados. El stack está aprobado; los pins siguientes son RECOMMENDATION revisable antes de implementación. «Publicado» no significa «compatibilidad integral probada».

## Matriz de versiones

| Componente | Versión estable observada / candidata | Evidencia y restricción |
|---|---|---|
| Node.js | **24.21.0 LTS** | Release 2026-09-08. Preferir línea 24 LTS a 26 Current; mantener último parche de la línea al construir. [Release](https://github.com/nodejs/node/releases), [soporte](https://nodejs.org/en/about/previous-releases). |
| TypeScript | Última observada **7.0.2**; candidato conservador **6.0.3** | Release nativa 7.0.2 del 2026-08-20; 6.0.3 publicado 2026-04-16. TS 7.0 no incluye API programática; recomendar 6.0.3 inicialmente evita introducir simultáneamente aliases/compiladores para herramientas que importan `typescript`. [Releases](https://github.com/microsoft/TypeScript/releases), [transición oficial](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/). |
| React / React DOM | **19.3.0**, misma versión en ambos | Publicado 2026-09-09; validar typings y bibliotecas UI elegidas. No requiere adoptar React Server Components. [Releases](https://github.com/react/react/releases). |
| Vite | **8.3.0** | Publicado 2026-09-10; guía exige Node 20.19+ / 22.12+ y admite plantilla react-ts. Node 24 cumple el rango documentado. [Release](https://github.com/vitejs/vite/releases), [guía](https://vite.dev/guide/). |
| Plugin React | **@vitejs/plugin-react 6.1.1** | Release 2026-08-28; manifiesto observado declara Vite ^8.0.0 y Node ^20.19.0 o >=22.12.0. No activar compilador experimental por defecto. [Release](https://github.com/vitejs/vite-plugin-react/releases), [manifiesto observado](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/package.json). |
| Fastify | **5.12.4** | Publicado 2026-09-11; 6.0 alpha excluida. Línea 5 con fin de LTS TBD. Su política cubre líneas Node LTS, aunque la tabla visible aún enumera 20/22: comprobar Node 24 con la combinación real. Plugins deben declarar compatibilidad con Fastify 5. [Releases](https://github.com/fastify/fastify/releases), [LTS](https://fastify.dev/docs/latest/Reference/LTS/). |
| Drizzle ORM | **0.45.2** | Stable visible; 1.0.0-rc.4 sigue pre-release y no se adopta automáticamente. [Releases](https://github.com/drizzle-team/drizzle-orm/releases). |
| Drizzle Kit | **0.31.10** candidato asociado | Confirmado en package.json del tag ORM 0.45.2, no mediante dist-tag npm. Verificación del artefacto publicado y compatibilidad exacta ORM/Kit pendiente antes del lockfile. [Manifiesto versionado](https://github.com/drizzle-team/drizzle-orm/blob/0.45.2/drizzle-kit/package.json). |
| Octokit | **octokit 5.0.5** | Release 2025-10-31, Node >=20. El paquete agregado no comparte necesariamente versión con @octokit/rest, auth-app o webhooks. Fijar dependencias transitivas y comprobar cada subpaquete usado. [Release](https://github.com/octokit/octokit.js/releases), [engine](https://github.com/octokit/octokit.js/blob/v5.0.5/package.json). |
| pg-boss | **12.31.0** | Publicado 2026-09-10, schema 41. Requiere Node >=22.12 y PostgreSQL >=13. La versión mínima no equivale a versión PostgreSQL soportada actualmente. [Requisitos](https://github.com/timgit/pg-boss#requirements), [release](https://github.com/timgit/pg-boss/releases/tag/12.31.0). |
| PostgreSQL | **18.6** candidato; **17.11** alternativa | Versiones estables publicadas 2026-08-13; 19 beta excluida. Política oficial: cinco años por major. Seleccionar 18 si el proveedor y ensayos lo soportan; 17 es fallback explícito sin cambiar dominio. [Política y versiones](https://www.postgresql.org/support/versioning/). |
| Vitest | **5.0.0** | Publicado 2026-09-03; engine ^22.12.0, ^24.0.0 o >=26.0.0; peer Vite ^6.4.0, ^7 o ^8. Alinear coverage y demás paquetes Vitest con la versión elegida. [Release](https://github.com/vitest-dev/vitest/releases), [manifiesto del tag](https://github.com/vitest-dev/vitest/blob/v5.0.0/packages/vitest/package.json). |
| Playwright | **1.63.0** | Publicado 2026-09-04; documentación admite Node 22/24/26 actualizados, Debian 12/13 y Ubuntu 22.04/24.04/26.04. Navegadores y contenedor de pruebas deben corresponder a la versión del paquete. [Release](https://github.com/microsoft/playwright/releases), [requisitos](https://playwright.dev/docs/intro). |
| Docker Engine | **29.8.0** observado | Publicado 2026-09-03. Es versión de Engine, no tag de imagen Node ni versión de Desktop. El runtime del hosting se verifica aparte. [Release notes](https://docs.docker.com/engine/release-notes/29/). |

No se usaron prereleases como versiones estables ni releases posteriores a la fecha de corte. Las páginas de rama principal son evidencia móvil: congelar manifiestos y hashes en el gate de dependencias. La consulta web al registro npm no obtuvo metadata utilizable; no se afirma haber verificado dist-tags ni integridades npm.

## Compatibilidad y scaffold recomendado

RECOMMENDATION: monorepo ESM con workspaces npm inicialmente, un lockfile, Node 24 en desarrollo/CI/runtime, frontend Vite react-ts y backend compilado para Node. Herramientas de build no forman parte obligatoria de la imagen runtime. No ejecutar un generador todavía. Registrar versión exacta de create-vite al autorizar scaffold; no conservar comandos @latest como mecanismo reproducible.

La intersección de engines Vite/plugin React, Vitest, Octokit y pg-boss incluye Node 24. El peer explícito Vitest 5/Vite 8 es compatible documentalmente. Esto no demuestra que Drizzle, drivers, validadores JSON Schema, typings React y plugins Fastify compilen juntos. RESEARCH REQUIRED: resolver instalación con engines/peers estrictos, typecheck y build mínimo, luego pruebas de integración. TS 6.0.3 es el candidato inicial; TS 7.0.2 queda como actualización posterior evaluable. Microsoft documenta ejecución lado a lado mediante @typescript/typescript6 y aliases para consumidores de API como typescript-eslint; no introducir esa complejidad sin necesidad. No se verificó una declaración específica Drizzle/Vitest que garantice compatibilidad integral con TS7. [Transición oficial](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/).

## Migraciones y cola

FACT: pg-boss 12.31.0 usa schema 41 y anuncia migración al actualizar. Su opción `migrate` es true por defecto; con false, start no migra y falla si hay migraciones pendientes. [Release schema](https://github.com/timgit/pg-boss/releases/tag/12.31.0), [opciones](https://github.com/timgit/pg-boss/blob/master/docs/api/constructor.md).

RECOMMENDATION:

- Schema pg-boss separado del esquema académico; propietario migrador y roles runtime distintos.
- Migraciones Drizzle generadas como SQL revisable, aplicadas por un paso de release único y auditado; no schema push en producción. [Flujos de migraciones](https://orm.drizzle.team/docs/migrations).
- Migraciones pg-boss también explícitas en ese paso; API/worker con `migrate: false`, sin privilegio general DDL. Readiness falla ante schema incompatible.
- No editar tablas internas pg-boss ni depender de su retención como auditoría académica. Outbox/inbox y estados de dominio permanecen propios.
- No afirmar exactly-once para efectos GitHub/object storage: commit externo seguido de caída sigue requiriendo reconciliación e idempotencia propia.
- Revisar SQL generado, permisos para creación de colas/particiones y mantenimiento de pg-boss. `migrate:false` por sí solo no prueba que runtime nunca necesite DDL: precrear colas y ensayar sus operaciones reales con permisos mínimos.
- Ensayar instalación limpia, upgrade N-1, arranque concurrente, interrupción de migración, restore y worker reiniciado con PostgreSQL elegido. No asumir que rollback de aplicación implica rollback seguro de schema.
- PostgreSQL y pg-boss comparten recursos: presupuestar pools API/worker/cola, conexiones de migración, vacuum, crecimiento y lag. No añadir Redis sin necesidad medida.

## Contenedores y mantenimiento

RECOMMENDATION: Linux Debian slim compatible con Node y tooling; build multietapa, usuario no root, filesystem de runtime de solo lectura salvo temporales acotados, capacidades Linux eliminadas, sin socket Docker, secretos inyectados fuera de capas, imágenes fijadas por digest con actualización revisada. API y worker son procesos desplegables diferentes. No ejecutar código estudiantil en ninguno. Las prácticas oficiales recomiendan bases confiables y pequeñas, multietapa y pins; los controles concretos anteriores son decisiones de seguridad del proyecto. [Docker build guidance](https://docs.docker.com/build/building/best-practices/).

FACT: las páginas de releases muestran actividad reciente, pero no constituyen SLA ni garantía de mantenimiento futuro. RECOMMENDATION: inventario/SBOM, licencia por dependencia, revisión de advisories directos y transitivos, actualización de seguridad priorizada y CI reproducible. No afirmar ausencia de vulnerabilidades: no existe todavía lockfile que auditar.

## Gates pendientes

1. **Antes de fijar implementación:** confirmar artefactos publicados, versiones exactas, engines/peers y ruta TS7/tooling; ningún `ignore-engines` para ocultar incompatibilidad.
2. **Antes del primer incremento integrado:** demostrar PostgreSQL 18.6 + pg-boss 12.31.0 + driver elegido, migraciones, roles y recuperación; alternativa PostgreSQL 17.11 documentada si proveedor impide 18.
3. **Antes de despliegue:** proveedor DB, región, TLS/pooling, PITR, extensión/DDL permitido, límites y restore. Object storage aún requiere elección y verificación de borrado real, versioning, backups, cifrado, lifecycle y retenciones excepcionales.
4. **Antes del piloto:** organización/App de ensayo, OAuth callback, firma sobre bytes originales, tokens, permisos por endpoint y webhook real. Octokit disponible no demuestra autorización de la organización.

Resultado: stack base coherente documentalmente; selección de versiones candidata actualizada. Compatibilidad integral y operación siguen pendientes de pruebas autorizadas; no se ha escrito código de aplicación.
