const router = require('express').Router()
const pool   = require('../db')
const { requireAuth, requireRol } = require('../middleware/auth')

const sqlJoin1 = `
  SELECT p.nombre AS producto, c.nombre AS categoria, pr.nombre AS proveedor, p.precio, p.stock
  FROM productos p
  JOIN categorias c ON p.id_categoria = c.id_categoria
  JOIN proveedores pr ON p.id_proveedor = pr.id_proveedor
  ORDER BY p.nombre
`

const sqlJoin2 = `
  SELECT v.id_venta, v.fecha, cl.nombre AS cliente, e.nombre AS empleado, v.total
  FROM ventas v
  JOIN clientes cl ON v.id_cliente = cl.id_cliente
  JOIN empleados e ON v.id_empleado = e.id_empleado
  ORDER BY v.fecha DESC
`

const sqlJoin3 = `
  SELECT v.id_venta, p.nombre AS producto, dv.cantidad, dv.precio_unitario, dv.subtotal
  FROM detalle_ventas dv
  JOIN ventas v ON dv.id_venta = v.id_venta
  JOIN productos p ON dv.id_producto = p.id_producto
  ORDER BY v.id_venta
`

const sqlSubquery1 = `
  SELECT nombre, precio
  FROM productos
  WHERE precio > (SELECT AVG(precio) FROM productos)
  ORDER BY precio DESC
`

const sqlSubquery2 = `
  SELECT nombre
  FROM clientes
  WHERE id_cliente IN (SELECT id_cliente FROM ventas WHERE total > 250)
  ORDER BY nombre
`

const sqlGroup = `
  SELECT c.nombre AS categoria, SUM(dv.subtotal) AS total_vendido, COUNT(*) AS cantidad_lineas
  FROM detalle_ventas dv
  JOIN productos p ON dv.id_producto = p.id_producto
  JOIN categorias c ON p.id_categoria = c.id_categoria
  GROUP BY c.nombre
  HAVING SUM(dv.subtotal) > 100
  ORDER BY total_vendido DESC
`

const sqlCte = `
  WITH ventas_por_cliente AS (
    SELECT cl.id_cliente, cl.nombre, SUM(v.total) AS total_comprado
    FROM clientes cl
    JOIN ventas v ON cl.id_cliente = v.id_cliente
    GROUP BY cl.id_cliente, cl.nombre
  )
  SELECT * FROM ventas_por_cliente
  WHERE total_comprado > 150
  ORDER BY total_comprado DESC
`

const sqlView = `
  SELECT * FROM vista_resumen_ventas ORDER BY fecha DESC
`

const reportes = {
  join1:     sqlJoin1,
  join2:     sqlJoin2,
  join3:     sqlJoin3,
  subquery1: sqlSubquery1,
  subquery2: sqlSubquery2,
  group:     sqlGroup,
  cte:       sqlCte,
  view:      sqlView
}

router.get('/:tipo', requireRol('admin', 'auditor', 'vendedor'), async (req, res) => {
  const sql = reportes[req.params.tipo]
  if (!sql) {
    return res.status(404).json({ error: 'El reporte ' + req.params.tipo + ' no existe' })
  }
  try {
    const result = await pool.query(sql)
    res.json(result.rows)
  } catch (e) {
    console.log('error en reporte:', e.message)
    res.status(500).json({ error: 'Error al ejecutar el reporte' })
  }
})

router.get('/:tipo/csv', requireRol('admin', 'auditor', 'vendedor'), async (req, res) => {
  const sql = reportes[req.params.tipo]
  if (!sql) {
    return res.status(404).send('Reporte no encontrado')
  }
  try {
    const result = await pool.query(sql)
    const columnas = result.fields.map(f => f.name)
    const filas = result.rows.map(fila => {
      return columnas.map(col => JSON.stringify(fila[col] ?? '')).join(',')
    })
    const csv = [columnas.join(','), ...filas].join('\n')
    res.header('Content-Type', 'text/csv')
    res.attachment(req.params.tipo + '.csv')
    res.send(csv)
  } catch (e) {
    res.status(500).send('Error al generar el CSV')
  }
})

module.exports = router