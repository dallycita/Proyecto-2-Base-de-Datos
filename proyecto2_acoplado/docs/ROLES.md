# Esquema de Roles - Proyecto 3

## Roles definidos en el DBMS

Los siguientes roles se crean con `CREATE ROLE` en PostgreSQL y sus permisos
se asignan con `GRANT` granular por tabla y operación.

---

### rol_admin
Acceso total a todas las tablas y operaciones.

| Tabla              | SELECT | INSERT | UPDATE | DELETE |
|--------------------|:------:|:------:|:------:|:------:|
| categorias         | ✅     | ✅     | ✅     | ✅     |
| proveedores        | ✅     | ✅     | ✅     | ✅     |
| empleados          | ✅     | ✅     | ✅     | ✅     |
| usuarios           | ✅     | ✅     | ✅     | ✅     |
| clientes           | ✅     | ✅     | ✅     | ✅     |
| productos          | ✅     | ✅     | ✅     | ✅     |
| ventas             | ✅     | ✅     | ✅     | ✅     |
| detalle_ventas     | ✅     | ✅     | ✅     | ✅     |
| movimientos_stock  | ✅     | ✅     | ✅     | ✅     |

---

### rol_vendedor
Puede consultar el catálogo, registrar ventas y crear clientes.

| Tabla              | SELECT | INSERT | UPDATE | DELETE |
|--------------------|:------:|:------:|:------:|:------:|
| productos          | ✅     |        |        |        |
| categorias         | ✅     |        |        |        |
| proveedores        | ✅     |        |        |        |
| clientes           | ✅     | ✅     |        |        |
| ventas             | ✅     | ✅     |        |        |
| detalle_ventas     | ✅     | ✅     |        |        |
| movimientos_stock  | ✅     | ✅     |        |        |

---

### rol_cajero
Solo puede ver productos y clientes, y registrar ventas.

| Tabla              | SELECT | INSERT | UPDATE | DELETE |
|--------------------|:------:|:------:|:------:|:------:|
| productos          | ✅     |        |        |        |
| clientes           | ✅     | ✅     |        |        |
| ventas             | ✅     | ✅     |        |        |
| detalle_ventas     | ✅     | ✅     |        |        |

---

### rol_bodega
Gestiona el inventario: consulta y actualiza stock, registra movimientos.

| Tabla              | SELECT | INSERT | UPDATE | DELETE |
|--------------------|:------:|:------:|:------:|:------:|
| productos          | ✅     |        | ✅     |        |
| movimientos_stock  | ✅     | ✅     |        |        |

---

### rol_auditor
Solo lectura total, para generación de reportes.

| Tabla              | SELECT | INSERT | UPDATE | DELETE |
|--------------------|:------:|:------:|:------:|:------:|
| categorias         | ✅     |        |        |        |
| proveedores        | ✅     |        |        |        |
| empleados          | ✅     |        |        |        |
| usuarios           | ✅     |        |        |        |
| clientes           | ✅     |        |        |        |
| productos          | ✅     |        |        |        |
| ventas             | ✅     |        |        |        |
| detalle_ventas     | ✅     |        |        |        |
| movimientos_stock  | ✅     |        |        |        |

---

## Usuarios de prueba por rol

| Username       | Contraseña | Rol      |
|----------------|------------|----------|
| proy3          | secret     | admin    |
| test_admin3    | secret     | admin    |
| test_vendedor  | secret     | vendedor |
| test_cajero    | secret     | cajero   |
| test_bodega    | secret     | bodega   |
| test_auditor   | secret     | auditor  |