# Proyecto 2 - Bases de Datos 1

Aplicación web para gestionar inventario y ventas de una tienda. Incluye frontend (React + Vite), backend (Node.js + Express) y base de datos PostgreSQL, todo desplegado con Docker.

## Requisitos

- Docker Desktop instalado y corriendo
- Docker Compose

## Levantar el proyecto

1. Clonar el repositorio:

```bash
git clone https://github.com/dallycita/Proyecto-2-Base-de-Datos.git
cd Proyecto-2-Base-de-Datos\proyecto2_acoplado
```

2. Copiar las variables de entorno:

```bash
cp .env.example .env
```

3. Levantar todo con un solo comando:

```bash
docker compose up --build
```

4. Abrir en el navegador:

```
Frontend:  http://localhost:5173
Backend:   http://localhost:3000/api/health
```

## Credenciales de base de datos

```
Usuario:       proy2
Contraseña:    secret
Base de datos: tienda_proyecto2
```

## Usuario de prueba

```
Usuario:    usuario01
Contraseña: secret
```

## Estructura del proyecto

```
proyecto2_acoplado/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── productos.js
│   │   │   ├── clientes.js
│   │   │   ├── ventas.js
│   │   │   └── reportes.js
│   │   ├── db.js
│   │   └── index.js
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   └── style.css
│   ├── index.html
│   ├── vite.config.js
│   ├── Dockerfile
│   └── package.json
├── database/
│   ├── schema.sql
│   └── seed.sql
├── docs/
│   └── DISENO_BD.md
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

## Funcionalidades

- Login y logout con sesión
- CRUD completo de productos
- CRUD completo de clientes
- Registro de ventas con transacción explícita (BEGIN / COMMIT / ROLLBACK)
- Historial de ventas
- 8 reportes SQL visibles en la UI (JOINs, subqueries, GROUP BY, CTE, VIEW)
- Exportación de reportes a CSV
- Manejo de errores visible en la interfaz

## Notas técnicas

- Todo el SQL es explícito, sin ORM
- Las transacciones se manejan manualmente con BEGIN / COMMIT / ROLLBACK
- La base de datos se inicializa automáticamente con `schema.sql` y `seed.sql` al levantar el contenedor
- Las credenciales se gestionan mediante `.env`, nunca hardcodeadas
