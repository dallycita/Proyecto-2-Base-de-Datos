-- Proyecto 2 - Bases de Datos 1
-- Esquema final acoplado al avance inicial de tienda



-- Roles de proyecto 3

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'rol_admin') THEN DROP ROLE rol_admin; END IF;
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'rol_vendedor') THEN DROP ROLE rol_vendedor; END IF;
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'rol_cajero') THEN DROP ROLE rol_cajero; END IF;
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'rol_bodega') THEN DROP ROLE rol_bodega; END IF;
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'rol_auditor') THEN DROP ROLE rol_auditor; END IF;
END $$;

CREATE ROLE rol_admin;
CREATE ROLE rol_vendedor;
CREATE ROLE rol_cajero;
CREATE ROLE rol_bodega;
CREATE ROLE rol_auditor;

----------------------------------------------------------------------------------------------------------
DROP VIEW IF EXISTS vista_resumen_ventas;
DROP TABLE IF EXISTS movimientos_stock;
DROP TABLE IF EXISTS detalle_ventas;
DROP TABLE IF EXISTS ventas;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS clientes;
DROP TABLE IF EXISTS empleados;
DROP TABLE IF EXISTS proveedores;
DROP TABLE IF EXISTS categorias;

CREATE TABLE categorias (
    id_categoria SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT NOT NULL
);

CREATE TABLE proveedores (
    id_proveedor SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    correo VARCHAR(120) NOT NULL UNIQUE,
    direccion VARCHAR(200) NOT NULL
);

CREATE TABLE empleados (
    id_empleado SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    puesto VARCHAR(80) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    correo VARCHAR(120) NOT NULL UNIQUE,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    id_empleado INT NOT NULL UNIQUE,
    username VARCHAR(60) NOT NULL UNIQUE,
    password_texto VARCHAR(100) NOT NULL,
    rol VARCHAR(40) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (id_empleado) REFERENCES empleados(id_empleado)
);

CREATE TABLE clientes (
    id_cliente SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    correo VARCHAR(120) NOT NULL UNIQUE,
    direccion VARCHAR(200) NOT NULL
);

CREATE TABLE productos (
    id_producto SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT NOT NULL,
    precio NUMERIC(10,2) NOT NULL CHECK (precio > 0),
    stock INT NOT NULL CHECK (stock >= 0),
    id_categoria INT NOT NULL,
    id_proveedor INT NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria),
    FOREIGN KEY (id_proveedor) REFERENCES proveedores(id_proveedor)
);

CREATE TABLE ventas (
    id_venta SERIAL PRIMARY KEY,
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_cliente INT NOT NULL,
    id_empleado INT NOT NULL,
    total NUMERIC(10,2) NOT NULL CHECK (total >= 0),
    estado VARCHAR(30) NOT NULL DEFAULT 'COMPLETADA',
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),
    FOREIGN KEY (id_empleado) REFERENCES empleados(id_empleado)
);

CREATE TABLE detalle_ventas (
    id_detalle SERIAL PRIMARY KEY,
    id_venta INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(10,2) NOT NULL CHECK (precio_unitario > 0),
    subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
    FOREIGN KEY (id_venta) REFERENCES ventas(id_venta) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
);

CREATE TABLE movimientos_stock (
    id_movimiento SERIAL PRIMARY KEY,
    id_producto INT NOT NULL,
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ENTRADA', 'SALIDA', 'AJUSTE')),
    cantidad INT NOT NULL CHECK (cantidad > 0),
    motivo VARCHAR(180) NOT NULL,
    id_empleado INT NOT NULL,
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto),
    FOREIGN KEY (id_empleado) REFERENCES empleados(id_empleado)
);

-- Índices explícitos justificados para búsquedas y reportes frecuentes
CREATE INDEX idx_productos_nombre ON productos(nombre);
CREATE INDEX idx_ventas_fecha ON ventas(fecha);
CREATE INDEX idx_detalle_producto ON detalle_ventas(id_producto);
CREATE INDEX idx_movimientos_producto_fecha ON movimientos_stock(id_producto, fecha);

-- VIEW usada por el backend para alimentar la UI de reportes
CREATE VIEW vista_resumen_ventas AS
SELECT
    v.id_venta,
    v.fecha,
    c.nombre AS cliente,
    e.nombre AS empleado,
    v.total,
    v.estado,
    COUNT(dv.id_detalle) AS cantidad_lineas
FROM ventas v
JOIN clientes c ON v.id_cliente = c.id_cliente
JOIN empleados e ON v.id_empleado = e.id_empleado
JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
GROUP BY v.id_venta, v.fecha, c.nombre, e.nombre, v.total, v.estado;

----------------------------------------------------------------------------
-- PERMISOS PARA LOS NUEVOS ROLES
----------------------------------------------------------------------------
-- rol_admin: acceso total
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO rol_admin;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO rol_admin;

-- rol_vendedor: puede ver productos/clientes, registrar ventas
GRANT SELECT ON productos, categorias, proveedores, clientes TO rol_vendedor;
GRANT SELECT, INSERT ON ventas, detalle_ventas TO rol_vendedor;
GRANT SELECT, INSERT ON movimientos_stock TO rol_vendedor;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO rol_vendedor;

-- rol_cajero: solo puede ver ventas y clientes, registrar ventas
GRANT SELECT ON productos, clientes TO rol_cajero;
GRANT SELECT, INSERT ON ventas, detalle_ventas TO rol_cajero;
GRANT USAGE, SELECT ON SEQUENCE ventas_id_venta_seq, detalle_ventas_id_detalle_seq TO rol_cajero;

-- rol_bodega: maneja stock y movimientos
GRANT SELECT, UPDATE ON productos TO rol_bodega;
GRANT SELECT, INSERT ON movimientos_stock TO rol_bodega;
GRANT USAGE, SELECT ON SEQUENCE movimientos_stock_id_movimiento_seq TO rol_bodega;

-- rol_auditor: solo lectura total (para reportes)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO rol_auditor;

----------------------------------------------------------------------------------------------------
-- PROCEDIMIENTOS 
----------------------------------------------------------------------------------------------------

-- SP 1: Registrar una venta completa con transacción y ROLLBACK
CREATE OR REPLACE PROCEDURE sp_registrar_venta(
  p_id_cliente INT,
  p_id_empleado INT,
  p_items JSON,
  OUT p_id_venta INT,
  OUT p_total NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_item JSON;
  v_id_producto INT;
  v_cantidad INT;
  v_precio NUMERIC;
  v_stock INT;
  v_subtotal NUMERIC;
BEGIN
  p_total := 0;

  -- Validar stock de cada producto antes de insertar
  FOR v_item IN SELECT * FROM json_array_elements(p_items)
  LOOP
    v_id_producto := (v_item->>'id_producto')::INT;
    v_cantidad    := (v_item->>'cantidad')::INT;

    SELECT precio, stock INTO v_precio, v_stock
    FROM productos WHERE id_producto = v_id_producto;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Producto % no existe', v_id_producto;
    END IF;

    IF v_stock < v_cantidad THEN
      RAISE EXCEPTION 'Stock insuficiente para producto %', v_id_producto;
    END IF;

    p_total := p_total + (v_precio * v_cantidad);
  END LOOP;

  -- Insertar la venta
  INSERT INTO ventas(id_cliente, id_empleado, total)
  VALUES (p_id_cliente, p_id_empleado, p_total)
  RETURNING id_venta INTO p_id_venta;

  -- Insertar detalles y actualizar stock
  FOR v_item IN SELECT * FROM json_array_elements(p_items)
  LOOP
    v_id_producto := (v_item->>'id_producto')::INT;
    v_cantidad    := (v_item->>'cantidad')::INT;

    SELECT precio INTO v_precio FROM productos WHERE id_producto = v_id_producto;
    v_subtotal := v_precio * v_cantidad;

    INSERT INTO detalle_ventas(id_venta, id_producto, cantidad, precio_unitario, subtotal)
    VALUES (p_id_venta, v_id_producto, v_cantidad, v_precio, v_subtotal);

    UPDATE productos SET stock = stock - v_cantidad WHERE id_producto = v_id_producto;

    INSERT INTO movimientos_stock(id_producto, tipo, cantidad, motivo, id_empleado)
    VALUES (v_id_producto, 'SALIDA', v_cantidad, 'Venta #' || p_id_venta, p_id_empleado);
  END LOOP;

EXCEPTION
  WHEN OTHERS THEN
    RAISE; -- el ROLLBACK lo maneja quien llama al SP
END;
$$;


-- SP 2: Desactivar un producto con validación
CREATE OR REPLACE PROCEDURE sp_desactivar_producto(
  p_id_producto INT
)
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM productos WHERE id_producto = p_id_producto) THEN
    RAISE EXCEPTION 'El producto % no existe', p_id_producto;
  END IF;

  UPDATE productos SET activo = FALSE WHERE id_producto = p_id_producto;
END;
$$;
