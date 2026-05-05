# Diseño de Base de Datos

## Entidades

| Entidad            | Descripción                                                  |
|--------------------|--------------------------------------------------------------|
| categorias         | Agrupaciones de productos                                    |
| proveedores        | Empresas que abastecen los productos                         |
| empleados          | Personal de la tienda                                        |
| usuarios           | Cuentas de acceso al sistema, ligadas a un empleado          |
| clientes           | Personas que realizan compras                                |
| productos          | Artículos disponibles en la tienda                           |
| ventas             | Registro de cada transacción de compra                       |
| detalle_ventas     | Líneas de producto dentro de cada venta                      |
| movimientos_stock  | Historial de entradas, salidas y ajustes de inventario       |

---

## Modelo Relacional

```
categorias       (id_categoria PK, nombre, descripcion)
proveedores      (id_proveedor PK, nombre, telefono, correo, direccion)
empleados        (id_empleado PK, nombre, puesto, telefono, correo, activo)
usuarios         (id_usuario PK, id_empleado FK UNIQUE, username, password_texto, rol, activo)
clientes         (id_cliente PK, nombre, telefono, correo, direccion)
productos        (id_producto PK, nombre, descripcion, precio, stock, id_categoria FK, id_proveedor FK, activo)
ventas           (id_venta PK, fecha, id_cliente FK, id_empleado FK, total, estado)
detalle_ventas   (id_detalle PK, id_venta FK, id_producto FK, cantidad, precio_unitario, subtotal)
movimientos_stock(id_movimiento PK, id_producto FK, fecha, tipo, cantidad, motivo, id_empleado FK)
```

---

## Diagrama Entidad-Relación

- Está en el PDF DER.pdf (se mira mejor si se descarga el .pdf)

### Cardinalidades

- Una **categoría** tiene muchos **productos** (1:N)
- Un **proveedor** abastece muchos **productos** (1:N)
- Un **cliente** puede tener muchas **ventas** (1:N)
- Un **empleado** puede atender muchas **ventas** (1:N)
- Una **venta** tiene muchos **detalles de venta** (1:N)
- Un **producto** puede aparecer en muchos **detalles de venta** (1:N)
- Un **producto** puede tener muchos **movimientos de stock** (1:N)
- Un **empleado** puede registrar muchos **movimientos de stock** (1:N)
- Un **empleado** tiene como máximo un **usuario** de acceso (1:1)

---

## Dependencias Funcionales

```
id_categoria  → nombre, descripcion
id_proveedor  → nombre, telefono, correo, direccion
id_empleado   → nombre, puesto, telefono, correo, activo
id_usuario    → id_empleado, username, password_texto, rol, activo
id_cliente    → nombre, telefono, correo, direccion
id_producto   → nombre, descripcion, precio, stock, id_categoria, id_proveedor, activo
id_venta      → fecha, id_cliente, id_empleado, total, estado
id_detalle    → id_venta, id_producto, cantidad, precio_unitario, subtotal
id_movimiento → id_producto, fecha, tipo, cantidad, motivo, id_empleado
```

---

## Normalización hasta 3FN

### Primera Forma Normal (1FN)

Todas las tablas cumplen 1FN: cada columna contiene valores atómicos y no hay grupos repetidos. Por ejemplo, los productos de una venta no se almacenan en una columna de texto separada por comas, sino como filas individuales en `detalle_ventas`.

### Segunda Forma Normal (2FN)

Todas las tablas usan llaves primarias simples (SERIAL), por lo que no puede existir dependencia parcial. Cada atributo depende completamente de su llave primaria. La separación entre `ventas` y `detalle_ventas` garantiza que los datos de la venta (fecha, cliente, empleado) no se repitan por cada producto incluido.

### Tercera Forma Normal (3FN)

No existen dependencias transitivas. Ningún atributo no clave depende de otro atributo no clave. Por ejemplo:

- El nombre de la categoría no se repite en `productos`; se accede mediante `id_categoria`.
- El nombre del proveedor no se repite en `productos`; se accede mediante `id_proveedor`.
- El nombre del cliente y del empleado no se guardan en `ventas`; se acceden mediante sus respectivas FK.

---

## DDL y Restricciones

Todas las tablas incluyen:

- `PRIMARY KEY` en su identificador principal
- `FOREIGN KEY` en todas las relaciones
- `NOT NULL` en todos los atributos obligatorios
- `CHECK` en campos críticos como `precio > 0`, `stock >= 0`, `cantidad > 0`
- `UNIQUE` en correos y usernames para evitar duplicados

---

## Índices

| Índice                          | Tabla             | Columna(s)          | Justificación                                              |
|---------------------------------|-------------------|---------------------|------------------------------------------------------------|
| idx_productos_nombre            | productos         | nombre              | Búsquedas de productos por nombre desde la interfaz        |
| idx_ventas_fecha                | ventas            | fecha               | Reportes ordenados o filtrados por fecha                   |
| idx_detalle_producto            | detalle_ventas    | id_producto         | Reportes de productos más vendidos                         |
| idx_movimientos_producto_fecha  | movimientos_stock | id_producto, fecha  | Consultas históricas de movimientos de inventario          |

---

## Vista

### `vista_resumen_ventas`

Utilizada por el backend para alimentar tanto el historial de ventas como los reportes de la UI.

```sql
CREATE VIEW vista_resumen_ventas AS
SELECT
    v.id_venta,
    v.fecha,
    c.nombre  AS cliente,
    e.nombre  AS empleado,
    v.total,
    v.estado,
    COUNT(dv.id_detalle) AS cantidad_lineas
FROM ventas v
JOIN clientes  c  ON v.id_cliente  = c.id_cliente
JOIN empleados e  ON v.id_empleado = e.id_empleado
JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
GROUP BY v.id_venta, v.fecha, c.nombre, e.nombre, v.total, v.estado;
```

---

## Transacción Explícita

El endpoint `POST /api/ventas` ejecuta toda la operación dentro de una transacción explícita. Si cualquier paso falla (producto inexistente, stock insuficiente, error de base de datos), se ejecuta `ROLLBACK` y ningún cambio queda guardado.

```sql
BEGIN;
  -- Verificar stock de cada producto
  -- INSERT INTO ventas
  -- INSERT INTO detalle_ventas (por cada ítem)
  -- UPDATE productos SET stock = stock - cantidad
  -- INSERT INTO movimientos_stock
COMMIT;
-- En caso de error:
ROLLBACK;
```
