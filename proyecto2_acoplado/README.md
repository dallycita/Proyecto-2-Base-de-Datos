# Proyecto 3 - Bases de Datos 1

Extensión del Proyecto 2: agrega seguridad a nivel de base de datos mediante roles y permisos, stored procedures y ORM (Sequelize).

## Requisitos

- Docker Desktop instalado y corriendo

## Levantar el proyecto

1. Clonar el repositorio y pararse en la rama correcta:

```bash
git clone https://github.com/dallycita/Proyecto-2-Base-de-Datos.git
cd Proyecto-2-Base-de-Datos/proyecto2_acoplado
git checkout proyecto-3
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
Usuario:       proy3
Contraseña:    secret
Base de datos: tienda_proyecto3
```

## Usuarios de prueba por rol

| Username       | Contraseña | Rol      | Acceso en UI                                        |
|----------------|------------|----------|-----------------------------------------------------|
| proy3          | secret     | admin    | Todo (productos, clientes, ventas, reportes, stock) |
| test_vendedor  | secret     | vendedor | Productos, Clientes, Ventas, Reportes               |
| test_cajero    | secret     | cajero   | Clientes, Ventas                                    |
| test_bodega    | secret     | bodega   | Productos (solo lectura), Stock                     |
| test_auditor   | secret     | auditor  | Reportes                                            |

## Estructura del proyecto

```
proyecto2_acoplado/
├── backend/
│   └── src/
│       ├── middleware/
│       │   └── auth.js           ← requireAuth y requireRol por rol
│       ├── models/
│       │   ├── index.js          ← instancia Sequelize
│       │   ├── Categoria.js
│       │   ├── Proveedor.js
│       │   ├── Producto.js       ← ORM con asociaciones a Categoria y Proveedor
│       │   └── Cliente.js
│       └── routes/
│           ├── auth.js
│           ├── productos.js      ← GET/POST/PUT via ORM, DELETE via SP
│           ├── clientes.js       ← GET/PUT via ORM, POST via SP
│           ├── ventas.js         ← POST/PATCH via stored procedures
│           ├── stock.js          ← POST via sp_ajustar_stock
│           └── reportes.js       ← protegido por rol
├── database/
│   ├── schema.sql                ← 5 roles, GRANTs granulares, 5 stored procedures
│   └── seed.sql                  ← datos de prueba + un usuario por cada rol
├── docs/
│   └── ROLES.md                  ← esquema de roles documentado
├── docker-compose.yml
├── .env.example
└── README.md
```

## Lo nuevo en Proyecto 3

### Seguridad y roles

Se definen exactamente 5 roles en PostgreSQL con `CREATE ROLE` y permisos granulares por tabla asignados con `GRANT` y `REVOKE`. Ver detalle completo en `docs/ROLES.md`.

| Rol          | Descripción                                       |
|--------------|---------------------------------------------------|
| rol_admin    | Acceso total a todas las tablas y operaciones     |
| rol_vendedor | Consulta catálogo, registra ventas, crea clientes |
| rol_cajero   | Ve productos y clientes, registra ventas          |
| rol_bodega   | Consulta y actualiza stock, registra movimientos  |
| rol_auditor  | Solo lectura total, para reportes                 |

Las rutas del backend están protegidas con middleware `requireAuth` y `requireRol`. Las vistas y botones del frontend se muestran u ocultan según el rol del usuario autenticado.

### Stored Procedures

Se implementaron 5 stored procedures invocados desde el backend (no desde scripts independientes):

| Stored Procedure       | Invocado en                    | Descripción                                      |
|------------------------|--------------------------------|--------------------------------------------------|
| sp_registrar_venta     | POST /api/ventas               | Registra venta completa con validación de stock  |
| sp_cancelar_venta      | PATCH /api/ventas/:id/cancelar | Cancela venta y revierte stock                   |
| sp_desactivar_producto | DELETE /api/productos/:id      | Desactiva producto con validación                |
| sp_crear_cliente       | POST /api/clientes             | Crea cliente con manejo de duplicados            |
| sp_ajustar_stock       | POST /api/stock/ajustar        | Ajusta stock con parámetros IN/OUT y excepciones |

`sp_ajustar_stock` y `sp_crear_cliente` usan parámetros de entrada/salida y manejo de excepciones. `sp_cancelar_venta` y `sp_registrar_venta` contienen transacciones con `RAISE` para forzar `ROLLBACK` en caso de error.

### ORM (Sequelize)

Sequelize está configurado en `backend/src/models/index.js` y se usa en las siguientes operaciones CRUD:

| Operación          | Método ORM            | Ruta                   |
|--------------------|-----------------------|------------------------|
| Listar productos   | `Producto.findAll()`  | GET /api/productos     |
| Crear producto     | `Producto.create()`   | POST /api/productos    |
| Editar producto    | `Producto.update()`   | PUT /api/productos/:id |
| Listar clientes    | `Cliente.findAll()`   | GET /api/clientes      |
| Editar cliente     | `Cliente.update()`    | PUT /api/clientes/:id  |

Las consultas avanzadas (reportes, vista de ventas) se complementan con SQL explícito según lo permitido por las restricciones técnicas del proyecto.

### Transacciones explícitas

Todas las rutas que invocan stored procedures críticos usan `BEGIN / COMMIT / ROLLBACK` explícito en el backend. Adicionalmente, `sp_cancelar_venta` y `sp_registrar_venta` manejan `RAISE` internamente para propagar errores y forzar el rollback desde el llamador.

## Funcionalidades heredadas del Proyecto 2

- Login y logout con sesión
- CRUD completo de productos
- CRUD completo de clientes
- Registro de ventas con transacción explícita
- Historial de ventas
- 8 reportes SQL visibles en la UI (JOINs, subqueries, GROUP BY, CTE, VIEW)
- Exportación de reportes a CSV
- Manejo de errores visible en la interfaz

## Notas técnicas

- Las credenciales de base de datos se gestionan mediante `.env`, nunca hardcodeadas
- El repositorio incluye `.env.example` con todos los valores necesarios
- La base de datos se inicializa automáticamente con `schema.sql` y `seed.sql` al levantar el contenedor
- Los roles del DBMS existen a nivel de PostgreSQL, no solo como lógica de aplicación