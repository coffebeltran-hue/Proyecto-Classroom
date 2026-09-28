# RR03-B — ACR-002 deterministic local recovery plan

Fecha: 2026-09-27 Colombia / 2026-09-28 UTC. **PROPOSED — NOT IMPLEMENTED / NOT EXECUTED.**

Alcance: diseño documental de un harness experimental aislado. No implementación de producto, adopción de AD, prueba B real/local, RR-04, Party Mode, Anti-Consensus, commit ni push. Implementación y ejecución futuras requieren nueva autorización. A = PASS; RR-03 = PARTIAL, B pendiente.

## 1. FACT: evidencia reutilizada y checkpoint A

`repair/TARGETED-REVIEW.md` declara ACR-002 CLOSED IN DESIGN, no operacionalmente cerrado. `repair/REPAIR-PROPOSAL.md` sección ACR-002, `anti-consensus/FINDINGS.md` y `OPERATIONS.md` protocolo de access attempts son las fuentes del contrato. `GITHUB.md` distingue desired state, observaciones y settlement de llamadas anteriores.

`rr03-evidence/collaborator-cancel.json` y `collaborator-accepted-cleanup.json`, junto con sus checkpoints en `RR-03.md`, acreditan primitivas reales de invitación/cancelación y acceso read/removal: effective read 200, remove 204, posterior 404/none y cero invitaciones. No acreditan el orden adversarial PUT tardío/crash/restart. `packages/database/src/rr03-intake.ts` implementa una transacción de intake webhook; no implementa el reconciliador de access attempts ni constituye prueba B. RR-02 acredita infraestructura local y reinicio, no este protocolo.

A: `installation-scope-2026-09-28T00-27-40.022Z.json` registra un único POST 201 con installation token sin repository_ids/repositories, readback exacto y revocación 204. Permanece PASS.

Verificación de esta sesión, 2026-09-28 00:33 UTC: instalación 162753561 no suspendida, selected; instalación y token fresco SIN override de permisos exponen únicamente Contents read y Metadata read, Administration ausente. Inventario completo total_count=1: rr03-allowed 1375855376, privado, owner 330894124. Acredita allowed accesible y denied excluido. Cuatro llamadas: installation GET 200, mint POST 201, inventory GET 200, revoke DELETE 204. Ninguna mutación de repositorio/configuración. Eliminación del target confirmada por Juan como owner; no prueba independiente de ausencia global mediante API. Evidencia `rr03-evidence/a-rollback-*.json` de esta sesión.

## 2. Contrato exacto reconstruido

**FACT documental:** revocar localmente niega autorización académica y avanza generación atómicamente con el trabajo durable de reconciliación. El efecto remoto no es autoridad académica. No basta rechazar la escritura DB de un worker antiguo: su PUT ya emitido puede producir acceso después del DELETE de otro worker.

Todo intento posiblemente emitido se registra antes del I/O, por tenant/repositorio/cuenta. Resultado, incertidumbre y auditoría sobreviven al proceso. Un completion obsoleto puede documentar SU intento; no cambia desired state ni certifica una generación nueva. No se mantiene transacción DB durante llamadas al proveedor. Startup/reclaim descubre intentos irresueltos sin depender de que sobreviva el mensaje de cola.

Reconciliar implica inspeccionar colaboradores efectivos E invitaciones pendientes; conservar separadas las cuentas antiguas/nuevas. Ausencia observada tiene timestamp y no resuelve por sí sola un PUT anterior desconocido. Timeout, crash, lease vencida o agotamiento de retries no cancelan efectos remotos. Sin argumento válido de settlement, seguir revocation_pending/blocked, vigilancia recurrente y escalación; nunca timeout→revoked.

Convergencia remota es condicional a settlement eventual, credenciales operables y ausencia de cambios externos contradictorios. No se promete revocación instantánea ni recuperar código descargado.

## 3. PROPOSED: límite arquitectónico del harness

Reusar Node/TypeScript y PostgreSQL local existentes, sin nueva dependencia/broker. DB/esquemas y roles exclusivos por run, sin modificar migraciones o roles RR-02 ni tablas de producto. No arrancar nada en esta sesión. Los nombres de tablas del harness son instrumentación experimental, no aprobación de AD-13/18, que siguen PROPOSED. El contrato reparado basta para diseñar una prueba aislada sin cambiar una AD adoptada.

Tres componentes separados: (1) controlador determinista de barreras; (2) worker hijo reiniciable, con conexiones propias a DB; (3) proveedor simulado independiente, solo loopback, que mantiene efectos e invitaciones aunque muera el worker. El controlador mata realmente al worker, no solo arroja una excepción dentro del mismo proceso. El proveedor no cae con él.

Usar reloj lógico y barreras con acuse, no sleeps para forzar carreras. Tiempo real solo como watchdog para detectar cuelgue, nunca como evidencia de settlement. Identidades/repositorios sintéticos; no cargar .env GitHub/PEM ni permitir salida a api.github.com. Sin datos académicos reales.

## 4. Modelo durable mínimo y state machines

**PROPOSED:**

| Registro/eje | Campos y estados |
| --- | --- |
| Subject | tenant_id, repo_id, account_id; desired=grant/revoke; generation monotónica; row_version; local_authorized independiente; last_observation/time; cleanup=pending/blocked/observed_absent |
| Attempt | attempt_id, subject, generation, action=grant/remove_invitation/remove_collaborator; prepared→possibly_issued→succeeded/definitive_no_effect/unknown; response/request/invitation ID cuando existan; nunca borrar incertidumbre por lease |
| Outbox/watch | subject y generación, trigger causal; cursor/checkpoint del sweep persistente; watch activo mientras haya incertidumbre, aunque falle una tarea |
| Audit | event_id único, secuencia, subject/attempt/generation, causa, resultado y observación; append-only dentro de la transacción relevante |
| Proveedor simulado | por cuenta/repositorio: absent/invited/member; comandos retenidos/aplicados, respuestas retenidas; almacenamiento independiente del worker |

`prepared` sin dispatch durable puede cancelarse. `possibly_issued` puede representar tanto un envío real como un crash justo antes del envío: debe tratarse conservadoramente. Es imposible eliminar esa ventana con una transacción local sin protocolo distribuido.

Revocación g→g+1: CAS de desired/generation, local_authorized=false, audit y outbox en una transacción corta. Observaciones remotas no escriben local_authorized. Completion g con sujeto g+1: registrar outcome del attempt, emitir stale-completion-observed y programar reconcile; CAS impide modificar estado deseado actual. Repetición del mismo completion no duplica evento lógico ni efectos.

Cleanup `observed_absent`: solamente observación completa actual de ausencia de acceso/invitaciones MÁS ningún grant propio antiguo irresuelto. De otro modo `pending`; si no puede inspeccionar/actuar, `blocked` con razón y watch retenido. Estos nombres corresponden a ejes distintos, no un enum que oculte la autoridad local.

## 5. Secuencia adversarial principal

1. Commit de subject grant g, audit y trabajo durable.
2. Worker W1 hace CAS/dispatch authorization y commit de attempt potentially issued.
3. Proveedor recibe PUT y lo retiene antes de aplicar; controlador confirma barrera.
4. Revocación local commit g+1, desired revoke, local_authorized=false y outbox.
5. W2 inspecciona/limpia y observa absent. Sigue pending porque W1 puede terminar.
6. Controlador libera PUT viejo: proveedor aplica invite o member. Dos variantes separadas.
7. Variante S: entrega success a W1; CAS rechaza actualización obsoleta y registra outcome. Variante C: mata W1 después de aplicar pero antes de persistir completion.
8. Arranca W3 sin memoria W1; consulta DB y descubre attempt incluso si se eliminó el mensaje de cola del fixture.
9. W3 inspecciona estado remoto, descubre efecto no deseado, registra compensación durable, retira invitación/colaborador y verifica ambos ausentes.
10. Reconciliaciones repetidas no conceden acceso ni corrompen auditoría. Desired sigue revoke/g+1 y acceso académico denegado en cada paso posterior al commit de revocación.

En S, el success registrado resuelve ese grant; ausencia posterior puede producir observed_absent. En C, si el proveedor no ofrece evidencia suficiente de settlement del attempt perdido, la remoción puede completarse físicamente pero el estado correcto sigue pending/blocked. Eso es convergencia del estado durable y auditoría hacia la incertidumbre verdadera, no fallo del harness.

## 6. Crash windows obligatorias

| Ventana | Aserción tras restart |
| --- | --- |
| Antes del commit de intención | Ningún I/O remoto autorizado; no intento parcial válido |
| Tras intención, antes de dispatch authorization | Trabajo recuperable; revoke puede impedir dispatch |
| Tras possibly_issued commit, antes de enviar | Incertidumbre conservadora; no retry ciego de grant |
| PUT recibido, antes de aplicar | Revocación puede ocurrir; absent no certifica cierre |
| Remote success, antes de guardar completion | Attempt descubierto por DB; limpieza y riesgo visibles |
| Tras revoke commit, antes de publicación en cola | Outbox/sweep descubre revocación |
| Tras DELETE remoto, antes de ack durable | Reobservar antes de actuar; ausencia no arregla grants irresueltos |
| Tras observation, antes de CAS cleanup | Una generación nueva invalida certificación vieja |
| Tras audit/outcome commit, antes de ack queue | Replay conserva una transición lógica, no restaura grant |

## 7. Algoritmo de reconciliación

1. Startup y sweep enumeran sujetos pending/blocked e intentos irresueltos desde DB, paginados con cursor durable. La cola acelera; no es única fuente.
2. Transacción corta: leer subject/generation, reclamar trabajo con CAS, registrar fase/attempt. Commit y liberar conexión antes de I/O.
3. Releer la autorización de dispatch. Un cambio posterior aún puede ganar: no prometer fence remoto.
4. Fuera de transacción: inspeccionar collaborators e invitations para la cuenta exacta. Respuesta inaccesible no equivale a ausencia. Registrar observación con generation de lectura y timestamp.
5. Si desired revoke: crear intentos de compensación para cada invitación y acceso encontrado, commit antes de DELETE; luego registrar resultado/unknown por intento. Nunca reenviar automáticamente un grant incierto.
6. Reobservar ambos recursos. CAS sobre generation actual antes de actualizar cleanup; si cambió, registrar evidencia del intento y reprogramar, sin certificar estado nuevo con observación vieja.
7. Evaluar unresolved attempts. Solo resolver con evidencia que demuestre que ese grant no puede producir un efecto futuro. No usar cantidad de lecturas, tiempo transcurrido o expiración de lease como sustituto.
8. Si absence+settlement: observed_absent con timestamp. Si hay incertidumbre: pending y watch durable. Si inspección/remoción bloqueada: blocked, razón, escalación y watch. Fallo terminal de una tarea no borra watch.

Reconcile repetido puede necesitar nuevas lecturas o compensaciones tras drift; idempotencia significa misma intención y efectos lógicos seguros, no exactamente una llamada HTTP. Antes de compensar, verificar cuenta/repositorio/generación; un DELETE viejo tampoco lleva fence remoto y no debe certificar acceso nuevo. Prueba de regrant concurrente registra y repara ese efecto sin inventar cancelación remota.

## 8. Observabilidad y ausencia de transacción durante I/O

**PROPOSED:** assert de la capa de acceso: contador de transacciones worker=0 antes de cada envío. Además un observador DB independiente consulta pg_stat_activity para los PID/conexiones del fixture mientras el proveedor está detenido en una barrera: xact_start nulo y sin idle-in-transaction. Usar conexiones autocommit/liberadas; filtrar solo workers, no la transacción del observador. Repetir en grant, inspect y compensación.

El audit debe reconstruir orden intent committed→dispatch→revoke g+1→remote late effect→crash/restart→discovery→removal→observation→settlement o uncertainty. Timestamps del proveedor y auditoría local son fuentes distintas. Ante crash antes de registrar recepción, mostrar gap conocido; no inventar completion.

Controlador puede observar el estado oculto del simulador para verificar el test, pero NO debe entregar un oracle de settlement al reconciliador. Variante con response conocida prueba cierre; variante opaca prueba que se mantiene incertidumbre. Si se ensaya una API sintética de settlement, etiquetarla como capacidad hipotética y excluirla del veredicto GitHub.

## 9. Matriz de pruebas locales propuestas

| ID | Caso | Resultado exigido |
| --- | --- | --- |
| B01 | I/O antes de intent durable | Guard lo impide; proveedor cuenta cero requests |
| B02 | Dos dispatch workers/CAS concurrente | Un dispatch autorizado por attempt; perdedor no concede |
| B03 | Late invite tras revoke y absent | Invitación descubierta/cancelada; nunca cierre anticipado |
| B04 | Late accepted grant tras revoke | Acceso descubierto/removido; autoridad académica siempre false |
| B05 | Completion antiguo entregado | Outcome propio persistido; desired/generation actual intactos |
| B06 | Crash remote success/pre-completion | Proceso nuevo descubre intento; limpia sin depender de memoria/cola |
| B07 | Unknown grant aún retenido, varias ausencias | Sigue pending; liberar después produce nueva limpieza |
| B08 | Crash tras DELETE/pre-ack | Reobservación/reconcile idempotente; sin grants duplicados |
| B09 | Proveedor 401/403/down | blocked/escalación, no ausencia falsa, watch durable |
| B10 | Agotar presupuesto de tarea/restart | Sweep sigue descubriendo incertidumbre |
| B11 | Old/new account y otro tenant | Limpieza solo del subject autorizado; acceso nuevo no legitimiza cuenta vieja |
| B12 | Regrant g+2 durante cleanup g+1 | CAS viejo no certifica g+2; efecto remoto viejo se conserva/reconcilia |
| B13 | Repetir reconcile/completion | Desired estable; audit lógico deduplicado, observaciones diferenciadas |
| B14 | Todas las barreras I/O | Cero transacciones DB worker abiertas |
| B15 | Controles negativos del propio harness | Desactivar intent-before-I/O, CAS o watch debe hacer fallar su aserción correspondiente |

Las aserciones provienen del contrato, no solo de replicar la implementación. Provider state/controlador son independientes del estado worker. Guardar script/version hashes, schedule de barreras, PID crash/restart, extractos durables antes/después, provider log, auditoría y resultados de aserciones sin secretos. Un test local demuestra sus schedules/modelo; no todas las ejecuciones distribuidas posibles.

## 10. Qué cierra localmente y qué necesita proveedor real

**INFERENCE:** el harness puede cerrar la evidencia acotada de durabilidad, CAS/stale handling, restart/discovery, compensación, idempotencia, separación académica y ausencia de transacciones abiertas para los schedules probados. No prueba comportamiento interno, propagación, políticas ni SLA de GitHub.

**FACT:** ya existe evidencia real de invitaciones/cancelación y acceso aceptado/removal. No repetirla por rutina. **PROPOSED:** combinar esa evidencia con el harness y una revisión de correspondencia del adaptador/contrato antes de decidir el cierre B. El harness no marca por sí solo RR-03 PASS ni convierte diseño en implementación de producto.

No hay por ahora una propiedad residual identificada que obligue a una nueva mutación GitHub: el adversario temporal puede controlarse mejor localmente. Si el harness/adaptador depende de semántica no demostrada (por ejemplo observabilidad de un resultado perdido o settlement de un PUT específico), documentar el gap antes de proponer una prueba real. GitHub real podría probar compatibilidad de requests/observaciones del adaptador bajo crash local, pero no demostrar por un solo experimento un límite universal de settlement ni revocación instantánea.

No resolver el gap opaco con una API inventada ni pedir un nuevo collaborator flow genérico. Si la aceptación exige un estado terminal para una llamada cuyo resultado no puede saberse, requerirá decisión explícita sobre el requisito; el contrato vigente exige incertidumbre honesta. No adoptar automáticamente alternativa ni cerrar ACR-002 por conveniencia.

## 11. Cleanup, stop conditions y próximo paso

Futura ejecución local: registrar previamente nombres absolutos de DB/esquemas/procesos del run y preservar evidencia sanitizada. Solo retirar fixtures de ese run después de comprobar su identidad; no tocar RR-01/02/03 anteriores, .env, PEM, sentinels de A o cambios ajenos. Sin recursos GitHub que limpiar en B local.

STOP ante necesidad de nueva AD, credenciales/permisos reales, cambio de producto, aislamiento DB insuficiente, dependencia nueva, oracle necesario para declarar éxito, o contradicción material con contrato. Preguntar antes de convertir una limitación en nuevo requisito. No probar B ahora.

Siguiente paso propuesto: autorización para implementar y ejecutar exclusivamente este harness aislado. Costo **MEDIUM** por procesos/restart real, DB durable y matriz de fallos dirigida; sin estimación ficticia de créditos. No nueva acción manual GitHub necesaria.
