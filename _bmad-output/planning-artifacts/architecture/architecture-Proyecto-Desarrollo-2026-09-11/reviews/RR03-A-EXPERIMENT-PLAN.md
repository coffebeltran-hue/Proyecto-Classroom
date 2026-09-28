# RR03-A — Installation-token template generation: experiment plan

Fecha de inspección local: 2026-09-25, America/Bogota. **PROPOSED / NOT EXECUTED / WAITING FOR JUAN.**

Alcance autorizado para esta sesión: fase 0 y análisis documental de A; producir este plan y detenerse. No ejecutar el experimento, fase B, pruebas, OAuth, tokens, operaciones GitHub, cambios de permisos/selección, commit o push. Este plan no constituye autorización de ejecución.

## 1. Fase 0 — checkpoint recuperado

- FACT: proyecto `C:/Users/coffe/OneDrive/Desktop/Proyecto Desarrollo`.
- FACT: branch `main`; HEAD `885ce136a24c3e6bfc93612461dbf6a9d95aea0f`, coincide con el handoff.
- FACT: `LAST-48-HOURS-CONSOLIDATED-HANDOFF.md` existe; se reutiliza, no se reconstruye.
- FACT: RR-01 PASS; RR-02 PASS local; RR-03 PARTIAL, según informes y checkpoint final.
- FACT: no hay cambios staged; hay cambios tracked y archivos untracked de RR-03.
- FACT: adicional al inventario del handoff, Git registra eliminado `.claude/skills/bmad-brainstorming/assets/brain-selector.html`. Autor, motivo y fecha: UNKNOWN. No restaurado ni modificado.
- FACT: `.env` y `.local/rr03/app.private-key.pem` están ignorados; no se leyeron sus valores.
- FACT: están disponibles los cinco JSON requeridos, recuperación de targets, revisión dirigida y ACR-002.
- FACT: no se encontró AGENTS.md en la búsqueda del proyecto ni en los ancestros consultados.
- INFERENCE: se puede continuar el análisis local de A sin invalidar evidencia; no se detectó contradicción material con RR-03.
- UNKNOWN: estado vivo actual del sandbox, procesos, túnel, DB y credenciales. Los datos de GitHub son observaciones históricas, no una verificación de hoy.
- Pendientes intactos: A installation-token template generation/reproduction; B recovery from late grants/crashes (ACR-002).

### Git status previo a esta documentación

Tracked modified: `.env.example`, `README.md`, `package.json`, `packages/github/src/index.ts`, `reviews/IMPLEMENTATION-PREPARATION.md` (ruta architecture habitual).

Tracked deleted: `.claude/skills/bmad-brainstorming/assets/brain-selector.html`.

Untracked: `_bmad-output/implementation-artifacts/spec-rr03.md`; `reviews/LAST-48-HOURS-CONSOLIDATED-HANDOFF.md`; `reviews/RR-03.md`; `reviews/rr03-evidence/`; `packages/database/rr03/`; `packages/database/src/rr03-intake.ts`; `packages/github/src/security.ts`; `tests/unit/rr03.test.ts`; `tests/unit/rr03-revocation.test.ts`; y los scripts `rr03-collaborator-proof.mjs`, `rr03-local-proof.mjs`, `rr03-permission-rollback.mjs`, `rr03-provider-proof.mjs`, `rr03-revocation-server.ts`, `rr03-serve.mjs`, `rr03-server.ts`, `rr03-template-proof.mjs`, `rr03-template-readback.mjs`, `rr03-token-revocation.mjs`, `rr03-user-revocation.mjs`, `rr03-user-template-final.mjs`.

Estos archivos son trabajo preexistente; no se limpian, descartan o vuelven a ejecutar. El checkpoint final de RR-03 prevalece sobre sus instrucciones históricas de preparación.

## 2. Pregunta exacta

¿Una única generación de la misma plantilla privada, usando un installation access token sin el downscope adicional `repository_ids`, puede generar y reproducir el contenido mientras la instalación permanece `selected`, con solo la fuente seleccionada y Administration write / Contents read / Metadata read?

Se cambia una dimensión conceptual respecto al fallo: omitir la lista explícita de repositorios del token. Se restaura, con intervención y autorización de Juan, el permiso temporal existente durante los intentos históricos. No se adopta un modelo all-repositories ni una alternativa user-token.

## 3. Reconstrucción FACT de la evidencia

| Elemento | Registro y límite |
| --- | --- |
| App | `classroom-rr03-juan`, ID 4990040; client ID público verificado `Iv23li5WIsPocsfDyGbK`. No representa autoridad académica. |
| Instalación | ID 162753561, organización `classroom-rr03-juan`, account ID 330894124. Scope `selected`, no all-repositories. |
| Fuente | `classroom-rr03-juan/rr03-allowed`, ID 1375855376, privada/template en el momento de los intentos. |
| Snapshot fuente | commit `0ca44601747fe3173fcf8053bb75e90607d3aa5c`; tree `878838669a9ee38918902c9165418e6897871419`. |
| Marker | `.github/workflows/rr03-marker.yml`, workflow_dispatch-only; blob `b4b34cc077b63263aa34cb46a6cacc3039200320`; SHA256 `b0d4300331fa26d3f1dba063d593a8c227f843e7cb6786afe71d149312dc5072`. No ejecución Actions. |
| Permisos durante diagnóstico | Administration write, Contents read, Metadata read, según `template-diagnostic-01.json`. |
| Token del primer fallo | `repository_ids: [1375855376]`; requestedIds y actualIds coinciden en `template-generate-422.json`. El script emite el POST con ese cliente. |
| Token del diagnóstico | RR-03 registra restricción a fuente 1375855376. El JSON del diagnóstico no contiene por sí mismo requestedIds; la atribución combina checkpoint y código, no inventa un campo del JSON. |
| Selección histórica | Primera recuperación: solo fuente. Después: fuente y target original 1376587196. Inventario exacto en el instante del POST diagnóstico: NOT RECORDED en ese JSON. No confundir selección de instalación con scope del token. |
| Llamada | `POST /repos/classroom-rr03-juan/rr03-allowed/generate`; owner misma organización, target privado, `include_all_branches:false`. |
| Primer target | `rr03-generated-1789779803890`; POST 422. Detalle del error no retenido en primer JSON. Owner confirmó existencia; lectura tras selección verificó ID 1376587196 y commits 409. |
| Diagnóstico | `rr03-diagnostic-template-01`; exactamente un POST; HTTP 422; message y errors: "Could not clone: Cloning user does not have permission to view the clone repository". Token revocado 204. |
| Éxito delegado | `template-user-final-01.json`: GitHub App user access token de coffebeltran-hue, ID 257880786; mismos permisos reportados, scope selected, IDs visibles 1375855376 y 1376587196; misma fuente/snapshot. No restriction `repository_ids` equivalente emitida para ese user token. |
| Resultado delegado | Único POST 201 a las 01:38:33.806Z del 19/09, target `rr03-user-template-final-01`, ID 1376607049; lecturas inmediatas 409. |
| Reproducción delegada | Lectura posterior con installation token: commit target `0cc411b4b59a4f659f6c4b56424acf778ac62ebb`, tree/manifest/marker iguales. Demuestra lectura y reproducción del target creado con user token; no generación con installation token. |
| Cleanup | RR-03 registra confirmación owner de eliminación de los tres targets. No se recrearán esos nombres. |
| Rollback final | `permission-rollback-final.json`, 19/09 01:50 UTC: instalación y token fresco solo Contents read/Metadata read; selected únicamente 1375855376; allowed 200, denied 404, invitations 403; token revocado 204. |

La autoridad de un owner humano no se transfiere a la App. Un 404 con credencial acotada no prueba inexistencia global. Un 422 no prueba ausencia de efectos remotos. Un 409 inmediato no demuestra fracaso permanente de materialización.

## 4. Diagnóstico e incertidumbre

| Hipótesis | Evaluación |
| --- | --- |
| H1: source-only repository_ids excluye autoridad sobre destino nuevo | **INFERENCE, candidata principal para aislar primero.** La fuente pudo leerse; el fallo menciona visibilidad de clone repository y el target queda fuera de la lista fija. No hay prueba causal aislada. |
| H2: selected-repository installation scope impide autoridad sobre nuevo destino | **INFERENCE, alternativa estrechamente relacionada.** Quitar repository_ids no convierte la instalación en all-repositories. Un nuevo 422 podría dejar H1/H2 sin distinguir. |
| H3: autoridad/visibilidad de target para el principal installation | **INFERENCE, explicación general mejor respaldada.** H1/H2 son mecanismos candidatos; el éxito delegado cambió principal y contexto de autoridad, no una sola variable. |
| H4: private-template clone semantics o limitación del proveedor | **UNKNOWN.** No se prueba incompatibilidad universal de installation tokens con private templates. |
| H5: falta Contents write o Workflows write | **NO RESPALDADA.** El user-token reprodujo el marker con Contents read y sin Workflows write reportado. No ampliar preventivamente. Esto no prueba equivalencia de todos los tipos de credenciales. |
| H6: snapshot defectuoso/409 permanente | El mismo snapshot se reprodujo con user token. Los 409 iniciales de ese target fueron transitorios; no generalizar su duración a otros intentos. |

UNKNOWN: mecanismo exacto de autorización del clone interno; si un token sin repository_ids adquiere autoridad sobre un destino creado después; cómo se incorporó el target exitoso a la selección; scopes exactos de la instalación en cada instante no registrado; tiempo/SLA de materialización; estado del proveedor hoy.

### Versiones y tres tipos de prueba

1. Documentación oficial: los informes existentes citan la documentación de GitHub sobre installation tokens y generación desde template. Se reutiliza su interpretación histórica; no se consultó la web ni se afirma que su contrato actual esté verificado.
2. Implementación local: `scripts/rr03-template-proof.mjs` muestra mint con repository_ids fuente, POST único y mint fuente+target solo después de 201. Retry/throttle deshabilitados. Evidencia histórica identifica Node v24.21.0 y Octokit 5.0.5 y fingerprints. El script user-token usa fetch directo y no fija `X-GitHub-Api-Version`; la versión efectiva histórica no está preservada en los JSON. No atribuirle una versión inventada ni equivalencia temporal exacta.
3. Evidencia ejecutable existente: 422 installation, 201 user y readback igual; aún falta la intervención discriminante. Este plan no completa esa tercera prueba causal.

No hace falta investigación externa para formular este plan provisional. Antes de un futuro experimento aprobado, verificar el contrato/versionado relevante de manera acotada si sigue siendo necesario; registrar la versión elegida y cualquier diferencia con la ejecución histórica. Ese preflight no debe disfrazarse de prueba ya realizada.

## 5. Experimento mínimo propuesto — una mutación principal

**Bloqueado antes de emitir tokens:** el último permiso efectivo conocido no incluye Administration. Se requiere decisión de Juan y su cambio manual temporal; nada se cambia en esta sesión.

- Token: GitHub App installation access token, memoria únicamente, sin OAuth/refresh/user token.
- Permisos propuestos: Administration write, Contents read, Metadata read. Es el conjunto acotado registrado para generación; no se afirma haber demostrado su minimalidad absoluta por pruebas de cada permiso.
- Instalación: 162753561, `selected`; solo rr03-allowed. rr03-denied debe permanecer excluido.
- Mint propuesto: `POST /app/installations/162753561/access_tokens` con body `{"permissions":{"administration":"write","contents":"read","metadata":"read"}}`. Omitir tanto `repository_ids` como `repositories`, no listas vacías. Este mint también es una operación externa y requiere autorización futura.
- Source: rr03-allowed ID 1375855376; snapshot histórico arriba. Si cambió, STOP y explicar antes de generar.
- Target propuesto nuevo: `rr03-installation-scope-20260925-01`, privado, mismo owner. Reservar duraderamente el nombre antes del POST; si ya existe o su ausencia/propiedad no puede establecerse con suficiente autoridad, STOP. No elegir otro automáticamente.
- No precrear target: el endpoint de generación crea un repositorio y esa precreación cambiaría la pregunta.

Llamada principal exacta propuesta, no ejecutada:

```http
POST https://api.github.com/repos/classroom-rr03-juan/rr03-allowed/generate
Accept: application/vnd.github+json
Authorization: Bearer <installation-token-en-memoria>
Content-Type: application/json

{"owner":"classroom-rr03-juan","name":"rr03-installation-scope-20260925-01","private":true,"include_all_branches":false}
```

El header de versión se fijará y documentará tras resolver el contrato/versionado antes de ejecución; no presentar este ejemplo como captura de un request histórico. No se prepara ni ejecuta un script de mutación en esta sesión.

### Preflight acotado tras autorización

Verificar solo lo indispensable para esta nueva mutación: App/instalación/owner correctos, instalación no suspendida, permisos exactos aprobados, selección source-only, fuente privada/template sin drift, scope efectivo del nuevo token y nombre reservado. Registrar identificadores públicos, permisos, versión y hashes; no credenciales. Son guards de una nueva operación, no repetición completa de baselines PASS.

Persistir intent-before-send y sentinel exclusivo; después de posible envío, nunca repetir POST, ni tras crash/timeout. Preservar request ID y respuesta sanitizada. Si el proceso cae con resultado incierto, inspección/diagnóstico del mismo target, no generación nueva.

### Expected success result

201 con identidad privada/owner/target ID coherentes; luego lectura del target y reproducción exacta del manifest path/mode/type/blob y marker contra source congelada, verificando ausencia de drift. Commits pueden diferir. 201 solo no cierra A.

PROPOSED: máximo cuatro lecturas de disponibilidad a 0, 5, 15 y 30 segundos tras 201; 409 se registra como materialización pendiente, sin repetir POST. Una vez disponible, leer tree completo y marker una vez. Si no disponible al límite: PARTIAL, sin convertir 30 segundos en SLA. Si 403/404 impide acceso al destino, detenerse antes de selección manual o de otro token no previsto; no concluir ausencia ni pedir all-repositories como arreglo automático.

### Expected failure result

- 422 con el mismo mensaje: STOP, guardar message/errors/request ID sanitizados y generación count=1; H1 no queda confirmada y H2/H3/H4 siguen abiertas. No repetir ni ampliar permisos.
- 401/403 o preflight incompatible: problema de autoridad/configuración; no generación adicional.
- Timeout/5xx/crash después de envío posible: resultado incierto con posible target existente; conservar nombre e intención; no retry.
- 201 pero contenido no verificable/diferente: creación no equivale a reproducción. Documentar observaciones; A sigue abierto.

### Qué demostraría / qué NO demostraría

Éxito completo: installation-token generation/reproduction es viable en la configuración observada sin la lista repository_ids explícita; favorece H1 como explicación del fallo histórico, sin demostrar causalidad exclusiva entre fechas/estados distintos.

Fracaso: documenta ese conjunto de condiciones. No demuestra que todos los installation tokens fallen con private templates ni que Contents write, Workflows write o all-repositories sean necesarios. No cierra ACR-002, RR-04 ni adopta AD-17. Tampoco valida aprovisionamiento académico de producto.

### Cleanup y stop conditions

Revocar el token propio en finally y descartar referencia, registrando resultado sin prometer rechazo global instantáneo. Si falla revocación, registrar incertidumbre y parar. Nada de tokens/PEM/OAuth codes en archivos, chat o logs.

El único target nuevo puede existir incluso tras 422. Juan deberá confirmar inventario con autoridad owner y eliminar exclusivamente ese target después de preservar evidencia. No borrar allowed/denied ni targets ajenos. Volver Administration a No access y conservar Contents/Metadata read y selected-only-allowed. La verificación posterior del rollback requerirá autorización para un token fresco y lecturas acotadas; no queda ejecutada por este plan.

La meta de una mutación principal significa **un POST generate**, no una única operación HTTP total: mint/revoke, cambio manual de permisos, eliminación de target y rollback son operaciones auxiliares explícitas. No ampliar permiso para automatizar cleanup por comodidad.

STOP inmediato ante necesidad de cualquier nueva acción manual, discrepancia de IDs/permisos/selección/source, secreto en respuesta, nombre ocupado, sentinel consumido, resultado incierto o necesidad de segundo POST. No borrar sentinels para reintentar. No cambiar selección por cuenta del agente.

## 6. Acción manual requerida y autorización

No realizar cambios preventivos al recibir este documento. Si Juan decide continuar A, debe autorizar primero la ejecución acotada y sus auxiliares. Prerrequisito manual concreto:

1. En la App classroom-rr03-juan, Permissions & events → Repository permissions: poner únicamente Administration en Read and write; mantener Contents Read-only y Metadata Read-only.
2. Guardar y aprobar la actualización pendiente para la instalación 162753561 de classroom-rr03-juan.
3. Mantener Only select repositories → únicamente rr03-allowed; no seleccionar rr03-denied ni todos los repositorios.
4. Confirmar el cambio, sin compartir secretos. Después se podrá verificar autoridad real antes del POST autorizado. Cleanup/rollback manuales se solicitarán en su momento exacto y el agente se detendrá en esa frontera.

No se necesita OAuth, regenerar claves ni crear el target manualmente. Si la UI o autoridad requerida difiere, STOP; no improvisar configuración.

## 7. B permanece pendiente; contrato conservado

ACR-002 está CLOSED IN DESIGN y no operacionalmente cerrado. `repair/TARGETED-REVIEW.md`, `repair/REPAIR-PROPOSAL.md` sección ACR-002 y `anti-consensus/FINDINGS.md` exigen intención durable por cuenta/repositorio y attempt potencialmente emitido antes del I/O; revocación avanza generation/CAS; completions obsoletas no restauran deseo ni autoridad académica; restart descubre attempts irresueltos; reconciliación retira grants e invitaciones tardías. Una observación de ausencia no resuelve un PUT viejo incierto. Sin settlement defendible: conservar incertidumbre, limpieza recurrente y escalación. Sin transacciones DB durante red.

El collaborator flow normal PASS no prueba delayed PUT → revoke/DELETE/absent → late PUT → crash → restart/reconcile. No se crea ni ejecuta harness B ni RR03-B-RECOVERY-PLAN.md ahora: la instrucción final limita esta sesión a fase 0 + plan A y STOP. RR-03 conserva explícitamente ambos pendientes.

## 8. Índice local y costo

Fuentes relativas a reviews: `LAST-48-HOURS-CONSOLIDATED-HANDOFF.md`, `RR-01.md`, `RR-02.md`, `RR-03.md`, `repair/TARGETED-REVIEW.md`, `repair/REPAIR-PROPOSAL.md`, `anti-consensus/FINDINGS.md`; `rr03-evidence/template-generate-422.json`, `template-diagnostic-01.json`, `template-existing-recovery.json`, `template-recovered-comparison.json`, `template-user-final-01.json`, `template-user-final-readback.json`, `permission-rollback-final.json`.

Código inspeccionado estáticamente desde raíz: `scripts/rr03-template-proof.mjs`, `scripts/rr03-user-template-final.mjs`, `scripts/rr03-template-readback.mjs`. No ejecutar scripts anteriores: nombres/sentinels/autorizaciones corresponden a rondas terminadas.

Costo siguiente paso: **LOW** para preparar/verificar el experimento acotado; no estimación monetaria ni promesa de cierre. Requiere coordinación manual. Si aparece otro 422, parar y diagnosticar antes de consumir otra mutación. No agentes adicionales, tests, web, GitHub, tokens, commit o push realizados en esta sesión.
