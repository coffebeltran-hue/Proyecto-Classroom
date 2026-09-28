# LAST 48 HOURS — CONSOLIDATED HANDOFF

Checkpoint solicitado por Juan el 18 de septiembre de 2026, hora Colombia. Últimas observaciones conservadas: 19 septiembre UTC. Ventana reconstruida: 17–18 septiembre local; antecedentes anteriores se identifican como tales. No existe una bitácora minuto a minuto completa. Fuente exclusiva: repositorio, informes, evidencia y declaraciones existentes. No se ejecutaron nuevas pruebas ni operaciones externas para este cierre.

FACT = registro/observación con alcance indicado; ADOPTED = aprobación de Juan; PROPOSED = propuesta no adoptada; INFERENCE = interpretación; OPEN/RESEARCH REQUIRED = pendiente. UNKNOWN/NOT RECORDED identifica información no reconstruida. Este informe no altera decisiones, reportes históricos ni evidencia original.

## 1. Executive Summary

Se buscó terminar arquitectura revisable, reparar los contrajemplos adversariales y verificar bases técnicas antes de implementar funcionalidades académicas. Se completaron reparación/re-review documental, RR-01/bootstrap y RR-02. RR-03 obtuvo numerosas pruebas reales, incluida reproducción exacta mediante user token, pero conserva dos pendientes técnicos. El proyecto tiene fundaciones y experimentos, no una plataforma académica terminada ni autorización general de implementación.

| Área | Estado | Resultado principal | Pendiente |
| --- | --- | --- | --- |
| Arquitectura | Reparada; re-review PASS | 11 hallazgos cerrados en diseño | Pruebas operativas y propuestas no adoptadas |
| RR-01 | PASS | Dependencias coherentes y bootstrap ejecutado | Docker sin ejecutar; riesgo dev documentado |
| RR-02 | PASS local | Roles, migraciones, cola, crash/retry y restore | Producción/PITR/upgrade real fuera de alcance |
| RR-03 | PARTIAL | Auth/webhooks/revocaciones/colaboradores/template user-token | Template installation-token; grants tardíos/crashes |
| Limpieza RR-03 | Completada según fuentes | Owner borró targets; rollback efectivo probado | Ninguna acción manual pendiente de esta ronda |
| RR-04–07 | OPEN | Planes y dependencias | Experimentos no iniciados como gates |
| RR-08 | FUTURE | Evaluador protegido fuera de MVP | Investigación futura |
| Producto | No implementado | Monorepo técnico y fixtures aislados | Autorización de slice y políticas pendientes |

La pausa es deliberada por presupuesto agotado según Juan. Consumo exacto UNKNOWN. RR-03 NO cambia a PASS.

## 2. Timeline de las últimas 48 horas

| Etapa/fecha registrada | Objetivo y acción | Resultado, evidencia, decisión y límite |
| --- | --- | --- |
| Antecedentes 11–15 septiembre | Completar paquete y reconciliar aprobaciones | Spine/API/OpenAPI/delivery/evidence/review completados; no trabajo nuevo de esta ventana |
| 17: Anti-Consensus | Wildcard/Level/Killjoy/Splinter y cross-review | 11 findings, 6 HIGH/5 MEDIUM; PASS WITH REQUIRED FIXES. Notas y desacuerdos preservados |
| 17: propuesta y aprobación | Core team propone reparación; Juan decide AD-5/7 | Autorización documental, AD-12–18 siguen propuestas |
| 17: reparación | Sincronizar contratos/generador/diagramas/estados | 85 paths/97 operaciones/112 schemas; validación formal y15 casos. No runtime |
| 17: targeted re-review | Level y Splinter verifican contrajemplos | 11 CLOSED IN DESIGN, cero nuevos HIGH/CRITICAL; ningún cierre operacional |
| 17: RR-01/bootstrap | Resolver versiones/peers y ejecutar base | PASS. Cache/red, build antes de install, SBOM sin versiones y browser ausente resueltos; Docker no disponible |
| 17 22:09:38 -05 | Commit local d6b6fff según git log | Bootstrap registrado; no atribuir commit a acción automática de este cierre |
| 18: RR-02 | Roles/migración/cola/crash/restore | 11 grupos PASS; cinco runs conservados, incluida aserción de fixture corregida |
| 18 07:32:06 -05 | Commit local885ce13 | HEAD actual; trabajo RR-03 posterior sin commit |
| 18: preparación RR-03 | App metadata-only no permite elegir repos | Juan añade Contents read; guarda .env; Client ID público corregido; repos se hacen privados |
| 18: OAuth/intake | PKCE/state/HMAC/persistencia aislada | 15/15 tests, build/typecheck y listeners; OAuth real sin vínculo académico |
| 18: ping/túnel | Recuperar upstream3003 | ERR_NGROK_8012 conservado; receptor recuperado, unsigned401, ping accepted y duplicate con una fila |
| 18 17:21–17:26 UTC | Suspender/reactivar instalación y revocar usuario | Invalidated/verification-required, verificación fresca y evento personal durable |
| 18: installation token | Medir mismo token antes/después de revoke | 200→204→200 transitorio→401, ~4.55s observados, sin SLA |
| 18 17:42–17:44 UTC | OAuth excepcional para retener mismo user token | Baseline200; revocación manual; mismo token401; descarte |
| 19 UTC/18 local: colaboradores | Invitación cancelada y luego aceptada/removida | Cuenta secundaria final404/none/cero invites; no late-grant/crash |
| 19 UTC: template inicial | Template/marker preparados por owner | Whitespace precheck corregido sin mutar source; POST422 dejó target vacío |
| 19 UTC: diagnóstico | Leer target y segunda generación autorizada | Scoped404→selección manual→409; diagnóstico422 exacto. Auto-review bloqueó intento previo antes de autorización, sin ejecutarlo |
| 19 UTC: análisis estático | Investigar token source-only | Hipótesis de acceso destino, no prueba de permiso faltante; ningún Contentswrite/Workflowswrite añadido |
| 19 01:31–01:38 UTC | Preparar único user-token POST | Receptor sin escucha/EADDRINUSE/enlace consumido/Origin rechazado corregidos; sin POST hasta preflight |
| 19 01:38:33.806 UTC | Único POST final | 201 target1376607049; lecturas inmediatas409, token descartado |
| 19 01:43:30 UTC | Lectura posterior autorizada | Commit/tree/manifest/marker iguales; user-token reproduction PASS |
| Posterior, hora owner no registrada | Owner borra tres targets | Existencia diagnóstico resuelta por testimonio owner, no por404 |
| 19 01:50:17 UTC | Verificar rollback Administration manual | Token nuevo solo contents/metadata read;200/404/403 y revoke204 |
| Cierre actual | Consolidación local únicamente | Sin GitHub/token/test/web/config/commit/push |

El usuario pide incluir ERR_NGROK_3200 como incidente posterior. Su timestamp, respuesta y recuperación concreta son UNKNOWN/NOT RECORDED en los artefactos recuperados; búsqueda local no encontró coincidencia. No inventar su secuencia. Ambos incidentes de túnel se distinguen de HMAC: una falla de transporte no demuestra falla de autenticación. Los éxitos posteriores acreditan disponibilidad en esos instantes, no disponibilidad continua.

## 3. Arquitectura y decisiones vigentes

| AD | Estado | Regla/resumen |
| --- | --- | --- |
| 1 | ADOPTED | Autograding formativo; automatic result/evaluation/draft/publication separados; solo docente publica |
| 2 | ADOPTED | Entrega explícita por SHA, revisiones; push no entrega ni deadline bloquea Git |
| 3 | ADOPTED | Vinculación académica confirmada por docente, una activa por identidad/institución, corrección auditada |
| 4 | ADOPTED | Evaluación/nota de revisión concreta; reentrega no invalida ni recalifica automáticamente |
| 5 | ADOPTED + aclaración | Candidato UTC en ingreso completo antes de esperas internas; oficial solo con persistencia durable |
| 6 | ADOPTED | Snapshot privado exact-SHA por entrega confirmada, independiente de recepción; sin ejecutar contenido |
| 7 | ADOPTED + aclaración | Retención piloto/cuotas configurables; excepción institucional para publicar tras borrado |
| 8 | ADOPTED | Decimal exacto0..máximo positivo, hasta2 decimales; porcentaje derivado half-up, no segunda nota |
| 9 | ADOPTED | Retirada explícita/motivada/auditada/CAS/idempotente, sin restaurar publicación anterior |
| 10 | ADOPTED | Una institución/org dedicada piloto, aislamiento multiinstitución desde diseño |
| 11 | ADOPTED | TS/React/Vite/Fastify/PostgreSQL/Drizzle/Octokit/pg-boss/objetos/Vitest/Playwright/Docker; API/worker separados |
| 12 | PROPOSED | Composite tenant FKs/RLS y alcance de autorización |
| 13 | PROPOSED | Inbox/outbox, intentos durables, efectos al menos una vez y reconciliación |
| 14 | PROPOSED | Ejes de evidencia/estado independientes, sequence intake, listas/CAS/resolución explícita |
| 15 | PROPOSED | Grade CAS, curso/purge serialization, journal cancel/start independiente |
| 16 | PROPOSED | Captura acotada privada, reservas y sweep justo |
| 17 | PROPOSED | Templates congelados/versionados y comparación; condicionado a RR-03 |
| 18 | PROPOSED | Linaje identidad, alcance multicurso y efectos remotos inciertos |

AD-5: Juan eligió ingreso confiable de petición completa, con contexto servidor, antes de pool/locks/queue. Guardar received/persisted/confirmed, deadline/policy y procedencia/incertidumbre de reloj. Sin commit no inventar recibo. Cliente/commit/TCP/primer byte/proxy arbitrario no autoritativos. Incertidumbre→needs_review, no late automático. R-01 observación histórica/TTL no fue adoptado.

AD-7: curso activo conserva; archivar/ocultar no cierra. academic_close explícito+12 meses; publicación extiende mínimo12 meses;30 días de pendiente eliminación; holds no expiran por fecha de revisión. Sin cierre no inventar fecha; no acortar conservación aplicada silenciosamente. Límites piloto configurables100MiB comprimido/500MiB inspección/20.000 entradas/20GiB curso/100GiB institución y alertas80/95%. Cuota/fallo captura no invalida entrega. Metadata académica/borrado permanente; no declarar eliminación completa con copias recuperables. Extra30dbackup sin verificar.

AD-7 Option C adoptada: publicación ordinaria sobre captura borrada bloqueada; excepción institucional exactamente acotada permite al docente publicar con razón, fundamento restante, explicación al alumno y auditoría. Admin otorga excepción, no nota. No bytes restaurados ni promesa retroactiva de12 meses. Recaptura fuera MVP; purge activo sigue conflicto.

Monolito modular, sin Redis/microservicios. Reparaciones no adoptan AD12–18. Autorización posterior de bootstrap/experimentos no es autorización general de producto. Párrafos/frontmatter antiguos de spine/REVIEW/memlog dicen revisión o RR pendientes: usar reportes posteriores como supersesión cronológica. No se reescribieron en este cierre.

## 4. Anti-Consensus y reparación

Fuentes: [FINDINGS](anti-consensus/FINDINGS.md), [reporte](anti-consensus/ANTI-CONSENSUS-REPORT.md), [ATTACK-MATRIX](anti-consensus/ATTACK-MATRIX.md), [DECISION-CHALLENGES](anti-consensus/DECISION-CHALLENGES.md), [gate](anti-consensus/IMPLEMENTATION-GATE.md). Personas Wildcard/Level/Killjoy/Splinter; notas, recovery y cross-reviews preservados. Original0 CRITICAL/6 HIGH/5 MEDIUM/0 LOW/0 INFO, PASS WITH REQUIRED FIXES.

| Finding | Severidad | Defecto → reparación documental | Prueba pendiente |
| --- | --- | --- | --- |
| ACR001 | HIGH | Reapproval elude autoridad multicurso→activación unificada/linaje/contexto/locks | RLS, grants/enrollment/role races |
| ACR002 | HIGH | PUT tardío tras revoke→intentos durables/cuenta/repositorio/incertidumbre | Delayed grant+crash+restart+cleanup |
| ACR003 | HIGH | Restore pierde cancelación→journal ordenado cancel/start/readback | Crash matrix/oldDB+currentjournal/fence entorno |
| ACR004 | HIGH | Reopen async vs purge→lock/generación curso | Barreras reopen/purge/hold/publicación |
| ACR005 | HIGH | Confirmation order invierte intención→sequence intake heredada | A/B invertidos, gaps y grade/latest |
| ACR006 | HIGH | Requests no descubribles→listas acceptance/curso | Fresh browser/paginación/tenant |
| ACR007 | MEDIUM | Refund sin wake→sweep justo/settlement único |50captures/2GiB/crash/refund/lease |
| ACR008 | MEDIUM | UUID GitHub no descubrible→cuenta de sesión | Fresh login/cambio cuenta/replay |
| ACR009 | MEDIUM | CAS no legible→current status version separado receipt | N/N+1 teacher/worker races |
| ACR010 | MEDIUM | Reject no expresable→discriminante reject/confirm_exception/reclassify | Guards/replay/terminalidad |
| ACR011 | MEDIUM | Alerta en servicio caído→monitor/canal independiente | Fallos reales/owner/SLO |

Todos CLOSED IN DESIGN: [TARGETED-REVIEW](repair/TARGETED-REVIEW.md),17sept, PASS — DOCUMENTARY REPAIRS VERIFIED, cero nuevos HIGH/CRITICAL. Level001/002/006/008/009/010+AD5, Splinter003/004/005/007/011+AD7. Ningún ACR operacionalmente cerrado. Wildcard conserva HIGH disidente para007; Killjoy retiró HIGH de008. S-03 no promovido por contrajemplo insuficiente. AD5/7 decisiones normativas, no dos findings adicionales.

[REPAIR-CHECKS](repair/REPAIR-CHECKS.json):85paths/97operations/112schemas,15examples/1244refs/34Markdown/85links, formalOpenAPI PASS y generator_equals_output;16reviewfiles y propuesta histórica preservados. No prueba runtime. [Propuesta](repair/REPAIR-PROPOSAL.md) sigue histórica; [changelog](repair/REPAIR-CHANGELOG.md) registra aplicación autorizada. No rerun de review en este cierre.

## 5. RR-01 = PASS

Objetivo y fuente: baseline coherente instalable y bootstrap pequeño, [RR-01](RR-01.md)/[preparación](IMPLEMENTATION-PREPARATION.md). Pins ejecutados Node24.21.0 LTS/npm11.19.0/PostgreSQL18.6; TS6.0.3; React/DOM19.3.0; Vite8.3.0/plugin6.1.1; Fastify5.12.5; DrizzleORM0.45.2/Kit0.31.10; pg8.23.0/types8.23.1; pg-boss12.33.1; Octokit5.0.5; Vitest5.0.1; Playwright1.63.0; tsx4.23.13; typesNode24.13.5/typesReact19.3.0. No refresh de versiones ahora.

Probe strict engines/peers201packages; final workspace207; sin legacy-peer-deps/engine suppression. Lock SHA256 e7f8f02867ad56f38bb4ab20c7443faf0c45c3473cccef4acb267ceaba16c15b. ESM imports reales. Node ZIP verificado contra checksum oficial; PostgreSQL ZIP hash solo integridad local, no firma publisher.

Workspace: apps/web React/Vite health UI; api Fastify factory/executable; worker idle separado; packages/shared config/liveness, database pg/Drizzle, github Octokit privado. Root configs TS/Vitest/Playwright/npm/compose, scripts build/PG, tests smoke. No dominio académico implementado.

Pruebas: typecheck PASS (skipLibCheck, no validación de toda declaración tercero), build ESM/Vite PASS; API emitida GET /health/live; worker idle y cleanup; PostgreSQL18.6 loopback54329 DrizzleSELECT y rechazo conexión sanitizado; Vitest3/3; Playwright2/2 Chromium real UI/API disponible/no disponible. GitHub solo import/construcción, no provider en RR01. Sin academic DDL.

Docker/Compose CONFIGURED NOT EXECUTED por ausencia Docker/WSL; PostgreSQL nativo autorizado. No instalación sistema/licencia Desktop aceptada. Runtime online audit0; full audit4moderate dev-only DrizzleKit/esbuild<=0.24.2, sin HIGH/CRITICAL en el probe. No Studio/esbuildserve/Kit producción, override ni downgrade forzado. Deprecations esbuild-kit conservadas. SBOM CycloneDX183components; licencias inventariadas sin blocker privado identificado, no aprobación legal universal. Offlineaudit0 no consulta fresca.

Archivos: package/lock/.npmrc/.node-version/tsconfig/vitest/playwright/compose/.gitignore/.env.example/README, apps/packages/scripts/tests. Cache/binarios/browser/DB en .local ignorado. Procesos detenidos al cierre histórico, no inferir ahora. Fuera: queue operational, provider, tenants académicos, hosting, business features. Docker sigue límite conocido.

## 6. RR-02 = PASS

[Informe](RR-02.md): PostgreSQL18.6/pg-boss12.33.1 schema42/Drizzle0.45.2/Kit0.31.10,11grupos finales. Cinco runs y aserción ACL fixture corregida conservados. Versiones candidatas12.31/schema41 no baseline final.

Roles prefijados rr02_run: owner NOLOGIN DB/rr02_proof/drizzle; migration LOGIN NOINHERIT SET ROLE owner; qowner NOLOGIN cola; maintenance LOGIN NOINHERIT SET ROLE qowner; API DML proof sin cola; worker DML proof y job/job_common, SELECTversion/queue, EXECUTEjob_now. Runtime sin ownership/owner memberships/CREATE/TEMP/superuser/createdb/createrole/replication/bypassrls. PUBLIC revocado, search_path pg_catalog, nombres calificados, funciones queue invoker. Sin RLS/extensions; límites de servicio no tenant isolation.

Drizzle generate→SQL/journal revisados→Node migrator pinned con advisory serialization; marker2columnas. First/replay/failure rollback PASS, sin tabla parcial/journal aplicado; Drizzle no impide por sí solo historical hash drift. Release hash check/expand-contract/forwardrepair/rollbackcompatible son DISEÑADOS, no pipeline ejecutado. No push ni startup migration. pg-boss DDL separado; schema41 ficticio prueba failclosed, NO upgrade real.

Negativos: runtime CREATE/ALTER/DROP/roles/DB/SETROLE; APIqueue reads; worker versionwrite/createQueue/adminfunctions/rebuild denegados. Runtime migrate/supervise/schedule off; maintenance separado,11rebuilds exitosos owner. No scheduler de producción seleccionado.

Queue: send/process/complete, deliberate failure/retry, duplicates ordinarios distintos/singleton acotado, graceful stop/restart, child kill→active expire→redelivery complete, timeout retry. transactional:false y conexión child idle sin transacción. No provider; timeout no cancela efectos ni garantiza exactlyonce. Inbox/outbox negocio sigue propuesto.

Restore pg_dump custom→DB vacía distinta→pg_restore:2markers/1migration/8queue rows, owners/ACL/defaults, job restaurado completado. Roles ya existían mismo cluster; classroom_dev intacta; dumps/data .local retenidos. No PITR/newcluster/hostpowerloss/outage real/reconnect/load/RPO/RTO/upgrade anterior.

Triple verificación: docs primarias existentes + fuente pinned/SQL + ejecución/catálogos. Typecheck/build PASS, Vitest6/6; validation.json transcripción etiquetada, no rawlog. Acceptance11groups/8fingerprints/48links y ausencia password en changedfiles. Playwright no rerun por UI igual. Docker ausente; deployment scheduling/upgrade/backup institucional RR07/OQ10/13. Archivos packages/database/rr02, wrapper queue, runner/crashchild, tests/spec/report/evidence. Fuera businessschema/RLS/provider/ACRclosure.

## 7. RR-03 — detalle completo del recorrido

### Sandbox y OAuth

Org/App classroom-rr03-juan; orgID330894124; AppID4990040; **ClientID Iv23li5WIsPocsfDyGbK** verificado; installation162753561. ClientID copiado originalmente era incorrecto, corregido con App response. Principal coffebeltran-hue ID257880786 owner/miembro y creador privado según Juan; secundaria coffebeltran-maker ID331091390.

rr03-allowed ID1375855376 y rr03-denied privados. Metadata-only inicial no ofrecía selección; Contentsread habilitado por Juan. Env inicialmente sin guardar se completó; repos se volvieron privados antes de proof. Final selected soloallowed, contentsread/metadataread, adminausente. Temporaladminwrite solo colaboradores/templates, sin Contentswrite/Workflowswrite.

App/install IDs verificados. OAuth real callback http://127.0.0.1:3002/rr03/oauth/callback: user-and-installation-verified, organizationAdminAuthority=false, academicLinkage=false. PKCE/state/browsercookie; pinned SDK helper omitía code_verifier, se transmitió explícitamente sin upgrade. Tokens memoria, refresh descartado, expiry28800 observado, no expiración natural ensayada.

User plataforma != GitHub account != academic identity. Authentication != linkage. Org membership != academic authorization. Installation != personal user authorization. Owner humano no transfiere permisos al installation token. Ningún roster/rol institucional/nota nace de OAuth.

### Revocaciones

Installation token: baseline200→DELETE204→mismo token200transitorio→401 ~4.55s después en run acotado. Primer resultado inesperado preservado. No SLA ni garantía inmediata/universal. Suspensión aparte: guard de programa se detuvo antes de mint, no prueba de rechazo provider de token viejo por suspensión.

User token: faltaba token retenido después del evento personal; Juan autorizó excepción OAuth limitada. Run user-revocation_1789753299441_89a39f: baseline20017:42:34.514Z, holding17:42:34.515Z; revocación manual; probe17:44:07.095Z,40117:44:07.335Z, cierre17:44:07.336Z.240ms duración consulta, no propagación desde revocación GitHub. Exactamente mismo token memoria, no refresh, descartado/proceso terminó.6tests simulados previos separados del liveproof. No zeroization RAM garantizada.

### Webhooks

Webhook-only127.0.0.1:3003 /rr03/webhooks/github; OAuth3002. ngrok https://tantrum-enable-basis.ngrok-free.dev→3003, SSL verificado. ERR_NGROK_8012 upstreamconnectionrefused; recuperación del receptor. ERR_NGROK_3200 mencionado por Juan pero detalles NOT RECORDED. Sin inferir fallas HMAC por túnel ni disponibilidad presente.

Unsigned401 WEBHOOK_SIGNATURE_INVALID; ping firmado accepted; Delivery5902078c-b383-11f1-88d5-b2b416e84ae4, received17:16:11.569Z. Redelivery duplicate; query17:18:40.765Z count1/digest/time iguales. Digest4303d043fa860cdbc6cfa1fc7679fc7b9c13b97f7f6e78d4e2c70c480e976983.12concurrentes sintéticos también probados, no12webhooks GitHub.

Suspend delivery7aa063f0-b385-11f1-9817-7557b401f5ab17:21:29.122Z→invalidated; provider guard INSTALLATION_CONFIGURATION_REQUIRED sin mint. Unsuspend deliveryd0903510-b385-11f1-81f5-36960ee2c36017:23:53.260Z→verification-required, no active automático; ocho observaciones frescas PASS. Personalrevocation github_app_authorization delivery354a1cd2-b386-11f1-997a-d668c787ba9b17:26:41.890Z, installation_idnull sin asociación inventada. No in-flight request real al revocar. installation_repositories soportado parser, liveevent no acreditado. Sin push/Actions subscriptions opcionales ni workflow execution.

Local15/15tests/build/typecheckPASS; missingstate400, OAuth webhook-port404, DBdown503, HMAC/JSONinvalid sin receipt,429sintético sanitizado; no agotamiento realrate-limit. Migración aislada packages/database/rr03/migrations/0000_real_miek.sql installation/receipt, rr03-intake y rol fixture restringido. No academic DDL ni alterar colaRR02.

### Collaborators/invitations

Secundaria inicialmente sin acceso/membership. Adminwrite temporal. Invite333732122 read/pull201, listread/noeffectiveaccess, cancel204 y posterior ausencia. Invite333732138201 pendiente para aceptación manual consentida; Juan aceptó, effectivepermissionread/roleread200. Remove204→collaborator404/permissionnone/zero invites. Tokens revocados204. No latePUT+crash por probar primitivas.

### Templates: todo el recorrido

Owner hizo allowed template, README "RR-03 sandbox proof", marker .github/workflows/rr03-marker.yml workflow_dispatch-only; NO ejecutado. Whitespace precheck falló antesPOST; normalización de vacías corrigió comparación, sin editsource. Snapshot commit0ca44601747fe3173fcf8053bb75e90607d3aa5c, tree878838669a9ee38918902c9165418e6897871419; markerblob b4b34cc077b63263aa34cb46a6cacc3039200320; SHA256 b0d4300331fa26d3f1dba063d593a8c227f843e7cb6786afe71d149312dc5072.

Primer installationPOST422 para rr03-generated-1789779803890; mensaje inicial no retenido. Owner encontrórepo; scoped404 no era ausencia. Owner lo seleccionó, ID1376587196privado/commit409. Segunda propuesta bloqueada por autoreview ANTES de ejecutar por exceder autorización; Juan aprobó luego una única diagnóstica. rr03-diagnostic-template-01 POST422: "Could not clone: Cloning user does not have permission to view the clone repository" en message/errors. Tokenrevoked, no retry.

INFERENCE: repository_ids source-only[1375855376] y selección limitada son candidatos de acceso destino; token source+target previsto solo tras201. No prueba de incompatibilidad general de installationtokens ni permisos faltantes. Documentación previamente consultada admite ambos tipos, Adminwrite+Contentsread. No Contentswrite/Workflowswrite ni allrepos solicitado como solución demostrada.

Única prueba user-token autorizada: rr03-user-template-final-01 privado, sameorg/source/perms/scope. Harness local necesitó corregir escucha expirada, EADDRINUSE PID5532, already-started por enlace consumido y Origin:null por no-referrer; landing+botónPOST/same-origin y sentinels resuelven arranque. Defectos locales, no GitHub. No generación hasta preflight exitoso; no borrar guards para retry.

Preflight usuario/install/source/snapshot/permisos; exactamente1POST→20101:38:33.806Z, target1376607049. Commit reads40901:38:34.050Z y01:38:35.300Z: Git Repository is empty. Script detuvo comparación, inventarió y descartó token, sin polling. Owner luego ve main/1Initialcommit/files/Generatedfrom. Lectura autorizada posterior SIN OAuth mediante installationtoken read-only: commit **0cc411b4b59a4f659f6c4b56424acf778ac62ebb**, treeidéntico, manifiesto path/mode/type/SHAidéntico y markerbytes/hashidénticos. PASS01:43:30.611Z; revoke204.409 transitorio en ESTA ejecución, materializationtime/SLA UNKNOWN. Target aparece en selection posterior; agente no modificó selección, mecanismo no demostrado.

**User-access-token template generation/reproduction = PASS. Installation-token generation/reproduction = NO DEMOSTRADO.** Que el installationtoken leyera después no cambia su POST422 anterior.

### Limpieza/rollback

Owner confirmó borrar los3targets exactos; diagnóstico existía según confirmación owner, no según404. Solo allowed/denied quedaron. Adminwrite retirado manualmente.01:50:17Z instalación y token nuevo SINoverride solo contentsread/metadataread; selected exactamente1375855376; allowed200/denied404/invitationsGET403; tokenrevoke204. No invalidación universal de todos tokensviejos inferida. Ningún pendiente manual owner de esta ronda.

## 8. RR-03 final = PARTIAL

PASS acotados: App/install auth, OAuth y separación autoridad, privateallowed/denied, HMAC/unsignedrefusal, durablereceipt/realdedup, lifecycle, installationtoken401eventual, sameusertoken401, invitations/acceptedaccess/removal, usertemplate exacto, cleanupowner y rollbacknuevo-token. Tests/build/typecheck existentes, no rerun.

1. **Installation-token template generation/reproduction:** solo422 en scope probado; éxito delegado no acredita provisioning worker. Falta experimento discriminante scope/destino/auth aprobado, generación real+manifest+workflow con installationtoken o decisión explícita de cambiar contrato. Ninguna nueva generación/permiso autorizada ahora.
2. **Late grants/crashes ACR002:** falta PUTviejo retenido→revocación/newgeneration→DELETE/read→PUTtardío+crash→restart/reconcile. Debe demostrar tracking durable, incertidumbre visible, invitations/grants cleanup y escalación; convergencia condicional, no revocación instantánea ni recuperar código descargado.

Límites adicionales no inflados a nuevos blockers: naturalexpiry/uninstall/liveOAuthrace no probados, selectionevent live no acreditado, HMACbody no autentica separadamente deliveryheaders,429simulado, no Actions/autograding real, no production/tenantproof. Conservarlos al definir alcance siguiente.

## 9. RR-04 a RR-08

| RR | Estado/objetivo | Dependencias/falta |
| --- | --- | --- |
|04|OPEN temporalreceipt/forcepush/delay/outage|AD5 aclarado, R01sinadoptar; clocks/policyraces/load no iniciados|
|05|OPEN storagecopies/deletejournal/restore|OQ10provider; cancel/start/reopen/purge/copias/30dbackups sin probar|
|06|OPEN hostilearchives/capture/quota|LFS/submodules/bombs/traversal/reservations/sweep/load no ejecutados|
|07|OPEN hostingcontainers/alerts/load/recovery|OQ10/13; Docker/owner/channel/SLO/RPO/RTO pendientes|
|08|FUTURE evaluatorautoritativo|Frontera independiente/provenance/secrecy/exfiltration; no MVPblocker|

RR02restorelocal y RR03HMAC no cierran RR05/07. No nuevos gates iniciados.

## 10. Open Questions/recomendaciones

OQ10 hosting/objectaccount/región/residencia/presupuesto/operator (Juan/institución/Winston); S3 recomendado no aprobado. OQ11 admin/Appowner/políticas institución piloto; sandboxowner no cierra readiness piloto. OQ12 PII no-publicación/appeals/acceso tras baja/corrección (Mary/institución), antesdatosreales, failclosed histórico. OQ13 SLO/RPO/RTO/support/alertrecipient (John/operator).

R01 preview/TTL5min/historicalbranch sigue PROPOSED, no continuidad de membership probada ni adopción por AD5. R02RLS/FK; R03reverseuniqueness; R04S3; R05frozenmechanics; R06retry/auxlimits; R07scalar/sessiondefaults; R08extensions/CSVscope; R09calendarretention mantienen recomendación. R10/11 refinados por decisión/reparación, operacional pendiente. npmworkspaces usado no adopta todoR07. OQ1–7 cerradas/convertidas, OQ8→R08 y OQ9→RR03; no reabrir stack/withdrawal.

Assumptions A01GitHub.com,noGHES; A02proyectos pequeños; A03institución acepta costos/políticas; A04docente resuelve excepciones; A05hostingcontainers/managedDB/objetos disponibles. No verificaciones del futuro piloto.

## 11. Sandbox durante pausa

Org/App classroom-rr03-juan, installation162753561, selectedonlyallowed1375855376, Contentsread/Metadataread/Adminnoaccess comprobados. Owner confirma allowed/denied únicos repos,3targets borrados. Secondary sinaccess/invites según prueba previa, no nuevas concesiones.

Conservar source/template/marker, denied excluido, App y configuración local. Webhook HTTPS ngrok /rr03/webhooks/github conSSL configurado durante prueba; no cambio posterior registrado. UNKNOWN estado vivo actual de túnel/listeners/DB y deliveries durante pausa: no se inspecciona ni promete disponibilidad. No tocar permisos/repos/selección/secrets, regenerarOAuth, workflow o borrarfixtures/evidence mientras pausado. Instrucciones históricas de activarpermisos/generar son obsoletas, no ejecutar.

## 12. Repositorio local

Lecturas baratas: branch main; HEAD **885ce136a24c3e6bfc93612461dbf6a9d95aea0f**. Anterior d6b6fff26eb3cd21352255bee5d72b023371f946. Remoto/push UNKNOWN, sin fetch.

Modified tracked: .env.example; README.md; package.json; packages/github/src/index.ts; reviews/IMPLEMENTATION-PREPARATION.md.

Untracked antes del informe: spec-rr03.md; reviews/RR-03.md; reviews/rr03-evidence/; packages/database/rr03/; packages/database/src/rr03-intake.ts; packages/github/src/security.ts; tests/unit/rr03.test.ts y rr03-revocation.test.ts. Scripts nuevos: rr03-collaborator-proof.mjs, rr03-local-proof.mjs, rr03-permission-rollback.mjs, rr03-provider-proof.mjs, rr03-revocation-server.ts, rr03-serve.mjs, rr03-server.ts, rr03-template-proof.mjs, rr03-template-readback.mjs, rr03-token-revocation.mjs, rr03-user-revocation.mjs, rr03-user-template-final.mjs. Este informe también nuevo/sincommit.

No stage/commit/push. Preservar .local/runtime/dumps/evidence/sentinels sin subir: contiene secretos. Scripts tardíos no tienen suitecompleta rerun acreditada; solo checks específicos. Estados antiguos de docs son cronología; latestcheckpoint gobierna la reanudación.

## 13. Evidence Index

Rutas relativas a reviews. Conservar TODO, incluidos fallos. Evidencia pública preparada sin credenciales, pero IDs/cuentas técnicas sí presentes; no auditoría universal nueva. .local/.env SENSIBLES, no exportar en bloque.

| Archivo/grupo | RR | Demuestra | Sensibilidad/conservar |
| --- | --- | --- | --- |
|RR-01.md; IMPLEMENTATION-PREPARATION.md|01|Pins/alcance/bootstrap|Sin secretos previstos; sí|
|rr01-evidence/selected-manifests.json; probe-inventory.json|01|Peers/engines/licenses|Metadata pública; sí|
|rr01-evidence/probe-audit.json; runtime-audit.json; workspace-audit.json|01|Advisories puntuales|Sin credenciales previstas; sí|
|rr01-evidence/workspace-sbom.json|01|183components|Inventario técnico; sí|
|rr01-evidence/typecheck.log, build.log, api-emitted.log, worker.log, database.log, unit.log, e2e-installed.log|01|Ejecuciones bootstrap|Logs históricos; sí|
|RR-02.md; rr02-evidence/final-evidence.json|02|11groups/roles/ACL/fingerprints|Roles no passwords previstos; sí|
|rr02-evidence/run-history.json; rr02_*.json|02|Cinco runs/fallo fixture|Conservar exploración, no confundir final|
|rr02-evidence/validation.json; acceptance-checks.json; preservation.json|02|Transcripciones/checks/preservación|Sí|
|rr03-evidence/provider_*.json|03|Auth/scope/fallos/config/lifecycle|Sanitizados; sí|
|rr03-evidence/rr03_1789749213491_3af3c6.json; rr03_1789749344623_300d4c.json|03|Fixture/intake|No confundir liveevents; sí|
|rr03-evidence/test-summary.json; server-smoke.json|03|15tests/listeners|Históricos; sí|
|rr03-evidence/oauth_1789749820504_5b3b0f.json|03|OAuth usuario/instalación|IDs no token; sí|
|rr03-evidence/ping-5902078c-first-receipt.json; ping-5902078c-duplicate.json|03|DBcount1/digest/time|IDs/digest; sí|
|rr03-evidence/suspension-observation.json; unsuspension-observation.json; user-revocation-observation.json|03|Eventos/capability|No tokenviejo deducido; sí|
|rr03-evidence/token-revocation_1789752650599.json; token-revocation_1789752677672.json|03|200tras204/luego401|Preservar ambos|
|rr03-evidence/user-revocation-preparation-checks.json|03|6simulatedtests|No liveproof solo; sí|
|rr03-evidence/user-token-revocation-final.json; user-token-revocation-manifest.json|03|Sameuser401/hashes|Sin token; sí|
|rr03-evidence/collaborator-preflight.json; collaborator-cancel.json; collaborator-awaiting-acceptance.json; collaborator-accepted-cleanup.json|03|Invites/read/remove/noaccess|Cuentas técnicas; sí|
|rr03-evidence/template-precheck-whitespace.json; template-generate-422.json|03|Precheck/primer422|Sí|
|rr03-evidence/template-existing-recovery.json; template-recovered-comparison.json|03|Scope404/ID/409|Sí|
|rr03-evidence/template-diagnostic-01.json|03|Segundo422/message/errors|Sanitizado; sí|
|rr03-evidence/template-user-final-01.json|03|OnePOST201/early409/inventario|Sin OAuthcode/token; sí|
|rr03-evidence/template-user-final-readback.json|03|Commit/tree/manifest/marker igualdad|Paths/hashes; sí|
|rr03-evidence/permission-rollback-final.json|03|Fullfreshgrant/200/404/403/revoke204|Sin credenciales; sí|
|anti-consensus/*; repair/*|Diseño|Notas/disensos/findings/checks/re-review|Preservar originales|
|.local/rr01,.local/rr02,.local/rr03|Todos|Runs/dumps/runtime/llaves auxiliares|SENSIBLE, conservar privado|

Scripts documentan procedimientos, no autorizan ejecución en pausa. Fuentes primarias enlazadas en informes anteriores no se volvieron a consultar.

## 14. Security / secret hygiene

git check-ignore confirmó .env y .local/rr03/app.private-key.pem; git ls-files .env .local vacío. No contents de secretos leídos para informe. RR03 registra scan previo de38 changed/untrackedfiles sin currentsecrets/DBcredentials/PEMheaders. Precede algunos scripts finales: **REVIEW REQUIRED antes de eventual commit para todos los cambios nuevos**; no nuevo scan ni garantía universal ahora.

JSON evidencia registra status/time/ID/hash/mensajes sanitizados, no tokens/privatekeys/clientsecrets. Tokens installation finales revocados204; no immediate401 universal. User tokens descartados en memoria; no revocación personal posterior al template registrada, estado personal final UNKNOWN. Descarte/procesoexit no zeroization. Refresh discarded. Juan aclaró selección IDE era X-Hub-Signature-256 y secretGitHubmasked, no webhooksecret expuesto; no rotación necesaria establecida. No reproducir selección.

## 15. Qué NO debe repetirse

Sin nueva razón técnica/autorización: RR01 install/bootstrap/pins, RR02 roles/migrations/queue/crash/restore; OAuth básico; allowed/denied; ping; invalidsignature; dedup; suspend/unsuspend; personalrevocationevent; installationtokenrevocation; sameusertokenrevocation; invitación/aceptación/removal; user-token template; cleanupowner; rollbackAdmin. No borrar sentinels ni recrear targets eliminados. No workflow/Contentswrite/Workflowswrite/allrepos/Admin automático. No amplia rediscovery, PartyMode/AntiConsensus o RR04. Probes mínimos necesarios para nuevo experimento aprobado se deben justificar, no repetir toda batería.

## 16. Próximo punto exacto

Iniciar **RR-03 PARTIAL**. A installation-token template; B lategrants/crashes. PROPOSED: leer handoff/latestcheckpoints/JSON, separar hipótesis scope/destino/auth estáticamente; diseñar experimento A discriminante mínimo con permisos/cleanup explícitos. Nueva autorización requerida antes de tokens/recursos/permisos/generación; actuales permisos sololectura y one-shots consumidos.

B: diseñar intento durable+generation, PUTdemorado→revoke→DELETE/read→PUTlate/crash→restart/reconcile. Distinguir simulador/control de red/evidencia real y límites de settlement/owner/credenciales. Reusar RR02, no afirmar que prueba B. No broker ni DBtransaction sobre network. Después reevaluar RR03; Juan decide RR04 o slice, no automático. R01/OQ12 mantienen gates. No prometer que una prueba cierre ambos.

## 17. Cost / execution discipline

Presupuesto actual agotado según Juan; pausa deliberada. Contador exacto UNKNOWN, no inventar consumo. Este cierre solo lecturas locales/escritura de documento nuevo. Un intento de escritura por comando excedió longitud Windows206 y no creó proceso; se guardó mediante editor, no fue test ni operación externa. No GitHub/token/web/research/config/migration/commit/push. Futuro agente reutiliza evidencia/fallos/fingerprints antes de nuevas operaciones costosas. Pausa no transforma PARTIAL ni concede permiso futuro.

## 18. NEXT SESSION — START HERE

RR-01 = PASS; bootstrap nativo, Docker no ejecutado.
RR-02 = PASS local; PostgreSQL18.6/pg-boss12.33.1 schema42,11grupos.
RR-03 = PARTIAL; no iniciar RR04/producto automáticamente.
Pendiente A: template generation/reproduction mediante installation token.
Pendiente B: recuperación de grants tardíos/crashes ACR002.
User-token template reproduction = PASS, no repetir.
Sandbox org/App classroom-rr03-juan; App4990040; installation162753561.
Repos ownerconfirmados: allowed/denied; tres targets borrados.
Selection efectiva solo rr03-allowed1375855376.
Contentsread/Metadataread; Administration no access.
Rollback200/404/403 comprobado; tokenrevocado204.
No repetir RR01/RR02/OAuth/ping/dedup/lifecycle/revocation/colaboradores.
No repetir cleanup/rollback ni nuevas generaciones sin autorización específica.
AD1–11 adopted; AD12–18 proposed; R01sinadoptar; OQ10–13open.
11ACR closedindesign, ninguno operacionalmente cerrado.
main HEAD885ce136a24c3e6bfc93612461dbf6a9d95aea0f; RR03sincommit.
No imprimir .env/.local/keys; evidencia no contiene tokens reutilizables.
Primera acción: leer últimos RR03checkpoints/template/rollbackJSON sin proveedor.
Proponer A y B acotados y obtener nueva autorización antes de ejecutar.
Solo entonces reevaluar gate con Juan y decidir RR04/verticalslice.
