# Acadex

Acadex es una plataforma educativa con paneles separados para administradores,
profesores y estudiantes. Permite gestionar usuarios, cursos, inscripciones,
tareas, entregas, calificaciones, eventos y notificaciones desde una SPA que
consume una API REST protegida con JWT.

La primera version usa una validacion simulada para las entregas. Se conservan
las validaciones reales de tipo, MIME, firma, estructura y tamano, pero no se
realiza un analisis antivirus. La segunda version puede activar ClamAV cambiando
el proveedor mediante variables de entorno.

## Funciones por rol

| Rol | Funciones principales |
| --- | --- |
| Admin | Dashboard global, CRUD de usuarios, cursos y tareas, inscripciones, eventos, notificaciones e incidencias de archivos. |
| Profesor | Sus cursos, tareas, entregas de sus estudiantes, calificaciones, eventos y notificaciones. |
| Estudiante | Sus cursos, tareas pendientes, envio y reemplazo de entregas, calificaciones, eventos y notificaciones. |

Los permisos se validan dos veces: el frontend oculta modulos no autorizados y
el backend aplica autenticacion y RBAC en cada ruta protegida. El backend es la
fuente de verdad para la autorizacion.

## Tecnologias

- Frontend: React 19, React Router, Axios, Vite, Lucide y Chart.js.
- Backend: Node.js, Express 5, CommonJS, JWT, bcrypt y Multer.
- Base de datos: MySQL 9, mysql2, InnoDB y fechas normalizadas en UTC.
- Archivos: almacenamiento privado local o S3 compatible, cuarentena y adaptadores de validacion.
- Pruebas: Node Test Runner, Supertest, Vitest y ESLint.

## Arquitectura

Acadex es un monolito modular con arquitectura cliente-servidor. El frontend y
el backend se despliegan por separado, mientras MySQL es un servicio externo.

```mermaid
flowchart LR
    U["Usuario"] --> SPA["React SPA"]
    SPA -->|"HTTP + JWT"| API["Express REST API"]
    API --> MW["Middlewares"]
    MW --> C["Controllers"]
    C --> S["Services"]
    S --> DB["MySQL"]
    S --> FS["Almacenamiento privado"]
    S --> EB["EventBus en memoria"]
    EB --> L["Listeners"]
    L --> N["Notificaciones"]
    FS --> V["Proveedor mock o ClamAV"]
```

### Capas del backend

1. `routes`: declara endpoints y combina middlewares.
2. `middlewares`: autentica JWT, autoriza roles, recibe archivos y centraliza errores.
3. `controllers`: traduce HTTP a llamadas de aplicacion y construye respuestas.
4. `services`: contiene reglas de negocio, permisos por propiedad y consultas SQL.
5. `listeners`: reacciona a eventos de dominio y genera notificaciones.
6. `config`: configura el pool MySQL y UTC.
7. `database`: contiene migraciones, fixture, verificacion y documentacion del esquema.

Los services acceden directamente a MySQL; actualmente no existe una capa
Repository separada ni un ORM.

### Capas del frontend

1. `pages` y `layouts`: composicion de rutas y panel principal.
2. `features/dashboard`: modulos de negocio por seccion.
3. `components`: controles reutilizables, tablas, modales y estados visuales.
4. `services`: cliente Axios y funciones por recurso de la API.
5. `context`: sesion y usuario autenticado.
6. `hooks`: acceso a sesion y carga asincrona cancelable.
7. `utils`: fechas UTC, archivos y funciones puras probadas.

## Patrones utilizados

- Arquitectura por capas: Route -> Middleware -> Controller -> Service -> MySQL.
- Modular Monolith: una aplicacion backend, separada internamente por dominios.
- MVC adaptado: React actua como vista; controllers y services forman la parte servidor.
- Observer / Publish-Subscribe: `eventBus` desacopla operaciones y notificaciones.
- Factory y Strategy: `createFileScanService` selecciona `mock`, `clamav` o `test`.
- Adapter: almacenamiento privado y proveedores de validacion ocultan su implementacion.
- Middleware / Chain of Responsibility: CORS, JSON, JWT, roles, upload y errores.
- Context Provider: `AuthProvider` comparte la sesion en React.
- Service Layer: frontend y backend encapsulan acceso HTTP y reglas de negocio.
- Soft Delete: varias entidades usan `deletedAt` y estados en lugar de borrado fisico.
- RBAC: permisos por `admin`, `teacher` y `student`, complementados con propiedad del recurso.

## Estructura del repositorio

```text
Acadex/
|-- backend/
|   |-- database/
|   |-- scripts/
|   |-- src/
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- events/
|   |   |-- helpers/
|   |   |-- listeners/
|   |   |-- middlewares/
|   |   |-- routes/
|   |   `-- services/
|   `-- tests/
`-- frontend/
    `-- AcadexFrontend/
        |-- public/
        |-- scripts/
        `-- src/
```

## Requisitos

- Git.
- Node.js `20.19+` o `22.12+`.
- npm.
- Acceso a MySQL 9.x o a la instancia compartida de Railway.
- Dos terminales para ejecutar frontend y backend.

Docker y ClamAV no son necesarios mientras `FILE_SCAN_PROVIDER=mock`.

## Inicio rapido con Railway compartido

Este es el recorrido mas corto para un integrante del equipo. Las credenciales
de Railway y `JWT_SECRET` deben compartirse por un canal privado, nunca por Git.

### 1. Clonar e instalar

```powershell
git clone <URL_DEL_REPOSITORIO>
cd Acadex

cd backend
npm ci
Copy-Item .env.example .env

cd ..\frontend\AcadexFrontend
npm ci
Copy-Item .env.example .env
```

### 2. Configurar el backend

Completar `backend/.env`:

```env
DATABASE_URL=mysql://USUARIO:CONTRASENA@HOST:PUERTO/BASE
PORT=4000
FRONTEND_URL=http://localhost:5173,http://127.0.0.1:5173
JWT_SECRET=un_secreto_largo_y_privado
APP_TIMEZONE=UTC

MAX_SUBMISSION_FILE_SIZE_MB=25
FILE_STORAGE_PROVIDER=local
PRIVATE_UPLOAD_DIRECTORY=./private-uploads
FILE_SCAN_PROVIDER=mock
MOCK_FILE_SCAN_RESULT=clean
MOCK_FILE_SCAN_DELAY_MS=400
```

Se puede usar `DATABASE_URL` o las variables `DB_HOST`, `DB_PORT`, `DB_USER`,
`DB_PASSWORD` y `DB_NAME`. `DATABASE_URL` tiene prioridad.

### 3. Configurar el frontend

`frontend/AcadexFrontend/.env`:

```env
VITE_API_URL=http://localhost:4000/api
```

### 4. Ejecutar

Terminal del backend:

```powershell
cd backend
npm run dev
```

Terminal del frontend:

```powershell
cd frontend\AcadexFrontend
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`
- Health check: `http://localhost:4000/health`

La base compartida de Railway ya tiene su migracion aplicada. No ejecutar
migraciones ni seeds contra Railway durante el inicio normal.

### Forma recomendada de colaborar

Hay dos configuraciones coherentes para el equipo:

1. Aplicacion compartida: todos consumen el backend desplegado en Render. Ese
   backend usa la base MySQL de Railway y el bucket privado de Backblaze B2.
2. Desarrollo aislado: cada integrante ejecuta backend, base local y carpeta de
   archivos local. Los cambios de codigo se comparten por Git, no los datos.

Evitar varios backends locales con `FILE_STORAGE_PROVIDER=local` conectados a
una misma base Railway para probar entregas. MySQL compartiria `storage_key`,
pero el archivo fisico solo existiria en la computadora que lo recibio. El
backend desplegado usa B2 y no tiene esa limitacion.

## Despliegue gratuito

La configuracion de produccion separa cada responsabilidad:

- Frontend React en Cloudflare Pages.
- Backend Express en Render.
- MySQL existente en Railway.
- Entregas privadas en Backblaze B2.

Servicios publicados:

- Frontend: `https://acadex-frontend.pages.dev`
- Backend: `https://acadex-backend-jzev.onrender.com`
- Salud del backend: `https://acadex-backend-jzev.onrender.com/health`

El frontend se compila con la URL publica del backend y se despliega desde
`frontend/AcadexFrontend`:

```powershell
$env:VITE_API_URL="https://acadex-backend-jzev.onrender.com/api"
npm run build
npx wrangler pages deploy dist --project-name acadex-frontend --branch main
```

Wrangler requiere `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID` solo en el
entorno local o de CI. Nunca deben guardarse en `.env` versionados, comandos de
Git ni archivos del repositorio. La integracion automatica con GitHub debe
configurarse desde la cuenta propietaria del repositorio; hasta entonces el
despliegue directo anterior es la opcion con menor alcance de permisos.

Render usa estas variables adicionales:

```env
NODE_ENV=production
FILE_STORAGE_PROVIDER=s3
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_BUCKET=acadex-private
S3_ENDPOINT=https://s3.REGION.backblazeb2.com
S3_REGION=REGION
API_RATE_LIMIT=600
LOGIN_RATE_LIMIT=10
```

El bucket permanece privado y el token se limita a lectura y escritura de
objetos en ese bucket. El navegador descarga mediante el endpoint autorizado
del backend y nunca recibe las credenciales de B2.

Los archivos existentes se migran una sola vez desde la computadora que los
conserva. El comando mantiene las claves `clean/UUID.pdf`, omite los objetos ya
existentes y no elimina la copia local:

```powershell
cd backend
$env:FILE_STORAGE_PROVIDER="s3"
npm run storage:migrate:s3
```

No se ejecutan seeds ni migraciones de esquema como parte del inicio de Render.
La migracion inicial de archivos privados a B2 ya fue aplicada y verificada.

## Base local desde cero

Usar esta opcion para desarrollo aislado. El fixture solo debe importarse en
una base local desechable.

```powershell
mysql --host=127.0.0.1 --port=3306 --user=root `
  --execute="CREATE DATABASE acadex_local CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci"

Get-Content -Raw backend/database/tests/fixtures/railway-schema-before-20260801.sql |
  mysql --host=127.0.0.1 --port=3306 --user=root --database=acadex_local
```

Configurar `backend/.env` para `acadex_local` y ejecutar:

```powershell
cd backend
npm run migrate:school
npm run seed
npm start
```

El seed es solo para desarrollo local. Es idempotente para sus entidades
conocidas, pero vuelve a establecer las contrasenas de demostracion.

### Usuarios locales del seed

| Rol | Correo | Contrasena |
| --- | --- | --- |
| Admin | `admin@acadex.local` | `Acadex.Admin.2026` |
| Profesor | `carlos.gomez@acadex.local` | `Acadex.Teacher.2026` |
| Profesor | `laura.martinez@acadex.local` | `Acadex.Teacher.2026` |
| Estudiante | `ana.rodriguez@acadex.local` | `Acadex.Student.2026` |

Las contrasenas pueden reemplazarse con `SEED_ADMIN_PASSWORD`,
`SEED_TEACHER_PASSWORD` y `SEED_STUDENT_PASSWORD`. El correo admin puede
reemplazarse con `SEED_ADMIN_EMAIL`.

## Validacion de entregas

Antes del proveedor, Acadex rechaza extensiones dobles, MIME incorrecto,
firmas invalidas, ejecutables renombrados, PPTX con macros o cifrado y archivos
que superen el limite.

Primera version:

```env
FILE_SCAN_PROVIDER=mock
MOCK_FILE_SCAN_RESULT=clean
MOCK_FILE_SCAN_DELAY_MS=400
```

`MOCK_FILE_SCAN_RESULT` admite:

- `clean`: valida y habilita el archivo.
- `infected`: simula rechazo y elimina el archivo en cuarentena.
- `failed`: simula indisponibilidad y conserva el archivo aislado.

Segunda version:

```env
FILE_SCAN_PROVIDER=clamav
CLAMAV_HOST=127.0.0.1
CLAMAV_PORT=3310
CLAMAV_TIMEOUT_MS=30000
```

La interfaz usa el termino `Archivo validado` porque el modo mock no representa
proteccion antivirus real.

## EventBus

`backend/src/events/eventBus.js` exporta una instancia unica de Node
`EventEmitter`. Los services emiten eventos despues de operaciones de negocio y
los listeners registrados al arrancar el backend crean notificaciones o logs.

Eventos actuales:

- Usuarios: `USER_CREATED`, `USER_UPDATED`, `USER_DEACTIVATED`.
- Cursos: `COURSE_CREATED`, `COURSE_UPDATED`, `COURSE_DEACTIVATED`.
- Inscripciones: `COURSE_ENROLLMENT_CREATED`, `COURSE_ENROLLMENT_DEACTIVATED`.
- Tareas: `TASK_CREATED`, `TASK_UPDATED`, `TASK_DELETED`.
- Entregas: `SUBMISSION_CREATED`, `SUBMISSION_UPDATED`, `SUBMISSION_GRADED`, `SUBMISSION_DELETED`.
- Archivos: `FILE_SCAN_REJECTED`.
- Eventos academicos: `EVENT_CREATED`.

Es un bus interno, sin persistencia. `EventEmitter` tampoco espera la finalizacion
de listeners asincronos. Es apropiado para este monolito y notificaciones no
criticas, pero no garantiza reintentos si el proceso cae. Una version distribuida
deberia migrar esas reacciones a Outbox + cola, por ejemplo RabbitMQ o Redis.

## Modelo de datos

Entidades principales:

- `users`: identidad, rol, estado y datos personales.
- `student_profiles` y `teacher_profiles`: informacion especifica por rol.
- `courses`: curso y profesor asignado.
- `courseStudents`: relacion muchos-a-muchos entre cursos y estudiantes.
- `tasks`: actividades, fecha UTC y puntuacion maxima.
- `submissions`: entrega, archivo, estado academico, nota y feedback.
- `events`: actividades generales o asociadas a cursos.
- `notifications`: notificaciones personales y estado de lectura.

La calificacion vive en `submissions`; no existe una tabla `grades` separada.
MySQL tambien aplica claves foraneas, indices, checks y triggers de integridad.

## API principal

Todas las rutas, excepto login y health, requieren `Authorization: Bearer TOKEN`.

| Grupo | Base | Acceso general |
| --- | --- | --- |
| Autenticacion | `/api/auth` | Publico para login |
| Dashboard | `/api/dashboard` | Todos los roles, datos filtrados |
| Usuarios | `/api/users` | CRUD admin; busqueda admin/profesor |
| Cursos | `/api/courses` | Lectura filtrada; CRUD e inscripcion admin |
| Tareas | `/api/tasks` | Lectura filtrada; escritura admin/profesor |
| Entregas | `/api/submissions` | Envio estudiante; revision profesor/admin |
| Eventos | `/api/events` | Lectura por rol; escritura admin/profesor |
| Notificaciones | `/api/notifications` | Solo recursos del usuario autenticado |

## Scripts

Backend:

```powershell
npm start                 # produccion local
npm run dev               # desarrollo con nodemon
npm test                  # pruebas unitarias
npm run test:integration  # integracion con MySQL local preparado
npm run test:smoke        # smoke tests contra la API y datos seed
npm run migrate:school    # migracion incremental
npm run seed              # datos locales de demostracion
```

Frontend:

```powershell
npm run dev
npm run lint
npm test
npm run build
npm run preview
```

## Antes de hacer commit

```powershell
cd backend
npm test

cd ..\frontend\AcadexFrontend
npm run lint
npm test
npm run build

cd ..\..
git diff --check
git status --short
```

Confirmar que no aparezcan `.env`, `private-uploads`, `node_modules` ni `dist`.
Los archivos nuevos deben agregarse con `git add`; un archivo marcado con `??`
no se incluye en el commit automaticamente.

Para incluir la version completa auditada:

```powershell
git add -A
git status --short
git commit -m "feat: integra Acadex por roles y documenta la arquitectura"
```

No usar solamente `git commit -am`: ese comando omite todos los archivos que
todavia aparecen como `??`.

## Limitaciones actuales

- El proveedor mock no detecta malware.
- El almacenamiento local es solo para desarrollo; produccion usa B2 privado.
- EventBus funciona solo dentro de una instancia y no conserva eventos.
- JWT se guarda en `localStorage`; una version posterior puede migrar a cookies
  HttpOnly con proteccion CSRF.
- Las consultas SQL viven en services; un crecimiento grande puede justificar
  repositories y transacciones de aplicacion mas explicitas.

La documentacion detallada del backend y la base se encuentra en
`backend/BACKEND.md` y `backend/database/README.md`.

## Autores

- Wander Castillo
- Ramshley Polanco
- Derik Manuel Infante
