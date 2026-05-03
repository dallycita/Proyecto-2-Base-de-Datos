const router = require('express').Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  const result = await pool.query('SELECT * FROM vista_resumen_ventas ORDER BY fecha DESC');
  res.json(result.rows);
});

router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id_cliente, id_empleado, items } = req.body;
    await client.query('BEGIN');
    let total = 0;
    for (const item of items) {
      const producto = await client.query('SELECT precio, stock FROM productos WHERE id_producto=$1 FOR UPDATE', [item.id_producto]);
      if (producto.rows.length === 0) throw new Error('Producto no encontrado');
      if (producto.rows[0].stock < item.cantidad) throw new Error('Stock insuficiente');
      total += Number(producto.rows[0].precio) * item.cantidad;
    }
    const venta = await client.query('INSERT INTO ventas(id_cliente, id_empleado, total) VALUES($1,$2,$3) RETURNING id_venta', [id_cliente, id_empleado, total]);
    const idVenta = venta.rows[0].id_venta;
    for (const item of items) {
      const producto = await client.query('SELECT precio FROM productos WHERE id_producto=$1', [item.id_producto]);
      const precio = Number(producto.rows[0].precio);
      const subtotal = precio * item.cantidad;
      await client.query('INSERT INTO detalle_ventas(id_venta, id_producto, cantidad, precio_unitario, subtotal) VALUES($1,$2,$3,$4,$5)', [idVenta, item.id_producto, item.cantidad, precio, subtotal]);
      await client.query('UPDATE productos SET stock = stock - $1 WHERE id_producto=$2', [item.cantidad, item.id_producto]);
      await client.query('INSERT INTO movimientos_stock(id_producto, tipo, cantidad, motivo, id_empleado) VALUES($1,$2,$3,$4,$5)', [item.id_producto, 'SALIDA', item.cantidad, `Venta registrada #${idVenta}`, id_empleado]);
    }
    await client.query('COMMIT');
    res.status(201).json({ mensaje: 'Venta registrada correctamente', id_venta: idVenta, total });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: e.message || 'Error en la venta. Se aplicó ROLLBACK.' });
  } finally {
    client.release();
  }
});
module.exports = router;
