# Integración del frontend con `ms_security`

Esta guía se actualizó a partir del contexto del backend compartido el
21-10-2026. Las rutas, DTO y reglas descritas corresponden a ese resumen; no se
inspeccionó ni ejecutó el repositorio backend desde este workspace. Antes de
considerarlos contrato definitivo, deben verificarse contra el código actual y
probarse con el servicio en ejecución.

## Contrato de autenticación actualizado: cookie HttpOnly

Este apartado es la referencia vigente para autenticación y sustituye las
referencias anteriores de esta guía a JWT devuelto como `Bearer` en JSON.
El código del backend no está disponible en este workspace; los detalles a
continuación reflejan el contrato y las clases que el usuario compartió.

- `POST /api/auth/login` recibe `{ "email": "...", "password": "..." }`,
  responde `204 No Content` y establece `AUTH_TOKEN` como cookie `HttpOnly`,
  con `Path=/api`, `SameSite=Lax` y `Secure` según `COOKIE_SECURE`.
- `GET /api/auth/session` requiere autenticación por cookie y responde
  `{ "id": number, "name": string, "email": string }`. El frontend usa este
  endpoint para confirmar que la sesión está activa; un `204` de login por sí
  solo no se toma como prueba suficiente de sesión.
- `GET /api/auth/csrf` inicializa CSRF y responde `{ "token": "..." }`, además
  de establecer `XSRF-TOKEN` (no HttpOnly). Las mutaciones envían el valor del
  cuerpo en `X-XSRF-TOKEN`. Como esta cookie está limitada a `Path=/api`, la
  aplicación no depende de leerla desde su página: conserva el token recibido
  en memoria.
- Las solicitudes del frontend a `${environment.apiUrl}/api/` usan
  `withCredentials: true`. Angular no lee ni guarda `AUTH_TOKEN`, y no envía
  `Authorization: Bearer`.
- El `SecurityConfig` compartido habilita CSRF, CORS con credenciales para el
  origen exacto `http://localhost:4200` y Resource Server con
  `CookieBearerTokenResolver`. El backend debe mantener esa lista de orígenes
  sincronizada con el origen real del frontend.
- La cookie de autenticación no debe ser accesible desde JavaScript. En local
  HTTP, `Secure=false` permite la prueba; en HTTPS/producción debe ser `true`.
  El frontend conserva las pantallas existentes de 2FA y recuperación, pero
  no las conecta porque sus endpoints/contratos no se han definido.

## Resumen del contrato compartido

Backend local: `http://localhost:8181`. El frontend ya usa esa dirección en
`src/environment/environment.ts`.

### Usuarios

El recurso es `/api/users`. Los responses de lectura descritos contienen
`id`, `name` y `email`, y no incluyen contraseña.

| Método | Ruta | Payload / resultado descrito |
|---|---|---|
| `GET` | `/api/users` | Lista directa de usuarios. |
| `GET` | `/api/users/{id}` | Un usuario. |
| `POST` | `/api/users` | Recibe `name`, `email`, `password`; devuelve el usuario creado (`201`). |
| `PUT` | `/api/users/{id}` | Recibe `name`, `email` y `password` opcional; devuelve el usuario actualizado. |
| `DELETE` | `/api/users/{id}` | Elimina al usuario (`204`, sin cuerpo). |

Validaciones descritas:

- `name`: obligatorio, 2–100 caracteres.
- `email`: obligatorio, formato de correo válido. El nombre del campo es
  `email`, no `mail`.
- Al crear, `password` es obligatorio, de 8–72 caracteres, con mayúscula,
  minúscula, número y al menos uno de `@$!%*?&`; no admite espacios.
- Al actualizar, `password` es opcional. Si se omite o llega en blanco, se
  conserva la contraseña existente; si se envía, debe satisfacer la misma
  política.
- Correo duplicado: `409`; ID inexistente: `404`; errores de validación: `400`.
- El backend codifica/hash la contraseña. No forma parte de las respuestas
  normales de usuario.

### Roles y asignaciones

El CRUD de roles está descrito en `/api/roles` (`GET` lista y consulta,
`POST` crea, `PUT` actualiza, `DELETE` elimina). El modelo y servicio de roles
ya existen en el frontend: `src/app/models/role.model.ts` y
`src/app/services/role.service.ts`.

La relación usuario-rol se describe como recurso aparte en `/api/user-roles`:

| Método | Ruta | Operación |
|---|---|---|
| `POST` | `/api/user-roles` | Asigna con `{ "userId": number, "roleId": number }`. |
| `GET` | `/api/user-roles` | Lista asignaciones. |
| `GET` | `/api/user-roles/users/{userId}` | Lista asignaciones/roles de un usuario. |
| `GET` | `/api/user-roles/roles/{roleId}` | Lista asignaciones/usuarios de un rol. |
| `DELETE` | `/api/user-roles/{userId}/{roleId}` | Retira la asignación. |

Una asignación duplicada produce `409`; IDs no encontrados producen `404`.
La asignación de roles se integra en una pantalla independiente de
administración (`/user-roles`), donde se selecciona un rol, se consultan sus
usuarios, se asignan usuarios disponibles y se retiran asignaciones con
confirmación. La autorización efectiva para administrar estas operaciones
debe seguir validándose en el backend.

### Autenticación, JWT y sesiones (referencia histórica; ver contrato actualizado)

El resumen recibido describe:

- `POST /api/auth/login`, request `{ "email": "...", "password": "..." }`.
- Respuesta con `accessToken`, `tokenType` (`Bearer`) y `expiresAt`.
- JWT con duración de 15 minutos. El login es público y las demás rutas
  requieren `Authorization: Bearer <accessToken>`.
- No se encontraron rutas de renovación ni cierre/revocación de JWT, ni flujo
  2FA. No se observaron reglas de autorización por rol/permiso, solo requisito
  de autenticación.

Se reportaron además recursos de sesiones de aplicación:
`/api/users/{userId}/sessions`, además de endpoints de detalle
`/api/users/{id}/detail`, `/detail-with-sessions` y `/detail-with-roles`.
Estas sesiones de aplicación **no deben asumirse equivalentes a la sesión JWT
de autenticación**. No se ha integrado un modelo o pantalla de sesiones en
Angular. Antes de hacerlo, revisar el DTO y asegurar que no se expongan token,
`code2FA` u otras credenciales en listados/detalles. El requisito original
menciona `code2FA`, pero el backend compartido no reporta un flujo 2FA; confirmar
si es un requisito o eliminarlo del alcance.

El frontend aún no implementa autenticación real: los formularios de login y
registro son pantallas de plantilla. Las operaciones protegidas de usuario
pueden recibir `401` hasta conectar login y el envío del Bearer token. La
autenticación requerida no sustituye autorización: si solo administradores
deben modificar usuarios o asignar roles, el backend debe comprobar sus
permisos. Ocultar botones en Angular no protege la API.

## Estado de la implementación Angular

- Aplicación standalone; rutas principales en `src/app/app.routes.ts`.
- `src/app/app.config.ts` provee `HttpClient` y el router.
- `src/app/services/user.service.ts` usa `${environment.apiUrl}/api/users` y
  contiene los métodos `findAll`, `findById`, `create`, `update` y `delete`
  según las rutas descritas arriba.
- `src/app/models/user.model.ts` es el modelo de lectura (`id`, `name`,
  `email`). No incluye contraseña.
- Los DTO de escritura se separan en
  `src/app/models/dtos/create-user.dto.ts` y
  `src/app/models/dtos/update-user.dto.ts`. La contraseña solo está en esos
  payloads de request.
- La página `/users` está en `src/app/pages/users/` y reutiliza
  `DataTableComponent`, `DynamicFormComponent`, `ConfirmDialogComponent`,
  `UserService` y `FeedbackHandlerService`.
- La contraseña de edición se presenta como campo vacío y opcional. Si queda
  vacía, el frontend omite la propiedad del request `PUT`; nunca la obtiene de
  una respuesta ni la precarga. Al crear sí es obligatoria.
- `DynamicFormComponent` renderiza los controles configurados mediante
  `FormFieldConfig`; el componente de página conserva la responsabilidad por
  el `FormGroup`, validación, construcción del DTO, estados HTTP y mensajes.
- El frontend valida nombre (2–100), formato de correo y contraseña (8–72,
  mayúscula, minúscula, número, carácter especial requerido, sin espacios).
  El backend debe repetir y hacer cumplir las validaciones.
- El frontend cuenta con modelos y servicio para asignaciones `UserRole` en
  `src/app/models/user-role.model.ts`, `src/app/models/dtos/user-role-request.dto.ts`
  y `src/app/services/user-role.service.ts`. Las asignaciones se administran
  desde `/user-roles`; no se envían roles en el DTO CRUD de usuario.

## Seguridad y aspectos que requieren confirmación

1. **HTTPS:** el endpoint local compartido es HTTP. Es adecuado únicamente para
   desarrollo local. Usar HTTPS en entornos accesibles por red y producción.
   No enviar contraseñas a través de conexiones HTTP no confiables.
2. **CORS:** el resumen indicó que no se encontró configuración explícita.
   Configurar el origen exacto del servidor de desarrollo frontend en backend;
   CORS no reemplaza autenticación/autorización.
3. **Autorización:** confirmar y aplicar permisos por operación en backend,
   en especial CRUD de usuarios, asignación de roles y administración de
   sesiones.
4. **JWT:** decidir cómo se tratará el vencimiento de 15 minutos y si se
   requiere refresh/revocación/logout. No se debe afirmar que logout invalida
   un JWT si el backend no ofrece esa capacidad.
5. **Sesiones de aplicación:** verificar qué datos retornan los endpoints
   `/sessions` y `detail-with-sessions`; no mostrar ni registrar tokens o
   códigos 2FA. Aclarar el flujo de 2FA antes de implementar cualquier UI.
6. **Borrado e integridad:** probar qué ocurre al borrar usuarios con perfiles,
   asignaciones o sesiones, y roles con asignaciones.
7. **Errores:** el resumen indica `400`, `404`, `409` y `500`; confirmar formato
   de response y probar los cuerpos de `401`/`403` emitidos por Spring Security.
8. **Documentación:** no se reportó dependencia Swagger/OpenAPI. Publicar una
   especificación facilita mantener frontend y backend alineados.
9. **Configuración sensible:** no copiar secretos, claves JWT, credenciales de
   base de datos ni tokens al frontend o a este documento.

## Cómo verificar la integración

1. Arrancar backend y base de datos; comprobar que la API está disponible en
   `http://localhost:8181`.
2. Probar login, listado, detalle, alta, actualización (con y sin contraseña),
   borrado, conflictos, validaciones y autorización con datos de prueba.
3. Confirmar que los responses de usuario no incluyen contraseña y revisar los
   DTO de sesiones/detalles antes de mostrarlos.
4. Verificar CORS desde el origen real del frontend.
5. En la carpeta del frontend, ejecutar `npm run build` y `npm test`.
6. Probar `/users` con backend activo: listado, detalle, create, update,
   confirmación y delete; verificar que al editar sin contraseña se omite ese
   campo del request.
7. Validar JWT y permisos también directamente en el backend/API. La UI Angular
   por sí sola no prueba controles de acceso.

Las operaciones CRUD del frontend ya están conectadas al contrato informado,
pero su funcionamiento integral requiere backend activo, CORS habilitado y un
flujo de autenticación que suministre Bearer token. La autenticación, la
autorización por rol, la renovación/revocación de JWT y la administración de
sesiones siguen fuera de lo implementado y requieren decisiones/pruebas del
lado backend.

## Estado actual de autenticación frontend (ver corrección vigente arriba)

Esta sección actualiza cualquier referencia anterior que describa el login
como una pantalla exclusivamente visual:

- `/authentication/login` consume `POST /api/auth/login` mediante `AuthService`.
- El `accessToken` se conserva únicamente en memoria y se limpia al alcanzar
  `expiresAt`. No se escribe en `localStorage` ni en `sessionStorage`; al
  recargar la aplicación, se debe iniciar sesión nuevamente.
- `authInterceptor` agrega el encabezado Bearer a las solicitudes dirigidas a
  la URL API configurada, excepto al endpoint de login.
- `/authentication/verify-2fa` y `/authentication/forgot-password` existen
  como interfaces informativas. Sus acciones siguen deshabilitadas porque el
  backend compartido no especifica endpoints ni DTO para esos flujos.
- El frontend no implementa cierre de sesión del lado servidor, guardas de
  rutas ni autorización por rol/permiso. Limpiar el token en memoria no implica
  que el backend lo revoque.
