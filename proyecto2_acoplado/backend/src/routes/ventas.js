const router = require('express').Router()
const pool = require('../db')

// traer todas las ventas usando la vista
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vista_resumen_ventas ORDER BY fecha DESC')
    res.json(result.rows)
  } catch (e) {
    res.status(500).json({ error: 'No se pudo cargar las ventas' })
  }
})

// registrar una venta nueva con transaccion explicita
router.post('/', async (req, res) => {
  const cliente = await pool.connect()
  try {
    const { id_cliente, id_empleado, items } = req.body

    if (!items || items.length === 0) {
      throw new Error('La venta debe tener al menos un producto')
    }

    // inicio de la transaccion
    await cliente.query('BEGIN')

    let totalVenta = 0

    // reviso el stock de cada producto antes de insertar
    for (const item of items) {
      const q = await cliente.query(
        'SELECT precio, stock FROM productos WHERE id_producto = $1',
        [item.id_producto]
      )

      if (q.rows.length === 0) {
        throw new Error('Producto con ID ' + item.id_producto + ' no existe')
      }

      const prod = q.rows[0]

      if (prod.stock < item.cantidad) {
        throw new Error('Stock insuficiente para el producto ' + item.id_producto)
      }

      totalVenta += Number(prod.precio) * Number(item.cantidad)
    }

    // insertar la venta
    const ventaResult = await cliente.query(
      'INSERT INTO ventas(id_cliente, id_empleado, total) VALUES($1, $2, $3) RETURNING id_venta',
      [id_cliente, id_empleado, totalVenta]
    )
    const idVenta = ventaResult.rows[0].id_venta

    // insertar cada detalle y actualizar el stock
    for (const item of items) {
      const q = await cliente.query(
        'SELECT precio FROM productos WHERE id_producto = $1',
        [item.id_producto]
      )
      const precio = Number(q.rows[0].precio)
      const subtotal = precio * Number(item.cantidad)

      await cliente.query(
        'INSERT INTO detalle_ventas(id_venta, id_producto, cantidad, precio_unitario, subtotal) VALUES($1, $2, $3, $4, $5)',
        [idVenta, item.id_producto, item.cantidad, precio, subtotal]
      )

      // bajar el stock
      await cliente.query(
        'UPDATE productos SET stock = stock - $1 WHERE id_producto = $2',
        [item.cantidad, item.id_producto]
      )

      // registrar movimiento de inventario
      await cliente.query(
        'INSERT INTO movimientos_stock(id_producto, tipo, cantidad, motivo, id_empleado) VALUES($1, $2, $3, $4, $5)',
        [item.id_producto, 'SALIDA', item.cantidad, 'Venta #' + idVenta, id_empleado]
      )
    }

    // todo bien, confirmo
    await cliente.query('COMMIT')

    res.status(201).json({
      mensaje: 'Venta registrada correctamente',
      id_venta: idVenta,
      total: totalVenta
    })

  } catch (e) {
    // si algo falla, deshago todo
    await cliente.query('ROLLBACK')
    res.status(400).json({ error: e.message || 'Error al registrar la venta' })
  } finally {
    cliente.release()
  }
})

module.exports = router