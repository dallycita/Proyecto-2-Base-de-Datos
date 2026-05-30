const { DataTypes } = require('sequelize')
const sequelize = require('./index')
const Categoria = require('./Categoria')
const Proveedor = require('./Proveedor')

const Producto = sequelize.define('Producto', {
  id_producto:  { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre:       { type: DataTypes.STRING(150), allowNull: false },
  descripcion:  { type: DataTypes.TEXT, allowNull: false },
  precio:       { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  stock:        { type: DataTypes.INTEGER, allowNull: false },
  id_categoria: { type: DataTypes.INTEGER, allowNull: false },
  id_proveedor: { type: DataTypes.INTEGER, allowNull: false },
  activo:       { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName: 'productos',
  timestamps: false
})

Producto.belongsTo(Categoria, { foreignKey: 'id_categoria', as: 'categoria_rel' })
Producto.belongsTo(Proveedor, { foreignKey: 'id_proveedor', as: 'proveedor_rel' })

module.exports = Producto