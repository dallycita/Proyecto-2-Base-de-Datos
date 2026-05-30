const { DataTypes } = require('sequelize')
const sequelize = require('./index')

const Cliente = sequelize.define('Cliente', {
  id_cliente: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre:     { type: DataTypes.STRING(150), allowNull: false },
  telefono:   { type: DataTypes.STRING(20),  allowNull: false },
  correo:     { type: DataTypes.STRING(120), allowNull: false, unique: true },
  direccion:  { type: DataTypes.STRING(200), allowNull: false }
}, {
  tableName: 'clientes',
  timestamps: false
})

module.exports = Cliente