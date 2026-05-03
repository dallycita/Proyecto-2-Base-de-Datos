const router = require('express').Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  const sql = `SELECT p.*, c.nombre AS categoria, pr.nombre AS proveedor
               FROM productos p
               JOIN categorias c ON p.id_categoria = c.id_categoria
               JOIN proveedores pr ON p.id_proveedor = pr.id_proveedor
               ORDER BY p.id_producto`;
  const result = await pool.query(sql);
  res.json(result.rows);
});

router.post('/', async (req, res) => {
  try {
    const { nombre, descripcion, precio, stock, id_categoria, id_proveedor } = req.body;
    const sql = `INSERT INTO productos(nombre, descripcion, precio, stock, id_categoria, id_proveedor)
                 VALUES($1,$2,$3,$4,$5,$6) RETURNING *`;
    const result = await pool.query(sql, [nombre, descripcion, precio, stock, id_categoria, id_proveedor]);
    res.status(201).json(result.rows[0]);
  } catch (e) { res.status(400).json({ error: 'No se pudo crear el producto. Revise precio, stock y llaves.' }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { nombre, descripcion, precio, stock, id_categoria, id_proveedor, activo } = req.body;
    const sql = `UPDATE productos SET nombre=$1, descripcion=$2, precio=$3, stock=$4, id_categoria=$5, id_proveedor=$6, activo=$7
                 WHERE id_producto=$8 RETURNING *`;
    const result = await pool.query(sql, [nombre, descripcion, precio, stock, id_categoria, id_proveedor, activo, req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(result.rows[0]);
  } catch (e) { res.status(400).json({ error: 'No se pudo actualizar el producto' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('UPDATE productos SET activo=FALSE WHERE id_producto=$1 RETURNING *', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ mensaje: 'Producto desactivado' });
  } catch (e) { res.status(400).json({ error: 'No se pudo eliminar/desactivar el producto' }); }
});
module.exports = router;
