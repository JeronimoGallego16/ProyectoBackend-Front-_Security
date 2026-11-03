# ProyectoBackend-Front-_Security

Aplicación web para administrar las funciones de seguridad de la plataforma.
Este repositorio contiene el frontend en Angular; el backend de seguridad y
otros microservicios se mantienen en proyectos independientes.

> El proyecto está en desarrollo. Esta documentación describe la estructura
> actual y se ampliará a medida que se integren nuevos microservicios y
> funcionalidades.

## Funcionalidades actuales

El frontend ofrece una interfaz para:

- Administrar usuarios.
- Crear y consultar roles y permisos.
- Asignar roles a usuarios y permisos a roles.
- Administrar perfiles y consultar el perfil propio.
- Iniciar sesión y configurar el
  perfil inicial.
- Restringir las secciones administrativas según el acceso del usuario.

La aplicación se comunica con el backend de seguridad, que expone la API para
usuarios, autenticación, perfiles, roles y permisos. El servicio de
notificaciones complementa algunos flujos, como el envío de correos y la
verificación en dos pasos.

## Tecnologías

- **Frontend:** Angular, TypeScript y Tailwind CSS.
- **Backend de seguridad:** Java 17, Spring Boot y Maven.
- **Microservicio de notificaciones:** Python, FastAPI y Uvicorn.
- **Base de datos:** MySQL para el backend de seguridad.

## Estructura del proyecto

```text
ProyectoBackend-Front-_Security/
├── src/
│   └── app/
│       ├── components/   # Componentes reutilizables
│       ├── layouts/      # Estructuras visuales de la aplicación
│       ├── models/       # Modelos y DTOs del frontend
│       ├── pages/        # Páginas y funcionalidades
│       └── services/     # Comunicación con la API y lógica compartida
├── iniciar-servicios.bat # Inicio local de los tres servicios en Windows
├── package.json
└── README.md
```

Los servicios independientes se esperan, para el inicio local descrito abajo,
en carpetas hermanas de este repositorio:

```text
Proyecto/
├── ProyectoBackend-Front-_Security/
├── backEndProyecto1/          # Backend Spring Boot de seguridad
└── Backend_ms_notificaciones/ # Microservicio FastAPI de notificaciones
```

Esta organización puede cambiar conforme se incorporen los siguientes
microservicios.

## Requisitos para desarrollo local

- Node.js y npm.
- Java 17.
- Python con las dependencias del microservicio de notificaciones instaladas.
- MySQL configurado para el backend de seguridad.

Configura las variables y credenciales requeridas por cada servicio en tu
entorno local. No guardes contraseñas, tokens ni credenciales en el repositorio.
El frontend usa `src/environment/environment.ts` para la configuración local;
ajusta allí la URL de la API si tu backend no está disponible en
`http://localhost:8181`.

El script de inicio configura Firebase para el backend con el proyecto
`oauthbackend-28668` y espera el archivo
`firebase-credentials.json` en la carpeta superior que contiene los tres
proyectos. Si usas otro proyecto de Firebase, actualiza `FIREBASE_PROJECT_ID`
en `iniciar-servicios.bat`. Mantén el archivo de credenciales fuera del
repositorio.

## Iniciar todos los servicios en Windows

Con las carpetas ubicadas como en la estructura anterior y los requisitos
instalados, ejecuta `iniciar-servicios.bat` desde este repositorio. El script
abre una ventana independiente para cada servicio:

| Servicio | URL local |
| --- | --- |
| Frontend Angular | `http://localhost:4200` |
| Backend de seguridad | `http://localhost:8181` |
| Notificaciones | `http://localhost:8000` |

Para detener un servicio, cierra su ventana de terminal. El script no instala
dependencias ni inicia MySQL; esos pasos deben completarse previamente.

## Iniciar servicios por separado

### Frontend

Desde la raíz de este repositorio:

```bash
npm install
npm start
```

### Backend de seguridad

Desde la carpeta `backEndProyecto1`:

```bat
mvnw.cmd spring-boot:run
```

Verifica que MySQL esté iniciado y que la configuración local del backend
contenga los datos de conexión necesarios.

### Microservicio de notificaciones

Desde la carpeta `Backend_ms_notificaciones`:

```bash
python -m pip install -r requeriments.txt
python -m uvicorn main:app --reload
```

El servicio puede requerir configuración y credenciales de Gmail para enviar
correos. Consulta el README de ese microservicio para conocer sus variables de
entorno y requisitos.

## Pruebas y compilación del frontend

Desde la raíz del repositorio:

```bash
npm test
npm run build
```

## Próximas entregas

La solución está organizada como una aplicación distribuida en microservicios.
Al agregar un nuevo servicio, se actualizará este README con su responsabilidad,
tecnologías, requisitos, configuración, dependencias e instrucciones de
ejecución.
