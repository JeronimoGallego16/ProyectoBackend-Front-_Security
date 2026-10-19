# Guía de integración del frontend con el backend

Este documento registra lo que el backend debe acordar y lo que habrá que
adaptar en el frontend cuando exista una API. No define un contrato de API
supuesto: las rutas, los nombres de campos, los DTO y las reglas de seguridad
deben confirmarse con la implementación real del backend.

## Estado actual del frontend

- La aplicación usa Angular con componentes standalone y rutas en
  `src/app/app.routes.ts`.
- `src/environment/environment.ts` define actualmente `apiUrl` como
  `http://localhost:8181`.
- `src/app/app.config.ts` configura `HttpClient` y el enrutador.
- `src/app/services/user.service.ts` consulta `GET /api/users` y
  `GET /api/users/{id}`. No implementa crear, actualizar o eliminar usuarios.
- La pantalla inicial de usuarios está disponible en `/users`. Usa las dos
  consultas de lectura existentes, muestra errores si no hay API disponible y
  no simula datos ni resultados exitosos.
- Los formularios de creación/edición están preparados visualmente, pero el
  botón de guardar y la operación de eliminación permanecen deshabilitados o
  pendientes hasta definir el contrato. No se añadieron métodos HTTP de
  escritura.
- `src/app/models/user.model.ts` define únicamente `id`, `name` y `email`.
  El nombre `email` es el que usa hoy el frontend; debe compararse con el
  contrato del backend (por ejemplo, podría llamarse `mail`).
- El CRUD de roles en `src/app/pages/roles/` es el ejemplo más cercano:
  reutiliza `DataTableComponent`, `DynamicFormComponent`,
  `ConfirmDialogComponent`, `FeedbackHandlerService` y `RoleService`.
- `src/app/components/dynamic-form/` dibuja campos configurados por la página
  anfitriona. Actualmente admite `text`, `textarea` y `date`. La página
  anfitriona define el `FormGroup`, validadores, carga, llamadas HTTP y
  conversión del payload; el formulario dinámico solo muestra los controles
  y emite los valores.
- La página `/profiles` ya consulta usuarios mediante `UserService`; cualquier
  cambio a `User` debe conservar esa compatibilidad o actualizar sus usos.
- No se encontraron modelos ni servicios frontend para `Session` o `UserRole`.
  El modelo y el CRUD de `Role` sí existen. No se debe inferir por esto cuál es
  la relación real entre usuarios y roles en el backend.
- Los formularios actuales de inicio de sesión y registro son pantallas de
  plantilla: no implementan autenticación con el backend.

## Contrato que se debe acordar en el backend

Antes de conectar operaciones de escritura, publicar o compartir una
especificación OpenAPI/Swagger (o documentación equivalente) que defina:

### Usuarios

- Rutas HTTP exactas para listar, consultar por ID, crear, actualizar y
  eliminar.
- Si el campo de correo se llama `mail` o `email`, y los formatos y límites
  aceptados para cada campo.
- DTO de request y response por operación, incluidos campos obligatorios,
  opcionales, de solo lectura y la estructura de errores.
- Si la creación de usuario incluye contraseña y cómo se realiza un cambio
  posterior. Aclarar si omitir el campo durante una actualización conserva la
  contraseña actual.
- Si las respuestas de lectura excluyen siempre la contraseña y cualquier otro
  dato sensible.
- Comportamiento ante identificadores inexistentes, correos duplicados,
  entradas inválidas y restricciones de integridad.
- Si el listado es una matriz directa o un objeto paginado y qué parámetros
  de búsqueda, ordenamiento o paginación acepta.

### Roles y relaciones

- Confirmar si la relación usuario-rol se administra como parte del DTO de
  usuario o mediante rutas separadas.
- Documentar el formato y las rutas para asignar y retirar roles, y quién puede
  realizar esas operaciones.
- Confirmar el esquema real de `UserRole`, sus restricciones y las reglas para
  eliminar un usuario o un rol que tenga relaciones.
- No duplicar `Role`: el frontend ya tiene `Role` y operaciones CRUD en
  `src/app/models/role.model.ts` y `src/app/services/role.service.ts`.

### Sesiones y autenticación

- Documentar cómo se inicia sesión, renueva y termina una sesión, y cómo se
  transportan las credenciales de autenticación.
- Definir formato, vencimiento y revocación de tokens, y el flujo 2FA si aplica.
- Definir qué rutas requieren autorización y los permisos necesarios por
  operación; el backend debe hacer cumplir los permisos aunque el frontend
  oculte botones.
- No exponer tokens, códigos 2FA ni contraseñas en endpoints de lectura ni en
  registros de aplicación. La gestión de sesiones no forma parte del modelo
  actual del frontend.

### Operación y despliegue

- Definir URL y puerto locales, URL de cada entorno y uso de HTTPS fuera del
  desarrollo local.
- Configurar CORS en el backend para los orígenes del frontend. CORS no es una
  medida de autenticación o autorización.
- Documentar los códigos HTTP y el formato del cuerpo para errores, incluidos
  errores de validación y autorización.
- Indicar requisitos de infraestructura, variables de entorno, migraciones de
  base de datos y datos semilla necesarios para probar la API.

## Cambios previstos en el frontend

Los siguientes cambios se deben hacer después de confirmar el contrato; los
nombres y formas de payload que se muestran aquí son ubicaciones de trabajo,
no decisiones sobre la API.

1. **Entorno:** ajustar `src/environment/environment.ts` para que `apiUrl`
   apunte al servidor real. Si se incorporan más entornos, mantener sus valores
   en configuraciones de entorno y no incrustar URLs en los componentes.
2. **Modelo y DTO:** revisar `src/app/models/user.model.ts` según la respuesta
   segura de lectura; crear DTO de request separados en
   `src/app/models/dtos/` si create/update tienen payloads diferentes.
   No añadir contraseñas a un modelo usado para listar o visualizar usuarios.
3. **Servicio:** ampliar `src/app/services/user.service.ts` con las operaciones
   HTTP que el contrato confirme. Mantener las rutas y tipos de respuesta
   centralizados en el servicio, siguiendo el patrón de `RoleService`.
4. **Página CRUD:** crear una página de usuarios siguiendo
   `src/app/pages/roles/roles.component.ts` y su plantilla. Reutilizar
   `DataTableComponent`, `DynamicFormComponent`, `ConfirmDialogComponent` y
   `FeedbackHandlerService`; no duplicar la lógica visual de tabla, formulario
   o confirmación.
5. **Formulario dinámico:** usar los controles existentes donde sean
   suficientes. Si el formulario de usuario requiere controles `email` o
   `password`, ampliar `FormFieldType` y la plantilla de
   `src/app/components/dynamic-form/` de forma reutilizable y compatible con
   las páginas existentes. La validación debe definirse en el `FormGroup` de la
   página y corresponder a las reglas del backend.
6. **Contraseña:** mostrar un campo de contraseña solo en el flujo y con la
   semántica acordados con el backend. No rellenarlo con una contraseña
   existente, ni mostrarla, devolverla en listados, registrarla en consola o
   almacenarla en el navegador. Enviar la contraseña únicamente por HTTPS en
   el flujo autorizado por el backend; el hash y la política de contraseñas
   pertenecen al backend.
7. **Relaciones:** añadir selección/visualización de roles solo cuando estén
   documentados el DTO o los endpoints para asignarlos. No incluir sesiones,
   tokens o códigos 2FA en formularios o tablas administrativas de usuario.
8. **Rutas y navegación:** añadir la ruta de usuarios a
   `src/app/app.routes.ts` y, si debe aparecer en el menú, actualizar
   `src/app/layouts/full/sidebar/sidebar-data.ts`.
9. **Errores y carga:** conservar el patrón de `finalize` y notificaciones
   visible en las páginas de roles/perfiles; mapear conflictos, validaciones,
   falta de autenticación y falta de permisos según los errores reales de la
   API. No convertir fallos de red en respuestas exitosas vacías.
10. **Autenticación:** implementar el mecanismo de autenticación solo cuando
    el backend haya definido el flujo. Si requiere añadir un interceptor o
    guards, hacerlo siguiendo el esquema acordado y sin asumir que la
    autorización del frontend protege los endpoints.

## Secuencia de integración y comprobación

1. Arrancar el backend y comprobar su documentación OpenAPI/Swagger y sus
   health checks, si los tiene.
2. Probar cada operación y sus errores con datos no sensibles, por ejemplo
   desde Swagger o una herramienta HTTP.
3. Configurar `apiUrl` y verificar CORS desde el origen local del frontend.
4. Implementar modelos/DTO y el servicio con el contrato confirmado.
5. Conectar la página reutilizando el CRUD de roles y el formulario dinámico.
6. Ejecutar `npm run build` y `npm test` (el test utiliza Karma y puede
   requerir un navegador disponible).
7. Probar manualmente listado, detalle, alta, edición, eliminación, validación,
   carga, errores y reglas de acceso. Confirmar en las respuestas y en la
   interfaz que contraseñas, tokens y códigos 2FA no se exponen.
8. Validar autorización y reglas de integridad en el backend; no se pueden
   demostrar solo con pruebas del frontend.

La interfaz CRUD inicial existe, pero la persistencia de crear, actualizar y
eliminar usuarios no está implementada. Se necesita el contrato de la API antes
de añadir operaciones de escritura o decidir cómo se representan las
relaciones y credenciales.
