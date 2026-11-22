# Prompt: crear en este front end las pantallas de Jugador, Habilidad, HabilidadJugador, EquipoJugador y Anotación

## 1. Contexto y objetivo

Estás dentro del espacio de trabajo del front end del proyecto. Todo lo que crees va dentro de este mismo proyecto y debe seguir su estructura actual.

El objetivo es agregar las pantallas de cinco entidades del backend (Backend_Negocio, NestJS): Jugador, Habilidad, HabilidadJugador, EquipoJugador (historial) y Anotación. En el backend se llaman `Player`, `Skill`, `PlayerSkill`, `TeamPlayer` y `Annotation`. Para ello reutilizas lo que ya existe en este proyecto: estructura de carpetas, componentes compartidos, servicios base, rutas, menú y estilo. No se inventan abstracciones nuevas. Cada archivo nuevo debe verse igual que los que ya hay.

Este proyecto ya contiene módulos de otros compañeros (equipos, deportes, partidos, torneos y similares). Son parte del mismo proyecto: reutiliza sus modelos y servicios, no los dupliques ni los reescribas.

## 2. Reglas para gastar pocos tokens

- No leas todo el proyecto. Lista directorios (solo nombres) y lee únicamente lo necesario.
- Elige un módulo CRUD ya terminado y una pantalla de asignación ya terminada como plantillas. Lee solo esos y los componentes compartidos que usan.
- Copia el patrón de las plantillas. No refactorices, no renombres y no reescribas componentes compartidos ni archivos de compañeros.
- Los únicos cambios permitidos fuera de tus carpetas son los mínimos para registrar rutas y entradas de menú. Si un componente compartido necesita un cambio para poder usarlo, detente y pregunta antes de tocarlo.
- Un archivo leído una vez no se vuelve a leer. No pegues código completo en la conversación: reporta con listas cortas.
- Implementa entidad por entidad y no avances a la siguiente hasta que la actual compile.

## 3. Fase 0: analiza este front end antes de escribir código

1. **Mapa del proyecto.** Determina el framework y cómo se organizan `controller`, `model`, `service` y `pages` en este proyecto, en qué carpetas viven, cómo se registran rutas y menú y si el front aplica restricciones por rol o permiso.
2. **Plantillas.** Identifica los CRUD ya terminados (candidatos según el backend: equipos, deportes, torneos, fases, partidos) y las pantallas de asignación ya terminadas (candidatos: asignación de deportes a equipos y inscripciones). Elige una plantilla de cada tipo y lee solo esas.
3. **Componentes compartidos.** Localiza Dynamic Form (crear y editar), Confirm Dialog (eliminar), Detail Dialog (ver detalle), Table List (listados CRUD), Selectable Table (asignaciones) y el Feedback Handler que muestra los errores en un Toast. Anota sus entradas y salidas y cómo los usan las páginas existentes.
4. **Cómo se arman las URL.** Averigua cómo construyen las URL los servicios actuales: URL base, prefijo, cliente HTTP base, token e interceptores. Las rutas cambiaron (ver sección 5.0). Replica el mecanismo que ya usan los servicios existentes; no escribas prefijos a mano.
5. **Backend.** Localiza la carpeta `Backend_Negocio` (módulos `src/players/`, `src/skills/`, `src/player-skills/`, `src/player-teams/` y `src/annotations/`). Si no está en el espacio de trabajo, pide la ruta. Lee sus controllers, DTOs de entrada y de respuesta y entidades, y el prefijo global en `main.ts`, y contrasta con las rutas de la sección 5.2. **El código del backend es la fuente de verdad:** algunas cosas cambiaron respecto a la descripción de la sección 5, que es solo una referencia. Anota cada diferencia.
6. **Reporte corto.** Entrega: plantillas elegidas, mapa de reutilización (qué componente usará cada pantalla), cómo se construyen las URL, diferencias con el backend, archivos que crearás o modificarás y dudas bloqueantes. Pregunta solo lo que no puedas deducir del código. Espera la confirmación del usuario antes de la Fase 1.

## 4. Estructura y convenciones obligatorias

- Sigue la estructura de este proyecto: `controller`, `model`, `service` y `pages`, en las carpetas y con los nombres que usen las plantillas.
- En las pages usa los componentes compartidos exactamente como los usan las demás páginas de este proyecto:
  - **Dynamic Form** para crear y editar.
  - **Confirm Dialog** para todas las eliminaciones.
  - **Detail Dialog** para ver detalles.
  - **Table List** para los listados CRUD.
  - **Selectable Table** para las asignaciones.
  - **Toast mediante el Feedback Handler** para mostrar los errores y las confirmaciones.
- La tabla de asignaciones (Selectable Table) se reutiliza tal como está en todas las asignaciones de este documento. Antes de usarla, léela y comprueba si admite campos extra por selección (nivel, observaciones, fechas). Si no los admite, el flujo es: seleccionar fila, abrir el Dynamic Form para los campos extra y luego llamar al servicio. No modifiques el componente sin preguntar.
- Sin comentarios decorativos, sin bloques de comentarios innecesarios y sin emojis. Respeta lint y formato del proyecto. No agregues dependencias sin preguntar.
- Los textos de la interfaz siguen el idioma que ya usa este proyecto.

## 5. Contexto del backend (referencia; verifícalo contra el código)

### 5.0 Rutas: prefijo `/api` y nombres en inglés

Todas las rutas del backend cuelgan de `/api`, los recursos van en inglés y los parámetros de ruta se escriben `{id}`. Estas son las rutas actuales de los módulos existentes, tal como están registradas en el microservicio de seguridad. Úsalas exactamente así para equipos, partidos y los demás módulos, y como modelo de nombres:

| Entidad | Rutas |
| --- | --- |
| Team | `POST /api/teams`, `GET /api/teams`, `GET /api/teams/{id}`, `PATCH /api/teams/{id}`, `DELETE /api/teams/{id}` |
| Sport | `POST /api/sports`, `GET /api/sports`, `GET /api/sports/{id}`, `PATCH /api/sports/{id}`, `DELETE /api/sports/{id}` |
| TeamSport | `POST /api/team-sports`, `GET /api/team-sports`, `GET /api/team-sports/{id}`, `PATCH /api/team-sports/{id}`, `DELETE /api/team-sports/{id}` |
| Registration | `POST /api/registrations`, `GET /api/registrations`, `DELETE /api/registrations/{id}` |
| Tournament | `POST /api/tournaments`, `GET /api/tournaments`, `GET /api/tournaments/{id}`, `GET /api/tournaments/{id}/development`, `PATCH /api/tournaments/{id}`, `DELETE /api/tournaments/{id}` |
| Phase | `POST /api/phases`, `GET /api/phases`, `GET /api/phases/{id}`, `PATCH /api/phases/{id}`, `DELETE /api/phases/{id}` |
| Match | `GET /api/matches`, `POST /api/matches`, `GET /api/matches/{id}`, `PATCH /api/matches/{id}`, `PATCH /api/matches/{id}/result`, `DELETE /api/matches/{id}` |

Las rutas de las entidades nuevas (jugadores, habilidades, sus asignaciones y anotaciones) están en la sección 5.2. Son las rutas reales del backend y sus permisos ya están registrados en el microservicio de seguridad. Arma las URL con el mismo mecanismo que usan los servicios existentes y no escribas el prefijo a mano.

### 5.1 Entidades y respuestas

Los nombres de campo de esta tabla, de los cuerpos de 5.2 y de las reglas de 5.3 son los del diseño original en español. El backend ya está en inglés, así que los nombres reales (y los valores del enum de género) difieren: léelos de los DTOs de entrada y de respuesta del backend y úsalos tal cual en modelos, servicios y formularios.

| Entidad | Campos de la respuesta |
| --- | --- |
| Jugador | `idJugador`, `nombre`, `apellido`, `fechaNacimiento`, `genero`, `correo`, `identificacion`, `activo` |
| Habilidad | `idHabilidad`, `nombre`, `descripcion` (puede ser nula) |
| HabilidadJugador | `idHabilidadJugador`, `idJugador`, `idHabilidad`, `nivel`, `observaciones` (puede ser nula), `nombreJugador`, `nombreHabilidad` |
| EquipoJugador | `idHistorial`, `idJugador`, `idEquipo`, `fechaInicio`, `fechaFin` (nulo si el vínculo está abierto), `nombreJugador`, `nombreEquipo` |
| Anotación | `idAnotacion`, `idPartido`, `idJugador`, `nombreJugador`, `minuto`, `tipo`, `anulado` |
| Perfil del jugador | `jugador`, `habilidades` (lista de HabilidadJugador), `equipos` (lista de EquipoJugador) |

### 5.2 Endpoints de las entidades nuevas (rutas reales)

En las rutas con dos `{id}`, el primero es el recurso padre (jugador o equipo) y el segundo el recurso hijo (habilidad o jugador). Los nombres de los campos del cuerpo son los del diseño original; verifícalos en los DTOs del backend.

Jugadores y habilidades:

| Método | Ruta | Cuerpo |
| --- | --- | --- |
| POST | `/api/players` | `nombre`, `apellido`, `fechaNacimiento`, `genero`, `correo`, `identificacion` |
| GET | `/api/players` | |
| GET | `/api/players/{id}` | |
| GET | `/api/players/{id}/profile` | |
| PATCH | `/api/players/{id}` | cualquiera de los campos anteriores y `activo` |
| DELETE | `/api/players/{id}` | |
| POST | `/api/skills` | `nombre`, `descripcion?` |
| GET | `/api/skills` | |
| GET | `/api/skills/{id}` | |
| PATCH | `/api/skills/{id}` | `nombre?`, `descripcion?` |
| DELETE | `/api/skills/{id}` | |

Asignación de habilidades a jugadores (primer `{id}` jugador, segundo habilidad):

| Método | Ruta | Cuerpo |
| --- | --- | --- |
| POST | `/api/players/{id}/skills` | `idHabilidad`, `nivel`, `observaciones?` |
| GET | `/api/players/{id}/skills` | |
| PATCH | `/api/players/{id}/skills/{id}` | `nivel?`, `observaciones?` |
| DELETE | `/api/players/{id}/skills/{id}` | |
| GET | `/api/skills/{id}/players` | |

Historial de equipos del jugador (en `retirement`, primer `{id}` equipo, segundo jugador):

| Método | Ruta | Cuerpo |
| --- | --- | --- |
| POST | `/api/teams/{id}/players` | `idJugador`, `fechaInicio`, `fechaFin?` |
| PATCH | `/api/teams/{id}/players/{id}/retirement` | `fechaFin` |
| GET | `/api/teams/{id}/players` | |
| GET | `/api/players/{id}/teams` | |

El listado de la plantilla de un equipo admite filtrar por vínculos vigentes con un parámetro de consulta; confirma su nombre real en el controller.

Anotaciones (`annotations`):

| Método | Ruta | Cuerpo |
| --- | --- | --- |
| POST | `/api/matches/{id}/annotations` | `idJugador`, `minuto`, `tipo` |
| GET | `/api/matches/{id}/annotations` | |
| PATCH | `/api/annotations/{id}` | `minuto?`, `tipo?` |
| DELETE | `/api/annotations/{id}` | |

### 5.3 Reglas que afectan a la interfaz

Los nombres de campo y los valores de enum de esta lista son los del diseño original; usa los reales del backend.

- `genero` es un enum con los valores `MASCULINO`, `FEMENINO`, `OTRO` y `PREFIERO_NO_DECIR`. En el formulario va como lista desplegable con etiquetas legibles.
- `correo` debe tener formato válido y es único. `identificacion` es única.
- `nivel` es un entero de 1 a 5.
- `tipo` de anotación es texto libre de hasta 30 caracteres. `minuto` es un entero mayor o igual a 0.
- Las fechas viajan como texto `YYYY-MM-DD`.
- Un jugador solo puede tener un equipo vigente. Si se asigna a un equipo nuevo mientras tiene una asignación abierta, el backend cierra la anterior con la fecha de inicio de la nueva.
- Retirar a un jugador de un equipo asigna `fechaFin` y conserva la fila: es historial, no se elimina.
- Retirar una habilidad de un jugador elimina solo la asignación; la habilidad y el jugador permanecen.
- Eliminar una anotación la marca como anulada (`anulado = true`). Las anuladas siguen apareciendo en el listado y no se pueden modificar.
- Eliminar un jugador o una habilidad con información asociada responde 409. Para desactivar un jugador se usa `PATCH` con `activo: false`.
- Los errores llegan con código 400, 404 o 409 y un mensaje. Se muestran con el Feedback Handler en un Toast. No dupliques las reglas de negocio en el front; limítate a validaciones de formulario simples (obligatorios, formato, rangos).
- La validación de que el jugador de una anotación pertenezca a un equipo del partido puede no estar implementada en el backend, porque `Match` no tenía fecha ni equipos. Verifícalo en el código. Si el backend ya expone los equipos del partido, el selector de jugador de la anotación se filtra por los jugadores de esos equipos. Si no, lista todos los jugadores y deja que el backend responda el error.

### 5.4 Permisos

Cada ruta del backend pasa por el microservicio de seguridad, que autoriza por método, URL y entidad. Los permisos de las rutas de 5.2 ya se agregaron al seeder del microservicio: todas para el rol ADMIN y solo las de lectura (`GET`) para el rol CONSULTOR. El seeder se aplica al arrancar el microservicio, así que si una ruta nueva responde 403 aunque el usuario sea administrador, lo más probable es que el microservicio no se haya reiniciado con el seeder actualizado. No es un error del front: repórtalo en lugar de intentar arreglarlo aquí.

Si el front oculta acciones según el rol, un usuario CONSULTOR solo debe ver las de lectura en estas pantallas, siguiendo el mecanismo que ya use el proyecto para ello.

## 6. Pantallas por entidad

### 6.1 Habilidad

- Listado con Table List: nombre y descripción, con acciones de ver detalle, editar y eliminar.
- Crear y editar con Dynamic Form: `nombre` (obligatorio) y `descripcion`.
- Eliminar con Confirm Dialog. Si responde 409, el Toast muestra el mensaje del backend.
- Detalle con Detail Dialog.

### 6.2 Jugador

- Listado con Table List: nombre completo, identificación, correo, género y estado activo.
- Crear y editar con Dynamic Form: `nombre`, `apellido`, `fechaNacimiento`, `genero`, `correo`, `identificacion`. En edición se agrega `activo`.
- Eliminar con Confirm Dialog. Si responde 409, el Toast muestra el mensaje y se sugiere desactivar.
- Detalle con Detail Dialog usando el perfil del jugador: datos básicos, habilidades con su nivel y equipos con sus fechas. Si no hay habilidades o equipos, muestra un aviso (por ejemplo "sin equipos" y "sin habilidades"). Desde este detalle hay acceso a las dos asignaciones siguientes.

### 6.3 HabilidadJugador (asignación)

- Desde el jugador: Table List con las habilidades asignadas (nombre de habilidad, nivel, observaciones) y acciones de editar y retirar.
- Para asignar: Selectable Table con el catálogo de habilidades. Al confirmar la selección, Dynamic Form para `nivel` (1 a 5) y `observaciones`, y luego la llamada de creación.
- Editar: Dynamic Form con `nivel` y `observaciones` (no se cambia la habilidad).
- Retirar: Confirm Dialog y la llamada de borrado de la asignación.
- Vista inversa opcional, si encaja con la plantilla: desde una habilidad, listar los jugadores que la poseen.

### 6.4 EquipoJugador (historial de equipos)

- Desde el jugador: Table List con el historial (equipo, fecha de inicio, fecha de fin, mostrando la fecha de fin vacía como vínculo abierto) y acción de retirar para los vínculos abiertos.
- Desde el equipo: Table List con su plantilla, con opción de ver solo los vigentes.
- Asignar un jugador a un equipo: Selectable Table con los jugadores y, al confirmar, Dynamic Form para `fechaInicio` y `fechaFin` opcional.
- Retirar: Dynamic Form con `fechaFin` y luego la llamada de retiro. Si la plantilla usa Confirm Dialog para acciones destructivas, se usa también aquí.
- Reutiliza el modelo y el servicio de equipos que ya existen en este proyecto para obtener los nombres y las listas de equipos. No los dupliques.
- Ubica dónde encaja el acceso a la plantilla dentro de la página de equipos y propón el cambio mínimo antes de hacerlo.

### 6.5 Anotación

- Contexto: un partido. Ubica en las páginas de partidos dónde se ve el detalle o la lista y propón el cambio mínimo para acceder a las anotaciones. Si no hay un lugar natural, crea una página de anotaciones por partido, accesible desde la acción de la fila del partido, pero pregunta antes de modificar la página de partidos.
- Listado con Table List: minuto, tipo, jugador y si está anulada (las anuladas se muestran diferenciadas y sin acciones de edición).
- Crear con Dynamic Form: jugador (selección), `minuto` y `tipo`. Editar: solo `minuto` y `tipo`.
- Eliminar con Confirm Dialog (el backend la anula). Detalle con Detail Dialog.
- Reutiliza el modelo y el servicio de partidos que ya existen en este proyecto para el partido en contexto. Revisa también si el módulo de partidos ya maneja resultados (el backend tiene una ruta de resultado del partido) y no dupliques esa lógica.

## 7. Orden de trabajo

1. Habilidad.
2. Jugador, incluido el perfil.
3. HabilidadJugador.
4. EquipoJugador.
5. Anotación.
6. Rutas y entradas de menú de todo lo anterior, con el cambio mínimo.

Al terminar cada entidad: compila y ejecuta el lint, corrige errores propios y reporta en una línea qué archivos creaste.

## 8. Criterios de entrega

- Todas las pantallas usan los componentes compartidos indicados, sin crear versiones paralelas.
- Las eliminaciones y los retiros pasan por Confirm Dialog, y todos los errores del backend se muestran con el Feedback Handler en un Toast.
- La Selectable Table se reutiliza en las asignaciones sin modificarse, salvo autorización expresa del usuario.
- Los modelos y servicios de equipos y partidos existentes se reutilizan, no se duplican.
- Las URL se arman con el mismo mecanismo que los servicios existentes y coinciden con las rutas reales del backend.
- Los nombres de campos coinciden con las respuestas reales del backend.
- No se modificaron archivos de compañeros salvo los cambios mínimos aprobados.
- El proyecto compila y pasa el lint.
- Resumen final: archivos creados, archivos modificados fuera de tus carpetas, diferencias con el backend que quedaron pendientes y rutas que respondieron 403 por falta de permisos.
