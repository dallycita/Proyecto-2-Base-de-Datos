const router = require('express').Router()
const pool = require('../db')

router.post('/login', async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos' })
  }

  try {
    // busco el usuario y junto con empleados para obtener el nombre y el id_empleado
    const sql = `
      SELECT u.id_usuario, u.username, u.rol, e.nombre, e.id_empleado
      FROM usuarios u
      JOIN empleados e ON u.id_empleado = e.id_empleado
      WHERE u.username = $1 AND u.password_texto = $2 AND u.activo = TRUE
    `
    const result = await pool.query(sql, [username, password])

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' })
    }

    // guardo el usuario en la sesion, incluyendo id_empleado para usarlo en ventas
    req.session.user = result.rows[0]
    res.json(result.rows[0])

  } catch (e) {
    console.log('error en login:', e.message)
    res.status(500).json({ error: 'Error interno al iniciar sesion' })
  }
})

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ mensaje: 'Sesion cerrada' })
  })
})

// para revisar si hay sesion activa
router.get('/me', (req, res) => {
  if (req.session.user) {
    res.json(req.session.user)
  } else {
    res.json(null)
  }
})

module.exports = router