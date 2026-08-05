# Backend Acadex

El backend usa Express, MySQL, JWT y almacenamiento privado para entregas. No
expone carpetas de archivos mediante `express.static` y no incluye modulos de
perfil, configuracion o reportes.

## Variables de entorno

```env
DATABASE_URL=
DB_HOST=
DB_PORT=3306
DB_USER=
DB_PASSWORD=
DB_NAME=

JWT_SECRET=
APP_TIMEZONE=UTC
PORT=4000
FRONTEND_URL=http://localhost:5173

MAX_SUBMISSION_FILE_SIZE_MB=25
FILE_STORAGE_PROVIDER=local
PRIVATE_UPLOAD_DIRECTORY=./private-uploads
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_ENDPOINT=
API_RATE_LIMIT=600
LOGIN_RATE_LIMIT=10
FILE_SCAN_PROVIDER=mock
MOCK_FILE_SCAN_RESULT=clean
MOCK_FILE_SCAN_DELAY_MS=400
CLAMAV_HOST=127.0.0.1
CLAMAV_PORT=3310
CLAMAV_TIMEOUT_MS=30000
```

`DATABASE_URL` tiene prioridad sobre las variables `DB_*`. `APP_TIMEZONE` debe
ser `UTC`. La carpeta privada se usa en desarrollo y no debe estar dentro de
`public` ni servirse de forma estatica. En produccion,
`FILE_STORAGE_PROVIDER=r2` mantiene los objetos en un bucket privado y usa el
disco de Render solo como cuarentena temporal durante la validacion.

## Endpoints principales

| Endpoint | Roles | Funcion |
| --- | --- | --- |
| `POST /api/submissions` | student | Crea una entrega multipart con `taskId` y `file`. |
| `PUT/PATCH /api/submissions/:id` | student propietario | Reemplaza el archivo sin cambiar nota ni feedback. |
| `GET /api/submissions/:submissionId/file` | propietario, profesor del curso, admin | Visualiza PDF o descarga PPTX si esta limpio. |
| `PATCH /api/submissions/:submissionId/grade` | profesor del curso | Califica dentro de `maxScore`. |
| `GET /api/users/search` | admin, teacher limitado | Busca activos por nombre, apellido, correo o nombre completo. |
| `GET /api/notifications` | autenticado | Lista las notificaciones propias. |
| `PATCH /api/notifications/:id/read` | propietario | Marca como leida y devuelve `relatedResource`. |
| `PATCH /api/notifications/read-all` | autenticado | Marca todas las notificaciones propias. |
| `GET /api/dashboard` | autenticado | Devuelve metricas academicas segun rol. |

El buscador requiere `q` de al menos dos caracteres. `role` puede ser
`student` o `teacher`, con `limit` maximo de 20 y paginacion por `page`.

## Archivos permitidos

- PDF: `.pdf`, MIME `application/pdf`, firma `%PDF-`.
- PowerPoint: `.pptx`, MIME OOXML de presentacion, estructura ZIP con
  `[Content_Types].xml` y `ppt/presentation.xml`.

Se rechazan dobles extensiones, rutas en el nombre, MIME discordante, ZIP
generico, contenido cifrado, macros, ejecutables y archivos superiores al
limite configurado. Se calcula SHA-256 antes del escaneo.

## Validacion de archivos

1. Multer guarda el archivo en `quarantine` con UUID.
2. Se validan nombre, extension, MIME, firma real, estructura y tamano.
3. La entrega se registra como `pending` y pasa a `scanning`.
4. El proveedor configurado valida el archivo.
5. Un resultado limpio mueve el archivo a `clean` y habilita la descarga.
6. Un archivo rechazado se elimina de cuarentena y queda `infected`.
7. Una falla del proveedor deja el archivo aislado como `scan_failed`.

La politica es fail closed: solamente `clean` puede descargarse.
`FILE_SCAN_PROVIDER=mock` simula el resultado y no detecta malware; se usa en
la primera version junto con la validacion de extension, MIME, firma y
estructura. `MOCK_FILE_SCAN_RESULT` admite `clean`, `infected` o `failed` para
demostrar los tres flujos. `MOCK_FILE_SCAN_DELAY_MS` controla la demora.

La segunda version puede activar el analisis antivirus sin cambiar el flujo:
`FILE_SCAN_PROVIDER=clamav` envia el archivo a `clamd` mediante `INSTREAM`.
ClamAV reduce el riesgo, pero no representa una garantia absoluta.
El rol `admin` consulta las incidencias del analisis, pero no aprueba archivos
manualmente. `CLAMAV_HOST` debe apuntar a un servicio `clamd` accesible desde el
backend cuando el proveedor sea `clamav`; si no responde, el archivo permanece
aislado.

## Fechas y errores

Las fechas de tareas y eventos deben enviarse como ISO 8601 con `Z` u offset.
El backend las convierte a objetos `Date`, mysql2 opera en UTC y la API responde
ISO 8601. Las fechas sin zona, inexistentes y rangos invertidos se rechazan.

El middleware central registra detalles tecnicos en el servidor. El cliente
solo recibe `message` y `code`; nunca SQL, stack traces, rutas fisicas ni
respuestas internas del proveedor de validacion.

## Comandos

```powershell
npm install
npm test
npm run test:integration
npm run test:smoke
npm start
```

La prueba integral requiere MySQL local con el fixture y la migracion descritos
en `database/README.md`. El proveedor `test` solo se habilita dentro de
`NODE_ENV=test`; el proveedor `mock` esta disponible para la primera version.

## Despliegue coordinado

El backend requiere la migracion
`database/migrations/20260801_001_school_profiles_and_submission_files.up.sql`.
Como el backend anterior no entiende los nuevos metadatos, se recomienda una
ventana sin escrituras: backup, migracion, despliegue del backend y smoke tests.
No ejecutar seeds en Railway.

## Pendientes de infraestructura

- Sustituir el proveedor `mock` por ClamAV real en la segunda version.
- Configurar el adaptador R2 y ejecutar `npm run storage:migrate:r2` una sola vez
  para documentos locales preexistentes.
- Definir una politica programada de retencion y limpieza de cuarentena.
- Agregar versionado en base de datos si en el futuro se requiere conservar el
  historial completo de cada reemplazo.
- Para alto volumen, mover el escaneo sincronico a una cola de trabajos.
