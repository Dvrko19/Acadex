# Migraciones de base de datos de Acadex

Este directorio contiene exclusivamente artefactos de base de datos. La
migracion `20260801_001` y los seeds fueron aplicados en Railway el 1 de agosto
de 2026 y se verifico que una segunda ejecucion no repite la migracion.

## Archivos

- `inspect-schema.js`: inventario completo y de solo lectura del esquema activo.
- `SCHEMA_CURRENT.md`: esquema encontrado y decisiones de compatibilidad.
- `migrations/20260801_001_school_profiles_and_submission_files.up.sql`:
  migracion incremental.
- `migrations/20260801_001_school_profiles_and_submission_files.down.sql`:
  rollback con advertencia de perdida de los nuevos datos.
- `tests/fixtures/railway-schema-before-20260801.sql`: volcado sin datos del
  esquema previo, destinado solo a una base local desechable.
- `tests/verify-migration.js`: pruebas estructurales y funcionales; se niega a
  ejecutarse contra hosts no locales.

## Orden de ejecucion

1. Importar en local una copia del esquema actual.
2. Aplicar el archivo `up.sql`.
3. Ejecutar `verify-migration.js`.
4. En una copia desechable, aplicar `down.sql` y comprobar el estado anterior.
5. Volver a aplicar `up.sql` y repetir la verificacion.

Cada archivo `up.sql` debe ejecutarse una sola vez y en orden cronologico. Esta
migracion no es destructiva, pero no debe repetirse porque las columnas ya
existirian.

## Prueba local

Se requiere MySQL 9.x local. El siguiente ejemplo usa PowerShell desde
`backend` y un servidor local en el puerto 33306:

```powershell
mysql --host=127.0.0.1 --port=33306 --user=root `
  --execute="CREATE DATABASE acadex_local CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci"

Get-Content -Raw database/tests/fixtures/railway-schema-before-20260801.sql |
  mysql --host=127.0.0.1 --port=33306 --user=root --database=acadex_local

Get-Content -Raw database/migrations/20260801_001_school_profiles_and_submission_files.up.sql |
  mysql --host=127.0.0.1 --port=33306 --user=root --database=acadex_local

$env:ACADEX_ALLOW_LOCAL_DB_TEST = "1"
$env:LOCAL_DB_HOST = "127.0.0.1"
$env:LOCAL_DB_PORT = "33306"
$env:LOCAL_DB_NAME = "acadex_local"
node database/tests/verify-migration.js
```

Para probar el rollback en esa copia desechable:

```powershell
Get-Content -Raw database/migrations/20260801_001_school_profiles_and_submission_files.down.sql |
  mysql --host=127.0.0.1 --port=33306 --user=root --database=acadex_local
```

## Aplicacion en Railway

El backend ya es compatible con los nuevos metadatos y con la URL autenticada
`/api/submissions/:id/file`. La migracion rechaza nuevas URLs publicas y
archivos que no sean PDF/PPTX.

Procedimiento seguro:

1. Crear un backup verificable de Railway.
2. Ejecutar `node database/inspect-schema.js` y comparar el resultado con
   `SCHEMA_CURRENT.md`; detenerse si el esquema cambio.
3. Probar otra vez sobre una restauracion local reciente.
4. Programar una ventana corta sin escrituras de entregas.
5. Configurar el cliente MySQL con TLS y la contrasena mediante variable de
   entorno o archivo seguro, nunca en el historial del comando.
6. Aplicar solamente el archivo `up.sql`.
7. Inspeccionar columnas, indices, relaciones, checks y triggers.
8. Probar login y flujos academicos una vez desplegado el backend compatible.

No ejecutar `seed-acadex-db.js` en produccion. El rollback elimina los datos de
las tablas de perfiles y los metadatos nuevos, por lo que solo debe utilizarse
con backup y una decision explicita de perdida de esos datos.

## Estrategia UTC

La migracion fija su sesion en UTC. Railway reporta `system_time_zone = UTC`.
Las columnas de negocio siguen siendo DATETIME/TIMESTAMP, nunca VARCHAR. La
aplicacion futura debe convertir ISO 8601 a UTC antes de escribir y volver a
ISO 8601 al responder.
