const router = require('express').Router()
const { Op } = require('sequelize')
const Producto  = require('../models/Producto')
const Categoria = require('../models/Categoria')
const Proveedor = require('../models/Proveedor')
const pool      = require('../db')

// GET — listar con asociaciones (ORM)
router.get('/', async (req, res) => {
  try {
    const lista = await Producto.findAll({
      include: [
        { model: Categoria, as: 'categoria_rel', attributes: ['nombre'] },
        { model: Proveedor, as: 'proveedor_rel', attributes: ['nombre'] }
      ],
      order: [['id_producto', 'ASC']]
    })
    // Aplanar para que el frontend siga recibiendo los campos "categoria" y "proveedor"
    const datos = lista.map(p => ({
      ...p.toJSON(),
      categoria: p.categoria_rel?.nombre,
      proveedor: p.proveedor_rel?.nombre
    }))
    res.json(datos)
  } catch (e) {
    res.status(500).json({ error: 'Error al cargar los productos' })
  }
})

// POST — crear (ORM)
router.post('/', async (req, res) => {
  const { nombre, descripcion, precio, stock, id_categoria, id_proveedor } = req.body
  if (!nombre || !precio || !stock) {
    return res.status(400).json({ error: 'Nombre, precio y stock son requeridos' })
  }
  try {
    const nuevo = await Producto.create({ nombre, descripcion, precio, stock, id_categoria, id_proveedor })
    res.status(201).json(nuevo)
  } catch (e) {
    console.log('error creando producto:', e.message)
    res.status(400).json({ error: 'No se pudo crear el producto. Revise los datos.' })
  }
})

// PUT — editar (ORM)
router.put('/:id', async (req, res) => {
  const { nombre, descripcion, precio, stock, id_categoria, id_proveedor, activo } = req.body
  try {
    const [filas] = await Producto.update(
      { nombre, descripcion, precio, stock, id_categoria, id_proveedor, activo },
      { where: { id_producto: req.params.id }, returning: true }
    )
    if (filas === 0) return res.status(404).json({ error: 'Producto no encontrado' })
    const actualizado = await Producto.findByPk(req.params.id)
    res.json(actualizado)
  } catch (e) {
    res.status(400).json({ error: 'No se pudo actualizar el producto' })
  }
})

// DELETE — desactivar usando SP (stored procedure invocado desde el backend)
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('CALL sp_desactivar_producto($1)', [req.params.id])
    res.json({ mensaje: 'Producto desactivado correctamente' })
  } catch (e) {
    res.status(400).json({ error: e.message || 'No se pudo desactivar el producto' })
  }
})

module.exports = router