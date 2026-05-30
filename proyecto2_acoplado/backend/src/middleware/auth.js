// Middleware para verificar que hay sesión activa
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'No autenticado' })
  }
  next()
}

// Middleware para verificar rol
function requireRol(...roles) {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).json({ error: 'No autenticado' })
    }
    if (!roles.includes(req.session.user.rol)) {
      return res.status(403).json({ error: 'No tienes permiso para esta acción' })
    }
    next()
  }
}

module.exports = { requireAuth, requireRol }