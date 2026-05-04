const express = require('express')
const cors = require('cors')
const session = require('express-session')

const app = express()

// configuracion de cors para que el frontend pueda llamar al backend
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}))

app.use(express.json())

// sesiones para el login
app.use(session({
  secret: process.env.SESSION_SECRET || 'clave_dev',
  resave: false,
  saveUninitialized: false
}))

// rutas
app.use('/api/auth', require('./routes/auth'))
app.use('/api/productos', require('./routes/productos'))
app.use('/api/clientes', require('./routes/clientes'))
app.use('/api/ventas', require('./routes/ventas'))
app.use('/api/reportes', require('./routes/reportes'))

// para verificar que el backend esta corriendo
app.get('/api/health', (req, res) => {
  res.json({ ok: true, mensaje: 'backend funcionando' })
})

app.listen(3000, () => {
  console.log('Servidor corriendo en puerto 3000')
})