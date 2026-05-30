const router = require('express').Router()
const pool   = require('../db')

// GET — sigue usando la vista (SQL avanzado, permitido)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vista_resumen_ventas ORDER BY fecha DESC')
    res.json(result.rows)
  } catch (e) {
    res.status(500).json({ error: 'No se pudo cargar las ventas' })
  }
})

// POST — llama sp_registrar_venta con transacción explícita y ROLLBACK
router.post('/', async (req, res) => {
  const client = await pool.connect()
  try {
    const { id_cliente, id_empleado, items } = req.body
    if (!items || items.length === 0) throw new Error('La venta debe tener al menos un producto')

    await client.query('BEGIN')

    // El SP maneja validaciones de stock, inserts y movimientos
    const result = await client.query(
      'CALL sp_registrar_venta($1, $2, $3::json, NULL, NULL)',
      [id_cliente, id_empleado, JSON.stringify(items)]
    )

    await client.query('COMMIT')

    // Recuperar id_venta y total desde la última venta del empleado
    const ultima = await client.query(
      'SELECT id_venta, total FROM ventas WHERE id_empleado = $1 ORDER BY id_venta DESC LIMIT 1',
      [id_empleado]
    )

    res.status(201).json({
      mensaje: 'Venta registrada correctamente',
      id_venta: ultima.rows[0]?.id_venta,
      total:    ultima.rows[0]?.total
    })
  } catch (e) {
    await client.query('ROLLBACK')
    res.status(400).json({ error: e.message || 'Error al registrar la venta' })
  } finally {
    client.release()
  }
})

// PATCH /:id/cancelar — llama sp_cancelar_venta
router.patch('/:id/cancelar', async (req, res) => {
  const client = await pool.connect()
  try {
    const id_empleado = req.body.id_empleado || 1
    await client.query('BEGIN')
    await client.query('CALL sp_cancelar_venta($1, $2)', [req.params.id, id_empleado])
    await client.query('COMMIT')
    res.json({ mensaje: 'Venta cancelada correctamente' })
  } catch (e) {
    await client.query('ROLLBACK')
    res.status(400).json({ error: e.message || 'Error al cancelar la venta' })
  } finally {
    client.release()
  }
})

module.exports = router