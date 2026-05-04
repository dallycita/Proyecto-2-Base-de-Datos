const router = require('express').Router()
const pool = require('../db')

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM clientes ORDER BY id_cliente')
    res.json(result.rows)
  } catch (e) {
    res.status(500).json({ error: 'Error al cargar los clientes' })
  }
})

router.post('/', async (req, res) => {
  const { nombre, telefono, correo, direccion } = req.body

  if (!nombre || !correo) {
    return res.status(400).json({ error: 'Nombre y correo son obligatorios' })
  }

  try {
    const result = await pool.query(
      'INSERT INTO clientes(nombre, telefono, correo, direccion) VALUES($1, $2, $3, $4) RETURNING *',
      [nombre, telefono, correo, direccion]
    )
    res.status(201).json(result.rows[0])
  } catch (e) {
    res.status(400).json({ error: 'No se pudo crear el cliente. El correo puede estar repetido.' })
  }
})

router.put('/:id', async (req, res) => {
  const { nombre, telefono, correo, direccion } = req.body
  try {
    const result = await pool.query(
      'UPDATE clientes SET nombre=$1, telefono=$2, correo=$3, direccion=$4 WHERE id_cliente=$5 RETURNING *',
      [nombre, telefono, correo, direccion, req.params.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' })
    }
    res.json(result.rows[0])
  } catch (e) {
    res.status(400).json({ error: 'No se pudo actualizar el cliente' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM clientes WHERE id_cliente = $1', [req.params.id])
    res.json({ mensaje: 'Cliente eliminado' })
  } catch (e) {
    // si tiene ventas asociadas postgresql va a lanzar error de FK
    res.status(400).json({ error: 'No se puede eliminar, el cliente tiene ventas registradas' })
  }
})

module.exports = router