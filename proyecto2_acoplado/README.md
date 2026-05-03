# Proyecto 2 - Bases de Datos 1

Aplicación web para gestionar inventario y ventas de una tienda. Incluye frontend, backend, base de datos PostgreSQL y Docker.

## Requisitos

- Docker Desktop instalado
- Docker Compose

## Cómo levantar el proyecto

1. Copiar variables de entorno:

```bash
cp .env.example .env
```

2. Levantar todo el proyecto:

```bash
docker compose up --build
```

3. Abrir la aplicación:

```txt
Frontend: http://localhost:5173
Backend: http://localhost:3000
```

## Credenciales obligatorias de base de datos

```txt
Usuario: proy2
Contraseña: secret
Base de datos: tienda_proyecto2
```

## Usuario de prueba para login

```txt
usuario: usuario01
contraseña: secret
```

## Funcionalidades incluidas

- Login/logout con sesión.
- CRUD de productos.
- CRUD de clientes.
- Registro de venta con transacción explícita.
- Manejo de errores visible en la UI.
- Reportes visibles en la UI.
- Exportación de reportes a CSV.
- Uso de SQL explícito en backend, sin ORM.
- Base de datos inicializada automáticamente con `schema.sql` y `seed.sql`.

## Consultas SQL visibles desde la UI

En la página de reportes se incluyen:

- 3 consultas con JOIN: `join1`, `join2`, `join3`.
- 2 consultas con subquery: `subquery1`, `subquery2`.
- Consulta con GROUP BY, HAVING y agregaciones: `group`.
- Consulta con CTE: `cte`.
- Consulta basada en VIEW: `view`.

## Transacciones

El endpoint `POST /api/ventas` usa una transacción explícita:

```sql
BEGIN;
COMMIT;
ROLLBACK;
```

Si no hay stock suficiente o ocurre un error, se ejecuta `ROLLBACK`.
