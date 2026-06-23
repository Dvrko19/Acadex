# Acadex

Sistema web de gestión académica desarrollado como una aplicación **Full Stack**, orientada a facilitar la administración de procesos educativos mediante una plataforma moderna, escalable y organizada.

Acadex permite gestionar usuarios, cursos, tareas, entregas, eventos y notificaciones mediante una arquitectura separada entre frontend y backend.

---

# Descripción del proyecto

Acadex está construido como una aplicación web completa compuesta por:

- **Frontend:** Aplicación desarrollada con React encargada de la interfaz de usuario.
- **Backend:** API REST desarrollada con Node.js y Express encargada de la lógica del sistema.
- **Base de datos:** MySQL para almacenamiento persistente de información.
- **Infraestructura:** Docker para facilitar la ejecución del proyecto en diferentes entornos.

El objetivo del sistema es centralizar procesos académicos como:

- Gestión de usuarios.
- Administración de cursos.
- Creación y entrega de tareas.
- Registro de eventos.
- Sistema de notificaciones.
- Control de información académica.

---

# Tecnologías utilizadas

## Backend

| Tecnología | Uso |
|---|---|
| Node.js | Entorno de ejecución del servidor |
| Express.js | Framework para creación de API REST |
| MySQL | Base de datos relacional |
| MySQL2 | Conexión y consultas a MySQL |
| JWT | Autenticación basada en tokens |
| bcrypt | Cifrado de contraseñas |
| dotenv | Manejo de variables de entorno |
| CORS | Control de solicitudes externas |

---

## Frontend

| Tecnología | Uso |
|---|---|
| React | Construcción de interfaz |
| Vite | Herramienta de desarrollo |
| Tailwind CSS | Estilos y diseño |
| Axios | Consumo de API |
| React Router | Navegación |
| Chart.js | Visualización de datos |

---

## Herramientas adicionales

- Git
- GitHub
- Docker
- Docker Compose
- Visual Studio Code

---

# Arquitectura del sistema

El proyecto utiliza una arquitectura basada en:

## MVC + Service Layer

La arquitectura fue seleccionada para mantener una separación clara entre responsabilidades, facilitar el mantenimiento y permitir que el sistema pueda crecer sin afectar módulos existentes.

El flujo general es:

<img width="342" height="544" alt="image" src="https://github.com/user-attachments/assets/5f6e9061-9dc2-4661-9633-8e3d4801cf95" />

---

# ¿Por qué se seleccionó esta arquitectura?

## Separación de responsabilidades

Cada capa tiene una función específica:

- Las rutas manejan los endpoints.
- Los controladores manejan las solicitudes.
- Los servicios contienen la lógica del negocio.
- La base de datos maneja la persistencia.

Esto evita mezclar lógica y facilita realizar cambios futuros.

---

# Estructura del proyecto

<img width="179" height="335" alt="image" src="https://github.com/user-attachments/assets/f04eb43b-956f-41ff-8cef-ec6590a3e163" />


---

# Backend

El backend funciona como una API REST.

Sus responsabilidades principales son:

- Procesar solicitudes del frontend.
- Aplicar reglas del negocio.
- Validar información.
- Comunicarse con MySQL.
- Gestionar autenticación.

---

# Capas del Backend

## Routes

Contiene las rutas disponibles de la API.

Ejemplo:

```
POST /api/auth/login

GET /api/cursos

GET /api/tareas
```

Las rutas reciben las solicitudes y las dirigen al controlador correspondiente.

---

## Controllers

Son el intermediario entre las rutas y los servicios.

Responsabilidades:

- Recibir datos HTTP.
- Validar información básica.
- Ejecutar servicios.
- Retornar respuestas JSON.

---

## Services

Contienen la lógica principal del sistema.

Ejemplos:

- Crear usuarios.
- Validar credenciales.
- Crear cursos.
- Gestionar tareas.
- Registrar entregas.
- Crear notificaciones.

Esta separación permite reutilizar funciones y mantener controladores pequeños.

---

## Config

Contiene configuraciones generales.

Ejemplo:

- Conexión con MySQL.
- Variables de entorno.
- Configuración del servidor.

---

# Arquitectura orientada a eventos

El proyecto incluye una estructura preparada para trabajar con eventos:

```
events/

listeners/
```

Este enfoque permite que ciertas acciones del sistema puedan generar procesos automáticos.

Ejemplo:

```
Estudiante entrega una tarea

          ↓

Se genera evento

          ↓

Notificación al profesor

          ↓

Actualización de historial
```

Beneficios:

- Menor acoplamiento.
- Fácil agregar nuevas funciones.
- Mejor escalabilidad.

---

# Seguridad

El sistema implementa:

## Autenticación

Uso de:

- JSON Web Token (JWT).

Permite identificar usuarios y proteger recursos.

---

## Contraseñas

Las contraseñas son almacenadas utilizando:

- bcrypt.

Esto evita guardar contraseñas directamente en la base de datos.

---

## Variables de entorno

Información sensible se maneja mediante:

```
.env
```

Ejemplo:

```
PORT=
DATABASE_HOST=
DATABASE_USER=
DATABASE_PASSWORD=
DATABASE_NAME=
JWT_SECRET=
```

---

# Instalación

## Clonar repositorio

```bash
git clone URL_DEL_REPOSITORIO

cd Acadex
```

---

# Backend

Entrar a backend:

```bash
cd backend
```

Instalar dependencias:

```bash
npm install
```

Crear archivo:

```
.env
```

Configurar variables necesarias.

Ejecutar modo desarrollo:

```bash
npm run dev
```

Ejecutar modo producción:

```bash
npm start
```

---

# Frontend

Entrar al frontend:

```bash
cd frontend/AcadexFrontend
```

Instalar dependencias:

```bash
npm install
```

Ejecutar:

```bash
npm run dev
```

---

# Docker

El proyecto incluye configuración Docker para facilitar el despliegue.

Ejecutar:

```bash
docker compose up
```

Detener servicios:

```bash
docker compose down
```

---

# Endpoints principales

## Autenticación

```
POST /api/auth/login
```

---

## Usuarios

```
GET /api/users

POST /api/users

PUT /api/users/:id

DELETE /api/users/:id
```

---

## Cursos

```
GET /api/cursos

POST /api/cursos

PUT /api/cursos/:id

DELETE /api/cursos/:id
```

---

## Tareas

```
GET /api/tareas

POST /api/tareas

PUT /api/tareas/:id

DELETE /api/tareas/:id
```

---

## Entregas

```
GET /api/entregas

POST /api/entregas
```

---

## Eventos

```
GET /api/eventos
```

---

## Notificaciones

```
GET /api/notificaciones

PUT /api/notificaciones/:id/read
```

---

# Estado actual

Actualmente el proyecto cuenta con:

✅ Arquitectura organizada  
✅ Backend separado por capas  
✅ Autenticación preparada  
✅ Conexión con base de datos  
✅ Frontend React configurado  
✅ Sistema preparado para eventos  
✅ Docker configurado  

---

## Sistema

- Roles y permisos avanzados.
- Notificaciones en tiempo real.
- Dashboard administrativo.
- Estadísticas.

---

## Calidad

- Pruebas automatizadas.
- Documentación API.
- Mejoras de seguridad.
- CI/CD.

---

# Organización de ramas

El desarrollo utiliza ramas separadas por funcionalidad:

```
main

├── f-service

├── f-controller

└── f-routes
```

Cada rama contiene una parte específica del desarrollo.

Ejemplo:

- `f-service` → lógica del negocio.
- `f-controller` → controladores.
- `f-routes` → endpoints de la API.

---

# Licencia

Proyecto desarrollado con fines educativos.

---

# Autor

Wander Castillo/n
Ramshley Polanco/n
Derik Manuel Infante
