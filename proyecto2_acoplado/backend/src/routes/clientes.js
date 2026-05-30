const router = require('express').Router()
const Cliente = require('../models/Cliente')
const pool    = require('../db')

// GET — ORM
router.get('/', async (req, res) => {
  try {
    const lista = await Cliente.findAll({ order: [['id_cliente', 'ASC']] })
    res.json(lista)
  } catch (e) {
    res.status(500).json({ error: 'Error al cargar los clientes' })
  }
})

// POST — vía stored procedure sp_crear_cliente
router.post('/', async (req, res) => {
  const { nombre, telefono, correo, direccion } = req.body
  if (!nombre || !correo) {
    return res.status(400).json({ error: 'Nombre y correo son obligatorios' })
  }
  try {
    // Llamada al SP con parámetros OUT usando pg directamente
    const result = await pool.query(
      'CALL sp_crear_cliente($1, $2, $3, $4, NULL)',
      [nombre, telefono, correo, direccion]
    )
    // Devolvemos el cliente recién creado vía ORM
    const nuevo = await Cliente.findOne({ where: { correo }, order: [['id_cliente', 'DESC']] })
    res.status(201).json(nuevo)
  } catch (e) {
    res.status(400).json({ error: e.message || 'No se pudo crear el cliente.' })
  }
})

// PUT — ORM
router.put('/:id', async (req, res) => {
  const { nombre, telefono, correo, direccion } = req.body
  try {
    const [filas] = await Cliente.update(
      { nombre, telefono, correo, direccion },
      { where: { id_cliente: req.params.id }, returning: true }
    )
    if (filas === 0) return res.status(404).json({ error: 'Cliente no encontrado' })
    const actualizado = await Cliente.findByPk(req.params.id)
    res.json(actualizado)
  } catch (e) {
    res.status(400).json({ error: 'No se pudo actualizar el cliente' })
  }
})

// DELETE — pg directo (tiene FK, manejo especial)
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM clientes WHERE id_cliente = $1', [req.params.id])
    res.json({ mensaje: 'Cliente eliminado' })
  } catch (e) {
    res.status(400).json({ error: 'No se puede eliminar, el cliente tiene ventas registradas' })
  }
})

module.exports = router