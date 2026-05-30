const { DataTypes } = require('sequelize')
const sequelize = require('./index')

const Proveedor = sequelize.define('Proveedor', {
  id_proveedor: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre:       { type: DataTypes.STRING(150), allowNull: false },
  telefono:     { type: DataTypes.STRING(20), allowNull: false },
  correo:       { type: DataTypes.STRING(120), allowNull: false, unique: true },
  direccion:    { type: DataTypes.STRING(200), allowNull: false }
}, {
  tableName: 'proveedores',
  timestamps: false
})

module.exports = Proveedor