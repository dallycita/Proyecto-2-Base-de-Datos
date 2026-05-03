const router = require('express').Router();
const pool = require('../db');

const consultas = {
  join1: `SELECT p.nombre AS producto, c.nombre AS categoria, pr.nombre AS proveedor, p.precio, p.stock
          FROM productos p JOIN categorias c ON p.id_categoria=c.id_categoria
          JOIN proveedores pr ON p.id_proveedor=pr.id_proveedor ORDER BY p.nombre`,
  join2: `SELECT v.id_venta, v.fecha, cl.nombre AS cliente, e.nombre AS empleado, v.total
          FROM ventas v JOIN clientes cl ON v.id_cliente=cl.id_cliente
          JOIN empleados e ON v.id_empleado=e.id_empleado ORDER BY v.fecha DESC`,
  join3: `SELECT v.id_venta, p.nombre AS producto, dv.cantidad, dv.subtotal
          FROM detalle_ventas dv JOIN ventas v ON dv.id_venta=v.id_venta
          JOIN productos p ON dv.id_producto=p.id_producto ORDER BY v.id_venta`,
  subquery1: `SELECT nombre, precio FROM productos WHERE precio > (SELECT AVG(precio) FROM productos) ORDER BY precio DESC`,
  subquery2: `SELECT nombre FROM clientes WHERE id_cliente IN (SELECT id_cliente FROM ventas WHERE total > 250) ORDER BY nombre`,
  group: `SELECT c.nombre AS categoria, SUM(dv.subtotal) AS total_vendido, COUNT(*) AS lineas
          FROM detalle_ventas dv JOIN productos p ON dv.id_producto=p.id_producto
          JOIN categorias c ON p.id_categoria=c.id_categoria
          GROUP BY c.nombre HAVING SUM(dv.subtotal) > 100 ORDER BY total_vendido DESC`,
  cte: `WITH ventas_por_cliente AS (
          SELECT cl.id_cliente, cl.nombre, SUM(v.total) AS total_comprado
          FROM clientes cl JOIN ventas v ON cl.id_cliente=v.id_cliente
          GROUP BY cl.id_cliente, cl.nombre
        ) SELECT * FROM ventas_por_cliente WHERE total_comprado > 150 ORDER BY total_comprado DESC`,
  view: `SELECT * FROM vista_resumen_ventas ORDER BY fecha DESC`
};

router.get('/:tipo', async (req, res) => {
  const sql = consultas[req.params.tipo];
  if (!sql) return res.status(404).json({ error: 'Reporte no existe' });
  const result = await pool.query(sql);
  res.json(result.rows);
});

router.get('/:tipo/csv', async (req, res) => {
  const sql = consultas[req.params.tipo];
  if (!sql) return res.status(404).send('Reporte no existe');
  const result = await pool.query(sql);
  const cols = result.fields.map(f => f.name);
  const rows = result.rows.map(r => cols.map(c => JSON.stringify(r[c] ?? '')).join(','));
  res.header('Content-Type', 'text/csv');
  res.attachment(`${req.params.tipo}.csv`);
  res.send([cols.join(','), ...rows].join('\n'));
});
module.exports = router;
