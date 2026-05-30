const router = require('express').Router()
const pool   = require('../db')

// POST /api/stock/ajustar — llama sp_ajustar_stock
router.post('/ajustar', async (req, res) => {
  const client = await pool.connect()
  try {
    const { id_producto, cantidad, tipo, motivo, id_empleado } = req.body
    if (!id_producto || !cantidad || !tipo || !motivo || !id_empleado) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' })
    }

    await client.query('BEGIN')
    const result = await client.query(
      'CALL sp_ajustar_stock($1, $2, $3, $4, $5, NULL)',
      [id_producto, cantidad, tipo, motivo, id_empleado]
    )
    await client.query('COMMIT')

    // Buscar el stock nuevo del producto
    const prod = await pool.query('SELECT stock FROM productos WHERE id_producto = $1', [id_producto])
    res.json({ mensaje: 'Stock ajustado correctamente', stock_nuevo: prod.rows[0]?.stock })
  } catch (e) {
    await client.query('ROLLBACK')
    res.status(400).json({ error: e.message || 'Error al ajustar el stock' })
  } finally {
    client.release()
  }
})

module.exports = router