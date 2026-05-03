const router = require('express').Router();
const pool = require('../db');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const sql = `
    SELECT u.id_usuario, u.username, u.rol, e.nombre
    FROM usuarios u
    JOIN empleados e ON u.id_empleado = e.id_empleado
    WHERE u.username = $1 AND u.password_texto = $2 AND u.activo = TRUE
  `;
  const result = await pool.query(sql, [username, password]);
  if (result.rows.length === 0) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  req.session.user = result.rows[0];
  res.json(result.rows[0]);
});

router.post('/logout', (req, res) => req.session.destroy(() => res.json({ mensaje: 'Sesión cerrada' })));
router.get('/me', (req, res) => res.json(req.session.user || null));
module.exports = router;
