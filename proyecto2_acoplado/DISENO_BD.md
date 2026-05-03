# Diseño de base de datos

## Entidades

- categorias
- proveedores
- empleados
- usuarios
- clientes
- productos
- ventas
- detalle_ventas
- movimientos_stock

## Modelo relacional

- categorias(id_categoria PK, nombre, descripcion)
- proveedores(id_proveedor PK, nombre, telefono, correo, direccion)
- empleados(id_empleado PK, nombre, puesto, telefono, correo, activo)
- usuarios(id_usuario PK, id_empleado FK UNIQUE, username, password_texto, rol, activo)
- clientes(id_cliente PK, nombre, telefono, correo, direccion)
- productos(id_producto PK, nombre, descripcion, precio, stock, id_categoria FK, id_proveedor FK, activo)
- ventas(id_venta PK, fecha, id_cliente FK, id_empleado FK, total, estado)
- detalle_ventas(id_detalle PK, id_venta FK, id_producto FK, cantidad, precio_unitario, subtotal)
- movimientos_stock(id_movimiento PK, id_producto FK, fecha, tipo, cantidad, motivo, id_empleado FK)

## Cardinalidades

- Una categoría tiene muchos productos.
- Un proveedor abastece muchos productos.
- Un cliente puede tener muchas ventas.
- Un empleado puede atender muchas ventas.
- Una venta tiene muchos detalles de venta.
- Un producto puede aparecer en muchos detalles de venta.
- Un producto puede tener muchos movimientos de stock.
- Un empleado puede registrar muchos movimientos de stock.
- Un empleado tiene como máximo un usuario de acceso.

## Dependencias funcionales principales

- id_categoria → nombre, descripcion
- id_proveedor → nombre, telefono, correo, direccion
- id_empleado → nombre, puesto, telefono, correo, activo
- id_usuario → id_empleado, username, password_texto, rol, activo
- id_cliente → nombre, telefono, correo, direccion
- id_producto → nombre, descripcion, precio, stock, id_categoria, id_proveedor, activo
- id_venta → fecha, id_cliente, id_empleado, total, estado
- id_detalle → id_venta, id_producto, cantidad, precio_unitario, subtotal
- id_movimiento → id_producto, fecha, tipo, cantidad, motivo, id_empleado

## Normalización hasta 3FN

### Primera forma normal

Todas las tablas cumplen 1FN porque cada columna contiene valores atómicos. No se guardan listas dentro de un mismo campo. Por ejemplo, los productos vendidos en una venta no se guardan en una columna de texto, sino en la tabla `detalle_ventas`.

### Segunda forma normal

Las tablas usan llaves primarias simples. Los atributos dependen completamente de la llave primaria de su tabla. En el caso de ventas con varios productos, se separó `ventas` de `detalle_ventas` para que los datos de la venta no se repitan por cada producto.

### Tercera forma normal

No se guardan atributos que dependan de otros atributos no clave. Por ejemplo, el nombre de la categoría no está repetido en `productos`; se obtiene mediante `id_categoria`. Lo mismo ocurre con proveedor, cliente y empleado.

## Justificación de índices

- `idx_productos_nombre`: permite buscar productos por nombre desde la interfaz.
- `idx_ventas_fecha`: ayuda en reportes ordenados o filtrados por fecha.
- `idx_detalle_producto`: mejora reportes de productos vendidos.
- `idx_movimientos_producto_fecha`: mejora consultas históricas de movimientos de inventario por producto.
