const express = require('express');
const cors = require('cors');
const session = require('express-session');
const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(session({ secret: process.env.SESSION_SECRET || 'dev', resave: false, saveUninitialized: false }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/productos', require('./routes/productos'));
app.use('/api/clientes', require('./routes/clientes'));
app.use('/api/ventas', require('./routes/ventas'));
app.use('/api/reportes', require('./routes/reportes'));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.listen(3000, () => console.log('Backend listo en puerto 3000'));
