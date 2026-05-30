const { DataTypes } = require('sequelize')
const sequelize = require('./index')

const Categoria = sequelize.define('Categoria', {
  id_categoria: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre:       { type: DataTypes.STRING(100), allowNull: false },
  descripcion:  { type: DataTypes.TEXT, allowNull: false }
}, {
  tableName: 'categorias',
  timestamps: false
})

module.exports = Categoria