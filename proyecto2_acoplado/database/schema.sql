-- Proyecto 2 - Bases de Datos 1
-- Esquema final acoplado al avance inicial de tienda

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
