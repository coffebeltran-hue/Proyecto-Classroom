# README DELEGADO — Proyecto Classroom
> Plan de trabajo del equipo · 10 de noviembre de 2026 · Documento de planificación, no declaración de funcionalidades implementadas.

## Propósito
Construir y publicar una plataforma académica independiente que **se integre con GitHub** para universidades, docentes y estudiantes. El proyecto es una web propia, no una extensión de GitHub ni un sustituto de GitHub Classroom. Las acciones académicas sobre repositorios solo podrán ejecutarse con permisos apropiados, especialmente las acciones reservadas al profesor o al administrador autorizado.

**Responsables de este documento:** Jero (infraestructura y despliegue), Juandi (diseño y experiencia frontend), Maura (flujos y pantallas académicas). El coordinador del proyecto está excluido de esta distribución de tareas. Todos deben integrar sus avances, escribir pruebas y documentar cambios.

## 0. Lectura obligatoria antes de trabajar
- Repositorio: https://github.com/coffebeltran-hue/Proyecto-Classroom
- README principal: instrucciones de instalación, comandos y restricciones reales de la base actual.
- `package.json`: monorepo npm workspaces, Node 24.x, npm 11.19.0; scripts `dev:api`, `dev:web`, `typecheck`, `test`, `test:e2e`, `build`, `db:check`.
- `vercel.json`: servicios `web` (Vite) y `api` (Fastify), y rewrites de `/health`, `/me`, `/auth` y `/admin`.
- No confundir **infraestructura experimental** con funciones de producto: según el README actual, el worker permanece inactivo y las pruebas de GitHub App son de sandbox; el repositorio NO documenta todavía tareas académicas, provisión automática de repositorios, migraciones académicas completas ni procesamiento de entregas.
- Las conversaciones previas mencionan pantallas, sesiones, membresías y despliegues parciales. **Revalidar todo contra el código y la producción actuales** antes de marcar algo como hecho.

## 1. Prioridades compartidas
| Orden | Prioridad | Resultado esperado |
|---|---|---|
| P0 | Bloqueante | Proyecto compila, pruebas pasan, API levanta y despliegue verificable; auth/configuración sin secretos expuestos |
| P1 | MVP | Sesión + roles + solicitud/aprobación de institución + navegación y paneles funcionales |
| P2 | Académico | Cursos, clases, matrículas, actividades, entregas y autorización sobre GitHub |
| P3 | Pulido | Temas, accesibilidad, correo/notificaciones, observabilidad, documentación y lanzamiento |

**Regla de trabajo:** una tarea se marca terminada solo con código integrado, prueba o evidencia reproducible, captura cuando aplica, y PR revisado. No hacer push directo a producción si falla el pipeline. No copiar credenciales en commits, issues ni capturas.

---

## 2. JERO — Vercel, Neon, API en producción, GitHub OAuth y lanzamiento
**Meta:** que la plataforma desplegada funcione realmente de extremo a extremo, no solo que Vercel muestre “Ready”.

### P0: investigar y estabilizar
- [ ] Comprobar rama productiva, último commit desplegado, configuración de Root Directory y servicios `web`/`api` definidos en `vercel.json`.
- [ ] Revisar Vercel Build Logs y Runtime Logs y registrar el error real con fecha, commit y ruta. En conversaciones anteriores se reportaron `500` en `/health/live` y problemas con `/me`; verificar si persisten.
- [ ] Identificar las variables **exactas** requeridas por el código (no asumir que la lista de esta guía es exhaustiva). Revisar `DATABASE_URL`, variables de cliente/secreto GitHub OAuth, origen del frontend, URL pública, cookies y claves de sesión si aplican.
- [ ] Configurar las variables en los entornos correctos de Vercel (Production y, si se usa, Preview/Development), sin espacios ni comillas indebidas. Si se usa integración Neon–Vercel, comprobar si el prefijo cambia `DATABASE_URL`.
- [ ] Confirmar que la URL de Neon usa la cadena apropiada y credenciales vigentes; comprobar DNS, TLS, permisos de usuario y conectividad **desde el runtime desplegado**, no solo desde el portátil.
- [ ] Verificar compatibilidad de Fastify con la entrada serverless `apps/api/src/server.ts`, el build y los rewrites; distinguir ruta de salud de disponibilidad de base de datos.
- [ ] Confirmar que las migraciones del producto se aplican de forma controlada, con respaldo y sin borrado de datos. No ejecutar pruebas experimentales sobre la base productiva.
- [ ] Verificar versión de Node en Vercel compatible con la configuración actual del proyecto y dependencias.
- [ ] Corregir errores de inicio del backend y respuestas `500/503` sin ocultar excepciones.
- [ ] Configurar dominio y callback OAuth de GitHub; verificar `state`, cookies seguras, SameSite, HTTPS, CORS/origen y cierre de sesión.
- [ ] Nunca almacenar ni solicitar contraseñas personales de GitHub: la autenticación se hace mediante OAuth y permisos explícitos.
- [ ] Verificar que los permisos/tokens de GitHub App o OAuth sean los mínimos necesarios y que crear repositorios requiera autorización apropiada.

### P1/P2: robustez
- [ ] Definir endpoints de salud: liveness (`/health/live`) y, si se implementa, readiness que compruebe dependencias sin filtrar secretos.
- [ ] Documentar contrato de API para sesión, usuario, instituciones, solicitudes, membresías, cursos y entrega de actividades junto con Maura.
- [ ] Implementar/validar restricciones de autorización en backend (no confiar en ocultar botones).
- [ ] Acordar quién administra las migraciones PostgreSQL y sus backups; preparar rollback de despliegues.
- [ ] Definir si se necesita worker/cola para sincronización y tareas pesadas. **No afirmarlo operativo** mientras siga en `idle`.
- [ ] Añadir registros útiles, manejo de errores y comprobación de salud sin publicar datos sensibles.
- [ ] Separar Development/Preview/Production y credenciales por ambiente.

### Prueba de aceptación de Jero
- [ ] `npm ci`, `npm run typecheck`, `npm test`, `npm run build` y `npm run test:e2e` pasan en entorno reproducible.
- [ ] La web abre desde el dominio publicado y `GET /health/live` responde con éxito de forma consistente.
- [ ] `GET /me` sin sesión devuelve respuesta controlada; con sesión devuelve identidad autorizada; no hay `500` de configuración.
- [ ] Un usuario inicia sesión en GitHub, regresa al dominio, refresca la página y mantiene sesión; puede cerrarla.
- [ ] Una operación de lectura/escritura permitida persiste en Neon y se confirma después de refrescar; las no autorizadas se rechazan.
- [ ] Evidencia: enlace del deployment, commit SHA, capturas/respuestas sin secretos, causas raíz y procedimiento de rollback.

---

## 3. JUANDI — diseño visual, frontend y personalización
**Meta:** una aplicación moderna, coherente, accesible y responsive; no copiar la apariencia oscura de GitHub como obligación.

### P1: identidad visual y estructura
- [ ] Auditar frontend React/Vite: componentes, rutas, estilos CSS, estados y pantallas disponibles; listar lo que falta antes del rediseño.
- [ ] Proponer sistema visual documentado: colores primarios/acento, tipografía, espaciado, iconos, bordes, botones, formularios, tablas, avisos y estados.
- [ ] Mantener un esquema verde como opción inicial si el equipo lo decide; añadir otras paletas sin imposición de un color.
- [ ] Implementar **modo claro, modo oscuro y personalización del acento** (verde, azul, morado, etc.) mediante variables CSS/tokens, sin reemplazar manualmente cada regla.
- [ ] Opcional: selector de fondo/tema adicional o presets, garantizando contraste y legibilidad.
- [ ] Persistir preferencias por usuario cuando exista backend adecuado; mientras tanto, usar almacenamiento local. **No usar cookies sensibles ni asumir que el servidor debe renderizar cada color**.
- [ ] Crear panel de Apariencia en ajustes: vista previa, selector, restaurar predeterminados, alternar tema y persistencia tras recarga.
- [ ] Diseñar y construir navegación principal, barra superior, menú lateral, breadcrumbs, perfil, logout, buscador y estados sin datos.
- [ ] Asegurar experiencia responsive en móvil, tablet y desktop; navegación por teclado, foco visible, etiquetas, contraste, estados de carga y mensajes de error.
- [ ] Crear componentes reutilizables para pantallas de Maura: `Button`, `Input`, `Select`, `Modal`, `Table`, `Card`, `Tabs`, `Badge`, `Toast` y diseño de formularios.
- [ ] Mostrar mensajes claros para usuario pendiente, acceso rechazado, correo no institucional, sesión expirada y error del servidor.
- [ ] Revisar UX de login, onboarding, selección de institución, perfil y configuración de cuenta.

### P2/P3: integración y pulido
- [ ] Implementar estados de carga/vacío/error en dashboards, cursos, solicitudes y entregas.
- [ ] Coordinar con Maura cada pantalla para evitar duplicar componentes y CSS.
- [ ] Evitar hardcodear datos reales o permisos en frontend; usar APIs y estados simulados solo cuando estén claramente identificados.
- [ ] Escribir pruebas de componentes/flujo visual, revisar accesibilidad y documentar convenciones de estilo.
- [ ] Optimizar carga inicial, tamaño de assets y presentación en diferentes resoluciones.

### Prueba de aceptación de Juandi
- [ ] Tema claro/oscuro y acento se pueden cambiar y sobreviven una recarga.
- [ ] La navegación se adapta a móvil/desktop; formularios accesibles y mensajes comprensibles.
- [ ] Todos los roles usan un sistema visual coherente; no existen botones decorativos que prometan funciones inexistentes.
- [ ] Entrega capturas de las pantallas, guía de estilos y PR con pruebas.

---

## 4. MAURA — pantallas, lógica y permisos de estudiante, profesor, administrador e instituciones
**Meta:** implementar los flujos académicos completos, con API, modelo de datos, validación, estados y autorizaciones. Coordinar endpoints/backend con Jero y componentes visuales con Juandi.

### P1: identidad, instituciones y solicitudes
- [ ] Definir claramente roles globales y roles **por institución**: estudiante, docente, administrador institucional; una persona puede pertenecer a varias instituciones con roles diferentes.
- [ ] Diseñar entidades/tablas (según el esquema real): usuarios, instituciones, dominios institucionales, membresías, solicitudes, historial de decisiones y auditoría.
- [ ] Crear pantalla de selección/búsqueda de universidad e información de pertenencia.
- [ ] Crear **formulario de solicitud de acceso**: institución destino, nombre, correo de contacto, correo institucional si lo tiene, código universitario opcional, rol solicitado, motivo o explicación.
- [ ] Permitir solicitudes con Gmail u otro correo no institucional, **sin conceder acceso automáticamente**. Los dominios institucionales pueden ayudar a evaluar, pero no son prueba suficiente de pertenencia.
- [ ] Estados de solicitud: borrador (opcional), pendiente, aprobada, rechazada, cancelada; fecha, institución, solicitante y administrador decisor.
- [ ] Panel «Mis solicitudes» del usuario: estado, motivo de rechazo, posibilidad de corregir o reenviar bajo reglas definidas.
- [ ] Bandeja de solicitudes del administrador **de esa institución**, con filtros, detalle, verificación, aprobar/rechazar y explicación.
- [ ] Permitir contacto administrador–solicitante mediante mensajes internos o notificaciones por email con consentimiento y sin exponer correos al público.
- [ ] Administrador de La Sabana solo decide solicitudes de La Sabana; el de otra universidad no debe poder decidirlas.
- [ ] Rechazar con guía útil: «Solicita acceso a tu institución correspondiente» cuando aplique, sin revelar datos privados.
- [ ] Prevenir doble aprobación, carreras de concurrencia, solicitudes repetidas y elevación de privilegios. Registrar quién decidió, cuándo y por qué.
- [ ] Definir autorización para registrar nuevas instituciones y nombrar al primer administrador sin autoasignación insegura.
- [ ] Distinguir validación automática del dominio y revisión manual: la decisión final debe seguir las reglas acordadas.

### P1/P2: pantalla de ESTUDIANTE
- [ ] Dashboard con institución activa, materias, actividades y notificaciones relevantes.
- [ ] Perfil, preferencias y estado de membresía.
- [ ] Explorar cursos/inscribirse por invitación o código con autorización.
- [ ] Ver clases, descripción, recursos, fechas, rúbricas y actividades.
- [ ] Conectar su identidad de GitHub de manera consentida.
- [ ] Consultar repositorios asignados, URL, visibilidad y permisos.
- [ ] Ver instrucciones de tarea, fecha de entrega, estado de envío e historial.
- [ ] Entregar trabajo mediante repositorio/enlace/commit según modelo definido; validación y confirmación.
- [ ] Consultar comentarios, retroalimentación y calificación si el módulo se desarrolla.
- [ ] Bloquear funciones si no tiene institución aprobada; mostrar pasos siguientes.

### P1/P2: pantalla de PROFESOR
- [ ] Dashboard de cursos, estudiantes, trabajos por revisar y próximos vencimientos.
- [ ] Crear, editar, archivar y gestionar cursos/clases de instituciones donde tenga rol docente.
- [ ] Gestionar matrículas/invitaciones y grupos, siempre con permisos institucionales.
- [ ] Crear actividades: título, instrucciones, fecha, rúbrica, tipo y repositorio/plantilla si procede.
- [ ] Ver entregas por estudiante y sus estados; ofrecer comentarios y calificaciones si se implementan.
- [ ] Configurar acceso a GitHub y repositorios académicos mediante instalación/permisos autorizados.
- [ ] Crear o asignar repositorios solo cuando el profesor y la integración tengan permiso; **nunca provisionar automáticamente por visitar una página**.
- [ ] Dar seguimiento a entregas tardías, faltantes y repositorios no disponibles.

### P1/P2: pantalla de ADMINISTRADOR e INSTITUCIONES
- [ ] Dashboard institucional con usuarios, profesores, estudiantes, cursos y solicitudes pendientes.
- [ ] Gestionar solicitudes, admitir/denegar usuarios y registrar motivo de decisión.
- [ ] Gestionar membresías, roles y revocaciones con confirmación, trazabilidad y verificaciones.
- [ ] Editar información de institución, descripción, identidad visual y dominios autorizados.
- [ ] Consultar métricas básicas y un log de operaciones críticas.
- [ ] Administrar enlaces/integraciones institucionales de GitHub cuando haya permiso explícito.
- [ ] Soportar cambio seguro de institución activa sin mezclar datos ni mostrar registros de otra universidad.
- [ ] Restringir todas las consultas y mutaciones por institución en backend; pruebas de aislamiento multi-tenant.
- [ ] Decidir con el equipo la diferencia entre administrador institucional y superadministrador de plataforma, con poderes mínimos.

### Reglas de seguridad y pruebas de Maura
- [ ] El frontend no determina permisos por sí solo: verificar roles y membresías en cada ruta mutadora y lectura sensible.
- [ ] No confiar en un campo `role`, `institutionId` o correo remitido por cliente sin comprobarlo.
- [ ] Tests unitarios de estados de solicitud y transiciones de rol.
- [ ] Tests de integración/API: Gmail pendiente, aprobación institucional, rechazo, intento de aprobar solicitud ajena, cambio de institución, permisos profesor/estudiante.
- [ ] E2E mínimo: login → solicitar institución → admin revisa → aprueba/rechaza → el estudiante accede o recibe motivo.
- [ ] Documentar endpoints, modelos, migraciones y capturas con flujo de cada rol.

---

## 5. Dependencias entre responsables
| Función | Responsable principal | Necesita de |
|---|---|---|
| Build, Vercel, Neon, OAuth, cookies | Jero | Maura: rutas y modelo de sesión |
| Contrato API de solicitudes y roles | Maura | Jero: API, BD y validación |
| Componentes y estilos reutilizables | Juandi | Maura: necesidades de pantallas |
| Formularios y dashboards académicos | Maura | Juandi: sistema visual; Jero: endpoints |
| Apariencia/tema persistente | Juandi | Jero/Maura solo si se guarda en servidor |
| Pruebas integradas y puesta en producción | Jero coordina | Los tres validan sus módulos |

## 6. Plan sugerido por fases
1. **Fase 0 — diagnóstico (P0):** cada uno revisa el código de su área y abre un issue/PR con inventario *existe / parcial / falta*. Jero reproduce y aísla problemas de Vercel.
2. **Fase 1 — núcleo seguro (P1):** API, login, sesión, estructura de roles, instituciones, solicitudes, aprobación y un sistema visual reutilizable.
3. **Fase 2 — flujos académicos (P2):** cursos, profesores, estudiantes, actividades, entregas e integración GitHub autorizada.
4. **Fase 3 — pruebas y UX (P3):** accesibilidad, temas, notificaciones, pruebas unitarias, API y E2E, corrección de bugs.
5. **Fase 4 — publicación:** staging/preview, auditoría de variables, migraciones controladas, deploy producción, smoke tests, monitorización y rollback documentado.

## 7. Checklist final de lanzamiento
- [ ] CI verde: dependencias, typecheck, unit tests, build, E2E.
- [ ] Backend, frontend y BD conectados desde producción, sin variables faltantes.
- [ ] OAuth y cookies HTTPS correctos; sesiones revocables.
- [ ] Roles y datos separados por institución en backend.
- [ ] Flujo completo de solicitudes probado con correo institucional y Gmail.
- [ ] Paneles de estudiante/profesor/admin funcionan con datos persistentes.
- [ ] Operaciones de GitHub exigen permisos y manejan errores.
- [ ] Diseño responsive, accesible, claro/oscuro y preferencias persistentes.
- [ ] Migraciones respaldadas, secretos fuera del repositorio, registros sin PII innecesaria.
- [ ] El equipo dispone de manual de despliegue, rollback, capturas y una demo reproducible.

## 8. Cómo reportar trabajo
Cada persona debe abrir una rama `feat/jero-...`, `feat/juandi-...` o `feat/maura-...`, crear PR y describir:
1. **Qué se hizo y por qué.**
2. **Archivos y endpoints modificados.**
3. **Cómo probarlo, comandos y resultados.**
4. **Capturas** para cambios visuales.
5. **Qué queda pendiente / dependencias de otros.**
6. **Evidencia** de permisos y de funcionamiento por rol.

La prioridad es **una demo real y segura**, no una interfaz que aparente funcionalidades aún no conectadas. Actualizar este README delegado conforme se cierren los PR.
